import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReaderSegment } from '../src/reader/ReaderSegment'
const segment = { id: 's1', order: 1, text: '余闻上古之人。', speakable: true, startMs: 1000, endMs: 2000, translation: '我听说上古时代的人。' }
afterEach(cleanup)
describe('reader segment interaction', () => {
  it('seeks only when its readable text is tapped', () => { const onPlay = vi.fn(); render(<ReaderSegment segment={segment} active={false} showPinyin={false} onPlay={onPlay} />); fireEvent.click(screen.getByText(segment.text)); expect(onPlay).toHaveBeenCalledWith(segment) })
  it('does not seek when opening translation', () => { const onPlay = vi.fn(); render(<ReaderSegment segment={segment} active={false} showPinyin={false} onPlay={onPlay} />); fireEvent.click(screen.getByRole('button', { name: '白话' })); expect(onPlay).not.toHaveBeenCalled(); expect(screen.getByText(segment.translation)).toBeInTheDocument() })
  it('does not seek when text is selected', () => { const onPlay = vi.fn(); const original = window.getSelection; Object.defineProperty(window, 'getSelection', { configurable: true, value: () => ({ toString: () => '余闻' }) }); render(<ReaderSegment segment={segment} active={false} showPinyin={false} onPlay={onPlay} />); fireEvent.click(screen.getByText(segment.text)); expect(onPlay).not.toHaveBeenCalled(); Object.defineProperty(window, 'getSelection', { configurable: true, value: original }) })
})
