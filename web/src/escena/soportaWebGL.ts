// ¿Este navegador puede dibujar la escena 3D? Sin WebGL se muestra una imagen fija.
// Con ?sin3d en la URL se fuerza el modo sin 3D (para probar el respaldo).
export function soportaWebGL(doc: Document | undefined = globalThis.document): boolean {
  if (!doc) return false
  if (globalThis.location?.search.includes('sin3d')) return false
  try {
    const lienzo = doc.createElement('canvas')
    return !!(lienzo.getContext('webgl2') || lienzo.getContext('webgl'))
  } catch {
    return false
  }
}
