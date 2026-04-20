const express = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tags — listar mis tags
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM scans WHERE tag_id = t.id) as total_scans,
        (SELECT MAX(scanned_at) FROM scans WHERE tag_id = t.id) as ultimo_escaneo
      FROM tags t
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    // pg returns count as string sometimes, convert if needed, but JS handles it
    const tags = result.rows.map(row => ({
      ...row,
      total_scans: parseInt(row.total_scans || 0, 10)
    }));

    res.json({ tags });
  } catch (err) {
    console.error('Error listando tags:', err);
    res.status(500).json({ error: 'Error al obtener los tags.' });
  }
});

// POST /api/tags — crear nuevo tag
router.post('/', async (req, res) => {
  try {
    const {
      id, nombre_tag, nombre_dueno, telefono, email, mensaje,
      tipo, especie, raza, color_descripcion, edad, info_medica, imagen_mascota
    } = req.body;

    if (!id || !nombre_tag || !nombre_dueno || !telefono || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos: id, nombre_tag, nombre_dueno, telefono, email.' });
    }

    const tipoClean = (tipo === 'mascota') ? 'mascota' : 'objeto';

    // Validar campos extra para mascotas
    if (tipoClean === 'mascota' && !especie) {
      return res.status(400).json({ error: 'Para mascotas, la especie es requerida (ej: Perro, Gato).' });
    }

    // Validar formato de ID
    const idClean = id.trim().toUpperCase();
    if (!/^[A-Z0-9\-_]{3,30}$/.test(idClean)) {
      return res.status(400).json({ error: 'El ID del tag solo puede contener letras, números, guiones o guiones bajos (3-30 caracteres).' });
    }

    const db = getDb();

    const existingTag = await db.query('SELECT id, user_id FROM tags WHERE id = $1', [idClean]);
    if (existingTag.rows.length > 0) {
      return res.status(409).json({ error: 'Este ID de tag ya está registrado por otro usuario.' });
    }

    const defaultMsg = tipoClean === 'mascota'
      ? '¡Hola! Encontraste a mi mascota. Por favor contáctame, te lo agradezco mucho 🐾'
      : '¡Hola! Encontraste mi objeto. Por favor contáctame.';

    await db.query(`
      INSERT INTO tags
        (id, user_id, nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
         tipo, especie, raza, color_descripcion, edad, info_medica, imagen_mascota)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13, $14)
    `, [
      idClean,
      req.user.id,
      nombre_tag.trim(),
      nombre_dueno.trim(),
      telefono.trim(),
      email.toLowerCase().trim(),
      mensaje ? mensaje.trim() : defaultMsg,
      tipoClean,
      especie ? especie.trim() : null,
      raza ? raza.trim() : null,
      color_descripcion ? color_descripcion.trim() : null,
      edad ? edad.trim() : null,
      info_medica ? info_medica.trim() : null,
      imagen_mascota || null
    ]);

    const newTagRes = await db.query('SELECT * FROM tags WHERE id = $1', [idClean]);
    res.status(201).json({ message: 'Tag registrado exitosamente.', tag: newTagRes.rows[0] });
  } catch (err) {
    console.error('Error creando tag:', err);
    res.status(500).json({ error: 'Error al crear el tag.' });
  }
});

// PUT /api/tags/:id — editar tag
router.put('/:id', async (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tagRes = await db.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para editarlo.' });
    }

    const {
      nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
      especie, raza, color_descripcion, edad, info_medica, imagen_mascota
    } = req.body;

    await db.query(`
      UPDATE tags SET
        nombre_tag        = COALESCE($1, nombre_tag),
        nombre_dueno      = COALESCE($2, nombre_dueno),
        telefono          = COALESCE($3, telefono),
        email             = COALESCE($4, email),
        mensaje           = COALESCE($5, mensaje),
        activo            = COALESCE($6, activo),
        especie           = COALESCE($7, especie),
        raza              = COALESCE($8, raza),
        color_descripcion = COALESCE($9, color_descripcion),
        edad              = COALESCE($10, edad),
        info_medica       = COALESCE($11, info_medica),
        imagen_mascota    = COALESCE($12, imagen_mascota)
      WHERE id = $13 AND user_id = $14
    `, [
      nombre_tag        ? nombre_tag.trim()              : null,
      nombre_dueno      ? nombre_dueno.trim()            : null,
      telefono          ? telefono.trim()                : null,
      email             ? email.toLowerCase().trim()     : null,
      mensaje           ? mensaje.trim()                 : null,
      activo !== undefined ? activo                      : null,
      especie           ? especie.trim()                 : null,
      raza              ? raza.trim()                    : null,
      color_descripcion ? color_descripcion.trim()       : null,
      edad              ? edad.trim()                    : null,
      info_medica       ? info_medica.trim()             : null,
      imagen_mascota    ? imagen_mascota                 : null,
      tagId,
      req.user.id
    ]);

    const updatedTagRes = await db.query('SELECT * FROM tags WHERE id = $1', [tagId]);
    res.json({ message: 'Tag actualizado exitosamente.', tag: updatedTagRes.rows[0] });
  } catch (err) {
    console.error('Error actualizando tag:', err);
    res.status(500).json({ error: 'Error al actualizar el tag.' });
  }
});

// DELETE /api/tags/:id — eliminar tag
router.delete('/:id', async (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tagRes = await db.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para eliminarlo.' });
    }

    await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    res.json({ message: 'Tag eliminado exitosamente.' });
  } catch (err) {
    console.error('Error eliminando tag:', err);
    res.status(500).json({ error: 'Error al eliminar el tag.' });
  }
});

// GET /api/tags/:id/scans — historial de escaneos
router.get('/:id/scans', async (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tagRes = await db.query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos.' });
    }

    const scansRes = await db.query(`
      SELECT id, tag_id, ip, user_agent, pais, ciudad, scanned_at 
      FROM scans 
      WHERE tag_id = $1 
      ORDER BY scanned_at DESC 
      LIMIT 100
    `, [tagId]);

    res.json({ tag_id: tagId, total: scansRes.rows.length, scans: scansRes.rows });
  } catch (err) {
    console.error('Error obteniendo escaneos:', err);
    res.status(500).json({ error: 'Error al obtener el historial de escaneos.' });
  }
});

module.exports = router;
