/**
 * Script de prueba automatizada para validar todos los endpoints de la API
 * Ejecución: npm test o node scripts/test-api.js
 */
const env = require('../src/config/env');

const BASE_URL = process.env.API_BASE_URL || `http://localhost:${env.port}`;
const SECRET_TOKEN = env.security.n8nSecretToken;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log(`🧪 INICIANDO PRUEBAS DE ENDPOINTS EN: ${BASE_URL}`);
  console.log('🧪 ========================================================\n');

  try {
    // 1. Healthcheck
    console.log('1️⃣  Probando Healthcheck (GET /api/health)...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log(`   Status: ${healthRes.status} | Respuesta:`, healthData);

    // 2. Validación de Seguridad (Sin Token -> Debe dar 401)
    console.log('\n2️⃣  Probando Seguridad: Petición sin x-secret-token (GET /api/bot/books)...');
    const noAuthRes = await fetch(`${BASE_URL}/api/bot/books?query=calculo`);
    const noAuthData = await noAuthRes.json();
    console.log(`   Status: ${noAuthRes.status} (Esperado 401) | Mensaje:`, noAuthData.message);

    // 3. Búsqueda Inteligente de Libros (Con Token)
    console.log('\n3️⃣  Probando Búsqueda Inteligente: "calculo" de Stewart (GET /api/bot/books)...');
    const bookRes = await fetch(`${BASE_URL}/api/bot/books?query=calculo`, {
      headers: { 'x-secret-token': SECRET_TOKEN }
    });
    const bookData = await bookRes.json();
    console.log(`   Status: ${bookRes.status} | Encontrados: ${bookData.data?.totalFound || 0}`);
    if (bookData.data?.books?.length) {
      console.log(`   Primer libro: "${bookData.data.books[0].title}" en ${bookData.data.books[0].locationShelf}`);
    }

    // 4. Consulta de Préstamos de Estudiante (Josias Ramos - Telegram ID 123456789)
    console.log('\n4️⃣  Probando Consulta de Préstamos (GET /api/bot/loans/status)...');
    const loansRes = await fetch(`${BASE_URL}/api/bot/loans/status?telegram_id=123456789`, {
      headers: { 'x-secret-token': SECRET_TOKEN }
    });
    const loansData = await loansRes.json();
    console.log(`   Status: ${loansRes.status} | Préstamos activos: ${loansData.data?.loansCount || 0}`);
    if (loansData.data?.loans?.length) {
      console.log(`   Libro: ${loansData.data.loans[0].bookTitle} | Días restantes: ${loansData.data.loans[0].daysRemaining}`);
    }

    // 5. Renovación Digital de Préstamo
    console.log('\n5️⃣  Probando Renovación Digital de Préstamo (POST /api/bot/loans/renew)...');
    const renewRes = await fetch(`${BASE_URL}/api/bot/loans/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-token': SECRET_TOKEN
      },
      body: JSON.stringify({
        telegram_id: '123456789',
        book_title: 'Cálculo de Una Variable'
      })
    });
    const renewData = await renewRes.json();
    console.log(`   Status: ${renewRes.status} | Respuesta:`, renewData.data?.message || renewData.message);

    // 6. Consultar Préstamos por Vencer (Para el Cron de n8n)
    console.log('\n6️⃣  Probando Préstamos por Vencer (GET /api/bot/loans/expiring-soon)...');
    const expiringRes = await fetch(`${BASE_URL}/api/bot/loans/expiring-soon`, {
      headers: { 'x-secret-token': SECRET_TOKEN }
    });
    const expiringData = await expiringRes.json();
    console.log(`   Status: ${expiringRes.status} | Préstamos próximos a vencer: ${expiringData.data?.count || 0}`);

    // 7. Simulación RFID: Salida no autorizada (Anomalía)
    console.log('\n7️⃣  Probando Simulación RFID: Intento de salida sin préstamo (POST /api/rfid/detect)...');
    const rfidRes = await fetch(`${BASE_URL}/api/rfid/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-token': SECRET_TOKEN
      },
      body: JSON.stringify({
        rfid_tag: 'RFID-SEARS-FISICA-001',
        antenna_id: 'ANTENA_SALIDA_PRINCIPAL'
      })
    });
    const rfidData = await rfidRes.json();
    console.log(`   Status: ${rfidRes.status} | Alerta activada: ${rfidData.data?.alertTriggered} | Mensaje:`, rfidData.data?.message);

    console.log('\n✅ ========================================================');
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('✅ ========================================================');
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error.message);
    console.log(`💡 Recuerda asegurarte de que el servidor esté corriendo en ${BASE_URL}`);
  }
}

runTests();
