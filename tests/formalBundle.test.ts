import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { adaptBundle } from '../src/content/bundleAdapter'
import type { RawBundle } from '../src/content/bundleLoader'
import { validPronunciation } from '../src/utils/pinyin'

describe('formal AncientMedicalTTS bundle', () => {
  it('adapts the imported six-chapter publication without changing its files', () => {
    const root = resolve(process.cwd(), 'public/books/huangdi-neijing-selected-v01')
    const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
    const book = JSON.parse(readFileSync(resolve(root, 'book.json'), 'utf8'))
    const chapters = book.chapters.map((entry: { content: string }) => JSON.parse(readFileSync(resolve(root, entry.content), 'utf8')))
    const adapted = adaptBundle({ manifest, book, chapters } as RawBundle)
    expect(adapted.chapters).toHaveLength(6)
    expect(adapted.chapters.every((chapter) => chapter.timelineValid && chapter.audioUrl?.includes('/books/huangdi-neijing-selected-v01/audio/'))).toBe(true)
    expect(adapted.chapters[0].segments.length).toBeGreaterThan(0)
    expect(adapted.chapters[0].segments[0].pronunciationTokens?.[0]).toMatchObject({ text: '昔', pinyin: 'xi1' })
    expect(adapted.chapters[0].segments[0].pronunciationTimings?.[0]).toMatchObject({ text: '昔', startMs: 34 })
    expect(adapted.chapters.every((chapter) => chapter.segments.every((segment) => validPronunciation(segment.pronunciationTokens, segment.text)))).toBe(true)
  })
})
