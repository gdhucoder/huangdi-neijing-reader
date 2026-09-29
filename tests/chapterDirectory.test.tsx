import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChapterDirectory } from '../src/components/ChapterDirectory'
import type { ReaderChapter } from '../src/types/reader'

const chapters: ReaderChapter[] = [
  { id: 'a', order: 1, title: '第一篇', timelineValid: true, segments: [] },
  { id: 'b', order: 2, title: '第二篇', subtitle: '篇章说明', timelineValid: true, segments: [] },
]

afterEach(cleanup)

describe('chapter directory', () => {
  it('lists chapters and selects a different chapter', () => {
    const onSelect = vi.fn()
    render(<ChapterDirectory open chapters={chapters} currentChapterId="a" onClose={vi.fn()} onSelect={onSelect} />)
    expect(screen.getByRole('dialog', { name: '章节目录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /第一篇/ })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: /第二篇/ }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })
})
