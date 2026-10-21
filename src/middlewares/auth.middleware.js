const env = require('../config/env');

/**
 * Middleware para validar el token secreto entre n8n y Node.js.
 * Cumple con la buena práctica de seguridad de Webhooks (PDF Página 5).
 */
function validateSecretToken(req, res, next) {
  const incomingToken = req.headers['x-secret-token'];

  // Si no se configuró token en producción, permitir si se desea o requerir siempre
  if (!incomingToken || incomingToken !== env.security.n8nSecretToken) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Acceso no autorizado: Token de webhook no válido o ausente en el header x-secret-token'
    });
  }

  next();
}

module.exports = {
  validateSecretToken,
};
