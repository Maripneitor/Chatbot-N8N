const db = require('../config/db');

/**
 * Repositorio de Estudiantes - Acceso exclusivo a PostgreSQL
 */
class StudentRepository {
  /**
   * Busca estudiante por su ID de Telegram (asociado al bot)
   */
  async findByTelegramId(telegramId) {
    const query = `
      SELECT id, student_code, full_name, email, telegram_id, has_penalty, penalty_amount, created_at
      FROM students
      WHERE telegram_id = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [telegramId.toString()]);
    return rows[0] || null;
  }

  /**
   * Busca estudiante por su matrícula escolar
   */
  async findByStudentCode(studentCode) {
    const query = `
      SELECT id, student_code, full_name, email, telegram_id, has_penalty, penalty_amount, created_at
      FROM students
      WHERE student_code = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [studentCode.trim()]);
    return rows[0] || null;
  }

  /**
   * Vincula la cuenta de Telegram de un estudiante con su matrícula
   */
  async linkTelegramId(studentCode, telegramId) {
    const query = `
      UPDATE students
      SET telegram_id = $2
      WHERE student_code = $1
      RETURNING id, student_code, full_name, email, telegram_id, has_penalty, penalty_amount;
    `;
    const { rows } = await db.query(query, [studentCode.trim(), telegramId.toString()]);
    return rows[0] || null;
  }
}

module.exports = new StudentRepository();
