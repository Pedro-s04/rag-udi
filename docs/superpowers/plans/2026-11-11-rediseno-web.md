# Rediseño de la web del RAG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar `chat.html` por una web React con el chat del RAG arriba, juegos destacados reales de Steam en el medio y una PC 3D abajo que, con la animación "pantalla → circuito", revela el paso a paso interno del RAG.

**Architecture:** `chat.mjs` sigue siendo el único servidor: la lógica HTTP pasa a `servidor.mjs` (testeable con dependencias inyectadas), que sirve `web/dist` y la API. El frontend vive en `web/` (Vite + React + TS + Tailwind v4 + shadcn) con componentes de los registros públicos de Magic UI y Aceternity. Un solo estado de conversación (React context) lo comparten el chat de afuera y el de adentro de la PC.

**Tech Stack:** Node 24 (`node:test`), React 19, Vite, TypeScript, Tailwind CSS v4, shadcn CLI, Magic UI + Aceternity, three.js con @react-three/fiber y @react-three/drei, hls.js, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-11-rediseno-web-design.md`

## Global Constraints

- Rama `rediseno-web`. **Nunca `git push`** sin que el usuario lo pida.
- No se modifica el RAG: `api.mjs`, `buscar.mjs`, `prompt.txt`, `reescribir.txt`, `indexar.mjs`, `esquema.sql` quedan igual.
- El servidor escucha solo en `127.0.0.1`, puerto `PUERTO` del `.env` (hoy `3050`).
- Se mantienen las protecciones: POST solo con `Content-Type: application/json` (si no, 415); `/api/responder` recibe solo `idPrompt`, de un solo uso.
- Componentes: `npx shadcn@latest add https://magicui.design/r/<nombre>.json` o `https://ui.aceternity.com/registry/<nombre>.json`. Nada del registro de 21st.dev (pide cuenta).
- Colores: fondo `#05070b`, celeste `#66c0f4`, verde `#beee11`, texto `#c7d5e0`, gris `#6f8296`. Fuentes: Chakra Petch (títulos), Inter (texto), JetBrains Mono (código).
- Textos de la interfaz en español rioplatense (voseo), como el resto del proyecto.
- Referencia visual: `rag-diseño/Main.dc.html` (estilos inline, keyframes del `<style>`, SVG de Pixel, escena three.js). `rag-diseño/` no se commitea.
- Datos de juegos: solo de Steam, nunca inventados.
- `prefers-reduced-motion`: sin animaciones largas; la entrada a la PC es un fundido.
- Tiene que verse bien a 1280×720 (proyector); en celular el chat funciona.

## Review Focus

1. Pedido a un archivo fuera de `web/dist` (`/../.env`, `/%2e%2e/.env`) → 404, nunca el contenido. Test en Task 1.
2. Gemini o la base fallan → el chat muestra el error en un mensaje y deja volver a preguntar; nunca queda "pensando" para siempre. Test en Task 4.
3. Búsqueda sin fragmentos útiles (`idPrompt: null`) → mensaje "No lo encuentro en los documentos." sin llamar a `/api/responder`. Test en Task 4.
4. Juego sin tráiler o tráiler HLS que no carga → la tarjeta queda con la portada/capturas, sin reproductor roto. Test en Task 6.
5. Navegador sin WebGL → la página funciona, la sección PC muestra una imagen de respaldo y el botón igual abre el detrás de escena (sin 3D). Test en Task 7.

---

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `servidor.mjs` (nuevo) | `crearServidor(deps)`: rutas HTTP, estáticos de `web/dist`, protecciones |
| `chat.mjs` (modificado) | Pipeline del RAG (sin cambios de lógica salvo `appid`) + `listen` usando `servidor.mjs` |
| `destacados.mjs` (nuevo) | Funciones puras: elegir destacados y armar cada ficha |
| `bajar-destacados.mjs` (nuevo) | Script: pide a Steam y escribe `datos/destacados.json` |
| `test/*.test.mjs` (nuevo) | Tests de backend con `node:test` |
| `web/` (nuevo) | Frontend Vite |
| `web/src/lib/api.ts` | Cliente de `/api/buscar`, `/api/responder`, `/api/juegos` y tipos |
| `web/src/lib/conversacion.ts` | Reducer puro de la conversación y `etapaActiva` |
| `web/src/lib/ChatProvider.tsx` | Context + hook `useChat()` |
| `web/src/lib/entrada.ts` | Línea de tiempo pura de la animación de entrada |
| `web/src/lib/video.ts` | `fuenteDeVideo(destacado)` |
| `web/src/components/*` | Navbar, Pixel, Chat, Hero, Destacados, TarjetaJuego, ComoPiensa, SeccionPC, DetrasDeEscena, PanelPasos |
| `web/src/escena/*` | Escritorio, pantalla (canvas), Circuito, `soportaWebGL` |

---

### Task 1: Servidor testeable que sirve `web/dist` y `/api/juegos`

**Files:**
- Create: `servidor.mjs`, `test/servidor.test.mjs`
- Modify: `chat.mjs` (rutas → `servidor.mjs`; `appid` en `resultados`), `package.json` (scripts)

**Interfaces:**
- Produces: `crearServidor({ buscarPasos, responderPaso, mensajeDeError, dirWeb, leerJuegos }) → http.Server`
  - `buscarPasos({ pregunta, descuentoMin, precioMax }) → Promise<object>` (el de `chat.mjs`)
  - `responderPaso({ idPrompt }) → Promise<{ respuesta, ms }>`
  - `leerJuegos() → Promise<object[]>` (contenido de `datos/destacados.json`, `[]` si no existe)
  - Rutas: `GET /` y `GET /assets/*` (y cualquier archivo existente dentro de `dirWeb`), `POST /api/buscar`, `POST /api/responder`, `GET /api/juegos`.
- Produces: cada item de `resultados` de `/api/buscar` suma `appid: number | null`.

- [ ] **Step 1: Escribir los tests** en `test/servidor.test.mjs` (levantar con `listen(0, "127.0.0.1")`, `dirWeb` = carpeta temporal con `index.html` = `"<h1>hola</h1>"` y `assets/a.js`):
  - `GET /` → 200, `text/html`, cuerpo `<h1>hola</h1>`
  - `GET /assets/a.js` → 200, `content-type` empieza con `text/javascript`
  - `GET /../.env` y `GET /%2e%2e/.env` → 404
  - `GET /api/juegos` → 200 y JSON igual a lo que devuelve el `leerJuegos` falso
  - `POST /api/buscar` con `text/plain` → 415
  - `POST /api/buscar` con `{"pregunta":"  "}` → 400
  - `POST /api/buscar` con `{"pregunta":"hola","precioMax":""}` → el `buscarPasos` falso recibe `{ pregunta: "hola", descuentoMin: undefined, precioMax: undefined }`
  - `POST /api/responder` cuando `responderPaso` tira `Error("x")` → 500 con `{ error: "x" }` (pasado por `mensajeDeError`)
  - Sin `index.html` en `dirWeb`: `GET /` → 503 con texto que contiene `npm run build`
- [ ] **Step 2: Correr** `node --test test/` → FAIL (no existe `servidor.mjs`).
- [ ] **Step 3: Implementar `servidor.mjs`** moviendo `leerJSON`, `enviar`, `numeroOpcional` y el handler de `chat.mjs`. Estáticos: `path.resolve(dirWeb, "." + decodeURIComponent(pathname))` y 404 si no empieza con `dirWeb + path.sep`; tipos para `.html .js .css .svg .png .jpg .woff2 .json`.
- [ ] **Step 4: Adaptar `chat.mjs`**: `crearServidor({..., dirWeb: "web/dist", leerJuegos })` y mantener el manejo de `EADDRINUSE` y `listen(PUERTO, "127.0.0.1")`. En el `map` de `resultados` agregar `appid: r.appid`.
- [ ] **Step 5: Scripts en `package.json`**: `"test": "node --test test/"`, `"build": "npm --prefix web run build"`, `"dev": "npm --prefix web run dev"`; `chat` queda igual.
- [ ] **Step 6: Correr** `npm test` → todos PASS.
- [ ] **Step 7: Commit** `servidor.mjs chat.mjs package.json test/` — "Servidor testeable: sirve web/dist y /api/juegos".

### Task 2: Juegos destacados reales de Steam

**Files:**
- Create: `destacados.mjs`, `bajar-destacados.mjs`, `test/destacados.test.mjs`, `datos/destacados.json` (generado)

**Interfaces:**
- Produces: `elegirDestacados({ masVendidos: number[], populares: number[], ofertas: number[] }, porLista = 12) → { appid: number, origen: "mas-vendido" | "popular" | "oferta" }[]` — toma hasta `porLista` de cada lista en ese orden de prioridad, sin repetir appid (el primero que aparece gana).
- Produces: `fichaDestacado(j, { origen, enCorpus }) → Destacado` donde `j` es `data` de `appdetails` y
  ```ts
  type Destacado = { appid: number; nombre: string; origen: string; enCorpus: boolean;
    precio: number; precioOriginal: number; descuento: number; gratis: boolean;
    generos: string[]; portada: string; capsula: string; capturas: string[];
    trailer: { miniatura: string; hls: string } | null; tienda: string }
  ```
  `precio/precioOriginal/descuento` como `numeros()` de `steam.mjs`; `capturas` = hasta 3 `path_thumbnail`; `trailer` = primer `movies[]` con `hls_h264`, si no `null`.
- Produces: `datos/destacados.json` = `Destacado[]` (lo lee `leerJuegos` de Task 1).

- [ ] **Step 1: Tests** en `test/destacados.test.mjs`:
  - `elegirDestacados({ masVendidos:[1,2], populares:[2,3], ofertas:[3,4] }, 12)` → appids `[1,2,3,4]` con orígenes `["mas-vendido","mas-vendido","popular","oferta"]`
  - con `porLista = 1` y `masVendidos:[1,2]` → solo toma el `1` de esa lista
  - `fichaDestacado` con un `j` mínimo sin `movies` → `trailer === null`; con `movies:[{thumbnail:"t", hls_h264:"h"}]` → `{ miniatura:"t", hls:"h" }`
  - `fichaDestacado` con `is_free: true` y sin `price_overview` → `gratis: true, precio: 0`
  - `tienda` = `https://store.steampowered.com/app/<appid>`
- [ ] **Step 2: Correr** `npm test` → FAIL.
- [ ] **Step 3: Implementar `destacados.mjs`.**
- [ ] **Step 4: Correr** `npm test` → PASS.
- [ ] **Step 5: Implementar `bajar-destacados.mjs`**: más vendidos de `${TIENDA}/api/featuredcategories?cc=${PAIS}&l=${IDIOMA}` → `top_sellers.items[].id`; populares = appids de `datos/populares.json` en orden; ofertas = appids de `datos/juegos.json` en orden (ya vienen por reseñas). Para cada elegido: `detalle(appid, { gratis: true })` + `esperar(ESPERA)`; si devuelve `null` (hardware, DLC, no es juego) se saltea. `enCorpus` = appid presente en `juegos.json` o `populares.json`. Escribe `datos/destacados.json`.
- [ ] **Step 6: Correr** `node bajar-destacados.mjs` → termina diciendo cuántos guardó (esperado 25–36) y `datos/destacados.json` tiene `portada` y al menos algunos `trailer` no nulos. Verificar que no hay Steam Deck/Steam Frame.
- [ ] **Step 7: Commit** `destacados.mjs bajar-destacados.mjs test/destacados.test.mjs datos/destacados.json` — "Juegos destacados reales de Steam".

### Task 3: Andamio de `web/` con tema y componentes

**Files:**
- Create: `web/` (Vite react-ts), `web/vite.config.ts`, `web/src/index.css`, `web/components.json`, `web/src/components/ui/*` (instalados), `web/src/App.tsx` (temporal)

**Interfaces:**
- Produces: alias `@/` → `web/src/`; utilidades Tailwind `bg-fondo text-texto text-celeste text-verde text-gris font-titulo font-mono`; componentes en `@/components/ui/`.
- Produces: `npm --prefix web run build` → `web/dist/index.html`; `npm --prefix web test` corre Vitest.

- [ ] **Step 1:** `npm create vite@latest web -- --template react-ts`, instalar `tailwindcss @tailwindcss/vite`, `vitest`, `three @react-three/fiber @react-three/drei hls.js`, tipos de three.
- [ ] **Step 2:** `vite.config.ts`: plugins react + tailwind, alias `@`, `server.proxy["/api"]` → `http://127.0.0.1:${process.env.PUERTO ?? 3050}`, `test.environment = "node"`. `tsconfig` con `paths` para `@/*`.
- [ ] **Step 3:** `npx shadcn@latest init` (tema oscuro). En `index.css`: `@theme` con los 5 colores y 3 fuentes de Global Constraints, import de Google Fonts, `body` con fondo `#05070b`, y regla `prefers-reduced-motion` que apaga animaciones.
- [ ] **Step 4:** Instalar componentes: Magic UI `retro-grid meteors animated-gradient-text typing-animation border-beam shine-border shimmer-button marquee`; Aceternity `3d-card spotlight-new`. Si el CLI pide sobrescribir `utils.ts`, aceptar.
- [ ] **Step 5:** `App.tsx` temporal que renderiza un `ShimmerButton` y `RetroGrid`; un test trivial `src/lib/tema.test.ts` (`expect(1).toBe(1)`) para comprobar Vitest.
- [ ] **Step 6: Verificar** `npm --prefix web test` → PASS y `npm run build` → crea `web/dist/index.html`; `npm run chat` y `http://localhost:3050` muestra el botón sobre el fondo oscuro.
- [ ] **Step 7: Commit** `web/` (sin `node_modules`/`dist`: agregar `web/dist` al `.gitignore`) — "Andamio del frontend con Tailwind, shadcn y componentes".

### Task 4: Estado de la conversación y cliente de la API

**Files:**
- Create: `web/src/lib/api.ts`, `web/src/lib/conversacion.ts`, `web/src/lib/conversacion.test.ts`, `web/src/lib/ChatProvider.tsx`

**Interfaces:**
- Produces (`api.ts`): tipos `Pasos` (forma exacta de la respuesta de `/api/buscar`, con `resultados[].appid`), `Destacado` (Task 2), y
  `buscar(pregunta: string, filtros: { precioMax?: number; descuentoMin?: number }) → Promise<Pasos>`,
  `responder(idPrompt: string) → Promise<{ respuesta: string; ms: number }>`,
  `juegos() → Promise<Destacado[]>`. Si la respuesta trae `error`, tiran `Error(error)`.
- Produces (`conversacion.ts`):
  ```ts
  type Mensaje = { id: string; quien: "usuario" | "pixel"; texto: string; error?: boolean };
  type Estado = { mensajes: Mensaje[]; pasos: Pasos | null; respuesta: { texto: string; ms: number } | null;
                  fase: "libre" | "buscando" | "respondiendo" };
  type Accion = { tipo: "preguntar"; pregunta: string } | { tipo: "pasos"; pasos: Pasos }
              | { tipo: "respuesta"; texto: string; ms: number } | { tipo: "error"; mensaje: string };
  function reducir(e: Estado, a: Accion): Estado;
  const estadoInicial: Estado;  // un mensaje de Pixel de bienvenida
  function etapaActiva(e: Estado): "reescribir" | "busqueda" | "respuesta" | null;
  ```
- Produces (`ChatProvider.tsx`): `<ChatProvider>` y `useChat() → { estado, enviar(pregunta, filtros), pensando: boolean }`. `enviar` ignora llamadas si `fase !== "libre"`; hace `buscar` → `pasos`; si `idPrompt` es `null` despacha `respuesta` con `"No lo encuentro en los documentos."`; si no, `responder` → `respuesta`; cualquier excepción → `error`.

- [ ] **Step 1: Tests** en `conversacion.test.ts`:
  - `preguntar` agrega mensaje de usuario, `fase: "buscando"`, `pasos` y `respuesta` vuelven a `null`
  - `pasos` guarda los pasos y pasa a `"respondiendo"`
  - `respuesta` agrega mensaje de Pixel con el texto y vuelve a `"libre"`
  - `error` agrega mensaje de Pixel con `error: true` y vuelve a `"libre"` (Review Focus 2)
  - `etapaActiva`: fase `buscando` → `"busqueda"`, `respondiendo` → `"respuesta"`, `libre` → `null`. (`"reescribir"` no se distingue en el servidor: es solo el primer tramo visual dentro de `buscando`, ver Task 8.)
- [ ] **Step 2:** `npm --prefix web test` → FAIL.
- [ ] **Step 3: Implementar** `conversacion.ts`, `api.ts`, `ChatProvider.tsx`.
- [ ] **Step 4: Test del provider sin React**: extraer la orquestación de `enviar` como `async function orquestar(pregunta, filtros, dispatch, api)` en `conversacion.ts` y testear con `api` falsa: con `idPrompt: null` despacha `respuesta` con `"No lo encuentro en los documentos."` y **no** llama a `responder` (Review Focus 3); si `buscar` rechaza, despacha `error`.
- [ ] **Step 5:** `npm --prefix web test` → PASS.
- [ ] **Step 6: Commit** — "Estado único de la conversación y cliente de la API".

### Task 5: Barra, hero y chat principal (arriba de la página)

**Files:**
- Create: `web/src/components/Navbar.tsx`, `Pixel.tsx`, `Chat.tsx`, `Hero.tsx`; Modify: `web/src/App.tsx`, `web/src/main.tsx`

**Interfaces:**
- Consumes: `useChat()` (Task 4), componentes de Task 3.
- Produces: `<Chat variante="hero" | "adentro" />` — misma conversación; `"hero"` con filtros visibles (máx USD, mín %) y sugerencias; `"adentro"` compacto. `<Pixel animo="normal" | "pensando" />` (SVG del diseño, ojos que parpadean; antena que pulsa mientras `pensando`).
- Produces: anclas `#chat`, `#destacados`, `#detras` para la Navbar.

- [ ] **Step 1:** `Pixel.tsx` desde el `<svg aria-label="Pixel, el robot…">` de `Main.dc.html`, con las clases `blink`/`pulse` pasadas a Tailwind/keyframes.
- [ ] **Step 2:** `Navbar.tsx` (logo OFERTAS_RAG, links a las anclas; "Detrás de escena" con badge NUEVO).
- [ ] **Step 3:** `Chat.tsx`: lista de mensajes, input con `Enter` para enviar, botón `ShimmerButton`, marco con `BorderBeam`; deshabilitado mientras `pensando`; mensajes de error en rojo; las respuestas de Pixel muestran el renglón "Fuente:" en `font-mono` gris. Sugerencias (variante hero): las de "Elegí un modo de juego" del diseño, que cargan el texto en el input.
- [ ] **Step 4:** `Hero.tsx`: `RetroGrid` + `Meteors` de fondo, `AnimatedGradientText` en "preguntando.", `TypingAnimation` con `pixel.buscar({ genero: "terror", coop: true, max_usd: 15 })`, Pixel a un lado y `<Chat variante="hero" />` como pieza central.
- [ ] **Step 5:** `App.tsx` envuelto en `<ChatProvider>`: Navbar + Hero.
- [ ] **Step 6: Verificar** con `npm run chat` + `npm run dev` (o build): preguntar "terror para jugar con amigos" → aparece respuesta real con "Fuente:"; con la base apagada (`docker stop rag-udi-db`) aparece el error en el chat y se puede volver a preguntar; volver a `docker start rag-udi-db`.
- [ ] **Step 7: Commit** — "Hero con el chat del RAG".

### Task 6: Juegos destacados con portadas y tráilers

**Files:**
- Create: `web/src/lib/video.ts`, `web/src/lib/video.test.ts`, `web/src/components/Destacados.tsx`, `TarjetaJuego.tsx`

**Interfaces:**
- Consumes: `juegos()` y `Destacado` (Task 4/2).
- Produces: `fuenteDeVideo(d: Destacado) → string | null` (la URL HLS o `null`).

- [ ] **Step 1: Tests** `video.test.ts`: con `trailer: null` → `null`; con `trailer.hls: ""` → `null`; con `hls: "h"` → `"h"`.
- [ ] **Step 2:** `npm --prefix web test` → FAIL; implementar; → PASS.
- [ ] **Step 3:** `TarjetaJuego.tsx` con `3d-card` de Aceternity: `portada` como imagen; al `mouseenter`, si `fuenteDeVideo` no es `null`, crea `<video muted playsInline loop>` con hls.js (o `src` directo si `video.canPlayType("application/vnd.apple.mpegurl")`); si hls.js emite error fatal o no hay tráiler, rota las `capturas` cada 1,5 s (Review Focus 4). Muestra precio (o "Gratis"), precio original tachado y `-N%` en verde si hay descuento; etiqueta de origen ("Más vendido", "Más jugado", "Oferta"); link a `tienda`. Si `!enCorpus`, una marca chica "Pixel todavía no lo conoce".
- [ ] **Step 4:** `Destacados.tsx`: título de sección "Juegos destacados de Steam", `Marquee` con los géneros, grilla responsive (4 columnas a 1280 px). Estados de carga y de error.
- [ ] **Step 5: Verificar** en el navegador: portadas reales, el tráiler arranca al pasar el mouse en un juego con tráiler y uno sin tráiler rota capturas.
- [ ] **Step 6: Commit** — "Juegos destacados con portadas y tráilers reales".

### Task 7: La PC de Pixel vista de frente (sección de abajo)

**Files:**
- Create: `web/src/escena/soportaWebGL.ts`, `web/src/escena/pantalla.ts`, `web/src/escena/Escritorio.tsx`, `web/src/components/ComoPiensa.tsx`, `web/src/components/SeccionPC.tsx`, `web/public/pc-respaldo.png`

**Interfaces:**
- Produces: `soportaWebGL() → boolean`; `dibujarPantalla(g: CanvasRenderingContext2D, t: number, desarme: number): void` (pantalla animada del diseño: "OFERTAS RAG", "PIXEL EN LÍNEA", Pixel, renglones, barra; con `desarme` 0..1 la imagen se parte en cuadrículas que se separan); `<Escritorio desarme={number} />` (escritorio, monitor con la textura de `dibujarPantalla`, parlante, taza y gabinete con vidrio, como `makeScene` del diseño); `<SeccionPC onEntrar={() => void} />`.

- [ ] **Step 1: Test** `soportaWebGL` en Vitest con `document` falso cuyo `getContext` devuelve `null` → `false` (Review Focus 5).
- [ ] **Step 2:** implementar `soportaWebGL.ts`, `pantalla.ts` y `Escritorio.tsx` (r3f + drei `RoundedBox`, `Environment`; luces y materiales del diseño; mouse mueve levemente la cámara como "mové el mouse para mirar alrededor").
- [ ] **Step 3:** `ComoPiensa.tsx`: los 4 pasos cortos del diseño ("Te escucha", "Lo traduce", "Busca en el archivo", "Te responde") con `ShineBorder`.
- [ ] **Step 4:** `SeccionPC.tsx`: `Spotlight` de Aceternity, título "Entrá a la PC de Pixel", texto del diseño, `<Canvas>` con `<Escritorio desarme={0} />` (o `pc-respaldo.png` si `!soportaWebGL()`) y `ShimmerButton` "Ver detrás de escena" que llama a `onEntrar`. `pc-respaldo.png`: captura de la escena renderizada.
- [ ] **Step 5:** `App.tsx`: Hero → Destacados → ComoPiensa → SeccionPC.
- [ ] **Step 6: Verificar** en el navegador: escena de frente, pantalla animada, 60 fps aprox. en la notebook; con WebGL desactivado (Chrome `--disable-webgl`) se ve la imagen y el botón funciona.
- [ ] **Step 7: Commit** — "La PC de Pixel en 3D".

### Task 8: Detrás de escena: pantalla → circuito y paso a paso

**Files:**
- Create: `web/src/lib/entrada.ts`, `web/src/lib/entrada.test.ts`, `web/src/escena/Circuito.tsx`, `web/src/components/PanelPasos.tsx`, `web/src/components/DetrasDeEscena.tsx`; Modify: `App.tsx`

**Interfaces:**
- Consumes: `useChat()`, `etapaActiva` (Task 4), `Escritorio`, `dibujarPantalla` (Task 7).
- Produces: `DURACION_ENTRADA = 2600` (ms) y
  `momentoEntrada(ms: number) → { camara: [number, number, number]; desarme: number; circuito: number; listo: boolean }`:
  0–1200 ms la cámara va de la posición de frente `[0, 1.1, 3.2]` a pegada a la pantalla `[0, 0.82, 0.25]` (ease-in-out); 1200–2000 `desarme` 0→1; 1600–2600 `circuito` 0→1; `listo` desde 2600. Valores fuera de rango se recortan.
- Produces: `<Circuito etapa={"reescribir"|"busqueda"|"respuesta"|null} />`: placa madre con pistas brillantes y tres piezas rotuladas **CPU · Ollama bge-m3**, **SSD · pgvector**, **GPU · Gemini**; un pulso de luz recorre la pista hacia la pieza de la etapa (`"reescribir"` y `"respuesta"` → GPU, `"busqueda"` → CPU y luego SSD).
- Produces: `<PanelPasos />`: con `estado.pasos` muestra las 5 etapas del spec: (0) consulta reescrita (+ aviso si `reescritura.error`), (1) primeros 8 números del vector, `dimensiones`, `msEmbedding`, (2) tabla de `resultados` (sección, similitud con 3 decimales, precio, descuento, útil/descartado, portada chica por `appid` si está en destacados), (3) prompt en `font-mono` desplegable, (4) respuesta y `ms`. Sin pasos: "Preguntale algo a Pixel".

- [ ] **Step 1: Tests** `entrada.test.ts`: `momentoEntrada(0)` → cámara `[0,1.1,3.2]`, `desarme 0`, `listo false`; `momentoEntrada(1200).camara` = `[0,0.82,0.25]`; `momentoEntrada(2000).desarme` = 1; `momentoEntrada(9999)` → `listo true`, `circuito 1`; `momentoEntrada(-5)` igual a `momentoEntrada(0)`.
- [ ] **Step 2:** FAIL → implementar `entrada.ts` → PASS.
- [ ] **Step 3:** `Circuito.tsx` y `PanelPasos.tsx`.
- [ ] **Step 4:** `DetrasDeEscena.tsx`: overlay de pantalla completa (`fixed inset-0`). Fases `"entrando" | "adentro" | "saliendo"`. Entrando: un `<Canvas>` que avanza `momentoEntrada` con `useFrame` (Escritorio con `desarme`, Circuito con opacidad `circuito`); al `listo`, la UI aparece con la animación `emerge` del diseño: encabezado "Dentro de la PC de Pixel", `<Chat variante="adentro" />` a la izquierda, `<PanelPasos />` a la derecha y el Circuito de fondo con `etapa`. Mientras `fase === "buscando"`, la etapa visual es `"reescribir"` los primeros 600 ms y después `"busqueda"`. Botón "Salir de la PC" (y `Escape`) → fundido de 400 ms. Con `prefers-reduced-motion` o sin WebGL: fundido directo a la UI, sin Canvas.
- [ ] **Step 5:** `App.tsx`: estado `adentro: boolean`; `SeccionPC onEntrar` lo activa; Navbar "Detrás de escena" también.
- [ ] **Step 6: Verificar** en el navegador: preguntar arriba, entrar → se ve la misma conversación y los pasos de esa pregunta; preguntar adentro → la luz recorre las piezas y el panel se llena; salir → el chat de arriba muestra también la pregunta hecha adentro; con reduced motion (DevTools → Rendering) entra con fundido.
- [ ] **Step 7: Commit** — "Detrás de escena: entrada pantalla→circuito y paso a paso".

### Task 9: Limpieza y verificación final

**Files:**
- Delete: `chat.html`; Modify: `chat.mjs` (comentario de cabecera), `.gitignore`

- [ ] **Step 1:** borrar `chat.html`; actualizar el comentario de `chat.mjs` (`npm run build` y después `npm run chat`).
- [ ] **Step 2: Verificar todo**: `npm test` PASS; `npm --prefix web test` PASS; `npm run build` sin errores de TypeScript; `npm run chat` y en `http://localhost:3050` recorrer los 5 puntos de "Cómo se verifica" del spec; `curl -X POST http://localhost:3050/api/responder -H "Content-Type: application/json" -d "{\"idPrompt\":\"nope\"}"` → 500 "Esa pregunta ya no está…".
- [ ] **Step 3: Commit** — "Saco chat.html: la web nueva la reemplaza". **Sin push.**
