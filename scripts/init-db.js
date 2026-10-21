const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../src/config/env');

async function initializeDatabase() {
  console.log('🔄 Conectando a PostgreSQL para inicializar base de datos...');
  console.log(`📌 Host: ${env.db.host}:${env.db.port} | BD: ${env.db.database} | Usuario: ${env.db.user}`);
  
  const poolConfig = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  };

  if (env.db.ssl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida con éxito.');

    const sqlFilePath = path.join(__dirname, '../database/init.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📦 Ejecutando script init.sql (creación de tablas e índices)...');
    await client.query(sqlContent);

    console.log('🎉 Base de datos inicializada con éxito.');
    client.release();
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
