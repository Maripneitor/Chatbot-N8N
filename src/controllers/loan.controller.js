const loanService = require('../services/loan.service');

class LoanController {
  /**
   * Endpoint para consultar estado de préstamos del estudiante
   * GET /api/bot/loans/status?telegram_id=123456
   */
  async getStatus(req, res, next) {
    try {
      const telegramId = req.query.telegram_id || req.query.telegramId;
      const statusData = await loanService.getStudentLoanStatus(telegramId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: statusData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint para solicitar la extensión/renovación de un préstamo
   * POST /api/bot/loans/renew
   * Body: { telegram_id, loan_id, book_title }
   */
  async renew(req, res, next) {
    try {
      const { telegram_id, telegramId, loan_id, loanId, book_title, bookTitle } = req.body;

      const renewalResult = await loanService.renewLoan({
        telegramId: telegram_id || telegramId,
        loanId: loan_id || loanId,
        bookTitle: book_title || bookTitle
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: renewalResult
      });
    } catch (error) {
      // Manejar errores de negocio controlados (404, 403, 409, 400) retornando 200 con success: false
      // para que n8n no rompa el flujo y Telegram pueda mostrar el mensaje explicativo al alumno
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return res.status(200).json({
          success: false,
          statusCode: 200,
          data: {
            success: false,
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Endpoint para consultar préstamos que vencen mañana (usado por Cron en n8n)
   * GET /api/bot/loans/expiring-soon
   */
  async getExpiring(req, res, next) {
    try {
      const expiringData = await loanService.getExpiringLoans();

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: expiringData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint para vincular matrícula escolar con cuenta de Telegram
   * POST /api/bot/students/register
   * Body: { student_code, telegram_id }
   */
  async registerStudent(req, res, next) {
    try {
      const { student_code, studentCode, telegram_id, telegramId } = req.body;

      const result = await loanService.linkTelegramAccount(
        student_code || studentCode,
        telegram_id || telegramId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result
      });
    } catch (error) {
      // Si la matrícula no existe, devolver respuesta controlada para que Telegram notifique amablemente
      if (error.statusCode === 404 || error.statusCode === 400) {
        return res.status(200).json({
          success: false,
          statusCode: 200,
          data: {
            success: false,
            message: `${error.message}. (Recuerda que las matrículas de prueba registradas son: EST-202401, EST-202402, EST-202403)`
          }
        });
      }
      next(error);
    }
  }
}

module.exports = new LoanController();
