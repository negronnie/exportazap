// The outputs the export dialog offers. Each one lands in its own issue; until then it shows as
// coming soon.

export type OutputFormat = 'pdf' | 'print' | 'screenshots' | 'strip' | 'html'

export const FORMATS: { id: OutputFormat; label: string; description: string }[] = [
  { id: 'pdf', label: 'PDF', description: 'Baixa direto, com texto que dá para selecionar e buscar.' },
  { id: 'print', label: 'PDF pela impressão', description: 'Abre a impressão do navegador; escolha "Salvar como PDF".' },
  { id: 'screenshots', label: 'Prints', description: 'Imagens no formato de tela de celular, num .zip.' },
  { id: 'strip', label: 'Tripa', description: 'Uma imagem comprida com o recorte inteiro.' },
  { id: 'html', label: 'Pacote HTML', description: 'Um .zip com a conversa navegável, que abre sem internet.' },
]

/** The Mark of CONTEXT.md, at the foot of every page and screenshot (ADR 0005). */
export const MARK = 'Gerado pelo ExportaZap a partir de uma exportação do WhatsApp'
export const MARK_SHORT = 'ExportaZap · exportação do WhatsApp'
