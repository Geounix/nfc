const { Pool } = require('pg');

let pool;

function getDb() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'password',
      database: process.env.PG_DB || 'safetag',
    });

    pool.on('error', (err) => {
      console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
      process.exit(-1);
    });
  }
  return pool;
}

async function initializeSchema() {
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

    // Añadir columna imagen_mascota si no existe (Migración)
    await client.query(`ALTER TABLE tags ADD COLUMN IF NOT EXISTS imagen_mascota TEXT;`);

    // Añadir columnas para recuperar contraseña
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires BIGINT;`);

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

    await client.query('COMMIT');
    console.log('✅ Esquema PostgreSQL inicializado / verificado correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error inicializando esquema en Postgres:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getDb, initializeSchema };
