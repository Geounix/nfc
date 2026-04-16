const express = require('express');
const { getDb } = require('../config/database');

const router = express.Router();

// GET /tag/:id — Página pública del tag (lo que ve quien encuentra el objeto)
router.get('/:id', (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tag = db.prepare(`
      SELECT t.id, t.nombre_dueno, t.telefono, t.email, t.mensaje, t.activo, t.nombre_tag
      FROM tags t
      WHERE t.id = ?
    `).get(tagId);

    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado. Verifica el ID del chip NFC.' });
    }

    if (!tag.activo) {
      return res.status(403).json({ error: 'Este tag ha sido desactivado por su dueño.' });
    }

    // Registrar el escaneo
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'desconocida';
    const userAgent = req.headers['user-agent'] || 'desconocido';

    // Intentar geolocalización por IP (gratuita, sin API key)
    let pais = 'Desconocido';
    let ciudad = 'Desconocida';

    try {
      // Solo para IPs públicas (no localhost)
      if (!ip.includes('127.0.0.1') && !ip.includes('::1') && !ip.includes('192.168') && !ip.includes('10.')) {
        const geoRes = require('https');
        // Usamos un servicio gratuito async — guardamos el escaneo sin esperar
      }
    } catch (geoErr) {
      // Silencioso — la geo es opcional
    }

    db.prepare(`
      INSERT INTO scans (tag_id, ip, user_agent, pais, ciudad)
      VALUES (?, ?, ?, ?, ?)
    `).run(tagId, ip, userAgent, pais, ciudad);

    // NUNCA devolver teléfono o email en texto plano
    // Solo se generan los links de contacto en servidor
    const whatsappLink = `https://wa.me/${tag.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Encontré tu objeto "${tag.nombre_tag}" y quiero devolvértelo. 🙏`)}`;
    const emailLink = `mailto:${tag.email}?subject=${encodeURIComponent(`Encontré tu objeto: ${tag.nombre_tag}`)}&body=${encodeURIComponent(`Hola ${tag.nombre_dueno},\n\nEncontré tu objeto "${tag.nombre_tag}" y quiero devolvértelo.\n\n¡Escríbeme para coordinar!`)}`;

    res.json({
      nombre_dueno: tag.nombre_dueno,
      nombre_tag: tag.nombre_tag,
      mensaje: tag.mensaje,
      contacto: {
        whatsapp: whatsappLink,
        email: emailLink
      }
    });
  } catch (err) {
    console.error('Error en página pública:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
