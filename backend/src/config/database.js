const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    runMigrations();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      nombre_tag TEXT NOT NULL,
      nombre_dueno TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      mensaje TEXT DEFAULT '¡Hola! Por favor contáctame.',
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      pais TEXT,
      ciudad TEXT,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Base de datos SQLite inicializada correctamente');
}

// Migraciones seguras — solo agregan columnas si no existen
function runMigrations() {
  const existingCols = db.prepare(`PRAGMA table_info(tags)`).all().map(c => c.name);

  const petColumns = [
    { name: 'tipo',              sql: `ALTER TABLE tags ADD COLUMN tipo TEXT DEFAULT 'objeto'` },
    { name: 'especie',           sql: `ALTER TABLE tags ADD COLUMN especie TEXT` },
    { name: 'raza',              sql: `ALTER TABLE tags ADD COLUMN raza TEXT` },
    { name: 'color_descripcion', sql: `ALTER TABLE tags ADD COLUMN color_descripcion TEXT` },
    { name: 'edad',              sql: `ALTER TABLE tags ADD COLUMN edad TEXT` },
    { name: 'info_medica',       sql: `ALTER TABLE tags ADD COLUMN info_medica TEXT` },
  ];

  let migrated = 0;
  for (const col of petColumns) {
    if (!existingCols.includes(col.name)) {
      db.exec(col.sql);
      migrated++;
    }
  }

  if (migrated > 0) {
    console.log(`🔄 Migración: ${migrated} columna(s) de mascotas agregadas a la tabla tags`);
  }
}

module.exports = { getDb };
