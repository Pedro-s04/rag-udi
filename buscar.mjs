import { db, comoVector } from "./db.mjs";

// Los k fragmentos más parecidos a la pregunta, de mayor a menor similitud.
// La cuenta la hace Postgres: <=> es la distancia coseno.
//
// Extensión Steam: "filtros" deja afuera, ANTES de ordenar por significado,
// los juegos que no cumplen con los números. Por ejemplo { descuentoMin: 50, precioMax: 5 }.
export async function buscar(vectorPregunta, k = 3, filtros = {}) {
  const { descuentoMin = 0, precioMax = 1e9 } = filtros;
  const { rows } = await db.query(
    `SELECT id, fuente, seccion, posicion, texto, appid, precio::float AS precio, descuento,
            1 - (embedding <=> $1) AS similitud
       FROM fragmentos
      WHERE COALESCE(descuento, 0) >= $3
        AND COALESCE(precio, 0) <= $4
      ORDER BY embedding <=> $1
      LIMIT $2
    `,
    [comoVector(vectorPregunta), k, descuentoMin, precioMax],
  );
  return rows;
}
