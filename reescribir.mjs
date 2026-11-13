// Etapa 0: Gemini pasa la pregunta a las palabras de las fichas de Steam
// (corrige errores, saca el relleno, agrega "multijugador"...). Solo se usa para BUSCAR:
// al modelo que responde le llega la pregunta original.
// La usan chat.mjs y distribucion.mjs, así el umbral se calibra con lo mismo que busca el chat.
import { readFile } from "node:fs/promises";
import { responder } from "./api.mjs";

// Si Gemini falla, devuelve la pregunta tal cual y el error, para buscar igual y avisar.
export async function reescribir(pregunta) {
  const t = performance.now();
  try {
    // se lee en cada pregunta: si editás reescribir.txt, el cambio vale sin reiniciar
    const plantilla = await readFile("reescribir.txt", "utf8");
    const texto = await responder(plantilla.replace("{{pregunta}}", () => pregunta));
    const consulta = texto.trim().split("\n")[0].replace(/^["“]|["”]$/g, "").trim();
    return { consulta: consulta || pregunta, ms: performance.now() - t };
  } catch (error) {
    return { consulta: pregunta, ms: performance.now() - t, error };
  }
}
