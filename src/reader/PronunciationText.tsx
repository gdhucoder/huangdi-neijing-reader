import type { ReaderSegment } from '../types/reader'
import { numericPinyinToToneMarks, validPronunciation } from '../utils/pinyin'
export function PronunciationText({ segment, showPinyin, activeCharacterIndex }: { segment: ReaderSegment; showPinyin: boolean; activeCharacterIndex: number }) {
  const valid = validPronunciation(segment.pronunciationTokens, segment.text)
  if (!valid) { if (showPinyin && segment.pronunciationTokens && import.meta.env.DEV) console.warn(`无效拼音 token：${segment.id}`); return <>{segment.text}</> }
  return <>{segment.pronunciationTokens!.map((token, index) => {
    const className = index === activeCharacterIndex ? 'reader-character current' : 'reader-character'
    const id = `character-${segment.id}-${index}`
    return token.pinyin && showPinyin
      ? <ruby className={className} id={id} key={`${token.text}-${index}`}>{token.text}<rt>{numericPinyinToToneMarks(token.pinyin)}</rt></ruby>
      : <span className={className} id={id} key={`${token.text}-${index}`}>{token.text}</span>
  })}</>
}
