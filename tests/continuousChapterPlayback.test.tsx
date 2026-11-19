import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getReaderBook } from '../src/content/contentProvider'
import { ChapterPage } from '../src/pages/ChapterPage'
import { useSettingsStore } from '../src/stores/settingsStore'
import type { ReaderBook } from '../src/types/reader'

vi.mock('../src/content/contentProvider', () => ({ getReaderBook: vi.fn() }))

const book: ReaderBook = {
  id: 'daodejing-v01',
  title: '道德经',
  sources: [],
  chapters: ['道可道，非常道。', '天下皆知美之为美。', '不尚贤，使民不争。'].map((text, index) => ({
    id: String(index + 1),
    order: index + 1,
    title: `第${index + 1}章`,
    audioUrl: '/books/daodejing-v01/audio/daodejing-continuous.mp3',
    audioOffsetMs: index * 10_000,
    audioDurationMs: 10_000,
    timelineValid: true,
    segments: [{ id: `s${index + 1}`, order: 1, text, speakable: true, startMs: 0, endMs: 10_000 }],
  })),
}

function CurrentPath() {
  return <output aria-label="当前路由">{useLocation().pathname}</output>
}

async function renderBook(autoNextChapter: boolean) {
  useSettingsStore.setState({ autoNextChapter, autoFollow: false })
  const view = render(
    <MemoryRouter initialEntries={['/book/daodejing-v01/chapter/1']}>
      <CurrentPath />
      <Routes>
        <Route path="/book/:bookId/chapter/:chapterId" element={<ChapterPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: '第1章' })
  const audio = view.container.querySelector('audio')!
  let position = 0
  let paused = false
  vi.spyOn(audio, 'paused', 'get').mockImplementation(() => paused)
  vi.spyOn(audio, 'currentTime', 'get').mockImplementation(() => position)
  const seek = vi.spyOn(audio, 'currentTime', 'set').mockImplementation((time) => { position = time })
  const play = vi.spyOn(audio, 'play').mockImplementation(async () => { paused = false })
  const pause = vi.spyOn(audio, 'pause').mockImplementation(() => { paused = true })
  const load = vi.spyOn(audio, 'load').mockImplementation(() => {})
  pause.mockClear() // Ignore the initial chapter setup.
  fireEvent.play(audio)
  return { ...view, audio, play, pause, load, seek, advanceTo: (time: number) => { position = time } }
}

beforeEach(() => {
  vi.mocked(getReaderBook).mockResolvedValue(book)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  useSettingsStore.setState(useSettingsStore.getInitialState())
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('continuous Dao De Jing playback', () => {
  it('updates the chapter only after its boundary, leaving the playing audio untouched', async () => {
    const { container, audio, play, pause, load, seek, advanceTo } = await renderBook(true)
    advanceTo(9.99)
    fireEvent.timeUpdate(audio)
    expect(screen.getByRole('heading', { name: '第1章' })).toBeInTheDocument()

    advanceTo(11.2)
    fireEvent.timeUpdate(audio)
    await screen.findByRole('heading', { name: '第2章' })
    expect(screen.getByText(book.chapters[1].segments[0].text)).toBeInTheDocument()
    expect(screen.getByLabelText('当前路由')).toHaveTextContent('/book/daodejing-v01/chapter/1')
    expect(screen.getByRole('button', { name: '暂停朗读' })).toBeInTheDocument()
    expect(container.querySelector('audio')).toBe(audio)
    expect(audio.getAttribute('src')).toBe(book.chapters[0].audioUrl)
    expect(audio.currentTime).toBe(11.2)
    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
    expect(seek).not.toHaveBeenCalled()
  })

  it('leaves the reading view alone in the background and catches up on return', async () => {
    const { audio, play, pause, seek, advanceTo } = await renderBook(true)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    advanceTo(11.5)
    fireEvent.timeUpdate(audio)
    advanceTo(21.5)
    fireEvent.timeUpdate(audio)
    expect(screen.getByRole('heading', { name: '第1章' })).toBeInTheDocument()
    expect(pause).not.toHaveBeenCalled()

    visibility.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))

    await screen.findByRole('heading', { name: '第3章' })
    expect(audio.currentTime).toBe(21.5)
    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
    expect(seek).not.toHaveBeenCalled()
  })

  it('lets the next button seek once from the displayed chapter', async () => {
    const { audio, play, seek, advanceTo } = await renderBook(true)
    advanceTo(11)
    fireEvent.timeUpdate(audio)
    await screen.findByRole('heading', { name: '第2章' })

    fireEvent.click(screen.getByRole('button', { name: '下一章' }))
    await screen.findByRole('heading', { name: '第3章' })
    expect(seek).toHaveBeenCalledExactlyOnceWith(20)
    expect(play).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('当前路由')).toHaveTextContent('/book/daodejing-v01/chapter/3')
  })

  it('stops after the current chapter when automatic advance is off', async () => {
    const { audio, pause, play, seek, advanceTo } = await renderBook(false)
    advanceTo(10.1)
    fireEvent.timeUpdate(audio)

    expect(screen.getByRole('heading', { name: '第1章' })).toBeInTheDocument()
    expect(pause).toHaveBeenCalledTimes(1)
    expect(play).not.toHaveBeenCalled()
    expect(seek).not.toHaveBeenCalled()

    fireEvent.pause(audio)
    fireEvent.click(screen.getByRole('button', { name: '播放朗读' }))
    expect(seek).toHaveBeenCalledOnce()
    expect(seek).toHaveBeenCalledWith(0)
    expect(play).toHaveBeenCalledOnce()
  })
})
