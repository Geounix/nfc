const express = require('express');
const { getDb } = require('../config/database');

const router = express.Router();

// GET /api/tag/:id — Datos públicos del tag (JSON para el frontend)
router.get('/:id', async (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tagRes = await db.query(`
      SELECT id, nombre_dueno, telefono, email, mensaje, activo, nombre_tag,
             tipo, especie, raza, color_descripcion, edad, info_medica
      FROM tags WHERE id = $1
    `, [tagId]);
    const tag = tagRes.rows[0];

    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado. Verifica el ID del chip NFC.' });
    }

    if (!tag.activo) {
      return res.status(403).json({ error: 'Este tag ha sido desactivado por su dueño.' });
    }

    // Registrar escaneo
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'desconocida';
    const userAgent = req.headers['user-agent'] || 'desconocido';

    await db.query(`
      INSERT INTO scans (tag_id, ip, user_agent, pais, ciudad)
      VALUES ($1, $2, $3, 'Desconocido', 'Desconocida')
    `, [tagId, ip, userAgent]);

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

    // Respuesta base
    const response = {
      tipo: tag.tipo || 'objeto',
      nombre_dueno: tag.nombre_dueno,
      nombre_tag: tag.nombre_tag,
      mensaje: tag.mensaje,
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
