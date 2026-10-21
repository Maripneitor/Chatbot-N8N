const db = require('../config/db');

/**
 * Repositorio de Libros - Acceso exclusivo a PostgreSQL
 */
class BookRepository {
  /**
   * Búsqueda de libros por término (título, autor o categoría)
   */
  async searchBooks(searchTerm) {
    const cleanTerm = `%${searchTerm.trim()}%`;
    const query = `
      SELECT 
        id,
        isbn,
        rfid_tag,
        title,
        author,
        category,
        edition,
        total_copies,
        available_copies,
        location_shelf,
        is_digital,
        digital_url,
        CASE 
          WHEN available_copies > 0 THEN true 
          ELSE false 
        END AS is_available
      FROM books
      WHERE 
        unaccent(title) ILIKE unaccent($1) 
        OR unaccent(author) ILIKE unaccent($1) 
        OR unaccent(category) ILIKE unaccent($1)
      ORDER BY available_copies DESC, title ASC
      LIMIT 10;
    `;
    const { rows } = await db.query(query, [cleanTerm]);
    return rows;
  }

  /**
   * Busca un libro por su ID único
   */
  async findById(id) {
    const query = `SELECT * FROM books WHERE id = $1 LIMIT 1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Busca un libro por su etiqueta RFID física
   */
  async findByRfid(rfidTag) {
    const query = `SELECT * FROM books WHERE rfid_tag = $1 LIMIT 1;`;
    const { rows } = await db.query(query, [rfidTag]);
    return rows[0] || null;
  }

  /**
   * Actualiza el inventario de copias disponibles
   */
  async updateAvailableCopies(bookId, delta) {
    const query = `
      UPDATE books
      SET available_copies = available_copies + $2
      WHERE id = $1 AND (available_copies + $2) >= 0
      RETURNING *;
    `;
    const { rows } = await db.query(query, [bookId, delta]);
    return rows[0] || null;
  }
}

module.exports = new BookRepository();
