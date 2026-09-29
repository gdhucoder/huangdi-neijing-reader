import type { CSSProperties } from 'react'
import type { ReaderChapter, ReaderSegment } from '../types/reader'
import { ReaderSegment as ReaderSegmentView } from './ReaderSegment'
export function ReaderText({ chapter, activeSegmentId, showPinyin, fontSize, onPlay }: { chapter: ReaderChapter; activeSegmentId: string | null; showPinyin: boolean; fontSize: number; onPlay: (segment: ReaderSegment) => void }) { return <article className="reader-text" style={{ '--reader-font-size': `${fontSize}px` } as CSSProperties}>{chapter.segments.map((segment) => <ReaderSegmentView key={segment.id} segment={segment} active={segment.id === activeSegmentId} showPinyin={showPinyin} onPlay={onPlay} />)}</article> }
