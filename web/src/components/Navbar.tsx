export function Navbar({ onDetras }: { onDetras: () => void }) {
  const link = 'rounded-full px-4 py-2.5 text-sm font-semibold text-[#acb2b8] transition-colors hover:bg-celeste/12 hover:text-white'
  return (
    <header className="relative z-20 flex justify-center px-4 pt-4">
      <div className="flex w-full max-w-[1180px] flex-wrap items-center gap-4 rounded-full border border-celeste/22 bg-[rgba(13,19,28,.72)] py-2 pr-2 pl-5 shadow-[0_10px_40px_rgba(0,0,0,.4)] backdrop-blur-md">
        <a href="#chat" className="font-titulo text-lg font-bold tracking-[.06em] text-white">
          OFERTAS<span className="text-verde">_RAG</span>
        </a>
        <nav aria-label="Principal" className="ml-auto flex flex-wrap gap-1">
          <a href="#chat" className={link}>Chat</a>
          <a href="#destacados" className={link}>Juegos</a>
          <a href="#como-piensa" className={link}>Cómo piensa</a>
          <button type="button" onClick={onDetras} className={`${link} inline-flex items-center gap-2`}>
            Detrás de escena
            <span className="rounded-full bg-verde px-2 py-0.5 text-[10px] font-extrabold tracking-[.06em] text-[#0b1118]">NUEVO</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
