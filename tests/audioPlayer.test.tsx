import { createRef, type RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AudioPlayer } from '../src/audio/AudioPlayer'

afterEach(cleanup)

function renderPlayer(overrides: Partial<Parameters<typeof AudioPlayer>[0]> = {}) {
  const audioRef = createRef<HTMLAudioElement>() as RefObject<HTMLAudioElement | null>
  const props: Parameters<typeof AudioPlayer>[0] = {
    audioRef,
    audioUrl: '/audio/chapter-001.mp3',
    title: '第1章',
    isPlaying: false,
    positionMs: 0,
    durationMs: 1000,
    rate: 1,
    canPlay: true,
    canGoPrevious: true,
    canGoNext: true,
    onToggle: vi.fn(),
    onChapterChange: vi.fn(),
    onTimeUpdate: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onEnded: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  }
  render(<AudioPlayer {...props} />)
  return props
}

describe('audio player chapter controls', () => {
  it('switches to the previous or next chapter', () => {
    const onChapterChange = vi.fn()
    renderPlayer({ onChapterChange })
    fireEvent.click(screen.getByRole('button', { name: '上一章' }))
    fireEvent.click(screen.getByRole('button', { name: '下一章' }))
    expect(onChapterChange).toHaveBeenNthCalledWith(1, -1)
    expect(onChapterChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('disables chapter controls at the ends of the book', () => {
    renderPlayer({ canGoPrevious: false, canGoNext: false })
    expect(screen.getByRole('button', { name: '上一章' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一章' })).toBeDisabled()
  })
})
