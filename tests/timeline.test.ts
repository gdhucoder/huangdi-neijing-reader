import { describe, expect, it } from 'vitest'
import { findActiveSegmentIndex, isValidTimeline, playableSegments } from '../src/audio/timeline'
import type { ReaderSegment } from '../src/types/reader'
const segments: ReaderSegment[] = [
  { id: 'a', order: 1, text: '甲', speakable: true, startMs: 0, endMs: 1000 },
  { id: 'b', order: 2, text: '乙', speakable: false, startMs: 1000, endMs: 2000 },
  { id: 'c', order: 3, text: '丙', speakable: true, startMs: 2000, endMs: 3000 },
]
describe('timeline', () => {
  it('checks monotonic non-overlapping ranges', () => { expect(isValidTimeline(segments)).toBe(true); expect(isValidTimeline([{ ...segments[0] }, { ...segments[1], startMs: 900 }])).toBe(false) })
  it('finds a segment with a cached hint and binary-search fallback', () => { expect(findActiveSegmentIndex(segments, 2300, 0)).toBe(2); expect(findActiveSegmentIndex(segments, 3000, 2)).toBe(-1) })
  it('omits non-speakable segments from controls', () => expect(playableSegments(segments).map((item) => item.id)).toEqual(['a', 'c']))
})
