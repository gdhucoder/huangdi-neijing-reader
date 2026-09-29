import { beforeEach, describe, expect, it } from 'vitest'
import { readProgress, saveProgress } from '../src/stores/readerStore'
describe('reading progress', () => {
  beforeEach(() => localStorage.clear())
  it('persists a chapter and segment for continue reading', () => { saveProgress({ bookId: 'book', chapterId: 'chapter', segmentId: 'segment', audioPositionMs: 4200 }); expect(readProgress()).toMatchObject({ bookId: 'book', chapterId: 'chapter', segmentId: 'segment', audioPositionMs: 4200 }) })
  it('ignores malformed stored values', () => { localStorage.setItem('huangdi-neijing-reader-progress', '{bad json'); expect(readProgress()).toBeNull() })
})
