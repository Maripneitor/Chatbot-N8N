const bookService = require('../services/book.service');

class BookController {
  /**
   * Endpoint para búsqueda de libros por lenguaje natural o palabras clave
   * GET /api/bot/books?query=calculo
   */
  async searchBooks(req, res, next) {
    try {
      const { query } = req.query;
      const result = await bookService.searchBooks(query);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint para consultar un libro específico por ID
   * GET /api/bot/books/:id
   */
  async getBookById(req, res, next) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: book
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookController();
