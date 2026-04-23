/**
 * Validación de variables de entorno
 * Lanzará error al inicio si JWT_SECRET no está configurado correctamente
 */

const requiredEnvVars = ['JWT_SECRET', 'PG_HOST', 'PG_USER', 'PG_PASSWORD', 'PG_DB'];

const FORBIDDEN_VALUES = ['secret_dev_key', 'dev_secret', 'your-secret-key', 'changeme', 'password', '123456'];

const FRONTEND_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:8080'];

function getForbiddenSecrets() {
  return FORBIDDEN_VALUES;
}

function getAllowedOrigins() {
  return FRONTEND_ORIGINS;
}

function validateEnvironment() {
  const missingVars = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Error de configuración: Variables de entorno requeridas faltantes: ${missingVars.join(', ')}\n` +
      'Revisa tu archivo .env y asegúrate de que todas las variables requeridas estén definidas.'
    );
  }

  // Verificar JWT_SECRET mínimo 32 caracteres
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'Error de seguridad: JWT_SECRET debe tener al menos 32 caracteres.\n' +
      'Genera uno seguro: node -e "console.log(require("crypto").randomBytes(48).toString("hex"))"'
    );
  }

  // Verificar que JWT_SECRET no sea un valor conocido/inseguro
  const jwtSecretLower = process.env.JWT_SECRET.toLowerCase();
  if (FORBIDDEN_VALUES.some(forbidden => jwtSecretLower.includes(forbidden))) {
    throw new Error(
      'Error de seguridad: JWT_SECRET contiene un valor prohibitivo.\n' +
      'No uses valores como "secret_dev_key", "changeme", etc.\n' +
      'Genera un secreto seguro usando: node -e "console.log(require("crypto").randomBytes(48).toString("hex"))"'
    );
  }

  console.log('✅ Validación de variables de entorno completada');
  console.log(`   Frontend origins permitidos: ${FRONTEND_ORIGINS.join(', ')}`);
}

module.exports = {
  validateEnvironment,
  getAllowedOrigins,
  getForbiddenSecrets
};