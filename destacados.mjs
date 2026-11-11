// Los juegos destacados de la web: una selección chica de juegos importantes, con sus
// portadas y tráilers reales. Funciones puras: las usa bajar-destacados.mjs.
import { TIENDA, numeros } from "./steam.mjs";

// Los appid de las ofertas del corpus, de más a menos reseñas: las más conocidas primero.
// La cantidad sale del renglón "El 97 % de las 45,274 reseñas..." de cada sección "## Nombre".
export function ofertasPorResenas(markdown, juegos) {
  return markdown.split(/^## /m).slice(1)
    .map(seccion => {
      const nombre = seccion.split("\n")[0].trim();
      const cantidad = Number(seccion.match(/de las ([\d.,]+)\s+rese/)?.[1].replace(/\D/g, "") ?? 0);
      return { appid: juegos[nombre]?.appid, cantidad };
    })
    .filter(o => o.appid)
    .sort((a, b) => b.cantidad - a.cantidad)
    .map(o => o.appid);
}

// La portada vertical (600x900, como la tapa de una caja) a partir de los assets que devuelve
// IStoreBrowseService/GetItems. Los juegos nuevos la guardan en una ruta con hash.
const CDN = "https://shared.akamai.steamstatic.com/store_item_assets/";
export function urlCaja(assets) {
  const archivo = assets?.library_capsule_2x ?? assets?.library_capsule;
  if (!archivo || !assets.asset_url_format) return null;
  return CDN + assets.asset_url_format.replace("${FILENAME}", archivo);
}

// Hasta porLista de cada lista, en este orden, sin repetir appid (gana el primero).
export function elegirDestacados({ masVendidos, populares, ofertas }, porLista = 12) {
  const elegidos = new Map();
  const listas = [["mas-vendido", masVendidos], ["popular", populares], ["oferta", ofertas]];
  for (const [origen, appids] of listas) {
    for (const appid of appids.slice(0, porLista)) {
      if (!elegidos.has(appid)) elegidos.set(appid, { appid, origen });
    }
  }
  return [...elegidos.values()];
}

// La ficha de un juego a partir de lo que devuelve appdetails.
export function fichaDestacado(j, { origen, enCorpus }) {
  const { appid, precio, precioOriginal, descuento } = numeros(j);
  const pelicula = (j.movies ?? []).find(m => m.hls_h264);
  return {
    appid,
    nombre: j.name.trim(),
    origen,
    enCorpus,
    precio,
    precioOriginal,
    descuento,
    gratis: !j.price_overview,
    generos: (j.genres ?? []).map(g => g.description),
    portada: j.header_image,
    capsula: j.capsule_image,
    capturas: (j.screenshots ?? []).slice(0, 3).map(s => s.path_thumbnail),
    trailer: pelicula ? { miniatura: pelicula.thumbnail, hls: pelicula.hls_h264 } : null,
    tienda: `${TIENDA}/app/${appid}`,
  };
}
