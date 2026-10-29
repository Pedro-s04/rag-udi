// Extensión Steam: los 100 juegos MÁS JUGADOS de Steam ahora, estén o no en oferta.
// Sirven para contestar "¿el FIFA está en oferta?" con un "no" en vez de "no lo encuentro".
// Escribe:
//   corpus/populares-steam.md  un juego por sección "## Nombre", igual que las ofertas
//   datos/populares.json        sus números (appid, precio, descuento), por nombre
// Los que ya están en datos/juegos.json (las ofertas) se saltean: ya están en el corpus.
//
// Uso: node bajar-populares.mjs      (tarda unos 3 minutos)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { ESPERA, esperar, pedirJSON, detalle, numeros, comoMarkdown } from "./steam.mjs";

// La lista oficial de Steam de los 100 más jugados (por pico de jugadores al mismo tiempo).
const RANKING = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/";

const ofertas = JSON.parse(await readFile("datos/juegos.json", "utf8").catch(() => "{}"));
const yaEstan = new Set(Object.values(ofertas).map(j => j.appid));

const { response: { ranks } } = await pedirJSON(RANKING);
console.log(`Steam devolvió los ${ranks.length} más jugados`);
const hoy = new Date().toLocaleDateString("es-AR");
const secciones = [];
const juegos = {};
let repetidos = 0, sinDatos = 0;

for (const { rank, appid, peak_in_game } of ranks) {
  if (yaEstan.has(appid)) { repetidos++; continue; }
  const j = await detalle(appid, { gratis: true });
  await esperar(ESPERA);
  if (!j) { sinDatos++; continue; }                   // no es un juego, o Steam no da sus datos acá
  const nombre = j.name.trim();
  if (juegos[nombre]) continue;
  const recomendaciones = j.recommendations?.total;
  secciones.push(comoMarkdown(j, {
    hoy,
    resenas: recomendaciones ? [`${recomendaciones.toLocaleString("es-AR")} reseñas de usuarios`] : null,
    extra: [`Popularidad: puesto ${rank} de los 100 juegos más jugados de Steam (pico de ${peak_in_game.toLocaleString("es-AR")} jugadores al mismo tiempo)`],
  }));
  juegos[nombre] = numeros(j);
  const { precio, descuento } = juegos[nombre];
  console.log(`  #${rank}  ${nombre}  (${precio === 0 ? "gratis" : descuento ? `-${descuento}%` : "sin oferta"})`);
}

await mkdir("corpus", { recursive: true });
await mkdir("datos", { recursive: true });
await writeFile("corpus/populares-steam.md", secciones.join("\n\n") + "\n");
await writeFile("datos/populares.json", JSON.stringify(juegos, null, 2));
console.log(`\nListo: ${secciones.length} juegos en corpus/populares-steam.md` +
            ` (${repetidos} ya estaban en las ofertas, ${sinDatos} sin datos en Steam)`);
