-- ============================================================
--  Rx Pro · Base de datos D1 (Cloudflare)
--  © 2026 isemperadorBR
--
--  Cómo usarlo (una sola vez):
--   1. Panel de Cloudflare → Workers y Pages → D1 → Crear base de datos
--         Nombre: rxpro-db
--   2. Entra a la base → pestaña "Consola" (Console)
--   3. Pega TODO este archivo y pulsa "Ejecutar"
--
--  Privacidad (Ley 29733): no se guarda ningún dato del paciente.
--  Solo el código de la receta, su huella de integridad, el CMP del
--  prescriptor y la fecha. Con eso se verifica y se audita sin exponer
--  datos sensibles de salud.
-- ============================================================

CREATE TABLE IF NOT EXISTS recetas (
  codigo    TEXT PRIMARY KEY,            -- RX-20261104-001
  huella    TEXT NOT NULL,               -- primeros 8 caracteres del SHA-256
  cmp       TEXT NOT NULL DEFAULT '',    -- CMP del prescriptor
  fecha     TEXT NOT NULL DEFAULT '',    -- AAAAMMDD de la receta
  estado    TEXT NOT NULL DEFAULT 'vigente',
  creada_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recetas_cmp   ON recetas(cmp);
CREATE INDEX IF NOT EXISTS idx_recetas_fecha ON recetas(fecha);

-- Vista rápida para revisar cuántas recetas se emitieron:
--   SELECT fecha, COUNT(*) FROM recetas GROUP BY fecha ORDER BY fecha DESC;

-- Para anular una receta (deja de considerarse válida en la verificación):
--   UPDATE recetas SET estado = 'anulada' WHERE codigo = 'RX-20261104-001';
