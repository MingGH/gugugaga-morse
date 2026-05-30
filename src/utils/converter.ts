import {
  charToMorse,
  morseToChar,
  morseToGuga,
  gugaToMorse,
  isChineseChar,
  charToUnicodeHex,
  unicodeHexToChar,
} from "./morseMap"
import type { GugaMode } from "./morseMap"

const WORD_SEP = " / "
const CHAR_SEP = " "

export function textToGuga(text: string, mode: GugaMode = "single"): string {
  const words = text.split(" ")
  const encodedWords: string[] = []

  for (const word of words) {
    if (word === "") {
      encodedWords.push("")
      continue
    }
    const chars: string[] = []
    for (const ch of word) {
      const encoded = encodeChar(ch, mode)
      if (encoded) chars.push(encoded)
    }
    encodedWords.push(chars.join(CHAR_SEP))
  }

  return encodedWords.join(WORD_SEP)
}

function encodeChar(ch: string, mode: GugaMode): string | null {
  if (isChineseChar(ch)) {
    const hex = charToUnicodeHex(ch)
    const hexGuga = [...hex]
      .map((h) => {
        const m = charToMorse(h)
        return m ? morseToGuga(m, mode) : h
      })
      .join(CHAR_SEP)
    return `[ ${hexGuga} ]`
  }

  const morse = charToMorse(ch)
  if (morse) return morseToGuga(morse, mode)

  if (ch.match(/[a-zA-Z0-9.,?!()\-\/]/)) {
    const m = charToMorse(ch)
    return m ? morseToGuga(m, mode) : null
  }

  return null
}

export function gugaToText(guga: string, mode: GugaMode = "single"): string {
  const words = guga.split("/").map((w) => w.trim()).filter((w) => w.length > 0 || guga.includes(" / "))
  const result: string[] = []
  let inBracket = false
  let hexBuffer: string[] = []

  for (let wi = 0; wi < words.length; wi++) {
    if (wi > 0) result.push(" ")
    const raw = words[wi]
    if (raw === "") continue

    const tokens = raw.split(/\s+/).filter(Boolean)

    for (const token of tokens) {
      if (token === "[") {
        inBracket = true
        hexBuffer = []
        continue
      }
      if (token === "]") {
        inBracket = false
        const hex = hexBuffer.join("")
        if (hex.length >= 4) {
          result.push(unicodeHexToChar(hex.slice(0, 4)))
        }
        continue
      }

      const morse = gugaToMorse(token, mode)
      const ch = morseToChar(morse)

      if (inBracket && ch) {
        hexBuffer.push(ch)
      } else if (ch) {
        result.push(ch)
      }
    }
  }

  return result.join("")
}
