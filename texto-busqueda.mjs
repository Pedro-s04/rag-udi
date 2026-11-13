// Extensión Steam: el texto con el que se BUSCA cada juego, o sea, el que se convierte en vector.
// En la tabla se sigue guardando la ficha completa, que es la que lee Gemini para responder.
//
// ¿Por qué no buscar con la ficha completa? Un tercio de cada ficha (características, precio,
// reseñas, tienda) es casi igual en todos los juegos y empuja todos los vectores al mismo lugar:
// el tema ("terror", "fútbol") quedaba en una frase y pesaba poco. Para "terror" salían
// CHAOS;CHILD y un juego de aviones; con nombre + géneros + descripción corta salen
// R.E.P.O., Phasmophobia y The Outlast Trials.
const AVISO_COMPRAS = /^Este juego incluye/;

const primerasOraciones = (texto, n) => texto.split(/(?<=[.!?])\s+/).slice(0, n).join(" ");

export function textoBusqueda(ficha) {
  const parrafos = ficha.replace(/\r\n/g, "\n").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const [titulo = "", datos = "", ...resto] = parrafos;
  const generos = datos.split("\n").find(r => r.startsWith("Géneros:"));
  if (!titulo.startsWith("#") || !generos) return ficha;   // no es una ficha de juego: se busca entera

  // la ficha trae la descripción corta de Steam (si tiene) y después un pedazo de la larga
  const textos = resto.filter(p => !AVISO_COMPRAS.test(p));
  const corta = textos.length > 1 ? textos[0] : primerasOraciones(textos[0] ?? "", 2);
  return [titulo.replace(/^#+\s*/, ""), generos, corta].filter(Boolean).join("\n");
}
