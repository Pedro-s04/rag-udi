// Extensión Steam (no está en la guía): arma el corpus.
// Baja de la tienda de Steam los juegos en oferta más conocidos (los que tienen más reseñas)
// y escribe:
//   corpus/ofertas-steam.md  un juego por sección "## Nombre", con su precio y su descripción
//   datos/juegos.json         los números de cada oferta (appid, precio, descuento), por nombre
//
// Uso: node bajar-steam.mjs [cantidad]      (por omisión, los 150 más conocidos)
// No necesita .env: la tienda de Steam no pide clave.
import { writeFile, mkdir } from "node:fs/promises";
import { PAIS, IDIOMA, ESPERA, TIENDA, esperar, pedirJSON, sinHTML, detalle, numeros, comoMarkdown } from "./steam.mjs";

const CANTIDAD = Number(process.argv[2] ?? 150);

// Cuántas reseñas tiene un juego, sacado del renglón "El 96 % de las 2,095 reseñas...".
const cantidadDeResenas = resenas => Number(resenas?.join(" ").match(/de las ([\d.,]+)\s+rese/)?.[1].replace(/\D/g, "") ?? 0);

// 1. La lista COMPLETA de ofertas, de a 50 por página, ordenada de más a menos reseñas:
//    así los "más conocidos" quedan primeros. De acá sale el resumen de reseñas,
//    que appdetails no trae.
async function listarOfertas() {
  const ofertas = new Map();
  let total = Infinity;
  for (let inicio = 0; inicio < total; inicio += 50) {
    const url = `${TIENDA}/search/results/?query=&start=${inicio}&count=50&specials=1&infinite=1` +
                `&category1=998&cc=${PAIS}&l=${IDIOMA}`;   // 998 = solo juegos
    const { results_html: html, total_count } = await pedirJSON(url);
    total = total_count;
    const filas = html.split(/<a href=/).filter(f => f.includes("data-ds-appid"));
    if (filas.length === 0) break;                          // no hay más ofertas
    for (const fila of filas) {
      const appid = fila.match(/data-ds-appid="(\d+)"/)?.[1];   // los paquetes traen varios: se saltean
      const resenas = fila.match(/data-tooltip-html="([^"]+)"/)?.[1];
      if (appid && !ofertas.has(appid)) {
        ofertas.set(appid, { resenas: resenas ? sinHTML(resenas.replace(/&lt;br&gt;/g, "\n")).split("\n") : null });
      }
    }
    if (ofertas.size % 1000 < 50) console.log(`  lista de ofertas: ${ofertas.size} de ${total}`);
    await esperar(ESPERA);
  }
  return [...ofertas].sort(([, a], [, b]) => cantidadDeResenas(b.resenas) - cantidadDeResenas(a.resenas));
}

console.log(`Buscando los ${CANTIDAD} juegos en oferta más conocidos de Steam...`);
const ofertas = await listarOfertas();
const hoy = new Date().toLocaleDateString("es-AR");
const secciones = [];
const juegos = {};

await mkdir("corpus", { recursive: true });
await mkdir("datos", { recursive: true });
async function guardar() {
  await writeFile("corpus/ofertas-steam.md", secciones.join("\n\n") + "\n");
  await writeFile("datos/juegos.json", JSON.stringify(juegos, null, 2));
}

// 2. Se recorre la lista ordenada hasta juntar CANTIDAD: si uno no sirve, entra el siguiente.
for (const [appid, { resenas }] of ofertas) {
  if (secciones.length >= CANTIDAD) break;
  const j = await detalle(appid);
  await esperar(ESPERA);
  if (!j) continue;                                   // no es un juego, o no tiene precio
  const nombre = j.name.trim();
  if (juegos[nombre]) continue;                       // dos juegos con el mismo nombre: queda el primero
  secciones.push(comoMarkdown(j, { resenas, hoy }));
  juegos[nombre] = numeros(j);
  console.log(`  ${secciones.length}/${CANTIDAD}  ${nombre}  (-${juegos[nombre].descuento}%, ${cantidadDeResenas(resenas)} reseñas)`);
  if (secciones.length % 50 === 0) await guardar();   // si se corta, no se pierde lo bajado
}

await guardar();
console.log(`\nListo: ${secciones.length} juegos en corpus/ofertas-steam.md y datos/juegos.json`);
