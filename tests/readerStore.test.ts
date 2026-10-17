import { beforeEach, describe, expect, it } from 'vitest'
import { readAllProgress, readProgress, saveProgress } from '../src/stores/readerStore'
describe('reading progress', () => {
  beforeEach(() => localStorage.clear())
  it('persists a chapter and segment for continue reading', () => { saveProgress({ bookId: 'book', chapterId: 'chapter', segmentId: 'segment', audioPositionMs: 4200 }); expect(readProgress()).toMatchObject({ bookId: 'book', chapterId: 'chapter', segmentId: 'segment', audioPositionMs: 4200 }) })
  it('ignores malformed stored values', () => { localStorage.setItem('huangdi-neijing-reader-progress', '{bad json'); expect(readProgress()).toBeNull() })
  it('keeps progress for separate books independently', () => {
    saveProgress({ bookId: 'huangdi', chapterId: 'chapter-1', segmentId: 'segment-1', audioPositionMs: 1200 })
    saveProgress({ bookId: 'xiaoyaoyou', chapterId: 'chapter-1', segmentId: 'segment-2', audioPositionMs: 3400 })
    expect(readProgress('huangdi')).toMatchObject({ bookId: 'huangdi', segmentId: 'segment-1', audioPositionMs: 1200 })
    expect(readProgress('xiaoyaoyou')).toMatchObject({ bookId: 'xiaoyaoyou', segmentId: 'segment-2', audioPositionMs: 3400 })
    expect(Object.keys(readAllProgress())).toEqual(expect.arrayContaining(['huangdi', 'xiaoyaoyou']))
  })
})
