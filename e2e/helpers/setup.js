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
      ('E2E-DOC-001', '¿Cual es la politica de devolucion?', 'La politica de devolucion permite devoluciones dentro de los 30 dias posteriores a la compra. El producto debe estar en su estado original.', 'Devoluciones', ARRAY['devolucion', 'reembolso', 'garantia']);
  `);

  const docResult = await pool.query(`
    INSERT INTO documents (code, title, category, file_name, file_path, checksum)
    VALUES ('E2E-DOC-001', 'Politica de Devolucion', 'Devoluciones', 'test.md', 'e2e/fixtures/documents/test.md', 'abc123')
    RETURNING id
  `);
  const docId = docResult.rows[0].id;

  await pool.query(`
    INSERT INTO document_chunks (document_id, chunk_number, title, content, token_count)
    VALUES
      ($1, 1, 'Politica de Devolucion', 'Nuestra politica de devolucion cubre todos los productos comprados en Northwind.', 10),
      ($1, 2, 'Plazos', 'Devoluciones: 30 dias desde la fecha de compra. Reembolsos: 5-10 dias habiles.', 12),
      ($1, 3, 'Condiciones', 'El producto debe estar en su estado original, sin uso y con su empaque.', 10),
      ($1, 4, 'Exclusiones', 'Quedan excluidos productos en oferta, personalizados y software ya activado.', 10)
  `, [docId]);
}

async function teardown() {
  await pool.end();
}

module.exports = { seedTestData, teardown };
