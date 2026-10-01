import type { PronunciationToken, ReaderSegment } from '../types/reader'
import { numericPinyinToToneMarks, validPronunciation } from '../utils/pinyin'
const clauseBoundary = /[，。；！？：、]/u
const noBreakPunctuation = /[，。；！？：、”’》）】』」]/u
export function PronunciationText({ segment, showPinyin, activeCharacterIndex }: { segment: ReaderSegment; showPinyin: boolean; activeCharacterIndex: number }) {
  const valid = validPronunciation(segment.pronunciationTokens, segment.text)
  if (!valid) { if (showPinyin && segment.pronunciationTokens && import.meta.env.DEV) console.warn(`无效拼音 token：${segment.id}`); return <>{segment.text}</> }
  const clauses: PronunciationToken[][] = []
  let current: PronunciationToken[] = []
  for (const token of segment.pronunciationTokens!) {
    current.push(token)
    if (clauseBoundary.test(token.text)) { clauses.push(current); current = [] }
  }
  if (current.length) clauses.push(current)
  let offset = 0
  return <>{clauses.map((clause, clauseIndex) => {
    const start = offset
    offset += clause.length
    const clauseClass = clause.length <= 10 ? 'reader-clause compact' : 'reader-clause'
    const units: PronunciationToken[][] = []
    for (const token of clause) {
      if (noBreakPunctuation.test(token.text) && units.length) units[units.length - 1].push(token)
      else units.push([token])
    }
    let unitOffset = 0
    return <span className={clauseClass} key={`clause-${clauseIndex}`}>{units.map((unit, unitIndex) => {
      const unitStart = unitOffset
      unitOffset += unit.length
      return <span className={unit.length > 1 ? 'reader-punctuation-pair' : undefined} key={`unit-${unitIndex}`}>{unit.map((token, index) => {
        const tokenIndex = start + unitStart + index
        const className = tokenIndex === activeCharacterIndex ? 'reader-character current' : 'reader-character'
        const id = `character-${segment.id}-${tokenIndex}`
        return token.pinyin && showPinyin
          ? <ruby className={className} id={id} key={`${token.text}-${tokenIndex}`}>{token.text}<rt>{numericPinyinToToneMarks(token.pinyin)}</rt></ruby>
          : <span className={className} id={id} key={`${token.text}-${tokenIndex}`}>{token.text}</span>
      })}</span>
    })}</span>
  })}</>
}
