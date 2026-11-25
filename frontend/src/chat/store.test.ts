import { beforeEach, describe, expect, it } from 'vitest'
import { looseFiles, syntheticExport, zippedExport } from '../test/fixtures.ts'
import { useChat } from './store.ts'

describe('chat store', () => {
  beforeEach(async () => {
    await useChat.getState().reset()
  })

  it('imports an export into the summary with the guess of who you are', async () => {
    const { name, folder } = syntheticExport('android-ptbr-individual')
    await useChat.getState().importFiles([await zippedExport(folder, name)])
    const state = useChat.getState()
    expect(state.stage).toBe('summary')
    expect(state.self).toBe('Lucas')
    expect(state.asksDateOrder).toBe(false)
    state.openChat()
    expect(useChat.getState().stage).toBe('chat')
  })

  it('goes back to the start with the reason when the files are not an export', async () => {
    await useChat.getState().importFiles([new File(['a'], 'a.txt'), new File(['b'], 'b.txt')])
    expect(useChat.getState()).toMatchObject({ stage: 'idle', error: 'several-chat-texts', imported: null })
  })

  it('asks the date order when the export leaves it open, and re-reads it with the answer', async () => {
    const text = '01/02/2024 10:00 - Ana: oi\n01/02/2024 10:01 - Bia: oi\n'
    await useChat.getState().importFiles([new File([text], 'Conversa do WhatsApp com Ana.txt')])
    expect(useChat.getState().asksDateOrder).toBe(true)
    expect(useChat.getState().imported?.parsed.dateOrderAmbiguous).toBe(true)

    useChat.getState().confirmDateOrder('mdy')
    const { imported, asksDateOrder } = useChat.getState()
    expect(asksDateOrder).toBe(true)
    expect(imported?.parsed.dateOrderAmbiguous).toBe(false)
    expect(imported?.parsed.entries[0].at).toBe('2024-01-02T10:00:00')
  })

  it('forgets the chat on reset', async () => {
    const { folder } = syntheticExport('android-ptbr-sem-midia')
    await useChat.getState().importFiles(looseFiles(folder))
    await useChat.getState().reset()
    expect(useChat.getState()).toMatchObject({ stage: 'idle', imported: null, self: null })
  })

  it('starts the range on the whole chat and moves its ends from the messages', async () => {
    const { name, folder } = syntheticExport('android-ptbr-individual')
    await useChat.getState().importFiles([await zippedExport(folder, name)])
    const total = useChat.getState().imported!.parsed.entries.length
    expect(useChat.getState().range).toEqual({ start: 0, end: total - 1 })
    useChat.getState().startRangeAt(3)
    useChat.getState().endRangeAt(5)
    expect(useChat.getState().range).toEqual({ start: 3, end: 5 })
    useChat.getState().endRangeAt(1)
    expect(useChat.getState().range).toEqual({ start: 1, end: 1 })
  })

  it('hides messages in chat order, masks numbers and starts clean on the next import', async () => {
    const { folder } = syntheticExport('android-ptbr-sem-midia')
    await useChat.getState().importFiles(looseFiles(folder))
    useChat.getState().toggleHidden(3)
    useChat.getState().toggleHidden(1)
    expect(useChat.getState().hidden).toEqual([1, 3])
    useChat.getState().toggleHidden(3)
    expect(useChat.getState().hidden).toEqual([1])
    useChat.getState().setMaskNumbers(true)
    useChat.getState().setAlias('Bruno Lima', 'B.')
    await useChat.getState().importFiles(looseFiles(folder))
    expect(useChat.getState()).toMatchObject({ hidden: [], maskNumbers: false, aliases: {} })
  })
})
