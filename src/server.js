const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
    // Probar conexión a la base de datos PostgreSQL
    await db.query('SELECT 1;');
    console.log('✅ Conexión a PostgreSQL verificada correctamente.');
  } catch (err) {
    console.warn('⚠️ Advertencia: No se pudo verificar la conexión con PostgreSQL:', err.message);
    console.warn('   Asegúrate de que PostgreSQL esté corriendo y que la base de datos exista.');
  }

  app.listen(env.port, () => {
    console.log('========================================================');
    console.log(`🚀 Servidor API de Biblioteca ejecutándose en puerto ${env.port}`);
    console.log(`🌍 Entorno: ${env.nodeEnv}`);
    console.log(`🔗 Healthcheck: http://localhost:${env.port}/api/health`);
    console.log(`🛡️  Seguridad Webhooks: Header x-secret-token activo`);
    console.log('========================================================');
  });
}

startServer();
