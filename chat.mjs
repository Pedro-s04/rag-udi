// Interfaz de chat para exponer en clase: el mismo RAG de preguntar.mjs,
// pero cada etapa se devuelve por separado para mostrarla paso a paso.
//   node --env-file=.env chat.mjs   ->   http://localhost:3000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { embedding, responder } from "./api.mjs";
import { buscar } from "./buscar.mjs";

const PUERTO = Number(process.env.PUERTO ?? 3000);
// Los prompts se leen en cada pregunta: si los editás, el cambio vale sin reiniciar.
const leerPrompt = archivo => readFile(archivo, "utf8");
const UMBRAL = Number(process.env.UMBRAL ?? 0);

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

// Etapa 0: Gemini pasa la pregunta a las palabras de las fichas de Steam
// (corrige errores, saca el relleno, agrega "multijugador"...). Solo se usa para BUSCAR:
// al modelo que responde le llega la pregunta original.
// Si Gemini falla, se busca con la pregunta tal cual y se avisa.
async function reescribir(pregunta) {
  const t = performance.now();
  try {
    const plantilla = await leerPrompt("reescribir.txt");
    const texto = await responder(plantilla.replace("{{pregunta}}", () => pregunta));
    const consulta = texto.trim().split("\n")[0].replace(/^["“]|["”]$/g, "").trim();
    return { consulta: consulta || pregunta, ms: performance.now() - t };
  } catch (e) {
    return { consulta: pregunta, ms: performance.now() - t, error: mensajeDeError(e) };
  }
}

// Etapas 0 a 3: pregunta -> consulta -> vector -> fragmentos -> prompt. Cada una con su tiempo.
async function buscarPasos({ pregunta, descuentoMin, precioMax }) {
  const reescritura = await reescribir(pregunta);

  let t = performance.now();
  const vector = await embedding(reescritura.consulta);
  const msEmbedding = performance.now() - t;

  const filtros = { descuentoMin, precioMax };
  t = performance.now();
  const resultados = await buscar(vector, 3, filtros);
  const msBusqueda = performance.now() - t;

  const utiles = resultados.filter(r => r.similitud >= UMBRAL);
  const fragmentos = utiles
    .map(r => `--- ${etiqueta(r)} ---\n${r.texto}`)
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
    resultados: resultados.map(r => ({
      seccion: r.seccion?.replace(/^#+\s*/, "") ?? `fragmento ${r.posicion}`,
      fuente: r.fuente,
      similitud: r.similitud,
      precio: r.precio,
      descuento: r.descuento,
      util: r.similitud >= UMBRAL,
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

const numeroOpcional = v => (v === "" || v == null ? undefined : Number(v));

async function leerJSON(req) {
  let cuerpo = "";
  for await (const pedazo of req) cuerpo += pedazo;
  return JSON.parse(cuerpo || "{}");
}

function enviar(res, estado, tipo, cuerpo) {
  res.writeHead(estado, { "Content-Type": tipo });
  res.end(cuerpo);
}

const servidor = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      return enviar(res, 200, "text/html; charset=utf-8", await readFile("chat.html"));
    }
    // Solo JSON: un formulario o un script de otra página no puede mandarlo sin permiso
    // del navegador (CORS), así que otra pestaña no puede usar el chat a tus espaldas.
    if (req.method === "POST" && !req.headers["content-type"]?.startsWith("application/json")) {
      return enviar(res, 415, "application/json", JSON.stringify({ error: "Solo acepto JSON" }));
    }
    if (req.method === "POST" && req.url === "/api/buscar") {
      const { pregunta, descuentoMin, precioMax } = await leerJSON(req);
      if (!pregunta?.trim()) return enviar(res, 400, "application/json", JSON.stringify({ error: "La pregunta está vacía" }));
      const datos = await buscarPasos({
        pregunta: pregunta.trim(),
        descuentoMin: numeroOpcional(descuentoMin),
        precioMax: numeroOpcional(precioMax),
      });
      return enviar(res, 200, "application/json", JSON.stringify(datos));
    }
    if (req.method === "POST" && req.url === "/api/responder") {
      return enviar(res, 200, "application/json", JSON.stringify(await responderPaso(await leerJSON(req))));
    }
    enviar(res, 404, "text/plain; charset=utf-8", "No existe");
  } catch (e) {
    console.error(e);
    enviar(res, 500, "application/json", JSON.stringify({ error: mensajeDeError(e) }));
  }
});

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
