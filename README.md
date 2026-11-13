# Rx Pro · Recetas Médicas Digitales

> Aplicación web (PWA) para emitir recetas médicas profesionales con **verificación QR**, historial y exportación a PDF.
> Funciona **100 % en el navegador**: sin servidor, sin base de datos, sin cuentas en la nube.

**© 2026 isemperadorBR. Todos los derechos reservados.**

---

## 🚀 Publicar en Cloudflare Pages (5 minutos)

### Opción A — Con GitHub (recomendado, actualizaciones automáticas)

1. Crea un repositorio nuevo en GitHub (público o privado). No marques "Add a README" (ya viene uno).
2. Sube esta carpeta. Por consola:

   ```bash
   cd rxpro-repo
   git init
   git add .
   git commit -m "Rx Pro v1.0.0 — recetas médicas digitales"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/rxpro.git
   git push -u origin main
   ```

3. Entra a <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
4. Autoriza GitHub y elige el repositorio `rxpro`.
5. Configuración del build:

   | Campo | Valor |
   |---|---|
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | *(vacío)* |
   | Build output directory | `/` |

6. **Save and Deploy**. En ~30 segundos tendrás una URL tipo
   `https://rxpro.pages.dev` y, si quieres, un dominio propio en *Custom domains*.

### Opción B — Arrastrar y soltar (sin GitHub)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Arrastra el contenido de esta carpeta (no la carpeta comprimida).
3. **Deploy site**. Listo.

> ⚠️ Sube el **contenido** de la carpeta (`index.html` en la raíz), no la carpeta `rxpro-repo` dentro de otra carpeta. Si `index.html` queda en una subcarpeta, Cloudflare no lo encontrará.

---

## 🖥️ Probar en local

Como no hay build, basta abrir `index.html`, pero para que el **service worker** y el manifest funcionen (instalación como app) necesitas servirlo por HTTP:

```bash
# Opción 1 · Python (ya instalado en macOS/Linux)
python3 -m http.server 8080

# Opción 2 · Node
npx serve .

# Opción 3 · PHP
php -S localhost:8080
```

Luego abre <http://localhost:8080>.

> Abrir el archivo con `file://` también funciona, pero el navegador bloquea el service worker y el "Agregar a pantalla de inicio" no se activa.

---

## 📁 Estructura

```
.
├── index.html              ← la app completa (HTML + CSS + JS + QR, un solo archivo)
├── manifest.webmanifest    ← PWA: nombre, iconos, color, modo standalone
├── sw.js                   ← service worker (funciona sin señal)
├── _headers                ← Cloudflare Pages: seguridad y cachés
├── _redirects              ← Cloudflare Pages: rutas limpias (/login, /dashboard…)
├── assets/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   └── og-image.png        ← imagen para compartir en WhatsApp/redes (1200×630)
├── robots.txt
├── LICENSE                 ← MIT + nota de uso clínico
├── .gitignore
├── .nojekyll               ← evita procesamiento de Jekyll si algún día usas GitHub Pages
└── README.md
```

**No hay `package.json`, ni `node_modules`, ni paso de build.** Es estático puro.

---

## ✨ Funcionalidades

| Módulo | Detalle |
|---|---|
| **Autenticación** | Cuentas en Cloudflare D1 con acceso sujeto a aprobación del administrador; modo autónomo disponible cuando no hay API. |
| **Perfil** | Nombre, CMP, RNE, especialidad, teléfono, dirección del consultorio, clínica. Firma (imagen **o dibujada** en canvas) y logo. |
| **Nueva receta** | Paciente (nombre, edad, sexo, documento), fecha, diagnóstico opcional, alergias, medicamentos múltiples, indicaciones, tipo de receta (simple / controlada). |
| **Medicamentos** | DCI, concentración, forma farmacéutica (18 opciones), dosis, frecuencia, duración, cantidad total, vía (12 opciones), indicación. **10 plantillas de dosis** con un toque. |
| **Vista previa en vivo** | La receta se arma mientras escribes, con marca de agua BORRADOR. |
| **Emisión** | Código único `RX-AAAAMMDD-###` + hash de integridad SHA-256 + **QR generado en el dispositivo**. |
| **Salida** | Imprimir / Guardar como PDF (A5, A4 o carta), enviar resumen por WhatsApp. |
| **Historial** | Búsqueda por paciente/código/medicamento/diagnóstico, orden, estadísticas, ver, PDF, WhatsApp, QR, eliminar. |
| **Ajustes** | 8 colores de receta, tipografía clásica/moderna, densidad, mostrar/ocultar diagnóstico, edad, QR, aviso legal y derecho de autor. |
| **Privacidad** | Caché local más sincronización de perfil e historial en D1 para cuentas en línea. Respaldo JSON e importación. |
| **PWA** | Instalable, con iconos, atajos y funcionamiento sin conexión. |

---

## 🔐 Privacidad y datos

- Si usas una cuenta en línea, el perfil y el historial se sincronizan con la base Cloudflare D1 de Rx Pro. También se conserva una copia de trabajo en el navegador.
- En modo autónomo, los cambios nuevos permanecen en ese navegador hasta que los respaldes; no hay sincronización entre dispositivos.
- La contraseña se guarda en D1 con PBKDF2-SHA256, no en texto plano.
- El respaldo JSON es una copia adicional que puede incluir datos sensibles del paciente. Guárdalo en un lugar protegido. Borrar los datos locales del navegador **no elimina** lo ya sincronizado en D1.
- El diagnóstico es un dato sensible (Ley 29733): puedes ocultarlo en Ajustes para que no se imprima.

---

## ⚖️ Límites clínicos y legales (importante)

1. **No es una receta electrónica certificada.** Una imagen de firma **no** es firma digital. La **Ley N.° 27269** exige un certificado de entidad acreditada (RENIEC / INDECOPI), y las **RM 351-2020-MINSA** y **RM 968-2021-MINSA** lo exigen para la receta electrónica. Esta app produce un **documento de prescripción legible y trazable**.
2. **No valida el CMP** contra el padrón del Colegio Médico del Perú. El número es autodeclarado.
3. **No sirve para medicamentos controlados** (psicotrópicos, estupefacientes, retrovirales): requieren receta especial numerada de DIGEMID.
4. Para trámites formales (seguros, ESSALUD, empleador) agrega **firma y sello físico**.
5. Incluye los campos obligatorios de **DS 014-2011-SA / DIGEMID**: nombre, CMP, especialidad, dirección y teléfono del consultorio, fecha, paciente, diagnóstico, medicamento en **DCI**, concentración, forma farmacéutica, dosis, vía, frecuencia y duración.

---

## 🛠️ Personalizar

| Quiero cambiar… | Dónde |
|---|---|
| Colores de la receta | `index.html` → buscar `const COLORES` |
| Plantillas de dosis | `index.html` → buscar `const PLANTILLAS` |
| Formas farmacéuticas y vías | `index.html` → buscar `const FORMAS` / `const VIAS` |
| Avisos predefinidos y vista | `index.html` → buscar `const NOTICES` |
| Publicar avisos compartidos | Vista **Avisos** (administrador) y API `/api/avisos` |
| Texto del derecho de autor | `index.html` → buscar `isemperadorBR` (footer, hoja, login, README) |
| Nombre / iconos de la PWA | `manifest.webmanifest` y carpeta `assets/` |
| Cabeceras de seguridad | `_headers` |
| Rutas amigables | `_redirects` |

Cuando cambies archivos versionados en caché, sube el número en `sw.js`:
`const VERSION = 'rxpro-v1.7.2';`

---

---

## 🗄️ Base de datos D1 (opcional)

La app puede funcionar en modo autónomo, pero al conectar D1 habilita cuentas,
aprobación del administrador, sincronización entre dispositivos, avisos
compartidos e integridad pública de códigos QR.

**Qué guarda D1:** datos de la cuenta profesional; historial de recetas (incluye
los datos clínicos necesarios para sincronizarlo); comprobantes públicos de
verificación (código, huella, CMP y fecha); y avisos publicados por el admin.
El historial solo se entrega a la cuenta autenticada del médico. El respaldo
JSON es una copia adicional, no sustituye la base sincronizada.

### Puesta en marcha (una sola vez, todo desde el panel)

1. **Crear la base** — Cloudflare → *Workers y Pages* → **D1** → *Crear base de datos*
   → nombre `rxpro-db`.
2. **Crear las tablas iniciales** — solo para una base D1 nueva: pestaña
   **Consola** → ejecuta `d1-schema.sql`. No vuelvas a ejecutar ese archivo
   sobre una base que ya contiene datos. Para actualizar una base existente,
   aplica únicamente la migración indicada en la sección v1.7.2.
3. **Publicar la API** — el repo ya trae `functions/api/[[ruta]].js`.
   (En el uploader web de GitHub: *Add file → Create new file* → escribe
   `functions/api/[[ruta]].js` en el nombre y pega el archivo.
   Los corchetes del nombre son parte de la ruta: hacen que ese único archivo
   atienda `/api/registro`, `/api/auth`, `/api/perfil` y `/api/historial`.)
4. **Conectar** — Cloudflare → tu proyecto de Pages → *Settings* → **Functions**
   → *D1 database bindings* → *Add binding*:
   - Variable name: `RX_DB`  ← **exactamente así**
   - D1 database: `rxpro-db`
5. **Redesplegar** — *Deployments* → *Retry deployment* (o sube cualquier archivo).

### Comprobar que quedó conectada

Abre en el navegador: `https://TU-DOMINIO/api/registro?codigo=RX-20260101-001`

- `{"ok":true,"registrada":false}` → **conectada** (ese código no existe, es normal).
- `{"ok":false,"error":"sin_base"}` → falta el paso 4 (o el nombre de la variable).
- HTML o 404 → falta el paso 3 (la carpeta `functions/`).

### Saber cuántas recetas se emitieron

En la consola de D1:

```sql
SELECT fecha, COUNT(*) AS recetas FROM recetas GROUP BY fecha ORDER BY fecha DESC;
```

Para anular una receta: `UPDATE recetas SET estado='anulada' WHERE codigo='RX-…';`

### Comprobar qué versión está publicada

Abre en el navegador: **`tudominio/api/version`**

```json
{"ok":true,"api":"v1.7.2","rutas":["registro","auth","perfil","historial","avisos"],"base":true}
```

- Si sale `v1.7.2` y `"base":true` → API actualizada y D1 conectada.
- Si sale `v1.6.2` o anterior → actualiza `functions/api/[[ruta]].js`.
- Si devuelve HTML o 404 → la carpeta `functions/` no se está publicando.
- Si devuelve HTML o 404 → la carpeta `functions/` no se está publicando.
- Si sale otra versión → el archivo `functions/api/[[ruta]].js` quedó viejo.

> ⚠️ **Cuidado con *Retry deployment*:** vuelve a compilar **el mismo commit**, no el
> último. Si subiste cambios y no aparecen, haz un commit nuevo (cualquier
> cambio minúsculo) o usa *Deploy latest commit*.

### «Espera, ¿qué versión estoy viendo?»

En la pantalla de inicio de sesión, **debajo del aviso de copyright**, aparece
la versión de la app (por ejemplo `Rx Pro · v1.7.2`). Si ahí ves `Rx Pro` sin
número, el navegador está usando una copia vieja en caché.

Y para el servidor, abre **`/api/version`**.

### Control de acceso: nadie entra sin tu autorización

- **La primera cuenta** que se cree en el sistema es la del administrador
  (tú) y queda aprobada de inmediato.
- **Quien se registre por su cuenta** queda en estado `pendiente`: ve una
  pantalla de espera y **no puede entrar** (el servidor le niega la sesión
  con `403 pendiente`, no basta con esconder botones).
- Tú los ves en **Solicitudes** (menú lateral, solo visible para el
  administrador), con el número en rojo cuando llega una nueva, y decides
  **Autorizar** o **Rechazar**. Quien se registra ve el mensaje
  *«Hemos enviado tu solicitud al administrador… Muchas gracias por su espera»*.
- Las cuentas que **tú creas** para colegas nacen aprobadas.
- **El modo local ya no es una puerta trasera:** si el sitio está publicado
  con base de datos, una cuenta que no exista en la nube **no entra**, ni por
  registro ni por inicio de sesión. Las sesiones guardadas sin token se
  descartan al arrancar.
- El enlace del CMP en la página de verificación apunta a
  **«Conoce a tu Médico»** (`conoceatumedico.cmp.org.pe`), donde se puede
  buscar la colegiatura.

> ⚠️ Al aplicar esta versión sobre una base que ya tiene cuentas, marca la
> tuya como administradora (ver el bloque final de `d1-schema.sql`), o
> quedarás fuera del sistema.

### Cuentas en línea y varios dispositivos

Con la base conectada, la cuenta del médico vive en el servidor:

- **Entra desde cualquier teléfono o computadora** con su correo y contraseña:
  ve el mismo perfil (firma, logo, datos) y el mismo historial.
- En **Mi perfil → Cuenta y dispositivos** aparece el estado
  («Sincronizada» / «Solo en este dispositivo»).
- **Crear cuenta a un colega**: botón en esa misma tarjeta. Se crea con el
  correo del médico y una contraseña temporal; él la cambia al entrar.
  Después puedes subirle su firma y logo desde tu equipo.
- **La contraseña la controla el administrador.** Si la cuenta la creaste tú
  para un colega, *esa persona no puede cambiar su contraseña*: el botón no
  aparece y, aunque lo intentara por la API, el servidor responde
  `403 sin_permiso`. Tú la cambias desde **Mis cuentas**.
- **Mis cuentas**: lista de las cuentas que administras, con un botón para
  asignarles una contraseña nueva cuando quieras.
- Las contraseñas **nunca** se guardan en texto plano, y la sesión caduca a
  los 30 días.

### Privacidad: dos niveles

| Tabla | Contenido | Quién la lee |
|---|---|---|
| `recetas` | código, huella, CMP, fecha | cualquiera (verificación pública) |
| `medicos` | nombre, correo, CMP, firma, logo, quién la administra | solo el dueño de la sesión |
| `recetas_medico` | historial clínico (incluye paciente) | solo el dueño de la sesión |

⚠️ El historial sincronizado **sí contiene datos del paciente**, porque es
justamente lo que el médico necesita ver desde otro equipo. Es información
sensible bajo la Ley 29733: la base está alojada fuera del país y solo se
sirve con la sesión del propio médico. Si prefieres que nada clínico salga
del dispositivo, basta con no conectar la base: la app sigue funcionando de
forma autónoma.

---
## ✅ Checklist antes de compartir el enlace

- [ ] Cambiaste `TU-USUARIO` en las instrucciones y pusiste tu dominio real.
- [ ] Probaste el registro y la emisión de una receta de prueba.
- [ ] Descargaste el PDF y revisaste que todos los datos se impriman.
- [ ] Añadiste tu firma y logo en *Mi perfil*.
- [ ] Decidiste si quieres el diagnóstico visible o no (*Ajustes*).
- [ ] Guardaste un respaldo `.json` de prueba.
- [ ] Probaste el endpoint `/api/registro` (si usas base de datos).

---

## 📄 Licencia

MIT para el código — ver [LICENSE](LICENSE).
Incluye el generador **qrcode-generator** de Kazuhiko Arase (MIT).
La nota sobre uso clínico al final del LICENSE no forma parte de la licencia MIT y debe conservarse.

© 2026 **isemperadorBR**. Todos los derechos reservados.

### Historial de versiones

| Versión | Qué arregla |
|---|---|
| **v1.7.2** | Avisos compartidos: el administrador publica y elimina comunicados visibles para todas las cuentas aprobadas; el servidor exige rol admin. Añade migración D1 `d1-avisos.sql`. Aclara el uso de Cloudflare y respaldos locales, y retira la frase comparativa de avisos y el texto del pie sobre firma digital certificada. |
| **v1.7.1** | El **registro de cuentas fallaba** (`error_servidor`: *15 values for 14 columns*): el `INSERT` no incluía la columna `rol`. Era la causa real de los mensajes «No se pudo crear la cuenta / No se pudo completar la operación». Además: mensaje de espera nuevo, panel de **Solicitudes** en el menú lateral con contador, el botón ya no aparece para quien no es administrador, los **rechazados** dejan de aparecer como pendientes, y los errores del servidor se muestran con su detalle. |
| v1.7.0 | El modo local deja de ser una puerta trasera: registro e inicio de sesión nunca caen al modo local si el sitio tiene base de datos. Se muestra la versión en la pantalla de login. |
| v1.6.1 | Ruta `/api/version` para comprobar qué API está publicada. |
| v1.6.0 | Control de acceso con aprobación del administrador. |

**Para actualizar una base D1 existente a v1.7.2:** en Cloudflare → D1 → `rxpro-db` → Consola, ejecuta una sola vez el archivo `d1-avisos.sql` incluido en el ZIP. **No ejecutes de nuevo `d1-schema.sql`** sobre la base existente. Después publica `index.html`, `sw.js` y `functions/api/[[ruta]].js` juntos; `/api/version` debe mostrar `v1.7.2`.

> **Importante:** `index.html` y `functions/api/[[ruta]].js` deben subirse
> **juntos**. Si solo subes la página, el servidor viejo no tiene `rol` y el
> registro responde *«La API del servidor está anticuada»*.
