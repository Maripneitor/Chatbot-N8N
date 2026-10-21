require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Base de Datos PostgreSQL
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'biblioteca_db',
    ssl: process.env.DB_SSL === 'true',
  },

  // Seguridad & Autenticación
  security: {
    jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_local_dev_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    n8nSecretToken: process.env.N8N_SECRET_TOKEN || 'clave_secreta_compartida_n8n_node',
  },

  // Semilla de Administrador Local
  adminSeed: {
    name: process.env.ADMIN_NAME || '',
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },

  // Correo / SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || '',
  },

  // Integraciones Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '',
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '',
  },

  // Orquestación con n8n
  n8n: {
    rfidWebhookUrl: process.env.N8N_RFID_WEBHOOK_URL || 'http://localhost:5678/webhook/alerta-rfid',
  }
};

module.exports = env;
