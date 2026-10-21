const bookRepository = require('../repositories/book.repository');

class BookService {
  /**
   * Búsqueda inteligente de libros para el bot
   */
  async searchBooks(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const error = new Error('El parámetro "query" es requerido para buscar libros.');
      error.statusCode = 400;
      throw error;
    }

    const books = await bookRepository.searchBooks(query);

    return {
      totalFound: books.length,
      query: query.trim(),
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        edition: book.edition,
        availableCopies: book.available_copies,
        totalCopies: book.total_copies,
        isAvailable: book.is_available,
        locationShelf: book.location_shelf,
        isDigital: book.is_digital,
        digitalUrl: book.digital_url,
        statusText: book.available_copies > 0 
          ? `✅ Disponible (${book.available_copies} ejemplares en ${book.location_shelf})` 
          : '❌ Sin copias físicas disponibles actualmente'
      }))
    };
  }

  /**
   * Obtener libro por ID
   */
  async getBookById(id) {
    const book = await bookRepository.findById(id);
    if (!book) {
      const error = new Error(`No se encontró ningún libro con el ID: ${id}`);
      error.statusCode = 404;
      throw error;
    }
    return book;
  }
}

module.exports = new BookService();
