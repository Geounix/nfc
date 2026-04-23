const express = require('express');
const { getDb } = require('../config/database');
const http = require('http');
const { logger } = require('../utils/logger');

const router = express.Router();

// Almacén en memoria para tracking de IPs (en prod usar Redis)
const ipTracking = new Map();
const SCRAPING_THRESHOLD = 10; // Máximo de tags distintos por IP en 5 minutos

function getGeoData(ip) {
  return new Promise(resolve => {
    if (!ip || ip.includes('127.0.0.1') || ip.includes('::1')) {
      return resolve({ pais: 'Local', ciudad: 'Network' });
    }
    const req = http.get(`http://ip-api.com/json/${ip}?fields=country,city`, { timeout: 2500 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ pais: parsed.country || 'Desconocido', ciudad: parsed.city || 'Desconocida' });
        } catch { resolve({ pais: 'Desconocido', ciudad: 'Desconocida' }); }
      });
    });
    req.on('error', () => resolve({ pais: 'Desconocido', ciudad: 'Desconocida' }));
    req.on('timeout', () => { req.abort(); resolve({ pais: 'Desconocido', ciudad: 'Desconocida' }); });
  });
}

/**
 * Verifica si una IP está haciendo scraping excesivo
 * @param {string} ip - Dirección IP del cliente
 * @param {string} tagId - ID del tag solicitado
 * @returns {boolean} true si se detecta scraping
 */
function isScrapingAttempt(ip, tagId) {
  const now = Date.now();
  const trackingData = ipTracking.get(ip);
  
  if (!trackingData) {
    ipTracking.set(ip, { tags: new Set([tagId]), timestamp: now });
    return false;
  }
  
  // Limpiar datos antiguos (más de 5 minutos)
  if (now - trackingData.timestamp > 5 * 60 * 1000) {
    ipTracking.set(ip, { tags: new Set([tagId]), timestamp: now });
    return false;
  }
  
  // Agregar tag a la lista
  trackingData.tags.add(tagId);
  
  // Verificar si excedió el umbral
  if (trackingData.tags.size > SCRAPING_THRESHOLD) {
    logger.warn('Scraping attempt detected', { ip, tagCount: trackingData.tags.size });
    return true;
  }
  
  return false;
}

// Limpiar tracking cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipTracking.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      ipTracking.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// GET /api/tag/:id — Datos públicos del tag (JSON para el frontend)
// Con protección anti-scraping
router.get('/:id', async (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'desconocida';
    const ip = rawIp.replace('::ffff:', '').trim();
    
    // Verificar si es intento de scraping
    if (isScrapingAttempt(ip, tagId)) {
      logger.warn('Blocked scraping attempt', { ip, tagId });
      return res.status(429).json({ 
        error: 'Demasiadas solicitudes. Por favor intenta más tarde.',
        retryAfter: 300 // segundos
      });
    }
    
    const db = getDb();

    const tagRes = await db.query(`
      SELECT id, nombre_dueno, telefono, email, mensaje, activo, nombre_tag,
             tipo, especie, raza, color_descripcion, edad, info_medica, imagen_mascota
      FROM tags WHERE id = $1
    `, [tagId]);
    const tag = tagRes.rows[0];

    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado. Verifica el ID del chip NFC.' });
    }

    if (!tag.activo) {
      return res.status(403).json({ error: 'Este tag ha sido desactivado por su dueño.' });
    }

    const userAgent = req.headers['user-agent'] || 'desconocido';

    // Obtener ubicación de la IP en background (asíncrono sin bloquear la respuesta)
    getGeoData(ip).then(async (geo) => {
      try {
        await db.query(`
          INSERT INTO scans (tag_id, ip, user_agent, pais, ciudad)
          VALUES ($1, $2, $3, $4, $5)
        `, [tagId, ip, userAgent, geo.pais, geo.ciudad]);
      } catch (err) { console.error('Error insertando scan:', err); }
    });

    const esMascota = tag.tipo === 'mascota';

    // Links de contacto — nunca exponen el dato real
    const whatsappText = esMascota
      ? `¡Hola! Encontré a tu mascota "${tag.nombre_tag}" y quiero devolvértela. 🐾`
      : `¡Hola! Encontré tu objeto "${tag.nombre_tag}" y quiero devolvértelo. 🙏`;

    const emailSubject = esMascota
      ? `Encontré a tu mascota: ${tag.nombre_tag}`
      : `Encontré tu objeto: ${tag.nombre_tag}`;

    const emailBody = esMascota
      ? `Hola ${tag.nombre_dueno},\n\nEncontré a tu mascota "${tag.nombre_tag}" y quiero devolvértela.\n\n¡Escríbeme para coordinar la devolución!`
      : `Hola ${tag.nombre_dueno},\n\nEncontré tu objeto "${tag.nombre_tag}" y quiero devolvértelo.\n\n¡Escríbeme para coordinar!`;

    const whatsappLink = `https://wa.me/${tag.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;
    const emailLink   = `mailto:${tag.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Respuesta base — no expone IDs internos para seguridad
    const response = {
      tipo: tag.tipo || 'objeto',
      nombre_dueno: tag.nombre_dueno,
      nombre_tag: tag.nombre_tag,
      mensaje: tag.mensaje,
      imagen_mascota: tag.imagen_mascota,
      telefono_raw: tag.telefono.replace(/\D/g, ''), // Para usar en la geolocalización
      whatsapp_text_base: whatsappText,
      contacto: { whatsapp: whatsappLink, email: emailLink }
    };

    // Agregar info médica si es mascota
    if (esMascota) {
      response.mascota = {
        especie: tag.especie,
        raza: tag.raza,
        color_descripcion: tag.color_descripcion,
        edad: tag.edad,
        info_medica: tag.info_medica
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Error obteniendo tag público:', err);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

module.exports = router;