const { Pool } = require("pg");
const path = require("path");
try { require("dotenv").config({ path: path.join(__dirname, "../../backend/.env") }); } catch (e) { }

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag",
});

async function seedTestData() {
  await pool.query("DELETE FROM document_chunks");
  await pool.query("DELETE FROM documents");
  await pool.query("DELETE FROM faq");

  await pool.query(`
    INSERT INTO faq (code, question, answer, category, keywords)
    VALUES
      ('E2E-FAQ-001', '¿Como facturar?', 'Debes seguir estos pasos: 1. Inicia sesion 2. Ve a facturacion 3. Descarga tu factura', 'Facturacion', ARRAY['factura', 'facturar', 'pasos']),
      ('E2E-FAQ-002', '¿Cual es el horario de atencion?', 'Nuestro horario es de lunes a viernes de 9:00 a 18:00', 'Soporte', ARRAY['horario', 'atencion']),
      ('E2E-FAQ-003', '¿Como restablecer mi contrasena?', 'Puedes restablecer tu contrasena desde la opcion "Olvide mi contrasena" en la pantalla de inicio', 'Cuenta', ARRAY['contrasena', 'password', 'restablecer']),
      ('E2E-DOC-001', '¿Como facturar electronicamente?', 'Para facturar electronicamente debes ingresar al modulo de facturacion, seleccionar "Factura Electronica" y completar los datos del cliente.', 'General', ARRAY['factura', 'facturacion', 'electronica']);
  `);

  const docResult = await pool.query(`
    INSERT INTO documents (code, title, category, file_name, file_path, checksum)
    VALUES ('E2E-DOC-001', 'Politica de Facturacion Electronica', 'General', 'test.md', 'e2e/fixtures/documents/test.md', 'abc123')
    RETURNING id
  `);
  const docId = docResult.rows[0].id;

  await pool.query(`
    INSERT INTO document_chunks (document_id, chunk_number, title, content, token_count)
    VALUES
      ($1, 1, 'Politica de Facturacion Electronica', 'Northwind ofrece facturacion electronica para todos sus clientes.', 8),
      ($1, 2, 'Requisitos', 'Clave de acceso y Certificado Digital. Registro en el sistema de facturacion.', 10),
      ($1, 3, 'Proceso', '1. Ingresa al modulo de facturacion 2. Selecciona Factura Electronica 3. Completa los datos del cliente 4. Genera y envia la factura', 16)
  `, [docId]);
}

async function teardown() {
  await pool.end();
}

module.exports = { seedTestData, teardown };
