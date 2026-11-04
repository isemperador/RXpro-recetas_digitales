/* ============================================================
   Rx Pro · Registro de recetas (Cloudflare Pages Function + D1)
   © 2026 isemperadorBR. Todos los derechos reservados.

   Ubicación en el repo:  functions/api/registro.js
   Rutas que atiende:     POST /api/registro   (emitir  → guarda)
                          GET  /api/registro?codigo=RX-…  (verificar → consulta)

   Privacidad (Ley 29733): aquí NO se guarda ningún dato del paciente.
   Solo código, huella de integridad, CMP del prescriptor y fecha.
   ============================================================ */

const CORS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status: status || 200, headers: CORS });

/* Limpia y valida lo que llega del navegador */
function limpio(v, max, soloDigitos) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  s = soloDigitos ? s.replace(/\D/g, '') : s.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return s;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RX_DB) {
    return json({ ok: false, registrada: false, error: 'sin_base' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'json_invalido' }, 400);
  }

  const codigo = limpio(body.codigo, 24, false);
  const huella = limpio(body.huella, 8, false);
  const cmp = limpio(body.cmp, 8, true);
  const fecha = limpio(body.fecha, 8, true);

  if (codigo.length < 6 || huella.length < 4) {
    return json({ ok: false, error: 'datos_incompletos' }, 400);
  }

  try {
    /* Si el código ya existe con la MISMA huella, no se toca (idempotente).
       Si existe con otra huella, se rechaza: alguien intenta sobrescribir
       una receta ajena.                                              */
    const prev = await env.RX_DB
      .prepare('SELECT huella FROM recetas WHERE codigo = ?')
      .bind(codigo)
      .first();

    if (prev) {
      if (prev.huella === huella) return json({ ok: true, registrada: true, repetida: true });
      return json({ ok: false, error: 'codigo_en_uso' }, 409);
    }

    await env.RX_DB
      .prepare('INSERT INTO recetas (codigo, huella, cmp, fecha) VALUES (?, ?, ?, ?)')
      .bind(codigo, huella, cmp, fecha)
      .run();

    return json({ ok: true, registrada: true });
  } catch (e) {
    return json({ ok: false, error: 'error_base', detalle: String(e && e.message || e).slice(0, 120) }, 500);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const codigo = limpio(url.searchParams.get('codigo'), 24, false);
  if (codigo.length < 6) return json({ ok: false, error: 'codigo_invalido' }, 400);

  if (!env.RX_DB) {
    return json({ ok: false, registrada: null, error: 'sin_base' }, 503);
  }

  try {
    const row = await env.RX_DB
      .prepare('SELECT codigo, huella, cmp, fecha, estado, creada_en FROM recetas WHERE codigo = ?')
      .bind(codigo)
      .first();

    if (!row) return json({ ok: true, registrada: false });

    return json({
      ok: true,
      registrada: true,
      codigo: row.codigo,
      huella: row.huella,
      cmp: row.cmp,
      fecha: row.fecha,
      estado: row.estado,
      emitida: row.creada_en
    });
  } catch (e) {
    return json({ ok: false, registrada: null, error: 'error_base' }, 500);
  }
}

/* Cualquier otro método: no permitido */
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  const m = context.request.method;
  if (m === 'POST') return onRequestPost(context);
  if (m === 'GET') return onRequestGet(context);
  return json({ ok: false, error: 'metodo_no_permitido' }, 405);
}
