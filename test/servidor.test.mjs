import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { request } from "node:http";
import { crearServidor } from "../servidor.mjs";

let base, servidor, sinWeb, recibido;
const juegosFalsos = [{ appid: 1, nombre: "Uno" }];

async function levantar(dirWeb) {
  const s = crearServidor({
    buscarPasos: async args => { recibido = args; return { ok: true }; },
    responderPaso: async () => { throw new Error("x"); },
    mensajeDeError: e => e.message,
    dirWeb,
    leerJuegos: async () => juegosFalsos,
  });
  await new Promise(r => s.listen(0, "127.0.0.1", r));
  return s;
}

// Pedido HTTP crudo: fetch normaliza "/../" y no deja probar el escape de carpeta.
function pedir(s, metodo, ruta, { tipo, cuerpo } = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port: s.address().port, method: metodo, path: ruta,
      headers: tipo ? { "Content-Type": tipo } : {} }, res => {
      let datos = "";
      res.on("data", d => datos += d);
      res.on("end", () => resolve({ estado: res.statusCode, tipo: res.headers["content-type"] ?? "", cuerpo: datos }));
    });
    req.on("error", reject);
    req.end(cuerpo);
  });
}

before(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "rag-web-"));
  base = path.join(dir, "dist");
  await mkdir(path.join(base, "assets"), { recursive: true });
  await writeFile(path.join(base, "index.html"), "<h1>hola</h1>");
  await writeFile(path.join(base, "assets", "a.js"), "console.log(1)");
  await writeFile(path.join(dir, ".env"), "API_KEY=secreta");
  servidor = await levantar(base);
  sinWeb = await levantar(path.join(dir, "vacia"));
});
after(() => { servidor.close(); sinWeb.close(); });

test("GET / sirve index.html", async () => {
  const r = await pedir(servidor, "GET", "/");
  assert.equal(r.estado, 200);
  assert.match(r.tipo, /^text\/html/);
  assert.equal(r.cuerpo, "<h1>hola</h1>");
});

test("GET /assets/a.js sirve JavaScript", async () => {
  const r = await pedir(servidor, "GET", "/assets/a.js");
  assert.equal(r.estado, 200);
  assert.match(r.tipo, /^text\/javascript/);
});

test("no se puede salir de la carpeta web", async () => {
  for (const ruta of ["/../.env", "/%2e%2e/.env", "/assets/../../.env"]) {
    const r = await pedir(servidor, "GET", ruta);
    assert.equal(r.estado, 404, ruta);
    assert.doesNotMatch(r.cuerpo, /secreta/);
  }
});

test("GET /api/juegos devuelve los destacados", async () => {
  const r = await pedir(servidor, "GET", "/api/juegos");
  assert.equal(r.estado, 200);
  assert.deepEqual(JSON.parse(r.cuerpo), juegosFalsos);
});

test("POST que no es JSON → 415", async () => {
  const r = await pedir(servidor, "POST", "/api/buscar", { tipo: "text/plain", cuerpo: "hola" });
  assert.equal(r.estado, 415);
});

test("pregunta vacía → 400", async () => {
  const r = await pedir(servidor, "POST", "/api/buscar", { tipo: "application/json", cuerpo: '{"pregunta":"  "}' });
  assert.equal(r.estado, 400);
});

test("filtros vacíos llegan como undefined", async () => {
  const r = await pedir(servidor, "POST", "/api/buscar",
    { tipo: "application/json", cuerpo: '{"pregunta":"hola","precioMax":""}' });
  assert.equal(r.estado, 200);
  assert.deepEqual(recibido, { pregunta: "hola", descuentoMin: undefined, precioMax: undefined });
});

test("error en /api/responder → 500 con el mensaje", async () => {
  const r = await pedir(servidor, "POST", "/api/responder", { tipo: "application/json", cuerpo: '{"idPrompt":"a"}' });
  assert.equal(r.estado, 500);
  assert.deepEqual(JSON.parse(r.cuerpo), { error: "x" });
});

test("sin build, GET / avisa que falta npm run build", async () => {
  const r = await pedir(sinWeb, "GET", "/");
  assert.equal(r.estado, 503);
  assert.match(r.cuerpo, /npm run build/);
});
