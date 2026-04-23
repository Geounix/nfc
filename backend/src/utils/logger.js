/**
 * Logger estructurado con Correlation IDs para tracking de requests
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

/**
 * Genera un correlation ID único
 */
function generateCorrelationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `corr_${timestamp}_${random}`;
}

/**
 * Obtiene timestamp ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Formatea el log como JSON estructurado
 */
function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  });
}

/**
 * Middleware de Express para agregar correlation ID a cada request
 */
function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Log de request entrante
  log('info', `→ ${req.method} ${req.path}`, {
    correlationId,
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 100)
  });

  // Medir duración de request
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    log('info', `← ${req.method} ${req.path} ${res.statusCode}`, {
      correlationId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

/**
 * Función principal de logging
 */
function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] > currentLevel) return;

  const output = formatLog(level, message, meta);

  switch (level) {
    case 'ERROR':
      console.error(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    case 'DEBUG':
      if (process.env.NODE_ENV === 'development') {
        console.log(output);
      }
      break;
    default:
      console.log(output);
  }
}

// Métodos de conveniencia
const logger = {
  error: (msg, meta) => log('ERROR', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta),

  // Logging específico para BD
  dbError: (operation, error, meta = {}) => {
    log('ERROR', `Database error in ${operation}`, {
      ...meta,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  },

  // Logging específico para HTTP
  httpRequest: (method, path, statusCode, duration, correlationId) => {
    log('info', `${method} ${path} ${statusCode}`, {
      correlationId,
      statusCode,
      duration: `${duration}ms`
    });
  },

  // Logging específico para autenticación
  auth: (event, meta = {}) => {
    log('info', `Auth event: ${event}`, meta);
  },

  // Wrapper con correlation ID incluido
  withCorrelation: (correlationId) => ({
    error: (msg, meta) => log('ERROR', msg, { correlationId, ...meta }),
    warn: (msg, meta) => log('WARN', msg, { correlationId, ...meta }),
    info: (msg, meta) => log('INFO', msg, { correlationId, ...meta }),
    debug: (msg, meta) => log('DEBUG', msg, { correlationId, ...meta })
  })
};

module.exports = {
  logger,
  correlationMiddleware,
  generateCorrelationId,
  getTimestamp
};