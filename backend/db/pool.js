const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000
});

pool.on("error", function (err) {
  console.error("PG pool error:", err.message);
});

module.exports = pool;
