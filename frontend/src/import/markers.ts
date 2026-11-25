// Fixed texts that WhatsApp writes into exports, per device language. Matching is done on
// lowercase text without the invisible direction marks.

import type { AttachmentKind, Language } from '../chat/model.ts'

/** Parenthetical after a file name on Android: `IMG-20231015-WA0012.jpg (arquivo anexado)`. */
export const ANDROID_ATTACHED: Record<string, Language> = {
  'arquivo anexado': 'pt',
  'file attached': 'en',
  'archivo adjunto': 'es',
}

/** Label inside the iOS attachment marker: `<anexado: 00000012-PHOTO-….jpg>`. */
export const IOS_ATTACHED: Record<string, Language> = {
  anexado: 'pt',
  attached: 'en',
  adjunto: 'es',
}

export const DELETED: Record<string, Language> = {
  'mensagem apagada': 'pt',
  'esta mensagem foi apagada': 'pt',
  'você apagou esta mensagem': 'pt',
  'this message was deleted': 'en',
  'you deleted this message': 'en',
  'se eliminó este mensaje': 'es',
  'eliminaste este mensaje': 'es',
}

export const POLL: Record<string, Language> = {
  enquete: 'pt',
  poll: 'en',
  encuesta: 'es',
}

export const POLL_OPTION = ['opção', 'option', 'opción']

/**
 * Words for "omitted" in `<Mídia oculta>`, `imagem ocultada`, `image omitted`, `imagen omitida`.
 * Portuguese and Spanish share `omitido` and `omitida`, so those do not tell the language.
 */
export const OMITTED: Record<string, Language | null> = {
  oculta: 'pt',
  ocultada: 'pt',
  ocultado: 'pt',
  omitida: null,
  omitido: null,
  omitted: 'en',
}

/** First word(s) of an omitted-media text, to know what kind of attachment was left out. */
export const OMITTED_KIND: [string, AttachmentKind][] = [
  ['mensagem de voz', 'voice'],
  ['voice message', 'voice'],
  ['mensaje de voz', 'voice'],
  ['imagem', 'image'],
  ['image', 'image'],
  ['imagen', 'image'],
  ['vídeo', 'video'],
  ['video', 'video'],
  ['áudio', 'audio'],
  ['audio', 'audio'],
  ['figurinha', 'sticker'],
  ['sticker', 'sticker'],
  ['gif', 'gif'],
  ['documento', 'document'],
  ['document', 'document'],
  ['cartão de contato', 'contact'],
  ['contact card', 'contact'],
  ['tarjeta de contacto', 'contact'],
]

/** Words that only appear in one language, used to tell the language from the system notices. */
export const NOTICE_WORDS: [RegExp, Language][] = [
  [/criptografia de ponta a ponta|adicionou|saiu|criou o grupo/, 'pt'],
  [/end-to-end encrypted|\badded\b|\bleft\b|created group/, 'en'],
  [/cifrado de extremo a extremo|añadió|salió|creó el grupo/, 'es'],
]
