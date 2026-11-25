import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { readViewerData } from './data.ts'
import { Viewer } from './Viewer.tsx'

const data = readViewerData()
// The theme chosen in the export dialog, whatever the system of whoever opens the package.
document.documentElement.classList.add(`theme-${data.document.theme}`)
document.title = `${data.document.title} · ExportaZap`

createRoot(document.getElementById('viewer')!).render(
  <StrictMode>
    <Viewer data={data} />
  </StrictMode>,
)
