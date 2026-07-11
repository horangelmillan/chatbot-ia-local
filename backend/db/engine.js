const pool = require("./pool");

async function searchFAQ(category, keywords) {
  if (!keywords || keywords.length === 0) return null;
  var sql = "SELECT code, question, answer, category FROM faq WHERE (";
  var params = [];
  var parts = [];
  for (var i = 0; i < keywords.length; i++) {
    parts.push("keywords @> ARRAY[$" + (params.length + 1) + "]");
    params.push(keywords[i]);
  }
  sql += parts.join(" OR ") + ")";
  if (category) {
    params.push(category);
    sql += " AND category = $" + params.length;
  }
  sql += " LIMIT 1";
  var result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function searchChunks(category, keywords) {
  if (!keywords || keywords.length === 0) return null;
  var tsquery = keywords.map(function (k) { return k.replace(/[^\w\s]/g, "") + ":*" }).join(" & ");
  var sql = "SELECT dc.id, dc.document_id, dc.chunk_number, dc.title, dc.content, dc.page, d.code, d.category ";
  sql += "FROM document_chunks dc JOIN documents d ON d.id = dc.document_id ";
  sql += "WHERE to_tsvector('spanish', dc.content) @@ to_tsquery('spanish', $1)";
  var params = [tsquery];
  if (category) {
    params.push(category);
    sql += " AND d.category = $" + params.length;
  }
  sql += " ORDER BY ts_rank(to_tsvector('spanish', dc.content), to_tsquery('spanish', $1)) DESC LIMIT 1";
  var result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function search(category, keywords) {
  var result = await searchFAQ(category, keywords);
  if (result) return { type: "faq", data: result };
  result = await searchChunks(category, keywords);
  if (result) return { type: "chunk", data: result };
  return null;
}

module.exports = { search, searchFAQ, searchChunks };
