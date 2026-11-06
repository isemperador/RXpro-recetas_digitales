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
| **Autenticación** | Registro e inicio de sesión local. Contraseña hasheada con SHA-256. "Recordarme". |
| **Perfil** | Nombre, CMP, RNE, especialidad, teléfono, dirección del consultorio, clínica. Firma (imagen **o dibujada** en canvas) y logo. |
| **Nueva receta** | Paciente (nombre, edad, sexo, documento), fecha, diagnóstico opcional, alergias, medicamentos múltiples, indicaciones, tipo de receta (simple / controlada). |
| **Medicamentos** | DCI, concentración, forma farmacéutica (18 opciones), dosis, frecuencia, duración, cantidad total, vía (12 opciones), indicación. **10 plantillas de dosis** con un toque. |
| **Vista previa en vivo** | La receta se arma mientras escribes, con marca de agua BORRADOR. |
| **Emisión** | Código único `RX-AAAAMMDD-###` + hash de integridad SHA-256 + **QR generado en el dispositivo**. |
| **Salida** | Imprimir / Guardar como PDF (A5, A4 o carta), enviar resumen por WhatsApp. |
| **Historial** | Búsqueda por paciente/código/medicamento/diagnóstico, orden, estadísticas, ver, PDF, WhatsApp, QR, eliminar. |
| **Ajustes** | 8 colores de receta, tipografía clásica/moderna, densidad, mostrar/ocultar diagnóstico, edad, QR, aviso legal y derecho de autor. |
| **Privacidad** | Todo en `localStorage`. Exportar/importar respaldo JSON. Botón de borrado total. |
| **PWA** | Instalable, con iconos, atajos y funcionamiento sin conexión. |

---

## 🔐 Privacidad y datos

- **No hay servidor.** Nada se transmite. Puedes verificarlo en la pestaña *Network* del navegador: cero peticiones tras la carga.
- Los datos viven en el `localStorage` del navegador y dispositivo donde usas la app.
- La contraseña se guarda como hash SHA-256 con sal derivada del correo; aun así, **no reutilices una contraseña importante**.
- **Si borras los datos del navegador, pierdes el historial.** Usa *Historial → Respaldar* o *Ajustes → Exportar respaldo (.json)* con regularidad.
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
| Avisos internos | `index.html` → buscar `const NOTICES` |
| Texto del derecho de autor | `index.html` → buscar `isemperadorBR` (footer, hoja, login, README) |
| Nombre / iconos de la PWA | `manifest.webmanifest` y carpeta `assets/` |
| Cabeceras de seguridad | `_headers` |
| Rutas amigables | `_redirects` |

Cuando cambies archivos versionados en caché, sube el número en `sw.js`:
`const VERSION = 'rxpro-v1.5.0';`

---

---

## 🗄️ Base de datos D1 (opcional)

La app funciona sin base de datos. Si la conectas, cada receta emitida queda
registrada y la página de verificación deja de fiarse solo del QR: compara
contra el registro, de modo que **un QR inventado sale como «Receta no
registrada»**. Si no la conectas, todo sigue igual (verificación por huella).

**Qué se guarda:** código, huella de integridad, CMP y fecha.
**Qué NO se guarda:** nombre del paciente, edad, documento, diagnóstico ni
medicamentos. Así no se administra una base de datos de salud (Ley 29733).

### Puesta en marcha (una sola vez, todo desde el panel)

1. **Crear la base** — Cloudflare → *Workers y Pages* → **D1** → *Crear base de datos*
   → nombre `rxpro-db`.
2. **Crear la tabla** — entra a la base → pestaña **Consola** → pega el contenido
   de `d1-schema.sql` → *Ejecutar*. Debe decir «Ejecutado».
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
