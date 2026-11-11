// El servidor HTTP del chat: sirve la web compilada (web/dist) y la API del RAG.
// Las etapas del RAG se reciben de afuera (chat.mjs), así se puede probar sin Ollama ni Gemini.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

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
const enviarJSON = (res, estado, datos) => enviar(res, estado, "application/json", JSON.stringify(datos));

// Un archivo de la web. Nunca sale de dirWeb: "/../.env" da 404.
async function servirArchivo(res, dirWeb, pathname) {
  const raiz = path.resolve(dirWeb);
  let relativo;
  try { relativo = decodeURIComponent(pathname); } catch { return enviar(res, 404, "text/plain; charset=utf-8", "No existe"); }
  const archivo = path.resolve(raiz, "." + (relativo === "/" ? "/index.html" : relativo));
  if (!archivo.startsWith(raiz + path.sep)) return enviar(res, 404, "text/plain; charset=utf-8", "No existe");
  try {
    const contenido = await readFile(archivo);
    return enviar(res, 200, TIPOS[path.extname(archivo)] ?? "application/octet-stream", contenido);
  } catch {
    if (relativo === "/") {
      return enviar(res, 503, "text/plain; charset=utf-8", "Falta compilar la web: corré npm run build y reiniciá el chat.");
    }
    return enviar(res, 404, "text/plain; charset=utf-8", "No existe");
  }
}

export function crearServidor({ buscarPasos, responderPaso, mensajeDeError, dirWeb, leerJuegos }) {
  return createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, "http://localhost");
      // Solo JSON: un formulario o un script de otra página no puede mandarlo sin permiso
      // del navegador (CORS), así que otra pestaña no puede usar el chat a tus espaldas.
      if (req.method === "POST" && !req.headers["content-type"]?.startsWith("application/json")) {
        return enviarJSON(res, 415, { error: "Solo acepto JSON" });
      }
      if (req.method === "POST" && pathname === "/api/buscar") {
        const { pregunta, descuentoMin, precioMax } = await leerJSON(req);
        if (!pregunta?.trim()) return enviarJSON(res, 400, { error: "La pregunta está vacía" });
        return enviarJSON(res, 200, await buscarPasos({
          pregunta: pregunta.trim(),
          descuentoMin: numeroOpcional(descuentoMin),
          precioMax: numeroOpcional(precioMax),
        }));
      }
      if (req.method === "POST" && pathname === "/api/responder") {
        return enviarJSON(res, 200, await responderPaso(await leerJSON(req)));
      }
      if (req.method === "GET" && pathname === "/api/juegos") {
        return enviarJSON(res, 200, await leerJuegos());
      }
      if (req.method === "GET" && !req.url.startsWith("/api/")) {
        // la ruta cruda: URL() ya resolvió los "..", y acá hay que verlos para rechazarlos
        return servirArchivo(res, dirWeb, req.url.split("?")[0]);
      }
      enviar(res, 404, "text/plain; charset=utf-8", "No existe");
    } catch (e) {
      console.error(e);
      enviarJSON(res, 500, { error: mensajeDeError(e) });
    }
  });
}
