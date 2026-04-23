/**
 * @fileoverview SafeTag NFC API - Routes de Autenticación
 * @module routes/auth
 * @description Maneja registro, login, recuperación de contraseña y verificación de usuarios
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { getDb } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/mailer');
const { logger } = require('../utils/logger');

// Validar entorno al cargar el módulo
const { validateEnvironment } = require('../config/env');
validateEnvironment();

const router = express.Router();

// ── Zod Schemas ──────────────────────────────────────────────────────────────

/**
 * Schema de validación para registro de usuario
 * @type {z.ZodObject}
 */
const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Schema de validación para login
 * @type {z.ZodObject}
 */
const loginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

/**
 * Schema de validación para solicitud de recuperación
 * @type {z.ZodObject}
 */
const forgotSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
});

/**
 * Schema de validación para reset de contraseña
 * @type {z.ZodObject}
 */
const resetSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ── Funciones de ayuda ───────────────────────────────────────────────────────

/**
 * Genera un token JWT sin fallbacks - falla si JWT_SECRET no está configurado
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT firmdo
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Sanitiza un email para almacenamiento seguro
 * @param {string} email - Email del usuario
 * @returns {string} Email sanitizado en minúsculas
 */
function sanitizeEmail(email) {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '');
}

/**
 * Sanitiza un nombre para almacenamiento seguro
 * @param {string} name - Nombre del usuario
 * @returns {string} Nombre sin caracteres HTML peligrosos
 */
function sanitizeName(name) {
  return name.trim().replace(/[<>'"&]/g, '').substring(0, 255);
}

// ── Rutas ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * @description Registra un nuevo usuario en el sistema
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} email - Correo electrónico único
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @returns {Object} Token JWT y datos del usuario creado
 */
router.post('/register', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Validation failed in register', { correlationId, errors: parsed.error.issues });
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { nombre, email, password } = parsed.data;

    // Sanitización adicional
    const cleanEmail = sanitizeEmail(email);
    const cleanNombre = sanitizeName(nombre);

    const db = getDb();

    // Check if email exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      logger.warn('Registration attempt with existing email', { correlationId, email: cleanEmail });
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (nombre, email, password) VALUES ($1, $2, $3) RETURNING id',
      [cleanNombre, cleanEmail, hashedPassword]
    );

    const newUserId = result.rows[0].id;

    const token = generateToken({
      id: newUserId,
      email: cleanEmail,
      nombre: cleanNombre
    });

    logger.info('User registered successfully', { correlationId, userId: newUserId });
    logger.auth('register', { correlationId, userId: newUserId });

    res.status(201).json({
      message: '¡Cuenta creada exitosamente!',
      token,
      user: { id: newUserId, nombre: cleanNombre, email: cleanEmail }
    });
  } catch (err) {
    logger.error('Error en registro', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * POST /api/auth/login
 * @description Inicia sesión y retorna token JWT
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @returns {Object} Token JWT y datos del usuario
 */
router.post('/login', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Validation failed in login', { correlationId, errors: parsed.error.issues });
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const cleanEmail = sanitizeEmail(email);

    const db = getDb();
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const user = userRes.rows[0];

    if (!user) {
      logger.warn('Login attempt with non-existent user', { correlationId, email: cleanEmail });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn('Login attempt with wrong password', { correlationId, userId: user.id });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      nombre: user.nombre
    });

    logger.info('User logged in successfully', { correlationId, userId: user.id });
    logger.auth('login', { correlationId, userId: user.id });

    res.json({
      message: '¡Bienvenido de vuelta!',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email }
    });
  } catch (err) {
    logger.error('Error en login', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * GET /api/auth/me
 * @description Verifica token y devuelve datos del usuario autenticado
 * @requires Authorization: Bearer <token>
 * @returns {Object} Datos del usuario
 */
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const db = getDb();
    const userRes = await db.query('SELECT id, nombre, email, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];

    if (!user) {
      logger.warn('User not found in /me', { correlationId, userId: req.user.id });
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ user });
  } catch (err) {
    logger.error('Error en auth/me', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * @description Solicita enlace de recuperación de contraseña
 * @param {string} email - Correo electrónico del usuario
 * @returns {Object} Mensaje de confirmación
 * @note Siempre retorna éxito para prevenir enumeración de usuarios
 */
router.post('/forgot-password', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email } = parsed.data;

    const cleanEmail = sanitizeEmail(email);

    const db = getDb();
    const userRes = await db.query('SELECT id, email FROM users WHERE email = $1', [cleanEmail]);
    const user = userRes.rows[0];

    // Por seguridad, siempre retornamos éxito aunque el correo no exista
    if (!user) {
      return res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 3600000; // 1 hora

    // HASHEAR el token antes de guardarlo
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [hashedToken, tokenExpires, user.id]
    );

    try {
      await sendResetPasswordEmail(user.email, resetToken);
    } catch (emailErr) {
      logger.error('Failed to send reset email', { correlationId, userId: user.id, error: emailErr.message });
    }

    logger.info('Password reset requested', { correlationId, userId: user.id });
    res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
  } catch (err) {
    logger.error('Error en forgot-password', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error procesando la solicitud de recuperación.' });
  }
});

/**
 * POST /api/auth/reset-password
 * @description Restablece contraseña usando token
 * @param {string} token - Token de recuperación (enviado por email)
 * @param {string} password - Nueva contraseña (mínimo 6 caracteres)
 * @returns {Object} Mensaje de confirmación
 */
router.post('/reset-password', async (req, res) => {
  const correlationId = req.correlationId || 'unknown';

  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { token, password } = parsed.data;

    // HASHEAR el token para buscarlo
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const db = getDb();
    const now = Date.now();
    const userRes = await db.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2',
      [hashedToken, now]
    );
    const user = userRes.rows[0];

    if (!user) {
      logger.warn('Invalid or expired reset token used', { correlationId });
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    logger.info('Password reset successfully', { correlationId, userId: user.id });
    logger.auth('password_reset', { correlationId, userId: user.id });

    res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    logger.error('Error en reset-password', { correlationId, error: err.message });
    res.status(500).json({ error: 'Error procesando el restablecimiento de contraseña.' });
  }
});

module.exports = router;