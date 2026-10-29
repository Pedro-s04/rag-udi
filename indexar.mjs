import { readFile, readdir } from "node:fs/promises";
import { trocear, trocearPorMarca } from "./trocear.mjs";
import { embeddingsEnLote, pedidos } from "./api.mjs";
import { agrupar } from "./lotes.mjs";
import { db, comoVector } from "./db.mjs";
import { MARCA } from "./marca.mjs";

const TAMANO_LOTE = 32;   // Ollama no tiene el tope de 100 de Google, pero corre en tu compu

// Extensión Steam: precio, descuento y appid de cada juego, por nombre: los de las ofertas
// (bajar-steam.mjs) y los más jugados (bajar-populares.mjs, si se corrió).
// La sección de cada fragmento es el título "## Nombre": se le sacan los # para buscarlo.
const leerJuegos = async archivo => JSON.parse(await readFile(archivo, "utf8").catch(() => "{}"));
const juegos = { ...await leerJuegos("datos/populares.json"), ...await leerJuegos("datos/juegos.json") };
const datosDe = seccion => juegos[seccion?.replace(/^#+\s*/, "")] ?? {};

const archivos = (await readdir("corpus")).filter(a => /\.(txt|md)$/i.test(a));
if (archivos.length === 0) throw new Error("No hay archivos .txt ni .md en la carpeta corpus");
console.time("tiempo total");

let total = 0;
for (const archivo of archivos) {
  const texto = await readFile(`corpus/${archivo}`, "utf8");
  const fragmentos = MARCA ? trocearPorMarca(texto, MARCA) : trocear(texto, 1000, 150);
  const lotes = agrupar(fragmentos, TAMANO_LOTE);
  console.log(`${archivo}: ${fragmentos.length} fragmentos en ${lotes.length} lote(s)`);

  for (const lote of lotes) {
    const vectores = await embeddingsEnLote(lote.map(f => f.texto));
    for (let i = 0; i < lote.length; i++) {
      const { appid = null, precio = null, descuento = null } = datosDe(lote[i].seccion);
      await db.query(
        `INSERT INTO fragmentos (fuente, seccion, posicion, texto, embedding, appid, precio, descuento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [archivo, lote[i].seccion ?? null, lote[i].id, lote[i].texto, comoVector(vectores[i]),
         appid, precio, descuento],
      );
    }
    total += lote.length;
  }
}

console.timeEnd("tiempo total");
console.log(`Pedidos a Ollama: ${pedidos}. Fragmentos guardados: ${total}.`);
await db.end();
