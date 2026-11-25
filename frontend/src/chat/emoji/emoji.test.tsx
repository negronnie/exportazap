import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { emojiSrc, isEmojiOnly, withEmoji, type EmojiMap } from './emoji.tsx'
import realMap from './map.json'

const map: EmojiMap = { '🎉': '1f389', '👍🏽': '1f44d-1f3fd', '❤️': '2764-fe0f' }
// React adds image preload hints when rendering to a string; they are not part of the output here.
const html = (text: string) => renderToStaticMarkup(<>{withEmoji(text, map, 'k')}</>).replace(/<link [^>]*\/>/g, '')

describe('emoji', () => {
  it('swaps each emoji for its image and keeps the rest as text', () => {
    expect(html('Valeu! 🎉 até')).toBe(
      'Valeu! <img src="/emoji/1f389.png" alt="🎉" draggable="false" class="inline-block align-[-0.2em] size-[1.2em]"/> até',
    )
  })

  it('treats a skin-tone sequence as one emoji', () => {
    expect(html('👍🏽')).toContain('/emoji/1f44d-1f3fd.png')
    expect(html('👍🏽').match(/<img/g)).toHaveLength(1)
  })

  it('leaves emoji without an image, and everything before the table loads, as text', () => {
    expect(html('🫠')).toBe('🫠')
    expect(withEmoji('🎉', null, 'k')).toEqual(['🎉'])
  })

  it('tells messages made only of a few emoji', () => {
    expect(isEmojiOnly('🎉')).toBe(true)
    expect(isEmojiOnly('🎉 ❤️ 👍🏽')).toBe(true)
    expect(isEmojiOnly('🎉🎉🎉🎉')).toBe(false)
    expect(isEmojiOnly('oi 🎉')).toBe(false)
  })

  it('has the common emoji in the bundled table', () => {
    for (const emoji of ['😂', '❤️', '❤', '👍', '🙏🏻', '🇧🇷', '👨‍👩‍👧']) {
      expect(emojiSrc(realMap as EmojiMap, emoji), emoji).not.toBeNull()
    }
  })
})
