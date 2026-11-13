import { test } from "node:test";
import assert from "node:assert/strict";
import { pideMasJugados, pideGratis } from "../intencion.mjs";

test("las consultas de 'más jugados' se ordenan por puesto", () => {
  // lo que escribe reescribir.txt, y la pregunta cruda por si Gemini falla
  assert.equal(pideMasJugados("Es el juego más jugado de Steam: el número uno en cantidad de jugadores"), true);
  assert.equal(pideMasJugados("Es uno de los 10 juegos más jugados de Steam, gratis"), true);
  assert.equal(pideMasJugados("el juego mas jugado"), true);
  assert.equal(pideMasJugados("los juegos MÁS JUGADOS"), true);
});

test("el resto de las consultas se busca por significado", () => {
  assert.equal(pideMasJugados("Terror, multijugador, en cooperativo, en línea"), false);
  assert.equal(pideMasJugados("Valheim"), false);
  assert.equal(pideMasJugados("un juego para jugar con amigos"), false);
});

test("gratis", () => {
  assert.equal(pideGratis("Es uno de los 10 juegos más jugados de Steam, gratis"), true);
  assert.equal(pideGratis("los más jugados free-to-play"), true);
  assert.equal(pideGratis("Es el juego más jugado de Steam"), false);
});
