const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

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

module.exports = router;
