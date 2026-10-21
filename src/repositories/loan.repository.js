const db = require('../config/db');

/**
 * Repositorio de Préstamos - Acceso exclusivo a PostgreSQL
 */
class LoanRepository {
  /**
   * Obtiene todos los préstamos activos de un estudiante con información detallada del libro
   */
  async getActiveLoansByStudentId(studentId) {
    const query = `
      SELECT 
        l.id AS loan_id,
        l.loan_date,
        l.due_date,
        l.status,
        l.renewal_count,
        l.max_renewals,
        (l.due_date - CURRENT_DATE) AS days_remaining,
        b.id AS book_id,
        b.title AS book_title,
        b.author AS book_author,
        b.location_shelf
      FROM loans l
      INNER JOIN books b ON l.book_id = b.id
      WHERE l.student_id = $1 AND l.status IN ('active', 'renewed')
      ORDER BY l.due_date ASC;
    `;
    const { rows } = await db.query(query, [studentId]);
    return rows;
  }

  /**
   * Busca un préstamo activo por su ID y el ID del estudiante
   */
  async findActiveLoanById(loanId, studentId) {
    const query = `
      SELECT l.*, b.title AS book_title 
      FROM loans l
      INNER JOIN books b ON l.book_id = b.id
      WHERE l.id = $1 AND l.student_id = $2 AND l.status IN ('active', 'renewed')
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [loanId, studentId]);
    return rows[0] || null;
  }

  /**
   * Busca un préstamo activo de un estudiante haciendo coincidir el título del libro
   */
  async findActiveLoanByBookQuery(studentId, bookQuery) {
    const cleanQuery = `%${bookQuery.trim()}%`;
    const query = `
      SELECT l.*, b.title AS book_title 
      FROM loans l
      INNER JOIN books b ON l.book_id = b.id
      WHERE l.student_id = $1 
        AND l.status IN ('active', 'renewed')
        AND (unaccent(b.title) ILIKE unaccent($2) OR unaccent(b.author) ILIKE unaccent($2))
      ORDER BY l.due_date ASC
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [studentId, cleanQuery]);
    return rows[0] || null;
  }

  /**
   * Extiende la fecha de vencimiento y aumenta el conteo de renovaciones
   */
  async renewLoan(loanId, daysToAdd = 7) {
    const query = `
      UPDATE loans
      SET 
        due_date = due_date + ($2 || ' days')::INTERVAL,
        renewal_count = renewal_count + 1,
        status = 'renewed'
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [loanId, daysToAdd]);
    return rows[0] || null;
  }

  /**
   * Consulta préstamos que vencen mañana (en las próximas 24 horas)
   * Utilizado por el flujo automatizado Cron de n8n a las 8:00 AM (PDF Fase 4)
   */
  async getLoansExpiringSoon() {
    const query = `
      SELECT 
        l.id AS loan_id,
        l.due_date,
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.telegram_id,
        b.title AS book_title,
        b.author AS book_author
      FROM loans l
      INNER JOIN students s ON l.student_id = s.id
      INNER JOIN books b ON l.book_id = b.id
      WHERE 
        l.status IN ('active', 'renewed')
        AND s.telegram_id IS NOT NULL
        AND l.due_date = CURRENT_DATE + INTERVAL '1 day';
    `;
    const { rows } = await db.query(query);
    return rows;
  }
}

module.exports = new LoanRepository();
