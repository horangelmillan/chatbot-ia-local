const pool = require("../../../../../../shared/adapters/outbound/postgres/pool");
const repo = require("../PostgresDocumentRepository");

beforeAll(async () => {
  await pool.query("TRUNCATE faq, document_chunks, documents CASCADE");
});

test("searchFAQ encuentra por keyword", async () => {
  await pool.query(
    `INSERT INTO faq (code, question, answer, category, keywords)
     VALUES ('FAQ-001', 'Como facturar?', 'Sigue estos pasos...', 'Facturacion', ARRAY['factura', 'pasos'])`
  );
  const result = await repo.searchFAQ("Facturacion", ["factura"]);
  expect(result).not.toBeNull();
  expect(result.code).toBe("FAQ-001");
  expect(result.question).toBe("Como facturar?");
});

test("searchFAQ devuelve null si no hay match", async () => {
  const result = await repo.searchFAQ("Facturacion", ["xyz123"]);
  expect(result).toBeNull();
});

test("searchFAQ filtra por categoria", async () => {
  await pool.query(
    `INSERT INTO faq (code, question, answer, category, keywords)
     VALUES ('FAQ-002', 'Pregunta proveedores?', 'Respuesta.', 'Proveedores', ARRAY['proveedor'])`
  );
  const result = await repo.searchFAQ("Facturacion", ["proveedor"]);
  expect(result).toBeNull();
});

test("searchChunks encuentra por FTS", async () => {
  const doc = await pool.query(
    `INSERT INTO documents (code, title, category) VALUES ('DOC-001', 'Manual', 'General') RETURNING id`
  );
  await pool.query(
    `INSERT INTO document_chunks (document_id, chunk_number, content)
     VALUES ($1, 1, 'Este es un texto de ejemplo sobre facturacion')`,
    [doc.rows[0].id]
  );
  const result = await repo.searchChunks("General", ["facturacion"]);
  expect(result).not.toBeNull();
  expect(result.code).toBe("DOC-001");
});

test("searchChunks devuelve null sin keywords", async () => {
  const result = await repo.searchChunks("General", []);
  expect(result).toBeNull();
});

test("search busca primero FAQ, luego chunks", async () => {
  const result = await repo.search("General", ["xyz999noexiste"]);
  expect(result).toBeNull();
});

test("search devuelve FAQ si hay match", async () => {
  await pool.query(
    `INSERT INTO faq (code, question, answer, category, keywords)
     VALUES ('FAQ-003', 'Pregunta?', 'Respuesta.', 'General', ARRAY['testmatch'])`
  );
  const result = await repo.search("General", ["testmatch"]);
  expect(result).not.toBeNull();
  expect(result.type).toBe("faq");
});

test("search devuelve chunk si no hay FAQ", async () => {
  const doc = await pool.query(
    `INSERT INTO documents (code, title, category) VALUES ('DOC-002', 'Doc', 'General') RETURNING id`
  );
  await pool.query(
    `INSERT INTO document_chunks (document_id, chunk_number, content)
     VALUES ($1, 1, 'contenido de prueba unico')`,
    [doc.rows[0].id]
  );
  const result = await repo.search("General", ["contenido", "prueba"]);
  expect(result).not.toBeNull();
  expect(result.type).toBe("chunk");
});
