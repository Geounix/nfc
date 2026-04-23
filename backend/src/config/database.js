const { Pool } = require('pg');
const { logger } = require('../utils/logger');

let pool;

function getDb() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'password',
      database: process.env.PG_DB || 'safetag',
      max: 20, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.dbError('Pool error', err, { context: 'getDb' });
      process.exit(-1);
    });

    pool.on('connect', () => {
      logger.debug('New client connected to pool', { poolSize: pool.totalCount });
    });
  }
  return pool;
}

async function initializeSchema() {
  const correlationId = 'schema-init';
  const currentPool = getDb();
  const client = await currentPool.connect();

  try {
    await client.query('BEGIN');

    // Tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear índice para búsqueda por email (más rápido)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Tabla de tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nombre_tag VARCHAR(255) NOT NULL,
        nombre_dueno VARCHAR(255) NOT NULL,
        telefono VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mensaje TEXT DEFAULT '¡Hola! Por favor contáctame.',
        activo BOOLEAN DEFAULT true,
        tipo VARCHAR(50) DEFAULT 'objeto',
        especie VARCHAR(100),
        raza VARCHAR(100),
        color_descripcion VARCHAR(255),
        edad VARCHAR(50),
        info_medica TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Índices para tags
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_activo ON tags(activo);
    `);

    // Añadir columna imagen_mascota si no existe (Migración)
    await client.query(`ALTER TABLE tags ADD COLUMN IF NOT EXISTS imagen_mascota TEXT;`);

    // Añadir columnas para recuperar contraseña
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires BIGINT;`);

    // ÍNDICE para tokens de reset (mejora seguridad y performance)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)
      WHERE reset_password_token IS NOT NULL;
    `);

    // Tabla de escaneos
    await client.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id SERIAL PRIMARY KEY,
        tag_id VARCHAR(50) NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        ip VARCHAR(50),
        user_agent TEXT,
        pais VARCHAR(100),
        ciudad VARCHAR(100),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Índice para escaneos
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scans_tag_id ON scans(tag_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
    `);

    await client.query('COMMIT');
    logger.info('✅ PostgreSQL schema initialized/verified', { correlationId });
    console.log('✅ Esquema PostgreSQL inicializado / verificado correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.dbError('Schema initialization', err, { correlationId });
    console.error('❌ Error inicializando esquema en Postgres:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getDb, initializeSchema };