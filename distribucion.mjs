import { embeddingsEnLote } from "./api.mjs";
import { buscar } from "./buscar.mjs";
import { db } from "./db.mjs";

// Preguntas cuya respuesta SÍ está en tu corpus: escribilas mirando corpus/ofertas-steam.md.
// Dos con las palabras del texto y dos reformuladas, como las haría alguien que no lo leyó.
const ESTAN = [
  "pegá acá tu pregunta 1",
  "pegá acá tu pregunta 2",
  "pegá acá tu pregunta 3",
  "pegá acá tu pregunta 4",
];

// Preguntas cuya respuesta NO está: tus dos, y tres que sirven para casi cualquier corpus.
// Si alguna de las tres está en el tuyo, cambiala por otra.
const NO_ESTAN = [
  "pegá acá tu pregunta 5",
  "pegá acá tu pregunta 6",
  "cuál es la contraseña del wifi",
  "quién ganó el último mundial",
  "cómo se hace una milanesa",
];
const preguntas = [...ESTAN, ...NO_ESTAN];
const vectores = await embeddingsEnLote(preguntas);   // todas las preguntas, un solo pedido

const filas = [];
for (const [i, p] of preguntas.entries()) {
  const [mejor] = await buscar(vectores[i], 1);
  filas.push({ pregunta: p, esta: i < ESTAN.length, mejor: mejor.similitud });
}
await db.end();

filas.sort((a, b) => b.mejor - a.mejor);
for (const f of filas) {
  console.log(`${f.mejor.toFixed(3)}  ${f.esta ? "[está]   " : "[NO está]"}  ${f.pregunta}`);
}
