// Extensión Steam: las características de Steam ("Cooperativo en línea, JcJ...")
// contadas con las palabras que usa la gente al preguntar ("para jugar con amigos").
// Así la búsqueda por significado encuentra el juego aunque la pregunta no diga "multijugador".
export function modoDeJuego(caracteristicas) {
  const tiene = texto => caracteristicas.some(c => c.includes(texto));
  const conOtros = tiene("Multijugador") || tiene("Cooperativo") || tiene("JcJ") || tiene("Remote Play Together");
  if (!conOtros) return "Modo de juego: para jugar solo, de un jugador, sin multijugador";

  const formas = [];
  if (tiene("Cooperativo")) formas.push("en cooperativo, en equipo con amigos");
  if (tiene("JcJ")) formas.push("competitivo contra otros jugadores");
  if (tiene("en línea") || tiene("masivo")) formas.push("en línea por internet");
  if (tiene("pantalla") || tiene("LAN") || tiene("Remote Play Together")) formas.push("en la misma compu o pantalla compartida");
  const solo = tiene("Un jugador") ? "; también se puede jugar solo" : "";
  return `Modo de juego: para jugar con amigos, multijugador${formas.length ? ` (${formas.join(", ")})` : ""}${solo}`;
}
