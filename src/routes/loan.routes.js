const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');

// GET /api/bot/loans/status?telegram_id=12345
router.get('/status', (req, res, next) => loanController.getStatus(req, res, next));

// POST /api/bot/loans/renew
router.post('/renew', (req, res, next) => loanController.renew(req, res, next));

// GET /api/bot/loans/expiring-soon
router.get('/expiring-soon', (req, res, next) => loanController.getExpiring(req, res, next));

// POST /api/bot/loans/register
router.post('/register', (req, res, next) => loanController.registerStudent(req, res, next));

module.exports = router;
