const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

// GET /api/bot/books?query=calculo
router.get('/', (req, res, next) => bookController.searchBooks(req, res, next));

// GET /api/bot/books/:id
router.get('/:id', (req, res, next) => bookController.getBookById(req, res, next));

module.exports = router;
