require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const tagsRoutes = require('./routes/tags');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ──────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// ── Rate limiters ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

const tagScanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Demasiados escaneos. Intenta en un momento.' }
});

// ── Rutas API ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/tag', tagScanLimiter, publicRoutes);

// Serve tag.html for /tag/:id so browsers get the visual page
app.get('/tag/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/tag.html'));
});

// ── Rutas del frontend (SPA fallback) ─────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dashboard.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/register.html'));
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafeTag API funcionando correctamente 🚀', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

const { initializeSchema } = require('./config/database');

// ── Start server ──────────────────────────────────────────────────────────────
initializeSchema().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🏷️  SafeTag API corriendo en:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Red LAN:  http://[TU_IP_LOCAL]:${PORT}`);
    console.log(`\n📡 Endpoints disponibles:`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET    http://localhost:${PORT}/api/tags`);
    console.log(`   POST   http://localhost:${PORT}/api/tags`);
    console.log(`   GET    http://localhost:${PORT}/api/tag/:id  (API JSON)`);
    console.log(`   GET    http://localhost:${PORT}/tag/:id       (Página pública HTML)`);
    console.log(`\n💾 Base de datos: PostgreSQL (safetag)`);
    console.log(`\n✅ Servidor listo!\n`);
  });
}).catch(err => {
  console.error("❌ Error grave: No se pudo conectar o inicializar PostgreSQL. Revisa tus credenciales en el archivo .env", err);
  process.exit(1);
});

module.exports = app;
