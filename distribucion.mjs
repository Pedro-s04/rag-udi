import { embeddingsEnLote } from "./api.mjs";
import { buscar } from "./buscar.mjs";
import { reescribir } from "./reescribir.mjs";
import { db } from "./db.mjs";

// Preguntas cuya respuesta SÍ está en el corpus (comprobadas a mano en corpus/).
// Dos con las palabras de las fichas y dos reformuladas, como las haría alguien que no las leyó.
const ESTAN = [
  "¿Valheim está en oferta?",                      // ofertas · Valheim: USD 13.49, 10%
  "¿Cuánto cuesta Stardew Valley?",                // populares · Stardew Valley: USD 4.99, sin oferta
  "busco algo de tiros con muchas armas para jugar con amigos que esté casi regalado",  // Borderlands 2
  "quiero un juego de manejar camiones",           // Euro Truck Simulator 2 / American Truck Simulator
];

// Preguntas cuya respuesta NO está: dos del tema (juegos que no aparecen en el corpus)
// y tres que sirven para casi cualquier corpus.
const NO_ESTAN = [
  "¿Hollow Knight está en oferta?",
  "¿Cuándo sale GTA 6?",
  "cuál es la contraseña del wifi",
  "quién ganó el último mundial",
  "cómo se hace una milanesa",
];
const preguntas = [...ESTAN, ...NO_ESTAN];

// El chat no busca con la pregunta tal cual: primero Gemini la reescribe (reescribir.mjs).
// Se miden las dos, porque el umbral tiene que servir para lo que de verdad se busca.
const consultas = [];
for (const p of preguntas) {
  const { consulta, error } = await reescribir(p);   // un pedido a Gemini por pregunta
  if (error) console.log(`  (no se pudo reescribir "${p}": ${error.message})`);
  consultas.push(consulta);
}
const vectores = await embeddingsEnLote([...preguntas, ...consultas]);   // todo en un solo pedido

const filas = [];
for (const [i, p] of preguntas.entries()) {
  const [tal] = await buscar(vectores[i], 1);
  const [reescrita] = await buscar(vectores[preguntas.length + i], 1);
  filas.push({ pregunta: p, consulta: consultas[i], esta: i < ESTAN.length, tal, reescrita });
}
await db.end();

// ordenadas por la nota de la reescrita: es la que usa el chat
filas.sort((a, b) => b.reescrita.similitud - a.reescrita.similitud);
console.log("reescrita  tal cual");
for (const f of filas) {
  console.log(`  ${f.reescrita.similitud.toFixed(3)}    ${f.tal.similitud.toFixed(3)}   ` +
              `${f.esta ? "[está]   " : "[NO está]"}  ${f.pregunta}`);
  console.log(`                      consulta: «${f.consulta}» → ${f.reescrita.seccion ?? "sin sección"}`);
}
