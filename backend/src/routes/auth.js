const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { getDb } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/mailer');

const router = express.Router();

// ── Zod Schemas ──
const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const forgotSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
});

const resetSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { nombre, email, password } = parsed.data;

    const db = getDb();
    
    // Check if email exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert user
    const result = await db.query(
      'INSERT INTO users (nombre, email, password) VALUES ($1, $2, $3) RETURNING id',
      [nombre.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUserId = result.rows[0].id;

    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), nombre: nombre.trim() },
      process.env.JWT_SECRET || 'secret_dev_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '¡Cuenta creada exitosamente!',
      token,
      user: { id: newUserId, nombre: nombre.trim(), email: email.toLowerCase().trim() }
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const db = getDb();
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      process.env.JWT_SECRET || 'secret_dev_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: '¡Bienvenido de vuelta!',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/auth/me — verificar token y devolver datos del usuario
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const db = getDb();
    const userRes = await db.query('SELECT id, nombre, email, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    
    res.json({ user });
  } catch (err) {
    console.error('Error en auth/me:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email } = parsed.data;

    const db = getDb();
    const userRes = await db.query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userRes.rows[0];

    // Por seguridad, siempre retornamos éxito aunque el correo no exista (evita enumeración)
    if (!user) {
      return res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 3600000; // 1 hora

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, tokenExpires, user.id]
    );

    await sendResetPasswordEmail(user.email, resetToken);

    res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ error: 'Error procesando la solicitud de recuperación.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { token, password } = parsed.data;

    const db = getDb();
    const now = Date.now();
    const userRes = await db.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2',
      [token, now]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ error: 'Error procesando el restablecimiento de contraseña.' });
  }
});

module.exports = router;
