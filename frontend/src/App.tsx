import { useEffect, useSyncExternalStore } from 'react'
import { useChat } from './chat/store.ts'
import { ChatScreen } from './screens/ChatScreen.tsx'
import { ImportScreen } from './screens/ImportScreen.tsx'
import { SummaryScreen } from './screens/SummaryScreen.tsx'
import { PrintView } from './export/print/PrintView.tsx'
import { PrivacyScreen } from './screens/PrivacyScreen.tsx'

const onHashChange = (notify: () => void) => {
  window.addEventListener('hashchange', notify)
  return () => window.removeEventListener('hashchange', notify)
}

function App() {
  const stage = useChat((state) => state.stage)
  const loaded = useChat((state) => state.imported !== null)
  // The privacy page is a link anyone can share: #privacidade, over whatever screen is open.
  const privacy = useSyncExternalStore(onHashChange, () => window.location.hash === '#privacidade', () => false)

  // Nothing is saved (ADR 0001): leaving the page loses the chat, so the browser asks first.
  useEffect(() => {
    if (!loaded) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [loaded])

  if (privacy) return <PrivacyScreen />
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
