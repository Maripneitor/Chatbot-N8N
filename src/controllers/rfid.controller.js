const rfidService = require('../services/rfid.service');

class RfidController {
  /**
   * Endpoint para recibir eventos de detección de la antena RFID
   * POST /api/rfid/detect
   * Body: { rfid_tag, antenna_id }
   */
  async detectTag(req, res, next) {
    try {
      const { rfid_tag, rfidTag, antenna_id, antennaId } = req.body;

      const detectionResult = await rfidService.processRfidDetection({
        rfidTag: rfid_tag || rfidTag,
        antennaId: antenna_id || antennaId
      });

      const statusCode = detectionResult.alertTriggered ? 200 : 200;

      res.status(statusCode).json({
        success: true,
        statusCode,
        data: detectionResult
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RfidController();
