/**
 * Middleware centralizado de errores para Express.
 * Cumple con el estándar de errores precisos (400, 404, 500) para n8n (PDF Página 6).
 */
function errorHandler(err, req, res, next) {
  console.error(`❌ [Error en ${req.method} ${req.originalUrl}]:`, err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Ocurrió un error inesperado en el servidor',
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware para rutas no encontradas (404)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'ROUTE_NOT_FOUND',
    message: `La ruta solicitada ${req.method} ${req.originalUrl} no existe en este servidor`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
