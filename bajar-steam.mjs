// Extensión Steam (no está en la guía): arma el corpus.
// Baja de la tienda de Steam los juegos que están en oferta y escribe:
//   corpus/ofertas-steam.md  un juego por sección "## Nombre", con su precio y su descripción
//   datos/juegos.json         los números de cada oferta (appid, precio, descuento), por nombre
//
// Uso: node bajar-steam.mjs [cantidad]      (por omisión, 150 juegos)
// No necesita .env: la tienda de Steam no pide clave.
import { writeFile, mkdir } from "node:fs/promises";

const CANTIDAD = Number(process.argv[2] ?? 150);
const PAIS = "ar";            // Argentina: Steam cobra en dólares
const IDIOMA = "spanish";
const ESPERA = 1500;          // milisegundos entre pedidos: Steam corta si le pedís muy rápido
const TIENDA = "https://store.steampowered.com";

const esperar = ms => new Promise(r => setTimeout(r, ms));

// Pide una URL y devuelve el JSON. Si Steam dice "pará un poco" (429), espera y reintenta.
async function pedirJSON(url, intento = 1) {
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (res.status === 429 && intento <= 3) {
    console.log(`  (Steam pide que espere: ${30 * intento} segundos)`);
    await esperar(30000 * intento);
    return pedirJSON(url, intento + 1);
  }
  if (!res.ok) throw new Error(`Steam respondió ${res.status} en ${url}`);
  return res.json();
}

// Saca el texto de un pedazo de HTML: cada bloque en su renglón, sin etiquetas.
function sinHTML(html) {
  return html
    .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .split("\n").map(r => r.replace(/\s+/g, " ").trim()).filter(Boolean)
    .join("\n");
}

// 1. La lista de ofertas: de a 50 por página, hasta juntar CANTIDAD juegos.
//    De acá sale el resumen de reseñas, que appdetails no trae.
async function listarOfertas() {
  const ofertas = new Map();
  for (let inicio = 0; ofertas.size < CANTIDAD; inicio += 50) {
    const url = `${TIENDA}/search/results/?query=&start=${inicio}&count=50&specials=1&infinite=1` +
                `&category1=998&cc=${PAIS}&l=${IDIOMA}`;   // 998 = solo juegos
    const { results_html: html } = await pedirJSON(url);
    const filas = html.split(/<a href=/).filter(f => f.includes("data-ds-appid"));
    if (filas.length === 0) break;                          // no hay más ofertas
    for (const fila of filas) {
      const appid = fila.match(/data-ds-appid="(\d+)"/)?.[1];   // los paquetes traen varios: se saltean
      const resenas = fila.match(/data-tooltip-html="([^"]+)"/)?.[1];
      if (appid && !ofertas.has(appid)) {
        ofertas.set(appid, { resenas: resenas ? sinHTML(resenas.replace(/&lt;br&gt;/g, "\n")).split("\n") : null });
      }
    }
    console.log(`  lista de ofertas: ${ofertas.size} juegos`);
    await esperar(ESPERA);
  }
  return [...ofertas].slice(0, CANTIDAD);
}

// 2. El detalle de cada juego: descripción, géneros, características y precio.
async function detalle(appid) {
  const url = `${TIENDA}/api/appdetails?appids=${appid}&cc=${PAIS}&l=${IDIOMA}`;
  const datos = (await pedirJSON(url))[appid];
  if (!datos?.success || datos.data.type !== "game" || !datos.data.price_overview) return null;
  return datos.data;
}

// 3. Cada juego como una sección de Markdown.
function comoMarkdown(j, resenas, hoy) {
  const p = j.price_overview;
  // cortada para que cada juego entre en un fragmento de 2000 caracteres con su precio
  const descripcion = sinHTML(j.about_the_game || j.short_description || "").slice(0, 800);
  const renglones = [
    `Precio al ${hoy}: USD ${(p.final / 100).toFixed(2)} (antes USD ${(p.initial / 100).toFixed(2)}), ${p.discount_percent}% de descuento`,
    `Géneros: ${(j.genres ?? []).map(g => g.description).join(", ") || "sin datos"}`,
    `Características: ${(j.categories ?? []).map(c => c.description).filter(c => !c.startsWith("#")).join(", ") || "sin datos"}`,
    resenas && `Reseñas: ${resenas[0]}. ${resenas[1] ?? ""}`,
    `Desarrollador: ${(j.developers ?? []).join(", ") || "sin datos"} · Lanzamiento: ${j.release_date?.date ?? "sin datos"}`,
    `Tienda: ${TIENDA}/app/${j.steam_appid}`,
  ].filter(Boolean);
  return `## ${j.name.trim()}\n\n${renglones.join("\n")}\n\n${j.short_description ? sinHTML(j.short_description) + "\n\n" : ""}${descripcion}`;
}

console.log(`Buscando ${CANTIDAD} juegos en oferta en Steam...`);
const ofertas = await listarOfertas();
const hoy = new Date().toLocaleDateString("es-AR");
const secciones = [];
const juegos = {};

for (const [n, [appid, { resenas }]] of ofertas.entries()) {
  const j = await detalle(appid);
  await esperar(ESPERA);
  if (!j) continue;                                   // no es un juego, o no tiene precio
  const nombre = j.name.trim();
  if (juegos[nombre]) continue;                       // dos juegos con el mismo nombre: queda el primero
  secciones.push(comoMarkdown(j, resenas, hoy));
  juegos[nombre] = {
    appid: j.steam_appid,
    precio: j.price_overview.final / 100,
    precioOriginal: j.price_overview.initial / 100,
    descuento: j.price_overview.discount_percent,
  };
  console.log(`  ${n + 1}/${ofertas.length}  ${nombre}  (-${j.price_overview.discount_percent}%)`);
}

await mkdir("corpus", { recursive: true });
await mkdir("datos", { recursive: true });
await writeFile("corpus/ofertas-steam.md", secciones.join("\n\n") + "\n");
await writeFile("datos/juegos.json", JSON.stringify(juegos, null, 2));
console.log(`\nListo: ${secciones.length} juegos en corpus/ofertas-steam.md y datos/juegos.json`);
