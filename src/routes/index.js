const express = require('express');
const router = express.Router();

const bookRoutes = require('./book.routes');
const loanRoutes = require('./loan.routes');
const rfidRoutes = require('./rfid.routes');
const { validateSecretToken } = require('../middlewares/auth.middleware');

// Endpoint público para verificación de estado (Healthcheck)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'gestor-biblioteca-api',
    timestamp: new Date().toISOString()
  });
});

// Rutas protegidas por el Secret Token para n8n y hardware
router.use('/bot/books', validateSecretToken, bookRoutes);
router.use('/bot/loans', validateSecretToken, loanRoutes);
router.use('/bot/students', validateSecretToken, loanRoutes);
router.use('/rfid', validateSecretToken, rfidRoutes);

module.exports = router;
