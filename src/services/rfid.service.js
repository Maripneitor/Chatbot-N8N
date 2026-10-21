const rfidRepository = require('../repositories/rfid.repository');
const bookRepository = require('../repositories/book.repository');
const env = require('../config/env');

class RfidService {
  /**
   * Procesa la señal emitida por la antena RFID cuando un libro pasa por el arco
   */
  async processRfidDetection({ rfidTag, antennaId = 'ANTENA_SALIDA_PRINCIPAL' }) {
    if (!rfidTag) {
      const error = new Error('El parámetro "rfidTag" es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Buscar si el libro existe en la base de datos
    const book = await bookRepository.findByRfid(rfidTag);
    if (!book) {
      // Libro no registrado o tag desconocido
      await rfidRepository.logEvent(
        rfidTag,
        antennaId,
        'UNAUTHORIZED_EXIT_ALERT',
        'Etiqueta RFID no reconocida en la base de datos de la biblioteca'
      );

      const alertPayload = {
        alertTriggered: true,
        reason: 'TAG_DESCONOCIDO',
        rfidTag,
        antennaId,
        detectedAt: new Date().toISOString(),
        message: `🚨 ALERTA RFID: Se detectó una etiqueta RFID no registrada (${rfidTag}) saliendo por ${antennaId}.`
      };

      // Notificar a n8n de forma asíncrona
      this.dispatchWebhookToN8N(alertPayload);
      return alertPayload;
    }

    // 2. Verificar si el libro tiene un préstamo activo
    const activeLoan = await rfidRepository.findActiveLoanForRfid(rfidTag);

    if (activeLoan && activeLoan.loan_id) {
      // Salida AUTORIZADA
      await rfidRepository.logEvent(
        rfidTag,
        antennaId,
        'AUTHORIZED_CHECKOUT',
        `Salida autorizada con préstamo #${activeLoan.loan_id} por ${activeLoan.student_name}`,
        book.id
      );

      return {
        alertTriggered: false,
        status: 'AUTHORIZED',
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          rfidTag: book.rfid_tag
        },
        student: {
          name: activeLoan.student_name,
          code: activeLoan.student_code
        },
        dueDate: activeLoan.due_date,
        message: `✅ Salida autorizada para "${book.title}" por ${activeLoan.student_name}.`
      };
    } else {
      // Salida NO AUTORIZADA (Anomalía detectada - posible sustracción sin registrar)
      await rfidRepository.logEvent(
        rfidTag,
        antennaId,
        'UNAUTHORIZED_EXIT_ALERT',
        `Salida no autorizada de "${book.title}". No cuenta con préstamo activo registrado.`,
        book.id
      );

      const alertPayload = {
        alertTriggered: true,
        reason: 'SIN_PRESTAMO_ACTIVO',
        rfidTag: book.rfid_tag,
        antennaId,
        detectedAt: new Date().toISOString(),
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          locationShelf: book.location_shelf
        },
        message: `🚨 ALERTA DE SEGURIDAD RFID: El libro "${book.title}" (${book.author}) está saliendo por ${antennaId} sin registrar préstamo en el sistema.`
      };

      // Disparar Webhook a n8n para alertar a los bibliotecarios por Telegram
      this.dispatchWebhookToN8N(alertPayload);

      return alertPayload;
    }
  }

  /**
   * Envía el evento a n8n mediante HTTP POST
   */
  async dispatchWebhookToN8N(payload) {
    if (!env.n8n.rfidWebhookUrl) return;

    try {
      const response = await fetch(env.n8n.rfidWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-token': env.security.n8nSecretToken
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`⚠️ n8n webhook respondió con estado: ${response.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ No se pudo enviar el webhook a n8n (${env.n8n.rfidWebhookUrl}):`, err.message);
    }
  }
}

module.exports = new RfidService();
