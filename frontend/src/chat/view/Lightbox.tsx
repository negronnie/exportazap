import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useLightbox } from './lightbox.ts'

export function Lightbox() {
  const { item, close } = useLightbox()

  useEffect(() => {
    if (!item) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, close])

  if (!item) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={item.fileName} className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={close}>
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <p className="min-w-0 flex-1 truncate text-sm">{item.fileName}</p>
        <button type="button" onClick={close} aria-label="Fechar" className="rounded-full p-2 hover:bg-white/10">
          <X size={22} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
        {item.kind === 'image' ? (
          <img src={item.url} alt={item.fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <video src={item.url} controls autoPlay playsInline className="max-h-full max-w-full" />
        )}
      </div>
    </div>
  )
}
