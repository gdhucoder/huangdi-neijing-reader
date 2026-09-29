import type { ReaderSegment } from '../types/reader'
export function isValidTimeline(segments: ReaderSegment[]): boolean {
  let previousEnd = -1
  for (const segment of segments) {
    if (segment.startMs === null || segment.endMs === null) continue
    if (segment.startMs < 0 || segment.endMs <= segment.startMs || segment.startMs < previousEnd) return false
    previousEnd = segment.endMs
  }
  return true
}
export function playableSegments(segments: ReaderSegment[]): ReaderSegment[] { return segments.filter((segment) => segment.speakable && segment.startMs !== null && segment.endMs !== null) }
export function findActiveSegmentIndex(segments: ReaderSegment[], currentMs: number, hint = 0): number {
  for (const index of [hint, hint + 1, hint - 1]) { const segment = segments[index]; if (segment && segment.startMs !== null && segment.endMs !== null && currentMs >= segment.startMs && currentMs < segment.endMs) return index }
  let low = 0; let high = segments.length - 1
  while (low <= high) { const middle = Math.floor((low + high) / 2); const segment = segments[middle]; if (segment.startMs === null || segment.endMs === null) return -1; if (currentMs < segment.startMs) high = middle - 1; else if (currentMs >= segment.endMs) low = middle + 1; else return middle }
  return -1
}
