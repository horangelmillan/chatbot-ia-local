const fs = require("fs");
const path = require("path");

const TEST_DB_URL = process.env.DATABASE_URL_TEST || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test";
process.env.DATABASE_URL = TEST_DB_URL;
global.__TEST_DB_URL = TEST_DB_URL;

const schemaPath = path.resolve(__dirname, "db/schema.sql");
let schema = fs.readFileSync(schemaPath, "utf-8");
schema = schema.replace(/^CREATE DATABASE.*?;\s*/i, "");
schema = schema.replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ");
schema = schema.replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");

const { Pool } = require("pg");
let setupPool;

beforeAll(async () => {
  setupPool = new Pool({ connectionString: TEST_DB_URL });
  await setupPool.query(schema).catch(() => {});
});

afterAll(async () => {
  if (setupPool) await setupPool.end();
});
