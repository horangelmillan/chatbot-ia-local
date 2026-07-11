CREATE DATABASE chatbot_rag;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500),
    category VARCHAR(100) DEFAULT 'general',
    file_name VARCHAR(500),
    file_path TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'active',
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_number INTEGER,
    title VARCHAR(500),
    content TEXT,
    page INTEGER,
    token_count INTEGER,
    embedding TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    question TEXT,
    answer TEXT,
    category VARCHAR(100),
    keywords TEXT[],
    version VARCHAR(50) DEFAULT '1.0'
);

CREATE INDEX idx_document_chunks_fts ON document_chunks USING GIN(to_tsvector('spanish', content));
CREATE INDEX idx_faq_keywords ON faq USING GIN(keywords);
