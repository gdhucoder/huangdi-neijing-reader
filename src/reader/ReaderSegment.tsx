import { useState, type MouseEvent } from 'react'
import type { ReaderSegment as Segment } from '../types/reader'
import { PronunciationText } from './PronunciationText'
import { Translation } from './Translation'
export function ReaderSegment({ segment, active, showPinyin, activeCharacterIndex = -1, onPlay }: { segment: Segment; active: boolean; showPinyin: boolean; activeCharacterIndex?: number; onPlay: (segment: Segment) => void }) {
  const [translationOpen, setTranslationOpen] = useState(false)
  function handleClick(event: MouseEvent<HTMLElement>) { if (!segment.speakable || segment.startMs === null || (event.target as HTMLElement).closest('button, a, input, label') || window.getSelection()?.toString().trim()) return; onPlay(segment) }
  const shortSegment = [...segment.text].length <= 36
  return <section id={`segment-${segment.id}`} data-segment-id={segment.id} className={`reader-segment${active ? ' active' : ''}${shortSegment ? ' short-segment' : ''}`} onClick={handleClick} aria-current={active ? 'true' : undefined}><p><PronunciationText segment={segment} showPinyin={showPinyin} activeCharacterIndex={activeCharacterIndex} /></p>{segment.translation && <Translation text={segment.translation} expanded={translationOpen} onToggle={() => setTranslationOpen((value) => !value)} />}</section>
}
