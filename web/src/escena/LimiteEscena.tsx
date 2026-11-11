import { Component, type ReactNode } from 'react'

// Si la escena 3D falla (GPU bloqueada, contexto perdido, un shader que no compila),
// se muestra el respaldo en vez de tirar abajo toda la página con el chat incluido.
type Props = { respaldo: ReactNode; children: ReactNode; onFallo?: () => void }

export class LimiteEscena extends Component<Props, { fallo: boolean }> {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error: unknown) {
    console.error('La escena 3D falló, muestro el respaldo:', error)
    this.props.onFallo?.()
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children
  }
}
