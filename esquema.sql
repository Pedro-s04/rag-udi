-- Activa pgvector en esta base (si ya estaba activo, no hace nada)
CREATE EXTENSION IF NOT EXISTS vector;

-- Arranca de cero: si la tabla ya existía, la borra con todo lo que tenía
DROP TABLE IF EXISTS fragmentos;

-- Cada fila es un fragmento de tu corpus. Cada metadato de la clase 7 es una columna.
CREATE TABLE fragmentos (
  id        SERIAL PRIMARY KEY,      -- número automático, lo pone Postgres
  fuente    TEXT NOT NULL,           -- de qué archivo salió
  seccion   TEXT,                    -- qué parte del archivo (puede quedar vacía)
  posicion  INTEGER NOT NULL,        -- qué número de fragmento es dentro del archivo
  texto     TEXT NOT NULL,           -- el fragmento en sí
  embedding VECTOR(____) NOT NULL,   -- TODO: ¿cuántos números devuelve tu modelo?

  -- Extensión Steam (no está en la guía): los números de la oferta, como columnas,
  -- para poder filtrar con SQL. Salen de datos/juegos.json, que arma bajar-steam.mjs.
  appid     INTEGER,                 -- el número del juego en Steam
  precio    NUMERIC(10,2),           -- precio con descuento, en dólares
  descuento INTEGER                  -- porcentaje de descuento (0 a 100)
);

-- Índice HNSW para buscar rápido por distancia coseno
CREATE INDEX ON fragmentos USING hnsw (embedding vector_cosine_ops);
