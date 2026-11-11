// Pixel, la mascota del RAG (el SVG de rag-diseño/Main.dc.html).
type Animo = 'normal' | 'pensando' | 'feliz'

export function Pixel({ animo = 'normal', className = '' }: { animo?: Animo; className?: string }) {
  const pecho = animo === 'pensando' ? '#beee11' : '#66c0f4'
  return (
    <svg role="img" aria-label="Pixel, el robot que responde tus preguntas" viewBox="0 0 320 300"
      className={`h-auto w-full drop-shadow-[0_0_30px_rgba(102,192,244,.25)] ${className}`}>
      <g className="animate-[pixel-respira_3.4s_ease-in-out_infinite]">
        <line x1="160" y1="22" x2="160" y2="50" stroke="#8fa6bc" strokeWidth="5" strokeLinecap="round" />
        <circle className="pixel-pulso" cx="160" cy="16" r="9" fill={pecho} />
        <circle cx="160" cy="16" r="16" fill={pecho} opacity=".18" />
        <rect x="54" y="92" width="22" height="46" rx="8" fill="#8fa6bc" />
        <rect x="244" y="92" width="22" height="46" rx="8" fill="#8fa6bc" />
        <rect x="70" y="48" width="180" height="132" rx="36" fill="#dbe6f0" />
        <path d="M106 48 L214 48 C234 48 250 64 250 84 L250 96 C220 70 100 70 70 96 L70 84 C70 64 86 48 106 48Z" fill="#ffffff" opacity=".55" />
        <rect x="88" y="72" width="144" height="86" rx="26" fill="#0e141b" />
        {animo === 'normal' && (
          <g>
            <ellipse className="pixel-parpadeo" cx="130" cy="110" rx="13" ry="16" fill="#66c0f4" />
            <ellipse className="pixel-parpadeo" cx="190" cy="110" rx="13" ry="16" fill="#66c0f4" />
            <circle cx="134" cy="104" r="4" fill="#ffffff" opacity=".8" />
            <circle cx="194" cy="104" r="4" fill="#ffffff" opacity=".8" />
          </g>
        )}
        {animo === 'pensando' && (
          <g>
            <rect x="104" y="104" width="112" height="10" rx="5" fill="#1a3a55" />
            <g className="animate-[pixel-escanea_1.3s_ease-in-out_infinite]">
              <rect x="142" y="100" width="36" height="18" rx="9" fill="#beee11" />
            </g>
          </g>
        )}
        {animo === 'feliz' && (
          <g>
            <path d="M116 114 Q130 94 144 114" fill="none" stroke="#beee11" strokeWidth="7" strokeLinecap="round" />
            <path d="M176 114 Q190 94 204 114" fill="none" stroke="#beee11" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
        <path d="M144 138 Q160 148 176 138" fill="none" stroke="#66c0f4" strokeWidth="4" strokeLinecap="round" />
        <circle cx="104" cy="140" r="5" fill="#ff7aa8" opacity=".55" />
        <circle cx="216" cy="140" r="5" fill="#ff7aa8" opacity=".55" />
        <rect x="140" y="178" width="40" height="16" rx="4" fill="#8fa6bc" />
        <rect x="90" y="190" width="140" height="130" rx="32" fill="#c3d2e0" />
        <rect x="124" y="214" width="72" height="44" rx="10" fill="#0e141b" />
        <circle className="pixel-pulso" cx="144" cy="236" r="7" fill={pecho} />
        <rect x="158" y="230" width="28" height="4" rx="2" fill="#2f4a68" />
        <rect x="158" y="239" width="20" height="4" rx="2" fill="#2f4a68" />
      </g>
      <path d="M100 218 C70 232 56 258 52 284" fill="none" stroke="#8fa6bc" strokeWidth="20" strokeLinecap="round" />
      <path d="M220 218 C250 232 264 258 268 284" fill="none" stroke="#8fa6bc" strokeWidth="20" strokeLinecap="round" />
      <g className={animo === 'pensando' ? 'animate-[pixel-tipea_.9s_ease-in-out_infinite]' : ''}>
        <ellipse cx="50" cy="288" rx="30" ry="13" fill="#dbe6f0" />
        <path d="M30 284 L30 292 M42 283 L42 293 M54 283 L54 293" stroke="#8fa6bc" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g>
        <ellipse cx="270" cy="288" rx="30" ry="13" fill="#dbe6f0" />
        <path d="M266 283 L266 293 M278 283 L278 293 M290 284 L290 292" stroke="#8fa6bc" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
