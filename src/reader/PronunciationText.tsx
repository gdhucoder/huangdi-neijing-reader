import type { ReaderSegment } from '../types/reader'
import { numericPinyinToToneMarks, validPronunciation } from '../utils/pinyin'
export function PronunciationText({ segment, showPinyin }: { segment: ReaderSegment; showPinyin: boolean }) {
  const valid = validPronunciation(segment.pronunciationTokens, segment.text)
  if (!showPinyin || !valid) { if (showPinyin && segment.pronunciationTokens && !valid && import.meta.env.DEV) console.warn(`无效拼音 token：${segment.id}`); return <>{segment.text}</> }
  return <>{segment.pronunciationTokens!.map((token, index) => token.pinyin ? <ruby key={`${token.text}-${index}`}>{token.text}<rt>{numericPinyinToToneMarks(token.pinyin)}</rt></ruby> : <span key={`${token.text}-${index}`}>{token.text}</span>)}</>
}
