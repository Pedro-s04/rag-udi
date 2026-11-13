# Pendientes

## Etiquetas de Steam en las fichas

**Estado:** pendiente, sin empezar.

### El problema

Para buscar por tema ("terror", "carreras", "relajante") el RAG depende de que la
**descripción corta** de cada juego diga el tema. Muchas no lo dicen:

- Steam no tiene "terror" como **género**. Los géneros que trae `appdetails` son
  Indie, Acción, Aventura, Simuladores, Rol, Estrategia, Casual, Deportes, Carreras…
  Lo que en la tienda se ve como "Horror" es una **etiqueta** que ponen los usuarios,
  y hoy no la bajamos.
- Hay descripciones cortas que no describen el juego. La de Assetto Corsa es una nota de
  actualización en inglés ("v1.16 introduces the new Laguna Seca track…"), así que no sale
  para "carreras".
- Muchas están en inglés (R.E.P.O.: "co-op horror game"; Left 4 Dead 2: "action horror
  FPS"). Lo compensamos en `reescribir.txt` agregando la palabra en inglés, pero es un parche.
- La consulta cambia mucho el resultado: con «terror, horror, miedo, sobrevivir a monstruos»,
  Dead by Daylight queda 31.º; con «horror game, terror, miedo, sustos, zombies, fantasmas»,
  7.º. Con etiquetas, "Horror" estaría escrito igual en todos los juegos de terror.

### La idea

1. Bajar las etiquetas de cada juego (Horror, Survival Horror, Racing, Relaxing, Shooter…),
   las más votadas.
2. Agregarlas al texto de búsqueda (`texto-busqueda.mjs`): nombre + géneros + **etiquetas** +
   descripción corta.
3. Opcional: guardarlas como columna (`etiquetas TEXT[]`) para filtrar con SQL, igual que el
   precio. Gemini las podría completar al reescribir ("terror" → etiqueta Horror).
4. Recalibrar `UMBRAL` con `distribucion.mjs` y repetir la regresión del chat.

### Lo que hay que averiguar antes

- **De dónde sacarlas.** `api/appdetails` no las trae. Opciones, sin probar todavía:
  - la página de la tienda de cada juego (`store.steampowered.com/app/<appid>`), donde aparecen
    las etiquetas populares en el HTML;
  - la API de SteamSpy (`steamspy.com/api.php?request=appdetails&appid=<appid>`), que
    devolvería las etiquetas con sus votos.
- **Cuánto tarda.** Son ~390 juegos; a 1,5 s por pedido (para que Steam no corte), entre
  10 y 15 minutos. Habría que sumarlo a `bajar-steam.mjs` y `bajar-populares.mjs`, o
  hacer un `bajar-etiquetas.mjs` aparte que complete `datos/`.
- **En qué idioma vienen.** Si vienen en inglés ("Horror"), conviene que la reescritura
  también ponga el término en inglés (ya lo hace).

### Cómo medir si mejoró

Con la regresión del chat (cada pregunta dos veces) y las preguntas de `distribucion.mjs`.
Casos que hoy andan flojos y deberían mejorar:

- «Busco un juego de carreras arcade barato» → hoy trae Planes, Bullets and Vodka
  (de aviones) primero.
- «dame un juego de terror» → hoy depende de cómo Gemini escribe la consulta.
- «algo relajante para jugar solo» → flojo con cualquier variante probada.
