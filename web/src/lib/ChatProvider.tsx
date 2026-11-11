import { createContext, useCallback, useContext, useReducer, useRef, type ReactNode } from 'react'
import * as api from './api'
import { estadoInicial, orquestar, reducir, type Estado } from './conversacion'

type Chat = {
  estado: Estado
  enviar: (pregunta: string, filtros?: api.Filtros) => void
  pensando: boolean
}

const Contexto = createContext<Chat | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducir, estadoInicial)
  // la fase del estado llega un render tarde: el ref evita mandar dos preguntas a la vez
  const ocupado = useRef(false)

  const enviar = useCallback((pregunta: string, filtros: api.Filtros = {}) => {
    const texto = pregunta.trim()
    if (!texto || ocupado.current) return
    ocupado.current = true
    orquestar(texto, filtros, dispatch, api).finally(() => { ocupado.current = false })
  }, [])

  return (
    <Contexto.Provider value={{ estado, enviar, pensando: estado.fase !== 'libre' }}>
      {children}
    </Contexto.Provider>
  )
}

export function useChat(): Chat {
  const chat = useContext(Contexto)
  if (!chat) throw new Error('useChat va adentro de <ChatProvider>')
  return chat
}
