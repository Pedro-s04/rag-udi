# Rediseño de la web del RAG de ofertas de Steam

Fecha: 2026-11-11 · Rama: `rediseno-web`

## Para qué

La web es la cara del RAG de ofertas de Steam que se expone en clase. Hoy es
`chat.html`: una página simple que muestra todas las etapas del RAG siempre.
El rediseño tiene dos objetivos:

1. Que el **chat** sea lo principal y se pueda usar de forma normal, como un producto.
2. Que el **paso a paso interno** del RAG quede "detrás de escena", dentro de una PC
   en 3D, y se revele con una animación al hacer click. Es el momento fuerte de la
   exposición.

La referencia visual es el diseño de Claude Design en `rag-diseño/Main.dc.html`
(ver su README: es una maqueta de referencia, no código para copiar).

## Objetivos

- Rehacer toda la web siguiendo el diseño de `rag-diseño/`: estética oscura "gamer",
  la mascota Pixel, colores, tipografías y animaciones.
- Usar componentes reales de la familia 21st.dev en lugar de las imitaciones hechas
  a mano del diseño.
- Mostrar juegos reales del corpus con imágenes y tráilers reales de Steam, en lugar
  de los datos de ejemplo.
- Que el chat use el RAG real (`/api/buscar` + `/api/responder`) tanto fuera como
  dentro de la PC.

## No objetivos

- No se cambia el RAG en sí: ni la búsqueda, ni los prompts, ni la indexación, ni el
  esquema de la base.
- No se despliega a internet: sigue siendo solo local (127.0.0.1), como exige
  `chat.mjs`.
- No hay cuentas, historial persistente ni multiusuario.

## Anti-objetivos (fallaría aunque "funcione")

- Que el chat quede escondido o en segundo plano detrás de efectos visuales.
- Que la animación de entrada a la PC se vea trabada o se rompa al exponer.
- Que se muestren juegos, precios o imágenes inventados.
- Que la web abra una vía para mandarle a Gemini prompts arbitrarios: hay que
  mantener las protecciones del último commit (solo JSON, prompt guardado en el
  servidor bajo un id de un solo uso).

## Estructura de la página (decidido por el usuario)

De arriba hacia abajo:

1. **Barra superior**: logo "OFERTAS_RAG" y links a Chat, Ofertas y Detrás de escena.
2. **Chat (lo principal)**: el hero del diseño, con Pixel y el título, pero con un
   chat funcional en el centro: mensajes, campo de texto y filtros opcionales de
   precio máximo (USD) y descuento mínimo (%). Las ideas rápidas del diseño ("Elegí
   un modo de juego") quedan como sugerencias que cargan una pregunta.
3. **Juegos destacados de Steam**: grilla o carrusel con una selección de unos 30 a
   40 juegos importantes y conocidos (ver "Selección de juegos destacados"): portada
   real, precio actual y, si están en oferta, precio anterior tachado y porcentaje.
   Al pasar el mouse se reproduce el tráiler real del juego.
4. **La PC de Pixel (abajo de todo)**: escena 3D del escritorio vista de frente,
   con el botón **"Ver detrás de escena"**.

La sección "Cómo piensa Pixel" (pipeline) del diseño puede quedar como explicación
breve entre las ofertas y la PC. Lo decide el builder (ver más abajo).

## Detrás de escena (decidido por el usuario: opción C)

- Al inicio, la cámara mira el escritorio **de frente**, con la pantalla del monitor
  animada (Pixel en línea), como en el diseño.
- Al hacer click en "Ver detrás de escena": la cámara avanza hacia el monitor hasta
  que la pantalla llena la vista; la pantalla **se desarma en un circuito**
  (placa madre) y quedamos **dentro de la PC**.
- Adentro se ve el modo "Dentro de la PC de Pixel": el chat a la izquierda y, a la
  derecha, el paso a paso de la pregunta: (0) pregunta reescrita por Gemini,
  (1) vector de bge-m3 (primeros números, 1024 dimensiones, tiempo), (2) búsqueda en
  pgvector (fragmentos, similitud, precio, descuento, si pasan el umbral),
  (3) prompt armado, (4) respuesta de Gemini. Son las etapas que ya devuelve
  `/api/buscar` y `/api/responder`.
- Mientras se procesa una pregunta, una luz recorre las pistas del circuito hacia la
  pieza de cada etapa (Ollama, pgvector, Gemini).
- Un botón "Salir de la PC" vuelve a la página normal con la animación inversa o un
  fundido.
- **La conversación es una sola**: lo que se preguntó afuera aparece adentro, con el
  paso a paso de la última pregunta. Afuera el chat funciona igual, pero no muestra
  los pasos.
- Con `prefers-reduced-motion` se reemplaza la animación por un fundido.

## Decisiones técnicas

Decididas con el usuario:

- **Componentes de 21st.dev sin cuenta**: el registro de 21st.dev ahora pide
  autenticación. Se instalan los mismos componentes desde los registros públicos de
  sus autores originales (Magic UI `https://magicui.design/r/<nombre>.json`,
  Aceternity `https://ui.aceternity.com/registry/<nombre>.json`) con el CLI de shadcn.
  El código es el mismo que publica 21st.dev.
- **Trabajo en la rama `rediseno-web`, sin push** hasta que el usuario lo pida.

Decididas por Claude (el usuario puede corregirlas):

- **Frontend nuevo en `web/`**: React + Vite + TypeScript + Tailwind + shadcn. Es lo
  que requieren esos componentes.
- **3D con three.js mediante react-three-fiber y drei.** No hay componente de
  21st.dev para la PC. Se toma como base la escena del diseño (escritorio, monitor
  con pantalla animada en canvas, gabinete con vidrio) y se agrega el circuito
  interior.
- **Backend**: `chat.mjs` sigue siendo el servidor. Sirve el build de `web/dist` en
  lugar de `chat.html` y suma un endpoint `GET /api/juegos` que devuelve
  `datos/destacados.json`. En desarrollo, Vite hace de proxy de `/api` hacia el puerto de `chat.mjs`
  (`PUERTO`, hoy 3050). `chat.html` se puede borrar al final.
- **`/api/buscar` agrega el `appid`** de cada resultado, para poder mostrar la
  portada del juego en el chat y en el paso a paso.
- **Medios reales de Steam**: un script nuevo, `bajar-destacados.mjs`, arma la
  selección de destacados (ver abajo), pide `appdetails` a Steam para cada uno
  (respetando la espera de `steam.mjs`) y guarda `datos/destacados.json`: nombre,
  appid, precio, precio original, descuento, géneros, `header_image`,
  `capsule_image`, 2 o 3 capturas y el primer tráiler (miniatura y URL `hls_h264`),
  más una marca `enCorpus` que dice si el juego está en el corpus del RAG. Los
  tráilers de Steam vienen en HLS/DASH, no en mp4, así que el reproductor usa
  **hls.js** (Safari lo reproduce nativo). Solo se bajan los destacados, no los 379
  juegos del corpus.
- **Componentes previstos** (equivalencias con el diseño): Retro Grid y Meteors
  (fondo del hero), Animated Gradient Text (título), Typing Animation (línea de
  consola), Border Beam / Shine Border (marco del chat), Shimmer Button (botones
  principales), Marquee (cinta de géneros), 3D Card o equivalente (portadas con
  inclinación), Spotlight (sección de la PC). Si alguno no existe en esos registros,
  se usa el más parecido de los mismos autores.
- **Estilo**: las fuentes y colores del diseño como variables de Tailwind: fondo
  `#05070b`, celeste `#66c0f4`, verde `#beee11`, texto `#c7d5e0`, gris `#6f8296`;
  fuentes Chakra Petch (títulos), Inter (texto), JetBrains Mono (código).
- **Responsive**: se tiene que ver bien en una notebook con proyector (1280×720 o
  más). En celular el chat tiene que funcionar; la escena 3D puede simplificarse.

## Selección de juegos destacados (decidido con el usuario)

- El usuario quiere solo juegos importantes, conocidos o lanzamientos recientes, no
  todo Steam.
- Fuentes: **los más vendidos de Steam** (`/api/featuredcategories`, `top_sellers`,
  sin hardware como Steam Deck ni DLC), que es donde aparecen los lanzamientos
  importantes (en noviembre de 2026: Call of Duty: Modern Warfare 4, Football
  Manager 27, Phantom Blade Zero…); **los más jugados** (`datos/populares.json`); y
  **las ofertas más conocidas** del corpus (por cantidad de reseñas).
- **Pueden aparecer juegos que no están en el corpus** del RAG: el usuario lo aceptó.
  No se vuelve a indexar. Si alguien pregunta por ellos, Pixel puede contestar "No lo
  encuentro en los documentos". La tarjeta puede indicar si el juego está o no en el
  catálogo de Pixel (lo decide el builder).
- Todos los datos salen de Steam: no se inventan juegos. **GTA 6 no está en Steam**
  (salió solo para consolas), así que no se puede mostrar con datos reales; si
  aparece en Steam más adelante, entra solo por la lista de más vendidos.

## Detalles resueltos por Claude

- **Scripts**: `npm run build` (compila `web/`) y `npm run chat` (servidor). Si falta
  `web/dist`, `chat.mjs` avisa que hay que correr `npm run build`. `npm run dev`
  levanta Vite con proxy, para desarrollo.
- **Pixel**: se reutiliza el SVG del robot de `rag-diseño/Main.dc.html` como componente.
- **`datos/destacados.json` se commitea**, igual que `datos/juegos.json`.
- **`rag-diseño/` no se commitea** salvo que el usuario lo pida: es su export de
  referencia.

## Lo que queda a criterio del builder

- Si se mantiene la sección "Cómo piensa Pixel" y cómo se ve.
- Grilla o carrusel para las ofertas, cuántos juegos se muestran y si hay filtro o
  búsqueda en esa sección.
- La forma exacta del circuito interior y de la transición pantalla → circuito,
  siempre que cumpla lo descrito.
- La organización interna de componentes y el manejo de estado.

## Cómo se verifica

- `npm run chat` levanta todo y la web carga en `http://localhost:3050`.
- Una pregunta en el chat de arriba devuelve la respuesta real de Gemini.
- Al entrar a la PC se ve la animación C y el paso a paso de esa misma pregunta.
- Las ofertas muestran imágenes reales y el tráiler se reproduce al pasar el mouse.
- `/api/responder` sigue rechazando ids desconocidos y los POST que no son JSON.
