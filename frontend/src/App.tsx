import { useEffect } from 'react'
import { useChat } from './chat/store.ts'
import { ChatScreen } from './screens/ChatScreen.tsx'
import { ImportScreen } from './screens/ImportScreen.tsx'
import { SummaryScreen } from './screens/SummaryScreen.tsx'
import { PrintView } from './export/print/PrintView.tsx'

function App() {
  const stage = useChat((state) => state.stage)
  const loaded = useChat((state) => state.imported !== null)

  // Nothing is saved (ADR 0001): leaving the page loses the chat, so the browser asks first.
  useEffect(() => {
    if (!loaded) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [loaded])

  if (stage === 'summary') return <SummaryScreen />
  if (stage === 'chat')
    return (
      <>
        <ChatScreen />
        <PrintView />
      </>
    )
  return <ImportScreen />
}

export default App
