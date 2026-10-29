// Extensión Steam: lo que comparten bajar-steam.mjs (ofertas) y bajar-populares.mjs
// (los más jugados): pedirle cosas a la tienda y escribir cada juego como Markdown.
import { modoDeJuego } from "./modo-de-juego.mjs";

export const PAIS = "ar";            // Argentina: Steam cobra en dólares
export const IDIOMA = "spanish";
export const ESPERA = 1500;          // milisegundos entre pedidos: Steam corta si le pedís muy rápido
export const TIENDA = "https://store.steampowered.com";

export const esperar = ms => new Promise(r => setTimeout(r, ms));

// Pide una URL y devuelve el JSON. Si Steam dice "pará un poco" (429), espera y reintenta.
export async function pedirJSON(url, intento = 1) {
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (res.status === 429 && intento <= 3) {
    console.log(`  (Steam pide que espere: ${30 * intento} segundos)`);
    await esperar(30000 * intento);
    return pedirJSON(url, intento + 1);
  }
  if (!res.ok) throw new Error(`Steam respondió ${res.status} en ${url}`);
  return res.json();
}

// Saca el texto de un pedazo de HTML: cada bloque en su renglón, sin etiquetas.
export function sinHTML(html) {
  return html
    .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .split("\n").map(r => r.replace(/\s+/g, " ").trim()).filter(Boolean)
    .join("\n");
}

// El detalle de cada juego: descripción, géneros, características y precio.
// Con gratis: true también sirven los juegos gratuitos (no tienen precio).
export async function detalle(appid, { gratis = false } = {}) {
  const url = `${TIENDA}/api/appdetails?appids=${appid}&cc=${PAIS}&l=${IDIOMA}`;
  const datos = (await pedirJSON(url))[appid];
  if (!datos?.success || datos.data.type !== "game") return null;
  if (!datos.data.price_overview && !(gratis && datos.data.is_free)) return null;
  return datos.data;
}

// Los números de la oferta, para las columnas precio y descuento de la tabla.
export function numeros(j) {
  const p = j.price_overview;
  if (!p) return { appid: j.steam_appid, precio: 0, precioOriginal: 0, descuento: 0 };   // gratis
  return {
    appid: j.steam_appid,
    precio: p.final / 100,
    precioOriginal: p.initial / 100,
    descuento: p.discount_percent,
  };
}

// El renglón del precio dice con todas las letras si está en oferta o no:
// así el modelo puede contestar "no, no está en oferta".
function renglonPrecio(j, hoy) {
  const p = j.price_overview;
  if (!p) return `Precio al ${hoy}: gratis (free to play). No está en oferta porque es gratis`;
  const final = `USD ${(p.final / 100).toFixed(2)}`;
  if (p.discount_percent === 0) return `Precio al ${hoy}: ${final}. No está en oferta: sin descuento`;
  return `Precio al ${hoy}: ${final} (antes USD ${(p.initial / 100).toFixed(2)}), ${p.discount_percent}% de descuento. Está en oferta`;
}

// Cada juego como una sección de Markdown. "extra" son renglones de más (como la popularidad).
export function comoMarkdown(j, { resenas, hoy, extra = [] }) {
  // cortada para que cada juego entre en un fragmento de 2000 caracteres con su precio
  const descripcion = sinHTML(j.about_the_game || j.short_description || "").slice(0, 800);
  const caracteristicas = (j.categories ?? []).map(c => c.description).filter(c => !c.startsWith("#"));
  const renglones = [
    renglonPrecio(j, hoy),
    ...extra,
    `Géneros: ${(j.genres ?? []).map(g => g.description).join(", ") || "sin datos"}`,
    modoDeJuego(caracteristicas),
    `Características: ${caracteristicas.join(", ") || "sin datos"}`,
    resenas && `Reseñas: ${resenas[0]}. ${resenas[1] ?? ""}`,
    `Desarrollador: ${(j.developers ?? []).join(", ") || "sin datos"} · Lanzamiento: ${j.release_date?.date ?? "sin datos"}`,
    `Tienda: ${TIENDA}/app/${j.steam_appid}`,
  ].filter(Boolean);
  return `## ${j.name.trim()}\n\n${renglones.join("\n")}\n\n${j.short_description ? sinHTML(j.short_description) + "\n\n" : ""}${descripcion}`;
}
