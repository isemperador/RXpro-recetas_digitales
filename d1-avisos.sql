-- Rx Pro · Migración de avisos globales (D1/Cloudflare)
-- Ejecutar UNA SOLA VEZ en la consola de la base rxpro-db.
-- No modifica ni borra recetas, historial ni cuentas.
CREATE TABLE IF NOT EXISTS avisos (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  mensaje    TEXT NOT NULL,
  creado_por TEXT NOT NULL,
  creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_avisos_creado ON avisos(creado_en);
