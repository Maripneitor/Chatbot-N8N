const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares globales con variables de entorno
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log básico de peticiones para auditoría
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Montaje de rutas API
app.use('/api', apiRoutes);

// Manejador de rutas 404
app.use(notFoundHandler);

// Manejador centralizado de errores (PDF Página 6)
app.use(errorHandler);

module.exports = app;
