const express = require('express');
const { z } = require('zod');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// ── Schemas de validación ──
const tagSchema = z.object({
  id: z.string()
    .regex(/^[A-Z0-9\-_]{3,30}$/i, 'ID inválido: solo letras, números, guiones (3-30 caracteres)')
    .transform(val => val.trim().toUpperCase()),
  nombre_tag: z.string().min(1, 'Requerido').max(255),
  nombre_dueno: z.string().min(1, 'Requerido').max(255),
  telefono: z.string().min(1, 'Requerido').max(50),
  email: z.string().email(),
  mensaje: z.string().max(1000).optional(),
  tipo: z.enum(['mascota', 'objeto']).optional(),
  especie: z.string().max(100).optional(),
  raza: z.string().max(100).optional(),
  color_descripcion: z.string().max(255).optional(),
  edad: z.string().max(50).optional(),
  info_medica: z.string().max(1000).optional(),
  imagen_mascota: z.string().url().optional().or(z.literal('')),
});

// ── Constantes de paginación ──
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ── Funciones de sanitización ──
function sanitizeTagId(id) {
  if (!id || typeof id !== 'string') return null;
  // Solo permitir caracteres seguros, convertir a mayúsculas
  const clean = id.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
  if (clean.length < 3 || clean.length > 30) return null;
  return clean;
}

function sanitizeString(str, maxLength = 255) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>'"&]/g, '').substring(0, maxLength);
}

function sanitizeEmail(email) {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '');
}

// ── Middleware de autenticación ──
router.use(authMiddleware);

// GET /api/tags — listar mis tags con paginación
router.get('/', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * limit;

    const db = getDb();

    // Query con paginación
    const result = await db.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM scans WHERE tag_id = t.id) as total_scans,
        (SELECT MAX(scanned_at) FROM scans WHERE tag_id = t.id) as ultimo_escaneo
      FROM tags t
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    // Total de tags para calcular páginas
    const countResult = await db.query('SELECT COUNT(*) as total FROM tags WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].total, 10);

    const tags = result.rows.map(row => ({
      ...row,
      total_scans: parseInt(row.total_scans || 0, 10)
    }));

    logger.debug('Tags listed', { correlationId, userId: req.user.id, page, limit, count: tags.length });

    res.json({
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + tags.length < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    logger.error('Error listing tags', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error al obtener los tags.' });
  }
});

// POST /api/tags — crear nuevo tag
router.post('/', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const parsed = tagSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Tag validation failed', { correlationId, errors: parsed.error.issues });
      return res.status(400).json({
        error: 'Datos inválidos. Verifica todos los campos requeridos.',
        details: parsed.error.issues.map(i => i.message)
      });
    }

    const {
      id, nombre_tag, nombre_dueno, telefono, email, mensaje,
      tipo, especie, raza, color_descripcion, edad, info_medica, imagen_mascota
    } = parsed.data;

    const tipoClean = (tipo === 'mascota') ? 'mascota' : 'objeto';

    // Validar campos extra para mascotas
    if (tipoClean === 'mascota' && !especie) {
      return res.status(400).json({ error: 'Para mascotas, la especie es requerida (ej: Perro, Gato).' });
    }

    const db = getDb();

    const existingTag = await db.query('SELECT id, user_id FROM tags WHERE id = $1', [id]);
    if (existingTag.rows.length > 0) {
      return res.status(409).json({ error: 'Este ID de tag ya está registrado por otro usuario.' });
    }

    const defaultMsg = tipoClean === 'mascota'
      ? '¡Hola! Encontraste a mi mascota. Por favor contáctame, te lo agradezco mucho'
      : '¡Hola! Encontraste mi objeto. Por favor contáctame.';

    await db.query(`
      INSERT INTO tags
        (id, user_id, nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
         tipo, especie, raza, color_descripcion, edad, info_medica, imagen_mascota)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id,
      req.user.id,
      sanitizeString(nombre_tag),
      sanitizeString(nombre_dueno),
      sanitizeString(telefono, 50),
      sanitizeEmail(email),
      mensaje ? sanitizeString(mensaje, 1000) : defaultMsg,
      tipoClean,
      especie ? sanitizeString(especie, 100) : null,
      raza ? sanitizeString(raza, 100) : null,
      color_descripcion ? sanitizeString(color_descripcion, 255) : null,
      edad ? sanitizeString(edad, 50) : null,
      info_medica ? sanitizeString(info_medica, 1000) : null,
      imagen_mascota || null
    ]);

    const newTagRes = await db.query('SELECT * FROM tags WHERE id = $1', [id]);
    logger.info('Tag created', { correlationId, userId: req.user.id, tagId: id });

    res.status(201).json({ message: 'Tag registrado exitosamente.', tag: newTagRes.rows[0] });
  } catch (err) {
    logger.error('Error creating tag', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error al crear el tag.' });
  }
});

const updateSchema = tagSchema.partial();

// PUT /api/tags/:id — editar tag (con sanitización adicional)
router.put('/:id', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    // Sanitización adicional del ID en la URL
    const tagId = sanitizeTagId(req.params.id);
    if (!tagId) {
      return res.status(400).json({ error: 'ID de tag inválido.' });
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Tag update validation failed', { correlationId, tagId, errors: parsed.error.issues });
      return res.status(400).json({
        error: 'Datos inválidos. Verifica todos los campos enviados.',
        details: parsed.error.issues.map(i => i.message)
      });
    }

    const db = getDb();

    const tagRes = await db.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para editarlo.' });
    }

    const {
      nombre_tag, nombre_dueno, telefono, email, mensaje, activo,
      especie, raza, color_descripcion, edad, info_medica, imagen_mascota
    } = parsed.data;

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
      nombre_tag        ? sanitizeString(nombre_tag)              : null,
      nombre_dueno      ? sanitizeString(nombre_dueno)            : null,
      telefono          ? sanitizeString(telefono, 50)            : null,
      email             ? sanitizeEmail(email)                     : null,
      mensaje           ? sanitizeString(mensaje, 1000)           : null,
      activo !== undefined ? activo                              : null,
      especie           ? sanitizeString(especie, 100)           : null,
      raza              ? sanitizeString(raza, 100)               : null,
      color_descripcion ? sanitizeString(color_descripcion, 255)  : null,
      edad              ? sanitizeString(edad, 50)                : null,
      info_medica       ? sanitizeString(info_medica, 1000)        : null,
      imagen_mascota    ? imagen_mascota                          : null,
      tagId,
      req.user.id
    ]);

    const updatedTagRes = await db.query('SELECT * FROM tags WHERE id = $1', [tagId]);
    logger.info('Tag updated', { correlationId, userId: req.user.id, tagId });

    res.json({ message: 'Tag actualizado exitosamente.', tag: updatedTagRes.rows[0] });
  } catch (err) {
    logger.error('Error updating tag', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error al actualizar el tag.' });
  }
});

// DELETE /api/tags/:id — eliminar tag
router.delete('/:id', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const tagId = sanitizeTagId(req.params.id);
    if (!tagId) {
      return res.status(400).json({ error: 'ID de tag inválido.' });
    }

    const db = getDb();

    const tagRes = await db.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tag no encontrado o no tienes permisos para eliminarlo.' });
    }

    await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [tagId, req.user.id]);
    logger.info('Tag deleted', { correlationId, userId: req.user.id, tagId });

    res.json({ message: 'Tag eliminado exitosamente.' });
  } catch (err) {
    logger.error('Error deleting tag', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error al eliminar el tag.' });
  }
});

// GET /api/tags/:id/scans — historial de escaneos (con paginación)
router.get('/:id/scans', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const tagId = sanitizeTagId(req.params.id);
    if (!tagId) {
      return res.status(400).json({ error: 'ID de tag inválido.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

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
      LIMIT $2 OFFSET $3
    `, [tagId, limit, offset]);

    const countRes = await db.query('SELECT COUNT(*) as total FROM scans WHERE tag_id = $1', [tagId]);
    const total = parseInt(countRes.rows[0].total, 10);

    logger.debug('Scans retrieved', { correlationId, userId: req.user.id, tagId, count: scansRes.rows.length });

    res.json({
      tag_id: tagId,
      scans: scansRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error('Error getting scans', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error al obtener el historial de escaneos.' });
  }
});

module.exports = router;