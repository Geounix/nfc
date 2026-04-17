const express = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tags — listar mis tags
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const tags = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM scans WHERE tag_id = t.id) as total_scans,
        (SELECT MAX(scanned_at) FROM scans WHERE tag_id = t.id) as ultimo_escaneo
      FROM tags t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `).all(req.user.id);

    res.json({ tags });
  } catch (err) {
    console.error('Error listando tags:', err);
    res.status(500).json({ error: 'Error al obtener los tags.' });
  }
});

// POST /api/tags — crear nuevo tag
router.post('/', (req, res) => {
  try {
    const {
      id, nombre_tag, nombre_dueno, telefono, email, mensaje,
      tipo, especie, raza, color_descripcion, edad, info_medica
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

    const existingTag = db.prepare('SELECT id, user_id FROM tags WHERE id = ?').get(idClean);
    if (existingTag) {
      return res.status(409).json({ error: 'Este ID de tag ya está registrado por otro usuario.' });
    }

    const defaultMsg = tipoClean === 'mascota'
      ? '¡Hola! Encontraste a mi mascota. Por favor contáctame, te lo agradezco mucho 🐾'
      : '¡Hola! Encontraste mi objeto. Por favor contáctame.';

    db.prepare(`
      INSERT INTO tags
        (id, user_id, nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
         tipo, especie, raza, color_descripcion, edad, info_medica)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
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
      info_medica ? info_medica.trim() : null
    );

    const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(idClean);
    res.status(201).json({ message: 'Tag registrado exitosamente.', tag: newTag });
  } catch (err) {
    console.error('Error creando tag:', err);
    res.status(500).json({ error: 'Error al crear el tag.' });
  }
});

// PUT /api/tags/:id — editar tag
router.put('/:id', (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(tagId, req.user.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para editarlo.' });
    }

    const {
      nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
      especie, raza, color_descripcion, edad, info_medica
    } = req.body;

    db.prepare(`
      UPDATE tags SET
        nombre_tag        = COALESCE(?, nombre_tag),
        nombre_dueno      = COALESCE(?, nombre_dueno),
        telefono          = COALESCE(?, telefono),
        email             = COALESCE(?, email),
        mensaje           = COALESCE(?, mensaje),
        activo            = COALESCE(?, activo),
        especie           = COALESCE(?, especie),
        raza              = COALESCE(?, raza),
        color_descripcion = COALESCE(?, color_descripcion),
        edad              = COALESCE(?, edad),
        info_medica       = COALESCE(?, info_medica)
      WHERE id = ? AND user_id = ?
    `).run(
      nombre_tag        ? nombre_tag.trim()              : null,
      nombre_dueno      ? nombre_dueno.trim()            : null,
      telefono          ? telefono.trim()                : null,
      email             ? email.toLowerCase().trim()     : null,
      mensaje           ? mensaje.trim()                 : null,
      activo !== undefined ? (activo ? 1 : 0)           : null,
      especie           ? especie.trim()                 : null,
      raza              ? raza.trim()                    : null,
      color_descripcion ? color_descripcion.trim()       : null,
      edad              ? edad.trim()                    : null,
      info_medica       ? info_medica.trim()             : null,
      tagId,
      req.user.id
    );

    const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
    res.json({ message: 'Tag actualizado exitosamente.', tag: updatedTag });
  } catch (err) {
    console.error('Error actualizando tag:', err);
    res.status(500).json({ error: 'Error al actualizar el tag.' });
  }
});

// DELETE /api/tags/:id — eliminar tag
router.delete('/:id', (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(tagId, req.user.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para eliminarlo.' });
    }

    db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(tagId, req.user.id);
    res.json({ message: 'Tag eliminado exitosamente.' });
  } catch (err) {
    console.error('Error eliminando tag:', err);
    res.status(500).json({ error: 'Error al eliminar el tag.' });
  }
});

// GET /api/tags/:id/scans — historial de escaneos
router.get('/:id/scans', (req, res) => {
  try {
    const tagId = req.params.id.toUpperCase();
    const db = getDb();

    const tag = db.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?').get(tagId, req.user.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos.' });
    }

    const scans = db.prepare(`
      SELECT * FROM scans WHERE tag_id = ? ORDER BY scanned_at DESC LIMIT 100
    `).all(tagId);

    res.json({ tag_id: tagId, total: scans.length, scans });
  } catch (err) {
    console.error('Error obteniendo escaneos:', err);
    res.status(500).json({ error: 'Error al obtener el historial de escaneos.' });
  }
});

module.exports = router;
