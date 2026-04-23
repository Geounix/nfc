/**
 * Sistema de Migraciones de Base de Datos
 * Permite versionar y ejecutar cambios en el esquema de BD
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');
const { logger } = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// Asegurar que el directorio de migraciones existe
function ensureMigrationsDir() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
}

/**
 * Inicializa la tabla de migraciones si no existe
 */
async function initMigrationsTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Obtiene la lista de migraciones ya aplicadas
 */
async function getAppliedMigrations() {
  const db = getDb();
  try {
    const result = await db.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`);
    return result.rows.map(r => r.name);
  } catch (err) {
    // Tabla no existe todavía
    return [];
  }
}

/**
 * Lee todas las migraciones del directorio
 */
function getMigrationFiles() {
  ensureMigrationsDir();
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

/**
 * Crea una nueva migración
 */
async function createMigration(name) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${name}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: TODO

BEGIN;

-- TODO: Add migration SQL here

COMMIT;
`;

  fs.writeFileSync(filepath, template);
  console.log(`✅ Migration created: ${filename}`);
  return filename;
}

/**
 * Ejecuta una migración
 */
async function runMigration(filename) {
  const db = getDb();
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [filename]);
    await client.query('COMMIT');
    console.log(`   ✅ Applied: ${filename}`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`   ❌ Failed: ${filename}`);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Revierte una migración (marca como no aplicada)
 */
async function rollbackMigration(filename) {
  const db = getDb();
  await db.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`, [filename]);
  console.log(`   ↩️  Rolled back: ${filename}`);
}

/**
 * Ejecuta todas las migraciones pendientes
 */
async function migrateUp() {
  console.log('\n🔄 Ejecutando migraciones...\n');

  await initMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();

  const pending = files.filter(f => !applied.includes(f));

  if (pending.length === 0) {
    console.log('   ✅ No hay migraciones pendientes.');
    return;
  }

  for (const filename of pending) {
    await runMigration(filename);
  }

  console.log(`\n✅ ${pending.length} migración(es) aplicada(s) exitosamente.\n`);
}

/**
 * Revierte la última migración
 */
async function migrateDown() {
  console.log('\n↩️  Revirtiendo última migración...\n');

  const db = getDb();
  const result = await db.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`
  );

  if (result.rows.length === 0) {
    console.log('   No hay migraciones para revertir.');
    return;
  }

  const lastMigration = result.rows[0].name;
  console.log(`   Revirtiendo: ${lastMigration}`);
  await rollbackMigration(lastMigration);
}

/**
 * Status de migraciones
 */
async function status() {
  await initMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();

  console.log('\n📋 Estado de Migraciones\n');
  console.log('   Archivo                                | Estado');
  console.log('   ----------------------------------------|----------');

  for (const file of files) {
    const isApplied = applied.includes(file);
    console.log(`   ${file.padEnd(40)} | ${isApplied ? '✅ Aplicada' : '⏳ Pendiente'}`);
  }

  console.log(`\n   Total: ${files.length} | Aplicadas: ${applied.length} | Pendientes: ${files.length - applied.length}\n`);
}

// CLI
const command = process.argv[2] || 'up';

switch (command) {
  case 'up':
    migrateUp().catch(err => {
      logger.error('Migration failed', { error: err.message });
      process.exit(1);
    });
    break;
  case 'down':
    migrateDown().catch(err => {
      logger.error('Rollback failed', { error: err.message });
      process.exit(1);
    });
    break;
  case 'status':
    status().catch(err => {
      logger.error('Status check failed', { error: err.message });
      process.exit(1);
    });
    break;
  case 'create':
    const name = process.argv[3];
    if (!name) {
      console.error('Uso: node migrate.js create <nombre_migracion>');
      process.exit(1);
    }
    createMigration(name);
    break;
  default:
    console.log('Comandos disponibles: up, down, status, create <nombre>');
}

module.exports = { migrateUp, migrateDown, status, createMigration };