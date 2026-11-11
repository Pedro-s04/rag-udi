// ¿Este navegador puede dibujar la escena 3D? Sin WebGL se muestra una imagen fija.
// Con ?sin3d en la URL se fuerza el modo sin 3D (para probar el respaldo).
export function soportaWebGL(doc: Document | undefined = globalThis.document): boolean {
  if (!doc) return false
  if (globalThis.location?.search.includes('sin3d')) return false
  try {
    const lienzo = doc.createElement('canvas')
    const contexto = (lienzo.getContext('webgl2') || lienzo.getContext('webgl')) as WebGLRenderingContext | null
    // el contexto de prueba se libera: Chrome mantiene ~16 vivos y empieza a matar los de la escena
    contexto?.getExtension?.('WEBGL_lose_context')?.loseContext()
    return !!contexto
  } catch {
    return false
  }
}

// Se prueba una sola vez por página, no en cada render.
let recordado: boolean | null = null
export function hayWebGL(probar: () => boolean = soportaWebGL): boolean {
  recordado ??= probar()
  return recordado
}
