import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AudioPlayer } from '../audio/AudioPlayer'
import { findActiveCharacterIndex } from '../audio/timeline'
import { useChapterAudio } from '../audio/useChapterAudio'
import { ChapterDirectory } from '../components/ChapterDirectory'
import { ReaderSettings } from '../components/ReaderSettings'
import { getReaderBook } from '../content/contentProvider'
import { ReaderText } from '../reader/ReaderText'
import { readProgress, saveProgress } from '../stores/readerStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { ReaderBook, ReaderChapter, ReaderSegment } from '../types/reader'
import { DEFAULT_BOOK_ID } from '../utils/paths'
import { ErrorScreen, LoadingScreen } from './HomePage'

function scrollToFollowPosition(target: HTMLElement, behavior: ScrollBehavior = 'smooth') {
  const topAnchor = Math.max(112, Math.min(window.innerHeight * 0.34, window.innerHeight - 220))
  const targetTop = target.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: Math.max(0, targetTop - topAnchor), behavior })
}

export function ChapterPage() {
  const { bookId, chapterId } = useParams(); const routeBookId = bookId ?? DEFAULT_BOOK_ID; const navigate = useNavigate(); const location = useLocation(); const [book, setBook] = useState<ReaderBook | null>(null); const [error, setError] = useState<string | null>(null); const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null); const [settingsOpen, setSettingsOpen] = useState(false); const [directoryOpen, setDirectoryOpen] = useState(false); const [pausedFollow, setPausedFollow] = useState(false)
  const { fontSize, showPinyin, autoFollow, autoNextChapter, playbackRate } = useSettingsStore(); const lastSegment = useRef<ReaderSegment | null>(null); const lastPosition = useRef(0); const lastFollowSegmentId = useRef<string | null>(null)
  useEffect(() => { setBook(null); setError(null); getReaderBook(routeBookId).then(setBook).catch((reason: unknown) => { console.error(reason); setError(reason instanceof Error ? reason.message : '内容包无法加载。') }) }, [routeBookId])
  const chapter = book?.chapters.find((candidate) => candidate.id === chapterId)
  const persist = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (!book || !chapter) return; const target = segment ?? lastSegment.current; if (!target) return; lastSegment.current = target; lastPosition.current = positionMs; saveProgress({ bookId: book.id, chapterId: chapter.id, segmentId: target.id, audioPositionMs: positionMs }) }, [book, chapter])
  const onActive = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (segment) { lastSegment.current = segment; setActiveSegmentId(segment.id); persist(segment, positionMs) } }, [persist])
  const audio = useChapterAudio(chapter ?? emptyChapter, playbackRate, onActive, (position) => persist(null, position))
  const activeSegment = chapter?.segments.find((segment) => segment.id === activeSegmentId)
  const activeCharacterIndex = activeSegment ? findActiveCharacterIndex(activeSegment.pronunciationTimings, audio.positionMs - (activeSegment.startMs ?? 0)) : -1
  const routeState = location.state as { restoreProgress?: boolean; autoPlay?: boolean } | null
  const chapterIndex = book && chapter ? book.chapters.findIndex((candidate) => candidate.id === chapter.id) : -1
  const previousChapter = chapterIndex > 0 ? book?.chapters[chapterIndex - 1] : undefined
  const nextChapter = chapterIndex >= 0 ? book?.chapters[chapterIndex + 1] : undefined
  const changeChapter = (direction: -1 | 1) => {
    const target = direction < 0 ? previousChapter : nextChapter
    if (!target) return
    // Try to start the new source immediately from the button/media-session
    // event. The route effect below remains as a fallback for slower loads.
    void audio.startSourceAndPlay(target.audioUrl)
    navigate(`/book/${routeBookId}/chapter/${target.id}`, { state: { autoPlay: true } })
  }
  const handleEnded = () => {
    audio.onEnded()
    if (autoNextChapter && nextChapter) {
      void audio.startSourceAndPlay(nextChapter.audioUrl)
      navigate(`/book/${routeBookId}/chapter/${nextChapter.id}`, { state: { autoPlay: true } })
    }
  }
  useEffect(() => { setActiveSegmentId(null); setPausedFollow(false); lastSegment.current = null; lastPosition.current = 0; lastFollowSegmentId.current = null; window.scrollTo({ top: 0, behavior: 'auto' }) }, [chapter?.id])
  useEffect(() => { if (!book || !chapter || !routeState?.restoreProgress) return; const progress = readProgress(book.id); const segment = progress?.chapterId === chapter.id ? chapter.segments.find((item) => item.id === progress.segmentId) : undefined; if (!segment) return; lastSegment.current = segment; lastPosition.current = progress!.audioPositionMs; setActiveSegmentId(segment.id); requestAnimationFrame(() => { const target = document.getElementById(`segment-${segment.id}`); if (target) scrollToFollowPosition(target, 'auto') }) }, [book, chapter, routeState?.restoreProgress])
  useEffect(() => {
    if (!chapter || !routeState?.autoPlay || !audio.playable.length) return
    const element = audio.audioRef.current
    if (!element) return
    let cancelled = false
    let attempted = false
    const start = () => {
      if (cancelled || attempted) return
      attempted = true
      void audio.seekAndPlay(audio.playable[0]).then((started) => {
        if (!cancelled && started) navigate(location.pathname, { replace: true, state: null })
      })
    }
    const retryWhenVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!element.paused) {
        navigate(location.pathname, { replace: true, state: null })
        return
      }
      attempted = false
      if (element.readyState >= 1) start()
    }
    if (element.readyState >= 1) start()
    else {
      element.addEventListener('loadedmetadata', start, { once: true })
      element.addEventListener('canplay', start, { once: true })
    }
    document.addEventListener('visibilitychange', retryWhenVisible)
    window.addEventListener('pageshow', retryWhenVisible)
    window.addEventListener('focus', retryWhenVisible)
    return () => {
      cancelled = true
      element.removeEventListener('loadedmetadata', start)
      element.removeEventListener('canplay', start)
      document.removeEventListener('visibilitychange', retryWhenVisible)
      window.removeEventListener('pageshow', retryWhenVisible)
      window.removeEventListener('focus', retryWhenVisible)
    }
  }, [chapter?.id, routeState?.autoPlay, audio.playable.length, location.pathname, navigate])
  useEffect(() => {
    if (!chapter || !book || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { session.setActionHandler(action, handler) } catch { /* unsupported actions are normal on some browsers */ }
    }
    if (typeof MediaMetadata !== 'undefined') {
      try {
        session.metadata = new MediaMetadata({ title: chapter.title, artist: '经典诵读', album: chapter.collection ?? book.title })
      } catch { /* older browsers may expose mediaSession without MediaMetadata */ }
    }
    setHandler('play', () => { void audio.toggle() })
    setHandler('pause', () => audio.audioRef.current?.pause())
    setHandler('nexttrack', () => changeChapter(1))
    setHandler('previoustrack', () => changeChapter(-1))
    setHandler('seekbackward', (details) => {
      const element = audio.audioRef.current
      if (element) element.currentTime = Math.max(0, element.currentTime - (details.seekOffset ?? 10))
    })
    setHandler('seekforward', (details) => {
      const element = audio.audioRef.current
      if (element) element.currentTime = Math.min(element.duration || Infinity, element.currentTime + (details.seekOffset ?? 10))
    })
    setHandler('seekto', (details) => {
      const element = audio.audioRef.current
      if (!element || details.seekTime === undefined) return
      if (details.fastSeek && 'fastSeek' in element) element.fastSeek(details.seekTime)
      else element.currentTime = details.seekTime
    })
    return () => {
      setHandler('play', null)
      setHandler('pause', null)
      setHandler('nexttrack', null)
      setHandler('previoustrack', null)
      setHandler('seekbackward', null)
      setHandler('seekforward', null)
      setHandler('seekto', null)
      if (session.metadata?.title === chapter.title) session.metadata = null
    }
  }, [book?.title, chapter?.id, chapter?.title, chapter?.collection, nextChapter?.id, previousChapter?.id])
  useEffect(() => {
    if (!chapter || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    session.playbackState = audio.isPlaying ? 'playing' : 'paused'
    const elementDuration = audio.audioRef.current?.duration ?? Number.NaN
    const duration = Number.isFinite(elementDuration) && elementDuration > 0 ? elementDuration : (chapter.audioDurationMs ?? 0) / 1000
    if (typeof session.setPositionState !== 'function' || !Number.isFinite(duration) || duration <= 0) return
    try {
      session.setPositionState({ duration, playbackRate, position: Math.min(duration, Math.max(0, audio.positionMs / 1000)) })
    } catch { /* position state is optional and can be rejected while metadata loads */ }
  }, [chapter?.id, chapter?.audioDurationMs, audio.isPlaying, audio.positionMs, playbackRate])
  useEffect(() => {
    // Auto-follow uses scrollIntoView, which also emits scroll events. Listening
    // to scroll itself therefore immediately cancelled following after the
    // first line. Wheel/touch movement represents an explicit user decision to
    // browse independently, while programmatic scrolling does not emit either.
    const pauseFollow = () => setPausedFollow(true)
    window.addEventListener('wheel', pauseFollow, { passive: true })
    window.addEventListener('touchmove', pauseFollow, { passive: true })
    return () => {
      window.removeEventListener('wheel', pauseFollow)
      window.removeEventListener('touchmove', pauseFollow)
    }
  }, [])
  useEffect(() => { const onHidden = () => { if (document.visibilityState === 'hidden') persist(null, lastPosition.current) }; document.addEventListener('visibilitychange', onHidden); return () => { document.removeEventListener('visibilitychange', onHidden); persist(null, lastPosition.current) } }, [persist])
  useEffect(() => {
    // Re-enabling the setting should also resume following after a manual
    // scroll paused it. Clearing the remembered segment makes the current
    // reading position recenter immediately.
    if (autoFollow) {
      setPausedFollow(false)
      lastFollowSegmentId.current = null
    }
  }, [autoFollow])
  useEffect(() => {
    if (!activeSegmentId || !autoFollow || pausedFollow) return
    const target = document.getElementById(activeCharacterIndex >= 0 ? `character-${activeSegmentId}-${activeCharacterIndex}` : `segment-${activeSegmentId}`)
    if (!target) return
    const segmentChanged = lastFollowSegmentId.current !== activeSegmentId
    lastFollowSegmentId.current = activeSegmentId
    const box = target.getBoundingClientRect()
    const topGuard = 96
    const bottomGuard = window.innerHeight - 180
    // Always bring a newly reached segment into view. Within the same segment
    // we keep the softer guard-band behaviour so the page does not constantly
    // move for every character.
    if (segmentChanged || box.top < topGuard || box.bottom > bottomGuard) scrollToFollowPosition(target)
  }, [activeSegmentId, activeCharacterIndex, autoFollow, pausedFollow])
  if (error) return <ErrorScreen message={error} />; if (!book) return <LoadingScreen />; if (!chapter) return <ErrorScreen message="未找到这一篇。" />
  const canPlay = Boolean(chapter.audioUrl && chapter.timelineValid && audio.playable.length)
  const returnToAudio = () => { if (!activeSegmentId) return; setPausedFollow(false); const target = document.getElementById(activeCharacterIndex >= 0 ? `character-${activeSegmentId}-${activeCharacterIndex}` : `segment-${activeSegmentId}`); if (target) scrollToFollowPosition(target) }
  const selectChapter = (nextChapterId: string) => { setDirectoryOpen(false); if (nextChapterId !== chapter.id) navigate(`/book/${routeBookId}/chapter/${nextChapterId}`) }
  return <main className="chapter-page"><header className="reader-header"><button className="icon-button" onClick={() => navigate(`/book/${routeBookId}`)} aria-label="返回目录">‹</button><button className="chapter-title-button" onClick={() => setDirectoryOpen(true)} aria-label="打开章节目录"><p className="eyebrow">{chapter.collection}</p><h1>{chapter.title}<span aria-hidden="true">⌄</span></h1></button><button className="type-button" onClick={() => setSettingsOpen(true)} aria-label="打开阅读设置">A<span>a</span></button></header><div className="reader-main">{!chapter.timelineValid && <p className="inline-notice">此篇时间轴有误，正文仍可阅读，但无法定位朗读。</p>}{audio.audioError && <p className="inline-notice">{audio.audioError}</p>}<ReaderText chapter={chapter} activeSegmentId={activeSegmentId} activeCharacterIndex={activeCharacterIndex} showPinyin={showPinyin} fontSize={fontSize} onPlay={audio.seekAndPlay} />{pausedFollow && activeSegmentId && <button className="follow-button" onClick={returnToAudio}>回到朗读位置</button>}</div><AudioPlayer audioRef={audio.audioRef} audioUrl={chapter.audioUrl} title={chapter.title} isPlaying={audio.isPlaying} positionMs={audio.positionMs} durationMs={chapter.audioDurationMs} rate={playbackRate} canPlay={canPlay} canGoPrevious={Boolean(previousChapter)} canGoNext={Boolean(nextChapter)} onToggle={audio.toggle} onChapterChange={changeChapter} onTimeUpdate={audio.onTimeUpdate} onPlay={audio.onPlay} onPause={audio.onPause} onEnded={handleEnded} onError={audio.onError} /><ChapterDirectory open={directoryOpen} chapters={book.chapters} currentChapterId={chapter.id} onClose={() => setDirectoryOpen(false)} onSelect={selectChapter} /><ReaderSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} /></main>
}
const emptyChapter: ReaderChapter = { id: '', order: 0, title: '', timelineValid: false, segments: [] }
