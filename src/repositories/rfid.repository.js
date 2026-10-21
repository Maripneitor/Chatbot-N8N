const db = require('../config/db');

/**
 * Repositorio RFID - Consultas de seguridad y auditoría en PostgreSQL
 */
class RfidRepository {
  /**
   * Verifica si existe un préstamo activo y vigente para un libro dado su rfid_tag
   */
  async findActiveLoanForRfid(rfidTag) {
    const query = `
      SELECT 
        l.id AS loan_id,
        l.due_date,
        s.full_name AS student_name,
        s.student_code,
        b.id AS book_id,
        b.title AS book_title,
        b.author AS book_author
      FROM books b
      LEFT JOIN loans l ON b.id = l.book_id AND l.status IN ('active', 'renewed')
      LEFT JOIN students s ON l.student_id = s.id
      WHERE b.rfid_tag = $1
      ORDER BY l.due_date DESC
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [rfidTag]);
    return rows[0] || null;
  }

  /**
   * Registra un evento de detección en el log de auditoría RFID
   */
  async logEvent(rfidTag, antennaId, eventType, description, bookId = null) {
    const query = `
      INSERT INTO rfid_logs (rfid_tag, antenna_id, event_type, description, book_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [rfidTag, antennaId, eventType, description, bookId]);
    return rows[0];
  }
}

module.exports = new RfidRepository();
