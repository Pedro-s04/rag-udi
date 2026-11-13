// La marca de TU corpus: una expresión regular que reconoce
// el párrafo donde empieza cada parte (como "Artículo N." en el reglamento).
// Si tu corpus no tiene ninguna estructura clara, poné null: se trocea fijo.

// Cada juego empieza con un título "## Nombre del juego".
export const MARCA = /^## .+/;

// Largo máximo de cada fragmento. Con 2000 (lo de la guía), 37 fichas se partían en dos y el
// pedacito sobrante (sin nombre, precio ni género) se parecía a cualquier pregunta.
// La ficha más larga tiene unos 2300 caracteres: con 2500 cada juego queda entero.
export const MAXIMO = 2500;
