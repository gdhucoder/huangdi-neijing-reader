import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { adaptBundle } from '../src/content/bundleAdapter'
import type { RawBundle } from '../src/content/bundleLoader'

describe('formal AncientMedicalTTS bundle', () => {
  it('adapts the imported twelve-chapter publication without changing its files', () => {
    const root = resolve(process.cwd(), 'public/books/huangdi-neijing')
    const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
    const book = JSON.parse(readFileSync(resolve(root, 'book.json'), 'utf8'))
    const chapters = book.chapters.map((entry: { content: string }) => JSON.parse(readFileSync(resolve(root, entry.content), 'utf8')))
    const adapted = adaptBundle({ manifest, book, chapters } as RawBundle)
    expect(adapted.chapters).toHaveLength(12)
    expect(adapted.chapters.every((chapter) => chapter.timelineValid && chapter.audioUrl?.includes('/books/huangdi-neijing/audio/'))).toBe(true)
    expect(adapted.chapters[0].segments.length).toBeGreaterThan(0)
    expect(adapted.chapters[0].segments[0].pronunciationTokens?.[0]).toMatchObject({ text: '上', pinyin: 'shang4' })
  })
})
