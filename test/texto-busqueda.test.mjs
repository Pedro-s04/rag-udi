import { test } from "node:test";
import assert from "node:assert/strict";
import { textoBusqueda } from "../texto-busqueda.mjs";

const datos = [
  "Precio al 12/11/2026: USD 4.99. No está en oferta: sin descuento",
  "Géneros: Acción, Indie",
  "Modo de juego: para jugar con amigos, multijugador (en cooperativo)",
  "Características: Un jugador, Multijugador, Logros de Steam, Steam Cloud",
  "Tienda: https://store.steampowered.com/app/1",
].join("\n");

test("busca con nombre, géneros y la descripción corta: sin precio, características ni tienda", () => {
  const ficha = `## Juego de Miedo\n\n${datos}\n\nUn juego de terror cooperativo.\n\nLa descripción larga, con muchos detalles.`;
  assert.equal(textoBusqueda(ficha), "Juego de Miedo\nGéneros: Acción, Indie\nUn juego de terror cooperativo.");
});

test("sin descripción corta, usa las dos primeras oraciones de la larga", () => {
  const ficha = `## Juego\n\n${datos}\n\nPrimera oración. Segunda oración! Tercera oración.`;
  assert.equal(textoBusqueda(ficha), "Juego\nGéneros: Acción, Indie\nPrimera oración. Segunda oración!");
});

test("saltea el aviso de compras dentro del juego", () => {
  const ficha = `## Juego\n\n${datos}\n\nLa corta.\n\nEste juego incluye la compra opcional en el juego de divisa virtual.`;
  assert.equal(textoBusqueda(ficha), "Juego\nGéneros: Acción, Indie\nLa corta.");
});

test("acepta saltos de línea de Windows", () => {
  const ficha = `## Juego\n\n${datos}\n\nLa corta.\n\nLa larga.`.replace(/\n/g, "\r\n");
  assert.equal(textoBusqueda(ficha), "Juego\nGéneros: Acción, Indie\nLa corta.");
});

test("un texto que no es una ficha de juego se busca entero", () => {
  assert.equal(textoBusqueda("Artículo 1. Un reglamento cualquiera."), "Artículo 1. Un reglamento cualquiera.");
});
