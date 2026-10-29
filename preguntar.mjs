import { readFile } from "node:fs/promises";
import { embedding, responder } from "./api.mjs";
import { buscar } from "./buscar.mjs";
import { db } from "./db.mjs";

const PLANTILLA = await readFile("prompt.txt", "utf8");
const UMBRAL = Number(process.env.UMBRAL ?? 0);
if (!process.env.UMBRAL) console.log("(sin UMBRAL en el .env: no se descarta ningún fragmento)");

// Extensión Steam: --descuento-min 50 y --precio-max 5 filtran por los números de la oferta.
const args = process.argv.slice(2);
const opcion = nombre => {
  const i = args.indexOf(nombre);
  return i === -1 ? undefined : Number(args[i + 1]);
};
const filtros = { descuentoMin: opcion("--descuento-min"), precioMax: opcion("--precio-max") };
// la pregunta es el primer argumento que no es una opción ni el número de una opción
const CON_VALOR = ["--descuento-min", "--precio-max"];
const pregunta = args.find((a, i) => !a.startsWith("--") && !CON_VALOR.includes(args[i - 1]));
if (!pregunta) {
  console.log('Uso: node --env-file=.env preguntar.mjs "tu pregunta" [--descuento-min 50] [--precio-max 5] [--sin-modelo]');
  process.exit(1);
}

const vectorPregunta = await embedding(pregunta);
const resultados = await buscar(vectorPregunta, 3, filtros);
await db.end();

// la etiqueta con la que se cita cada fragmento: archivo y sección
const etiqueta = r => `${r.fuente} · ${r.seccion ?? `fragmento ${r.posicion}`}`;
const oferta = r => r.precio == null ? "" : `  (USD ${r.precio.toFixed(2)}, -${r.descuento}%)`;

console.log("\nFRAGMENTOS RECUPERADOS");
for (const r of resultados) {
  const marca = r.similitud >= UMBRAL ? "  " : "✗ ";
  console.log(`  ${marca}${r.similitud.toFixed(3)}  ${etiqueta(r)}${oferta(r)}`);
}

const utiles = resultados.filter(r => r.similitud >= UMBRAL);
if (utiles.length === 0) {
  console.log("\nRESPUESTA");
  console.log("No lo encuentro en los documentos.");
  console.log(`(ningún fragmento llegó al umbral de ${UMBRAL}: no se llamó al modelo)`);
  process.exit(0);
}

const fragmentos = utiles
  .map(r => `--- ${etiqueta(r)} ---\n${r.texto}`)
  .join("\n\n");
const prompt = PLANTILLA
  .replace("{{fragmentos}}", fragmentos)
  .replace("{{pregunta}}", pregunta);

// con --sin-modelo solo muestra la búsqueda, sin gastar la llamada al modelo
if (args.includes("--sin-modelo")) process.exit(0);

console.log("\nRESPUESTA");
console.log(await responder(prompt));
