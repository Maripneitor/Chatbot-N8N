const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfid.controller');

// POST /api/rfid/detect
router.post('/detect', (req, res, next) => rfidController.detectTag(req, res, next));

module.exports = router;
