// La marca de TU corpus: una expresión regular que reconoce
// el párrafo donde empieza cada parte (como "Artículo N." en el reglamento).
// Si tu corpus no tiene ninguna estructura clara, poné null: se trocea fijo.

// Cada juego empieza con un título "## Nombre del juego".
export const MARCA = /^## .+/;
