-- ============================================================
--  Rx Pro · Base de datos D1 (Cloudflare) — esquema completo
--  © 2026 isemperadorBR
--
--  Cómo usarlo:
--   1. Panel de Cloudflare → Storage & databases → D1 SQL Database
--      → Create database → nombre: rxpro-db
--   2. Entra a la base → pestaña "Console"
--   3. Pega TODO este archivo y pulsa Execute
--
--  Solo para una base nueva. En una base existente NO vuelvas a ejecutar
--  este esquema; aplica exclusivamente la migración indicada para la versión.
--
--  Privacidad (Ley 29733):
--   · `recetas` solo guarda el comprobante público de verificación
--     (código, huella, CMP, fecha): ningún dato del paciente.
--   · `medicos` guarda la cuenta del prescriptor (nombre, correo, CMP,
--     firma y logo). La contraseña se guarda CIFRADA, nunca en texto plano.
--   · `recetas_medico` guarda el historial clínico de cada médico para que
--     lo vea desde cualquier dispositivo. Es información sensible: solo es
--     accesible con la sesión del propio médico.
-- ============================================================

/* ---------- 1) Comprobante público de verificación ---------- */
CREATE TABLE IF NOT EXISTS recetas (
  codigo    TEXT PRIMARY KEY,            -- RX-20261104-001
  huella    TEXT NOT NULL,               -- primeros 8 caracteres del SHA-256
  cmp       TEXT NOT NULL DEFAULT '',
  fecha     TEXT NOT NULL DEFAULT '',    -- AAAAMMDD
  estado    TEXT NOT NULL DEFAULT 'vigente',
  creada_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recetas_cmp   ON recetas(cmp);
CREATE INDEX IF NOT EXISTS idx_recetas_fecha ON recetas(fecha);

/* ---------- 2) Cuentas de médicos ---------- */
CREATE TABLE IF NOT EXISTS medicos (
  email          TEXT PRIMARY KEY,
  pass           TEXT NOT NULL,          -- PBKDF2-SHA256 (iteraciones$salt$hash)
  propietario    TEXT NOT NULL DEFAULT '', -- quién administra la cuenta ('' = ella misma)
  estado         TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | aprobado | rechazado
  rol            TEXT NOT NULL DEFAULT 'medico',    -- admin (tú) | medico
  nombre         TEXT NOT NULL DEFAULT '',
  cmp            TEXT NOT NULL DEFAULT '',
  rne            TEXT NOT NULL DEFAULT '',
  especialidad   TEXT NOT NULL DEFAULT '',
  telefono       TEXT NOT NULL DEFAULT '',
  direccion      TEXT NOT NULL DEFAULT '',
  clinica        TEXT NOT NULL DEFAULT '',
  firma          TEXT,                   -- data URL PNG
  logo           TEXT,                   -- data URL PNG/JPG
  ajustes        TEXT,                   -- JSON con las preferencias de la hoja
  creado_en      TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------- 3) Historial de recetas por médico ---------- */
CREATE TABLE IF NOT EXISTS recetas_medico (
  id         TEXT PRIMARY KEY,           -- id interno de la receta
  email      TEXT NOT NULL,
  codigo     TEXT NOT NULL DEFAULT '',
  fecha      TEXT NOT NULL DEFAULT '',
  paciente   TEXT NOT NULL DEFAULT '',   -- nombre del paciente (buscable)
  data       TEXT NOT NULL,              -- receta completa en JSON
  creada_en  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rm_email ON recetas_medico(email);
CREATE INDEX IF NOT EXISTS idx_rm_fecha ON recetas_medico(email, fecha);

/* ---------- 4) Avisos globales publicados por el administrador ---------- */
CREATE TABLE IF NOT EXISTS avisos (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  mensaje    TEXT NOT NULL,
  creado_por TEXT NOT NULL,
  creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_avisos_creado ON avisos(creado_en);

/* ---------- 4) Si ya habías creado la tabla `medicos` antes ----------
   Ejecuta SOLO esta línea aparte (si aparece el error «duplicate column
   name» es que ya estaba y no hay nada que hacer):

   ALTER TABLE medicos ADD COLUMN propietario TEXT NOT NULL DEFAULT '';
   UPDATE medicos SET propietario = email WHERE propietario = '';

------------------------------------------------------------------------- */

-- Vista de control (opcional):
--   SELECT email, COUNT(*) FROM recetas_medico GROUP BY email;
--   UPDATE recetas SET estado='anulada' WHERE codigo='RX-20261104-001';
