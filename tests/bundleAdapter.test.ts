import { describe, expect, it } from 'vitest'
import { adaptBundle } from '../src/content/bundleAdapter'
import type { RawBundle } from '../src/content/bundleLoader'
const raw: RawBundle = { manifest: { format: 'ancient-medical-publication-bundle', format_version: '1.0', book: 'book.json' }, book: { id: 'book', title: '书', chapters: [{ id: 'one', src: 'chapters/one.json' }] }, chapters: [{ id: 'one', title: '篇', audio: { src: 'audio/one.mp3' }, segments: [{ id: 's1', text: '甲', start_ms: 0, end_ms: 1000, translation: null }, { id: 's2', text: '乙', start_ms: 900, end_ms: 1500 }] }] }
describe('bundle adapter', () => {
  it('maps raw v1 content to reader model and flags an invalid timeline', () => { const book = adaptBundle(raw); expect(book.chapters[0]).toMatchObject({ id: 'one', title: '篇', timelineValid: false }); expect(book.chapters[0].audioUrl).toContain('/books/huangdi-neijing-selected-v01/audio/one.mp3') })
})
