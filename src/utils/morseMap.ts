export type GugaMode = "single" | "double"

const MORSE_TO_CHAR: Record<string, string> = {
  ".-": "A",
  "-...": "B",
  "-.-.": "C",
  "-..": "D",
  ".": "E",
  "..-.": "F",
  "--.": "G",
  "....": "H",
  "..": "I",
  ".---": "J",
  "-.-": "K",
  ".-..": "L",
  "--": "M",
  "-.": "N",
  "---": "O",
  ".--.": "P",
  "--.-": "Q",
  ".-.": "R",
  "...": "S",
  "-": "T",
  "..-": "U",
  "...-": "V",
  ".--": "W",
  "-..-": "X",
  "-.--": "Y",
  "--..": "Z",
  "-----": "0",
  ".----": "1",
  "..---": "2",
  "...--": "3",
  "....-": "4",
  ".....": "5",
  "-....": "6",
  "--...": "7",
  "---..": "8",
  "----.": "9",
  ".-.-.-": ".",
  "--..--": ",",
  "..--..": "?",
  "-.-.--": "!",
  "-.--.": "(",
  "-.--.-": ")",
  "-....-": "-",
  "-..-.": "/",
}

const CHAR_TO_MORSE: Record<string, string> = {}
for (const [morse, char] of Object.entries(MORSE_TO_CHAR)) {
  CHAR_TO_MORSE[char] = morse
}

export function charToMorse(char: string): string | null {
  const upper = char.toUpperCase()
  return CHAR_TO_MORSE[upper] ?? null
}

export function morseToChar(morse: string): string | null {
  return MORSE_TO_CHAR[morse] ?? null
}

export function getMorseTable(mode: GugaMode = "single"): Array<{ char: string; morse: string; guga: string }> {
  const order = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!()-/"
  return [...order].map((ch) => {
    const morse = CHAR_TO_MORSE[ch]
    const guga = morseToGuga(morse, mode)
    return { char: ch, morse, guga }
  })
}

export function morseToGuga(morse: string, mode: GugaMode = "single"): string {
  const dot = mode === "double" ? "咕咕" : "咕"
  const dash = mode === "double" ? "嘎嘎" : "嘎"
  return morse.replace(/\./g, dot).replace(/-/g, dash)
}

export function gugaToMorse(guga: string, mode: GugaMode = "single"): string {
  if (mode === "double") {
    return guga.replace(/咕咕/g, ".").replace(/嘎嘎/g, "-")
  }
  return guga.replace(/咕/g, ".").replace(/嘎/g, "-")
}

export function isChineseChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

export function charToUnicodeHex(char: string): string {
  return char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")
}

export function unicodeHexToChar(hex: string): string {
  return String.fromCodePoint(parseInt(hex, 16))
}
