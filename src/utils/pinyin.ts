import type { PronunciationToken } from '../types/reader'

const toneMarks: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'], e: ['ē', 'é', 'ě', 'è'], i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'], u: ['ū', 'ú', 'ǔ', 'ù'], ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

export function isNumericPinyin(value: string): boolean {
  return /^[a-züv:]+[1-5]$/i.test(value.trim())
}

export function numericPinyinToToneMarks(value: string): string {
  const normalized = value.trim().toLocaleLowerCase().replace(/u:|v/g, 'ü')
  if (!isNumericPinyin(value)) throw new Error(`无效的数字拼音：${value}`)
  const tone = Number(normalized.at(-1))
  const syllable = normalized.slice(0, -1)
  if (tone === 5) return syllable
  const index = syllable.includes('a') ? syllable.indexOf('a') : syllable.includes('e') ? syllable.indexOf('e') : syllable.includes('ou') ? syllable.indexOf('o') : Math.max(syllable.lastIndexOf('i'), syllable.lastIndexOf('o'), syllable.lastIndexOf('u'), syllable.lastIndexOf('ü'))
  const marks = toneMarks[syllable[index]]
  if (!marks) throw new Error(`无效的数字拼音：${value}`)
  return `${syllable.slice(0, index)}${marks[tone - 1]}${syllable.slice(index + 1)}`
}

export function validPronunciation(tokens: PronunciationToken[] | undefined, text: string): boolean {
  return Boolean(tokens?.length) && tokens!.map((token) => token.text).join('') === text && tokens!.every((token) => token.text.length > 0 && (isNumericPinyin(token.pinyin) || (/^[，。；：、？！“”]$/u.test(token.text) && token.pinyin === '')))
}
