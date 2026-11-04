# Rx Pro · Recetas Médicas Digitales

> Aplicación web (PWA) para emitir recetas médicas profesionales con **verificación QR**, historial y exportación a PDF.
> Funciona **100 % en el navegador**: sin servidor, sin base de datos, sin cuentas en la nube.

**© 2026 isemperadorBR. Todos los derechos reservados.**

> 📦 **Esta es la versión «plana»**: todos los archivos están en la raíz, **sin carpetas**. No hay `assets/` ni `.github/`.
> Así puedes subirla arrastrando todo con el botón **«choose your files»** de GitHub, que no acepta carpetas.

---

## ⚡ Subir a GitHub con el navegador (lo que estabas intentando)

El uploader web de GitHub **solo acepta archivos, no carpetas**. Por eso esta versión no tiene ninguna.

1. Entra a tu repositorio → botón **Add file** → **Upload files**.
2. Abre la carpeta `rxpro-plano` en tu computadora (**no** la arrastres entera).
3. Selecciona **todos los archivos de dentro** con `Ctrl + A` (`Cmd + A` en Mac) y arrástralos a la zona de subida. También puedes pulsar **choose your files** y seleccionarlos todos.
4. **Los archivos que empiezan con punto** (`.gitignore`, `.nojekyll`) a veces no aparecen en el selector. Si no los ves, no pasa nada: no son obligatorios. Puedes crearlos luego con **Add file → Create new file** escribiendo `.nojekyll` y `.gitignore` como nombre.
5. Escribe el mensaje de commit: `Rx Pro v1.0.0 — recetas médicas digitales` → **Commit changes**.

Quedan **15 archivos en la raíz**. Eso es todo.

> 💡 Si tu repositorio ya tiene archivos sueltos de un intento anterior, no te preocupes: al subir de nuevo se **sobrescriben** los que tengan el mismo nombre.

### Alternativa sin complicaciones

Si prefieres no pelear con el selector de archivos, instala **GitHub Desktop** (<https://desktop.github.com>), arrastra la carpeta completa y pulsa *Commit* → *Push*. Con eso las carpetas sí se preservan.

---

## 🚀 Publicar en Cloudflare Pages (5 minutos)

### Opción A — Conectado a GitHub (recomendado, actualizaciones automáticas)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige tu repositorio.
3. Configuración del build:

   | Campo | Valor |
   |---|---|
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | *(vacío)* |
   | Build output directory | **`/`** |

4. **Save and Deploy**. En ~30 segundos tendrás `https://TU-PROYECTO.pages.dev`.
5. Opcional: *Custom domains* para usar tu propio dominio.

### Opción B — Arrastrar y soltar (sin GitHub)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Arrastra **los archivos de dentro** de esta carpeta (no el `.zip`).
3. **Deploy site**.

> ⚠️ `index.html` debe quedar en la **raíz** del proyecto. Si Cloudflare no lo encuentra, revisa que no haya quedado dentro de una subcarpeta.

---

## 🖥️ Probar en local

El service worker y la instalación como app solo funcionan por HTTP, no con `file://`:

```bash
# dentro de esta carpeta
python3 -m http.server 8080     # luego abre http://localhost:8080
npx serve .                     # alternativa con Node
```

Abrir `index.html` con doble clic **también funciona** para usar la app, pero sin offline ni "Agregar a pantalla de inicio".

---

## 📁 Estructura (todo en la raíz)

```
index.html               ← la app completa (HTML + CSS + JS + QR)
manifest.webmanifest     ← PWA: nombre, iconos, color, modo standalone
sw.js                    ← service worker (funciona sin señal)
_headers                 ← Cloudflare Pages: seguridad y cachés
_redirects               ← Cloudflare Pages: rutas limpias (/login, /dashboard…)
icon-192.png             ┐
icon-512.png             │
icon-maskable-512.png    ├ iconos de la app
apple-touch-icon.png     │
favicon-32.png           ┘
og-image.png             ← imagen para compartir en WhatsApp (1200×630)
robots.txt
LICENSE                  ← MIT + nota de uso clínico
.gitignore               ← bloquea respaldos con datos de pacientes
.nojekyll                ← evita procesamiento de Jekyll en GitHub Pages
README.md
```

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

- **No hay servidor.** Nada se transmite. Puedes verificarlo en la pestaña *Network* del navegador: cero peticiones externas.
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
| Texto del derecho de autor | `index.html` → buscar `isemperadorBR` |
| Nombre / iconos de la PWA | `manifest.webmanifest` y `icon-*.png` |
| Cabeceras de seguridad | `_headers` |
| Rutas amigables | `_redirects` |

Cuando cambies archivos que están en caché, sube el número en `sw.js`: `const VERSION = 'rxpro-v1.0.1';`

---

## ✅ Checklist antes de compartir el enlace

- [ ] Cloudflare te da la URL y abre la pantalla de login.
- [ ] Probaste el registro y la emisión de una receta de prueba.
- [ ] Descargaste el PDF y revisaste que todos los datos se impriman.
- [ ] Añadiste tu firma y logo en *Mi perfil*.
- [ ] Decidiste si quieres el diagnóstico visible o no (*Ajustes*).
- [ ] Guardaste un respaldo `.json` de prueba.
- [ ] En el celular: "Agregar a pantalla de inicio" la abre como app.

---

## 📄 Licencia

MIT para el código — ver [LICENSE](LICENSE).
Incluye el generador **qrcode-generator** de Kazuhiko Arase (MIT).
La nota sobre uso clínico al final del LICENSE no forma parte de la licencia MIT y debe conservarse.

© 2026 **isemperadorBR**. Todos los derechos reservados.
