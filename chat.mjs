// Interfaz de chat para exponer en clase: el mismo RAG de preguntar.mjs,
// pero cada etapa se devuelve por separado para mostrarla paso a paso.
//   npm run build   (compila la web de web/)
//   npm run chat    ->   http://localhost:PUERTO
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { embedding, responder } from "./api.mjs";
import { buscar } from "./buscar.mjs";
import { reescribir } from "./reescribir.mjs";
import { pideMasJugados, pideGratis } from "./intencion.mjs";
import { crearServidor } from "./servidor.mjs";

const PUERTO = Number(process.env.PUERTO ?? 3000);
// Los prompts se leen en cada pregunta: si los editás, el cambio vale sin reiniciar.
const leerPrompt = archivo => readFile(archivo, "utf8");
const UMBRAL = Number(process.env.UMBRAL ?? 0);
// Cuántos fragmentos se traen. La guía usa 3, pero la reescritura de Gemini varía un poco cada
// vez y a veces deja los mejores juegos 4.º o 5.º. Con 8, el modelo tiene de dónde elegir las
// TRES recomendaciones que pide el prompt: con 5, para "terror" llegaban solo 2 juegos de terror
// de verdad (R.E.P.O., Dead by Daylight y 7 Days to Die quedaban 6.º a 8.º).
const K = 8;

// Los prompts armados quedan acá, en el servidor, bajo un id al azar: la página solo
// devuelve el id. Así nadie puede usar /api/responder para mandarle a Gemini lo que quiera
// con tu API_KEY.
const PROMPTS_GUARDADOS = new Map();
function guardarPrompt(prompt) {
  const id = randomUUID();
  PROMPTS_GUARDADOS.set(id, prompt);
  if (PROMPTS_GUARDADOS.size > 50) PROMPTS_GUARDADOS.delete(PROMPTS_GUARDADOS.keys().next().value);
  return id;
}

// la etiqueta con la que se cita cada fragmento, igual que en preguntar.mjs
const etiqueta = r => `${r.fuente} · ${r.seccion ?? `fragmento ${r.posicion}`}`;

// Etapas 0 a 3: pregunta -> consulta -> vector -> fragmentos -> prompt. Cada una con su tiempo.
// La etapa 0 (reescribir) está en reescribir.mjs. Si Gemini falla, se busca con la pregunta
// tal cual y se avisa en pantalla.
async function buscarPasos({ pregunta, descuentoMin, precioMax }) {
  // descuentoMin y precioMax llegan de la web; "gratis" en una pregunta de más jugados pone precioMax en 0
  const reescritura = await reescribir(pregunta);
  if (reescritura.error) reescritura.error = mensajeDeError(reescritura.error);

  let t = performance.now();
  const vector = await embedding(reescritura.consulta);
  const msEmbedding = performance.now() - t;

  // "el más jugado" es un número: lo ordena la base por puesto, no la búsqueda por significado.
  // Ahí no se aplica el umbral, porque los juegos no se eligieron por parecido sino por el dato.
  const porPuesto = pideMasJugados(reescritura.consulta);
  if (porPuesto && precioMax == null && pideGratis(reescritura.consulta)) precioMax = 0;
  const filtros = { descuentoMin, precioMax };
  const esUtil = r => porPuesto || r.similitud >= UMBRAL;
  t = performance.now();
  const resultados = await buscar(vector, K, { ...filtros, porPuesto });
  const msBusqueda = performance.now() - t;

  const utiles = resultados.filter(esUtil);
  const fragmentos = utiles
    .map(r => `--- ${etiqueta(r)} ---\n` +
              (r.puesto ? `(Puesto ${r.puesto} de los 100 juegos más jugados de Steam)\n` : "") +
              r.texto)
    .join("\n\n");
  const prompt = utiles.length === 0 ? null : (await leerPrompt("prompt.txt"))
    .replace("{{fragmentos}}", () => fragmentos)
    .replace("{{pregunta}}", () => pregunta);

  return {
    reescritura,
    vector: vector.slice(0, 8),
    dimensiones: vector.length,
    msEmbedding,
    filtros,
    umbral: UMBRAL,
    k: K,
    orden: porPuesto ? "puesto" : "distancia",
    resultados: resultados.map(r => ({
      seccion: r.seccion?.replace(/^#+\s*/, "") ?? `fragmento ${r.posicion}`,
      fuente: r.fuente,
      appid: r.appid,
      similitud: r.similitud,
      precio: r.precio,
      descuento: r.descuento,
      puesto: r.puesto,
      util: esUtil(r),
    })),
    msBusqueda,
    prompt,
    idPrompt: prompt && guardarPrompt(prompt),
  };
}

// Etapa 4: el prompt armado va a Gemini. Solo los que armó /api/buscar, y una vez cada uno.
async function responderPaso({ idPrompt }) {
  const prompt = PROMPTS_GUARDADOS.get(idPrompt);
  if (!prompt) throw new Error("Esa pregunta ya no está: volvé a hacerla.");
  PROMPTS_GUARDADOS.delete(idPrompt);
  const t = performance.now();
  const respuesta = await responder(prompt);
  return { respuesta, ms: performance.now() - t };
}

// Los errores de conexión, contados en criollo para que se entiendan en pantalla.
function mensajeDeError(e) {
  const codigo = e.code ?? e.errors?.[0]?.code;
  if (codigo === "ECONNREFUSED") return "No se puede conectar a la base. ¿Corriste docker start rag-udi-db?";
  if (/relation "fragmentos" does not exist/.test(e.message)) {
    return "La tabla fragmentos no existe. Corré crear-tabla.mjs e indexar.mjs.";
  }
  return e.message;
}

const leerJuegos = async () => JSON.parse(await readFile("datos/destacados.json", "utf8").catch(() => "[]"));

const servidor = crearServidor({ buscarPasos, responderPaso, mensajeDeError, dirWeb: "web/dist", leerJuegos });

servidor.on("error", e => {
  if (e.code === "EADDRINUSE") {
    console.error(`El puerto ${PUERTO} está ocupado. Probá con PUERTO=3001 en el .env.`);
    process.exit(1);
  }
  throw e;
});

// Solo desde esta compu (127.0.0.1): nadie del mismo WiFi puede entrar y gastar tu API_KEY.
servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`Chat listo en http://localhost:${PUERTO}`);
  if (!process.env.UMBRAL) console.log("(sin UMBRAL en el .env: no se descarta ningún fragmento)");
});
