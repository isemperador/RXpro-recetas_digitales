/* ============================================================
   Rx Pro · API (Cloudflare Pages Function + D1)
   © 2026 isemperadorBR. Todos los derechos reservados.

   Ubicación en el repo:  functions/api/[[ruta]].js
   (el doble corchete hace que este archivo atienda TODAS las rutas
    bajo /api/, incluidas las que se agreguen en el futuro)

   Rutas:
     POST /api/registro                     → anota una receta emitida
     GET  /api/registro?codigo=RX-…         → verifica un código (público)
     POST /api/auth  {accion:'signup'|'login'|'logout'|'clave', …}
     POST /api/perfil  (Bearer)             → guarda perfil
     GET  /api/historial (Bearer)           → lista las recetas del médico
     POST /api/historial (Bearer)           → guarda/actualiza una receta

   Privacidad: en `recetas` no se guarda ningún dato del paciente.
   En `recetas_medico` sí (historial clínico), y solo se sirve al
   dueño de la sesión.
   ============================================================ */

const JSON_H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: JSON_H });

/* ---------------- utilidades ---------------- */

function limpio(v, max, soloDigitos) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  return soloDigitos ? s.replace(/\D/g, '') : s.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e || '');
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/* PBKDF2-SHA256 · 100 000 iteraciones.
   Ojo: Cloudflare Workers NO admite más de 100 000 (el límite es del runtime,
   no nuestro). Con 100 000 y contraseñas de 8+ caracteres el cifrado sigue
   siendo sólido para este uso.                                              */
const ITER = 100000;
async function hashPass(pass, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITER, hash: 'SHA-256' }, key, 256
  );
  return b64(bits);
}
async function nuevaPass(pass) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16))).replace(/[^A-Za-z0-9]/g, '').slice(0, 22);
  return ITER + '$' + salt + '$' + (await hashPass(pass, salt));
}
async function comprobarPass(pass, guardado) {
  const [it, salt, hash] = String(guardado || '').split('$');
  if (!it || !salt || !hash) return false;
  const calc = await hashPass(pass, salt);
  if (calc.length !== hash.length) return false;
  let dif = 0;                                   // comparación en tiempo constante
  for (let i = 0; i < calc.length; i++) dif |= calc.charCodeAt(i) ^ hash.charCodeAt(i);
  return dif === 0;
}
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* token de sesión: "email.expira.firma" (la firma impide falsificarlo) */
const DIAS_SESION = 30;
async function firmar(payload) {
  const sello = await sha256hex('rxpro|' + payload);
  return payload + '.' + sello.slice(0, 32);
}
async function crearToken(email) {
  const exp = Date.now() + DIAS_SESION * 86400000;
  return firmar(email + '|' + exp);
}
async function leerToken(req) {
  const h = req.headers.get('Authorization') || '';
  const t = h.replace(/^Bearer\s+/i, '').trim();
  if (!t) return null;
  const i = t.lastIndexOf('.');
  if (i < 0) return null;
  const payload = t.slice(0, i);
  if ((await firmar(payload)) !== t) return null;              // firma inválida
  const [email, exp] = payload.split('|');
  if (!email || !exp || +exp < Date.now()) return null;        // expirado
  return email;
}

const PERFIL_COLS = 'email, nombre, cmp, rne, especialidad, telefono, direccion, clinica, firma, logo, ajustes, propietario, creado_en';
/* puede cambiar la contraseña: el dueño de la cuenta o quien la administra */
function puedeGestionar(registro, quien) {
  if (!registro || !quien) return false;
  const prop = registro.propietario || registro.email;
  return quien === registro.email || quien === prop;
}
const publico = (r) => ({
  email: r.email, nombre: r.nombre, cmp: r.cmp, rne: r.rne,
  especialidad: r.especialidad, telefono: r.telefono, direccion: r.direccion,
  clinica: r.clinica, firma: r.firma || '', logo: r.logo || '',
  ajustes: r.ajustes ? JSON.parse(r.ajustes) : null,
  propietario: r.propietario || '',
  creadoEn: r.creado_en
});

/* ---------------- /api/registro ---------------- */

async function postRegistro(env, request) {
  if (!env.RX_DB) return json({ ok: false, error: 'sin_base' }, 503);
  let b; try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }

  const codigo = limpio(b.codigo, 24, false);
  const huella = limpio(b.huella, 8, false);
  if (codigo.length < 6 || huella.length < 4) return json({ ok: false, error: 'datos_incompletos' }, 400);
  const cmp = limpio(b.cmp, 8, true);
  const fecha = limpio(b.fecha, 8, true);

  const prev = await env.RX_DB.prepare('SELECT huella FROM recetas WHERE codigo = ?').bind(codigo).first();
  if (prev) {
    if (prev.huella === huella) return json({ ok: true, registrada: true, repetida: true });
    return json({ ok: false, error: 'codigo_en_uso' }, 409);
  }
  await env.RX_DB.prepare('INSERT INTO recetas (codigo, huella, cmp, fecha) VALUES (?, ?, ?, ?)')
    .bind(codigo, huella, cmp, fecha).run();
  return json({ ok: true, registrada: true });
}

async function getRegistro(env, url) {
  const codigo = limpio(url.searchParams.get('codigo'), 24, false);
  if (codigo.length < 6) return json({ ok: false, error: 'codigo_invalido' }, 400);
  if (!env.RX_DB) return json({ ok: false, registrada: null, error: 'sin_base' }, 503);
  const row = await env.RX_DB.prepare(
    'SELECT codigo, huella, cmp, fecha, estado, creada_en FROM recetas WHERE codigo = ?'
  ).bind(codigo).first();
  if (!row) return json({ ok: true, registrada: false });
  return json({ ok: true, registrada: true, codigo: row.codigo, huella: row.huella,
    cmp: row.cmp, fecha: row.fecha, estado: row.estado, emitida: row.creada_en });
}

/* ---------------- /api/auth ---------------- */

async function postAuth(env, request) {
  if (!env.RX_DB) return json({ ok: false, error: 'sin_base' }, 503);
  let b; try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }
  const accion = String(b.accion || '').toLowerCase();
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);

  /* --- crear cuenta (la puede crear el médico o un colega que la configura) --- */
  if (accion === 'signup') {
    if (!emailOk(email)) return json({ ok: false, error: 'email_invalido' }, 400);
    if (String(b.pass || '').length < 8) return json({ ok: false, error: 'clave_corta' }, 400);
    if (!String(b.nombre || '').trim() || !String(b.cmp || '').trim())
      return json({ ok: false, error: 'faltan_datos' }, 400);

    const ya = await env.RX_DB.prepare('SELECT email FROM medicos WHERE email = ?').bind(email).first();
    if (ya) return json({ ok: false, error: 'email_en_uso' }, 409);

    const pass = await nuevaPass(String(b.pass));
    await env.RX_DB.prepare(
      `INSERT INTO medicos (email, pass, nombre, cmp, rne, especialidad, telefono, direccion, clinica, firma, logo, ajustes, propietario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email, pass,
      String(b.nombre || '').slice(0, 90), String(b.cmp || '').slice(0, 20),
      String(b.rne || '').slice(0, 20), String(b.especialidad || '').slice(0, 60),
      String(b.telefono || '').slice(0, 30), String(b.direccion || '').slice(0, 140),
      String(b.clinica || '').slice(0, 80),
      b.firma || null, b.logo || null, b.ajustes ? JSON.stringify(b.ajustes) : null,
      String(b.propietario || '').trim().toLowerCase().slice(0, 120)
    ).run();

    const row = await env.RX_DB.prepare(`SELECT ${PERFIL_COLS} FROM medicos WHERE email = ?`).bind(email).first();
    return json({ ok: true, token: await crearToken(email), perfil: publico(row) });
  }

  /* --- iniciar sesión --- */
  if (accion === 'login') {
    if (!emailOk(email)) return json({ ok: false, error: 'email_invalido' }, 400);
    const row = await env.RX_DB.prepare(`SELECT ${PERFIL_COLS}, pass FROM medicos WHERE email = ?`).bind(email).first();
    if (!row) return json({ ok: false, error: 'no_existe' }, 404);
    if (!(await comprobarPass(String(b.pass || ''), row.pass))) return json({ ok: false, error: 'clave_mala' }, 401);
    return json({ ok: true, token: await crearToken(email), perfil: publico(row) });
  }

  /* --- cambiar contraseña ---
     Solo quien administra la cuenta (tú) o el propio dueño si la creó para sí.
     Una cuenta creada por un colega NO puede cambiar su clave: la controla
     quien la creó. Así el acceso queda siempre en manos del administrador. */
  if (accion === 'clave') {
    const quien = await leerToken(request);
    if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
    const row = await env.RX_DB.prepare('SELECT pass, email, propietario FROM medicos WHERE email = ?').bind(quien).first();
    if (!row) return json({ ok: false, error: 'no_existe' }, 404);
    if (!puedeGestionar(row, quien)) return json({ ok: false, error: 'sin_permiso' }, 403);
    if (String(b.nueva || '').length < 8) return json({ ok: false, error: 'clave_corta' }, 400);
    if (!(await comprobarPass(String(b.actual || ''), row.pass))) return json({ ok: false, error: 'clave_mala' }, 401);
    await env.RX_DB.prepare('UPDATE medicos SET pass = ?, actualizado_en = datetime("now") WHERE email = ?')
      .bind(await nuevaPass(String(b.nueva)), quien).run();
    return json({ ok: true });
  }

  /* --- restablecer la contraseña de un colega (solo el administrador) --- */
  if (accion === 'restablecer') {
    const quien = await leerToken(request);
    if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
    const objetivo = String(b.email || '').trim().toLowerCase().slice(0, 120);
    if (!emailOk(objetivo)) return json({ ok: false, error: 'email_invalido' }, 400);
    if (String(b.nueva || '').length < 8) return json({ ok: false, error: 'clave_corta' }, 400);
    const row = await env.RX_DB.prepare('SELECT email, propietario FROM medicos WHERE email = ?').bind(objetivo).first();
    if (!row) return json({ ok: false, error: 'no_existe' }, 404);
    if (!puedeGestionar(row, quien)) return json({ ok: false, error: 'sin_permiso' }, 403);
    await env.RX_DB.prepare('UPDATE medicos SET pass = ?, actualizado_en = datetime("now") WHERE email = ?')
      .bind(await nuevaPass(String(b.nueva)), objetivo).run();
    return json({ ok: true });
  }

  /* --- ¿qué cuentas administro? (para el panel del administrador) --- */
  if (accion === 'mios') {
    const quien = await leerToken(request);
    if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
    const { results } = await env.RX_DB.prepare(
      'SELECT email, nombre, cmp, especialidad, propietario FROM medicos WHERE propietario = ? AND email <> ?'
    ).bind(quien, quien).all();
    const cuentas = (results || []).map((r) => ({ email: r.email, nombre: r.nombre, cmp: r.cmp, especialidad: r.especialidad }));
    const yo = await env.RX_DB.prepare('SELECT email, propietario FROM medicos WHERE email = ?').bind(quien).first();
    return json({ ok: true, cuentas, puedoCambiar: puedeGestionar(yo, quien) });
  }

  /* --- cerrar sesión (el token caduca solo; esto es informativo) --- */
  if (accion === 'logout') return json({ ok: true });

  /* --- ¿existe esta cuenta? (para avisar «cuenta no encontrada») --- */
  if (accion === 'existe') {
    if (!emailOk(email)) return json({ ok: false, error: 'email_invalido' }, 400);
    const row = await env.RX_DB.prepare('SELECT email FROM medicos WHERE email = ?').bind(email).first();
    return json({ ok: true, existe: !!row });
  }

  return json({ ok: false, error: 'accion_desconocida' }, 400);
}

/* ---------------- /api/perfil ---------------- */

async function getPerfil(env, request) {
  const quien = await leerToken(request);
  if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
  const row = await env.RX_DB.prepare(`SELECT ${PERFIL_COLS} FROM medicos WHERE email = ?`).bind(quien).first();
  if (!row) return json({ ok: false, error: 'no_existe' }, 404);
  return json({ ok: true, perfil: publico(row) });
}

async function postPerfil(env, request) {
  const quien = await leerToken(request);
  if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }

  const campos = [], vals = [];
  const set = (col, v) => { if (v !== undefined) { campos.push(col + ' = ?'); vals.push(v); } };
  set('nombre', b.nombre !== undefined ? String(b.nombre).slice(0, 90) : undefined);
  set('cmp', b.cmp !== undefined ? String(b.cmp).slice(0, 20) : undefined);
  set('rne', b.rne !== undefined ? String(b.rne).slice(0, 20) : undefined);
  set('especialidad', b.especialidad !== undefined ? String(b.especialidad).slice(0, 60) : undefined);
  set('telefono', b.telefono !== undefined ? String(b.telefono).slice(0, 30) : undefined);
  set('direccion', b.direccion !== undefined ? String(b.direccion).slice(0, 140) : undefined);
  set('clinica', b.clinica !== undefined ? String(b.clinica).slice(0, 80) : undefined);
  set('firma', b.firma !== undefined ? (b.firma || null) : undefined);
  set('logo', b.logo !== undefined ? (b.logo || null) : undefined);
  set('ajustes', b.ajustes !== undefined ? JSON.stringify(b.ajustes) : undefined);

  if (!campos.length) return json({ ok: false, error: 'nada_que_guardar' }, 400);
  campos.push('actualizado_en = datetime("now")');
  vals.push(quien);
  await env.RX_DB.prepare(`UPDATE medicos SET ${campos.join(', ')} WHERE email = ?`).bind(...vals).run();
  return json({ ok: true });
}

/* ---------------- /api/historial ---------------- */

async function getHistorial(env, request) {
  const quien = await leerToken(request);
  if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
  const { results } = await env.RX_DB.prepare(
    'SELECT id, data FROM recetas_medico WHERE email = ? ORDER BY fecha DESC, creada_en DESC LIMIT 500'
  ).bind(quien).all();
  const recetas = [];
  for (const r of results || []) { try { recetas.push(JSON.parse(r.data)); } catch (e) {} }
  return json({ ok: true, recetas });
}

async function postHistorial(env, request) {
  const quien = await leerToken(request);
  if (!quien) return json({ ok: false, error: 'sin_sesion' }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }

  const lista = Array.isArray(b.recetas) ? b.recetas.slice(0, 100) : (b.receta ? [b.receta] : []);
  if (!lista.length) return json({ ok: false, error: 'nada_que_guardar' }, 400);

  let n = 0;
  for (const r of lista) {
    if (!r || !r.id) continue;
    const paciente = String((r.paciente && r.paciente.nombre) || '').slice(0, 90);
    await env.RX_DB.prepare(
      `INSERT INTO recetas_medico (id, email, codigo, fecha, paciente, data) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, paciente = excluded.paciente`
    ).bind(String(r.id).slice(0, 40), quien, String(r.code || '').slice(0, 24),
           String(r.fecha || '').slice(0, 10), paciente, JSON.stringify(r)).run();
    n++;
  }
  return json({ ok: true, guardadas: n });
}

/* ---------------- enrutador ---------------- */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ruta = (url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '') || 'registro').toLowerCase();
  const m = request.method;

  if (m === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_H });

  try {
    if (!env.RX_DB && ruta !== 'registro') return json({ ok: false, error: 'sin_base' }, 503);

    if (ruta === 'registro') {
      if (m === 'POST') return await postRegistro(env, request);
      if (m === 'GET') return await getRegistro(env, url);
    }
    if (ruta === 'auth' && m === 'POST') return await postAuth(env, request);
    if (ruta === 'perfil') {
      if (m === 'GET') return await getPerfil(env, request);
      if (m === 'POST') return await postPerfil(env, request);
    }
    if (ruta === 'historial') {
      if (m === 'GET') return await getHistorial(env, request);
      if (m === 'POST') return await postHistorial(env, request);
    }
    return json({ ok: false, error: 'ruta_no_encontrada', ruta }, 404);
  } catch (e) {
    return json({ ok: false, error: 'error_servidor', detalle: String((e && e.message) || e).slice(0, 160) }, 500);
  }
}
