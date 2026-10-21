const loanRepository = require('../repositories/loan.repository');
const studentRepository = require('../repositories/student.repository');

class LoanService {
  /**
   * Consulta el estado de préstamos y posibles multas de un estudiante por su Telegram ID
   */
  async getStudentLoanStatus(telegramId) {
    if (!telegramId) {
      const error = new Error('El parámetro "telegramId" es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    const student = await studentRepository.findByTelegramId(telegramId);
    if (!student) {
      return {
        registered: false,
        message: 'Tu cuenta de Telegram aún no está vinculada a una matrícula estudiantil. Usa /vincular <tu_matricula> para registrarte.'
      };
    }

    const loans = await loanRepository.getActiveLoansByStudentId(student.id);

    return {
      registered: true,
      student: {
        code: student.student_code,
        name: student.full_name,
        hasPenalty: student.has_penalty,
        penaltyAmount: parseFloat(student.penalty_amount || 0)
      },
      loansCount: loans.length,
      loans: loans.map(loan => ({
        loanId: loan.loan_id,
        bookTitle: loan.book_title,
        bookAuthor: loan.book_author,
        dueDate: loan.due_date,
        daysRemaining: loan.days_remaining,
        renewalsMade: loan.renewal_count,
        maxRenewals: loan.max_renewals,
        canRenew: loan.renewal_count < loan.max_renewals && !student.has_penalty && loan.days_remaining >= 0,
        status: loan.days_remaining < 0 
          ? `⚠️ VENCIDO (hace ${Math.abs(loan.days_remaining)} días)` 
          : (loan.days_remaining <= 1 ? '⏰ Vence muy pronto' : '🟢 Al corriente')
      }))
    };
  }

  /**
   * Realiza la renovación digital de un préstamo aplicando las reglas de negocio
   */
  async renewLoan({ telegramId, loanId, bookTitle }) {
    if (!telegramId) {
      const error = new Error('Se requiere el telegramId para renovar.');
      error.statusCode = 400;
      throw error;
    }

    const student = await studentRepository.findByTelegramId(telegramId);
    if (!student) {
      const error = new Error('Estudiante no encontrado en el sistema. Debe registrar su matrícula primero.');
      error.statusCode = 404;
      throw error;
    }

    // Regla de Negocio 1: No permitir renovaciones si tiene multas activas
    if (student.has_penalty) {
      const error = new Error(`No puedes renovar préstamos porque tienes una multa pendiente de $${student.penalty_amount} MXN. Acude a ventanilla de biblioteca.`);
      error.statusCode = 403;
      throw error;
    }

    // Buscar préstamo específico o por coincidencia de libro
    let loan = null;
    if (loanId) {
      loan = await loanRepository.findActiveLoanById(loanId, student.id);
    } else if (bookTitle) {
      loan = await loanRepository.findActiveLoanByBookQuery(student.id, bookTitle);
    } else {
      // Si solo tiene un único préstamo activo, tomar ese
      const activeLoans = await loanRepository.getActiveLoansByStudentId(student.id);
      if (activeLoans.length === 1) {
        loan = activeLoans[0];
      } else if (activeLoans.length > 1) {
        const error = new Error('Tienes múltiples libros prestados. Por favor especifica el título del libro que deseas renovar.');
        error.statusCode = 400;
        throw error;
      }
    }

    if (!loan) {
      const error = new Error('No se encontró un préstamo activo para renovar con los datos proporcionados.');
      error.statusCode = 404;
      throw error;
    }

    // Regla de Negocio 2: Límite máximo de renovaciones alcanzado
    if (loan.renewal_count >= loan.max_renewals) {
      const error = new Error(`Ya alcanzaste el límite máximo de ${loan.max_renewals} renovaciones para el libro "${loan.book_title}". Debes devolverlo a la biblioteca.`);
      error.statusCode = 409;
      throw error;
    }

    // Ejecutar renovación: 7 días adicionales
    const DAYS_TO_ADD = 7;
    const updatedLoan = await loanRepository.renewLoan(loan.id || loan.loan_id, DAYS_TO_ADD);

    return {
      success: true,
      message: `¡Renovación exitosa! Se extendió el préstamo de "${loan.book_title}" por ${DAYS_TO_ADD} días adicionales.`,
      bookTitle: loan.book_title,
      newDueDate: updatedLoan.due_date,
      renewalNumber: updatedLoan.renewal_count,
      maxRenewalsAllowed: updatedLoan.max_renewals
    };
  }

  /**
   * Obtiene préstamos que expiran mañana para el Cron de n8n
   */
  async getExpiringLoans() {
    const loans = await loanRepository.getLoansExpiringSoon();
    return {
      count: loans.length,
      expiringLoans: loans.map(l => ({
        loanId: l.loan_id,
        telegramId: l.telegram_id,
        studentName: l.student_name,
        studentCode: l.student_code,
        bookTitle: l.book_title,
        dueDate: l.due_date,
        suggestedMessage: `¡Hola ${l.student_name}! Te recordamos que tu préstamo del libro "${l.book_title}" vence mañana (${new Date(l.due_date).toLocaleDateString()}). Si necesitas más tiempo, puedes solicitar su renovación respondiendo este chat.`
      }))
    };
  }

  /**
   * Vincula matrícula escolar con ID de Telegram
   */
  async linkTelegramAccount(studentCode, telegramId) {
    if (!studentCode || !telegramId) {
      const error = new Error('Se requiere studentCode (matrícula) y telegramId.');
      error.statusCode = 400;
      throw error;
    }

    const student = await studentRepository.findByStudentCode(studentCode);
    if (!student) {
      const error = new Error(`No se encontró ningún estudiante con la matrícula: ${studentCode}`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await studentRepository.linkTelegramId(studentCode, telegramId);

    return {
      success: true,
      message: `¡Vinculación exitosa! Hola ${updated.full_name}, tu cuenta de Telegram ya está conectada a la biblioteca.`,
      student: updated
    };
  }
}

module.exports = new LoanService();
