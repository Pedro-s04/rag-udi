// Los juegos destacados de la web: los más vendidos de Steam (ahí aparecen los lanzamientos
// importantes), los más jugados y las ofertas más conocidas. Con portadas, capturas y tráiler.
// No toca el corpus: pueden aparecer juegos que Pixel no conoce (la marca enCorpus lo dice).
// Escribe datos/destacados.json, que sirve chat.mjs en /api/juegos.
//
// Uso: node bajar-destacados.mjs [porLista]      (por omisión 12 de cada lista; tarda ~1 minuto)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { PAIS, IDIOMA, TIENDA, ESPERA, esperar, pedirJSON, detalle } from "./steam.mjs";
import { elegirDestacados, fichaDestacado, ofertasPorResenas, urlCaja } from "./destacados.mjs";

const POR_LISTA = Number(process.argv[2] ?? 12);
const leer = async archivo => JSON.parse(await readFile(archivo, "utf8").catch(() => "{}"));
const juegos = await leer("datos/juegos.json");
const ofertas = ofertasPorResenas(await readFile("corpus/ofertas-steam.md", "utf8"), juegos);
const populares = Object.values(await leer("datos/populares.json")).map(j => j.appid);
const enCorpus = new Set([...Object.values(juegos).map(j => j.appid), ...populares]);

// Los más vendidos ahora, solo juegos (category1=998): ahí aparecen los lanzamientos importantes.
// Se piden 50 para que, después de descartar lo que no sirve, queden POR_LISTA.
const { results_html } = await pedirJSON(`${TIENDA}/search/results/?filter=topsellers&category1=998` +
                                         `&start=0&count=50&infinite=1&cc=${PAIS}&l=${IDIOMA}`);
const masVendidos = [...new Set([...results_html.matchAll(/data-ds-appid="(\d+)"/g)].map(m => Number(m[1])))];

const candidatos = elegirDestacados({ masVendidos, populares, ofertas }, Infinity);
const cupo = { "mas-vendido": 0, popular: 0, oferta: 0 };
const destacados = [];

for (const { appid, origen } of candidatos) {
  if (cupo[origen] >= POR_LISTA) continue;
  const j = await detalle(appid, { gratis: true });
  await esperar(ESPERA);
  if (!j) continue;                                  // no es un juego, o Steam no da sus datos acá
  destacados.push(fichaDestacado(j, { origen, enCorpus: enCorpus.has(appid) }));
  cupo[origen]++;
  console.log(`  ${origen.padEnd(11)} ${j.name}${j.movies?.length ? "" : "  (sin tráiler)"}`);
}

// La portada vertical (tipo caja) de todos, en un solo pedido a la API de la tienda.
const entrada = { ids: destacados.map(d => ({ appid: d.appid })), context: { language: IDIOMA, country_code: PAIS.toUpperCase() },
                  data_request: { include_assets: true } };
const { response } = await pedirJSON("https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=" +
                                     encodeURIComponent(JSON.stringify(entrada)));
const assetsDe = new Map((response.store_items ?? []).map(i => [i.appid, i.assets]));
for (const d of destacados) d.caja = urlCaja(assetsDe.get(d.appid));
console.log(`Portadas verticales: ${destacados.filter(d => d.caja).length} de ${destacados.length}`);

await mkdir("datos", { recursive: true });
await writeFile("datos/destacados.json", JSON.stringify(destacados, null, 2));
console.log(`\nListo: ${destacados.length} destacados en datos/destacados.json ` +
            `(${cupo["mas-vendido"]} más vendidos, ${cupo.popular} más jugados, ${cupo.oferta} ofertas)`);
