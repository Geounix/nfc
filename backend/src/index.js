require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mime = require('mime');

const authRoutes = require('./routes/auth');
const tagsRoutes = require('./routes/tags');
const publicRoutes = require('./routes/public');
const { logger, correlationMiddleware } = require('./utils/logger');
const { getAllowedOrigins, validateEnvironment } = require('./config/env');

// Validar entorno al iniciar (lanzará error si JWT_SECRET es inválido)
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_PATH = path.join(__dirname, '../../frontend/dist');

// ── Middleware global ──────────────────────────────────────────────────────────

// Middleware de correlation ID (agregar antes de todo)
app.use(correlationMiddleware);

// CORS configurado con orígenes específicos (más seguro)
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Permitir requests sin origen (como Postman/cURL) en desarrollo
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from unauthorized origin', { origin, allowedOrigins });
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

app.use(express.json({ limit: '10kb' })); // Limitar tamaño del body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Servir archivos estáticos del frontend con MIME types correctos ────────────
app.use(express.static(FRONTEND_PATH, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === '.js' || ext === '.mjs') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (ext === '.ico') {
      res.setHeader('Content-Type', 'image/x-icon');
    }
  }
}));

// ── Rate limiters ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

// Rate limiter específico para forgot-password (3 solicitudes por hora)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de recuperación. Espera 1 hora.' }
});

const tagScanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados escaneos. Intenta en un momento.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento.' }
});

// ── Rutas API ──────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter); // Rate limit general para toda la API
app.use('/api/auth/forgot-password', forgotPasswordLimiter); // Rate limit específico para forgot-password
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/tag', tagScanLimiter, publicRoutes);

// Serve tag.html for /tag/:id so browsers get the visual page
app.get('/tag/:id', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'tag.html'));
});

// ── Rutas del frontend ──────────────────────────────────────────

// Landing page - sirve el index.html del frontend React
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'dashboard.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'register.html'));
});
app.get('/reset-password.html', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'reset-password.html'));
});

// ── Health check (sin auth) - Verificación de dependencias ────────────────────
const { getDb } = require('./config/database');

app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  
  try {
    const pool = getDb();
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
    logger.error('Health check - DB connection failed', { error: err.message });
  }
  
  res.json({
    status: 'ok',
    message: 'Cerca API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {
      database: dbStatus
    }
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('404 - Route not found', { correlationId: req.correlationId, path: req.path });
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ── Error Handler global ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    correlationId: req.correlationId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ error: 'Origin no permitido.' });
  }

  res.status(500).json({ error: 'Error interno del servidor.' });
});

const { initializeSchema } = require('./config/database');

// ── Start server ──────────────────────────────────────────────────────────────
initializeSchema().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info('🚀 Server started', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      allowedOrigins: getAllowedOrigins()
    });

    console.log(`\n🏷️  Cerca API + Frontend corriendo en:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Red LAN:  http://[TU_IP_LOCAL]:${PORT}`);
    console.log(`\n📡 Endpoints API:`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/forgot-password`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/reset-password`);
    console.log(`   GET    http://localhost:${PORT}/api/tags`);
    console.log(`   POST   http://localhost:${PORT}/api/tags`);
    console.log(`   GET    http://localhost:${PORT}/api/tag/:id  (API JSON)`);
    console.log(`   GET    http://localhost:${PORT}/tag/:id       (Página pública HTML)`);
    console.log(`\n🌐 Páginas del Frontend:`);
    console.log(`   GET    http://localhost:${PORT}/          (Landing Page)`);
    console.log(`   GET    http://localhost:${PORT}/login     (Iniciar sesión)`);
    console.log(`   GET    http://localhost:${PORT}/register  (Registro)`);
    console.log(`   GET    http://localhost:${PORT}/dashboard  (Panel de usuario)`);
    console.log(`\n💾 Base de datos: PostgreSQL (safetag)`);
    console.log(`\n✅ Servidor listo!\n`);
  });
}).catch(err => {
  logger.error('Fatal error - could not start server', { error: err.message });
  console.error("❌ Error grave: No se pudo conectar o inicializar PostgreSQL. Revisa tus credenciales en el archivo .env", err);
  process.exit(1);
});

module.exports = app;
