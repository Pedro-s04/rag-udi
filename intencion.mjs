// Qué tipo de búsqueda pide la consulta (ya reescrita por Gemini, o la pregunta tal cual).
// Para "el más jugado" no sirve buscar por significado: es un número (el puesto),
// y eso lo ordena mejor la base con SQL. Es la idea de la búsqueda híbrida.

// "más jugado", "mas jugados", "MÁS JUGADOS"...
export const pideMasJugados = consulta => /m[aá]s\s+jugad[oa]s?/i.test(consulta);

// "gratis", "free-to-play", "free to play"
export const pideGratis = consulta => /gratis|free[\s-]*to[\s-]*play/i.test(consulta);
