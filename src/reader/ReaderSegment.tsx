import { useState, type MouseEvent } from 'react'
import type { ReaderSegment as Segment } from '../types/reader'
import { PronunciationText } from './PronunciationText'
import { Translation } from './Translation'
export function ReaderSegment({ segment, active, showPinyin, onPlay }: { segment: Segment; active: boolean; showPinyin: boolean; onPlay: (segment: Segment) => void }) {
  const [translationOpen, setTranslationOpen] = useState(false)
  function handleClick(event: MouseEvent<HTMLElement>) { if (!segment.speakable || segment.startMs === null || (event.target as HTMLElement).closest('button, a, input, label') || window.getSelection()?.toString().trim()) return; onPlay(segment) }
  return <section id={`segment-${segment.id}`} data-segment-id={segment.id} className={`reader-segment${active ? ' active' : ''}`} onClick={handleClick} aria-current={active ? 'true' : undefined}><p><PronunciationText segment={segment} showPinyin={showPinyin} /></p>{segment.translation && <Translation text={segment.translation} expanded={translationOpen} onToggle={() => setTranslationOpen((value) => !value)} />}</section>
}
