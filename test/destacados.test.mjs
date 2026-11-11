import { test } from "node:test";
import assert from "node:assert/strict";
import { elegirDestacados, fichaDestacado, ofertasPorResenas, urlCaja } from "../destacados.mjs";

test("arma la URL de la portada vertical (tipo caja) desde los assets de la tienda", () => {
  const assets = { asset_url_format: "steam/apps/10/${FILENAME}?t=5", library_capsule_2x: "abc/library_capsule_2x.jpg", library_capsule: "abc/library_capsule.jpg" };
  assert.equal(urlCaja(assets), "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/abc/library_capsule_2x.jpg?t=5");
  assert.equal(urlCaja({ ...assets, library_capsule_2x: undefined }),
    "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/abc/library_capsule.jpg?t=5");
  assert.equal(urlCaja({ asset_url_format: "x" }), null);
  assert.equal(urlCaja(undefined), null);
});

test("ordena las ofertas del corpus de más a menos reseñas", () => {
  const md = [
    "## Chico\n\nReseñas: Positivas. El 90 % de las 1,200 reseñas de los usuarios son positivas.",
    "## Grande\n\nReseñas: Muy positivas. El 95 % de las 45,274 reseñas de los usuarios son positivas.",
    "## Sin reseñas\n\nPrecio: algo",
  ].join("\n\n");
  const juegos = { Chico: { appid: 1 }, Grande: { appid: 2 }, "Sin reseñas": { appid: 3 } };
  assert.deepEqual(ofertasPorResenas(md, juegos), [2, 1, 3]);
});

test("elige de las tres listas en orden y sin repetir", () => {
  const r = elegirDestacados({ masVendidos: [1, 2], populares: [2, 3], ofertas: [3, 4] }, 12);
  assert.deepEqual(r.map(d => d.appid), [1, 2, 3, 4]);
  assert.deepEqual(r.map(d => d.origen), ["mas-vendido", "mas-vendido", "popular", "oferta"]);
});

test("toma como mucho porLista de cada lista", () => {
  const r = elegirDestacados({ masVendidos: [1, 2], populares: [], ofertas: [] }, 1);
  assert.deepEqual(r.map(d => d.appid), [1]);
});

const minimo = {
  steam_appid: 10, name: " Juego ", header_image: "h.jpg", capsule_image: "c.jpg",
  genres: [{ description: "Acción" }],
  price_overview: { final: 199, initial: 999, discount_percent: 80 },
  screenshots: [1, 2, 3, 4].map(i => ({ path_thumbnail: `s${i}.jpg` })),
};

test("ficha sin tráiler → trailer null", () => {
  const f = fichaDestacado(minimo, { origen: "oferta", enCorpus: true });
  assert.equal(f.trailer, null);
  assert.equal(f.nombre, "Juego");
  assert.deepEqual(f.capturas, ["s1.jpg", "s2.jpg", "s3.jpg"]);
  assert.equal(f.precio, 1.99);
  assert.equal(f.precioOriginal, 9.99);
  assert.equal(f.descuento, 80);
  assert.equal(f.gratis, false);
  assert.deepEqual(f.generos, ["Acción"]);
});

test("ficha con tráiler HLS", () => {
  const f = fichaDestacado({ ...minimo, movies: [{ thumbnail: "t", hls_h264: "h" }] }, { origen: "oferta", enCorpus: false });
  assert.deepEqual(f.trailer, { miniatura: "t", hls: "h" });
  assert.equal(f.enCorpus, false);
});

test("juego gratis", () => {
  const { price_overview, ...gratis } = minimo;
  const f = fichaDestacado({ ...gratis, is_free: true }, { origen: "popular", enCorpus: true });
  assert.equal(f.gratis, true);
  assert.equal(f.precio, 0);
});

test("link a la tienda", () => {
  const f = fichaDestacado(minimo, { origen: "oferta", enCorpus: true });
  assert.equal(f.tienda, "https://store.steampowered.com/app/10");
});
