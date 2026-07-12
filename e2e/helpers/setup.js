const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TEST || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test",
});

async function seedTestData() {
  const sql = `
    TRUNCATE faq CASCADE;
    INSERT INTO faq (code, question, answer, category, keywords)
    VALUES
      ('E2E-FAQ-001', '¿Como facturar?', 'Debes seguir estos pasos: 1. Inicia sesion 2. Ve a facturacion 3. Descarga tu factura', 'Facturacion', ARRAY['factura', 'facturar', 'pasos']),
      ('E2E-FAQ-002', '¿Cual es el horario de atencion?', 'Nuestro horario es de lunes a viernes de 9:00 a 18:00', 'Soporte', ARRAY['horario', 'atencion']);
  `;
  await pool.query(sql);
}

async function teardown() {
  await pool.end();
}

module.exports = { seedTestData, teardown };
