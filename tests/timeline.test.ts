import { describe, expect, it } from 'vitest'
import { findActiveCharacterIndex, findActiveSegmentIndex, isValidTimeline, playableSegments } from '../src/audio/timeline'
import type { PronunciationTiming, ReaderSegment } from '../src/types/reader'
const segments: ReaderSegment[] = [
  { id: 'a', order: 1, text: '甲', speakable: true, startMs: 0, endMs: 1000 },
  { id: 'b', order: 2, text: '乙', speakable: false, startMs: 1000, endMs: 2000 },
  { id: 'c', order: 3, text: '丙', speakable: true, startMs: 2000, endMs: 3000 },
]
const timings: PronunciationTiming[] = [
  { text: '甲', startMs: 0, endMs: 300 },
  { text: '乙', startMs: 300, endMs: 700 },
  { text: '。', startMs: 700, endMs: 1000 },
]
describe('timeline', () => {
  it('checks monotonic non-overlapping ranges', () => { expect(isValidTimeline(segments)).toBe(true); expect(isValidTimeline([{ ...segments[0] }, { ...segments[1], startMs: 900 }])).toBe(false) })
  it('finds a segment with a cached hint and binary-search fallback', () => { expect(findActiveSegmentIndex(segments, 2300, 0)).toBe(2); expect(findActiveSegmentIndex(segments, 3000, 2)).toBe(-1) })
  it('finds the character at an audio position', () => { expect(findActiveCharacterIndex(timings, 120)).toBe(0); expect(findActiveCharacterIndex(timings, 450)).toBe(1); expect(findActiveCharacterIndex(timings, 900)).toBe(2) })
  it('omits non-speakable segments from controls', () => expect(playableSegments(segments).map((item) => item.id)).toEqual(['a', 'c']))
})
