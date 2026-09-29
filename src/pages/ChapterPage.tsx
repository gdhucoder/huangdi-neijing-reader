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
import { ErrorScreen, LoadingScreen } from './HomePage'

export function ChapterPage() {
  const { chapterId } = useParams(); const navigate = useNavigate(); const location = useLocation(); const [book, setBook] = useState<ReaderBook | null>(null); const [error, setError] = useState<string | null>(null); const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null); const [settingsOpen, setSettingsOpen] = useState(false); const [directoryOpen, setDirectoryOpen] = useState(false); const [pausedFollow, setPausedFollow] = useState(false)
  const { fontSize, showPinyin, autoFollow, playbackRate } = useSettingsStore(); const lastSegment = useRef<ReaderSegment | null>(null); const lastPosition = useRef(0)
  useEffect(() => { getReaderBook().then(setBook).catch((reason: unknown) => { console.error(reason); setError(reason instanceof Error ? reason.message : '内容包无法加载。') }) }, [])
  const chapter = book?.chapters.find((candidate) => candidate.id === chapterId)
  const persist = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (!book || !chapter) return; const target = segment ?? lastSegment.current; if (!target) return; lastSegment.current = target; lastPosition.current = positionMs; saveProgress({ bookId: book.id, chapterId: chapter.id, segmentId: target.id, audioPositionMs: positionMs }) }, [book, chapter])
  const onActive = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (segment) { lastSegment.current = segment; setActiveSegmentId(segment.id); persist(segment, positionMs) } }, [persist])
  const audio = useChapterAudio(chapter ?? emptyChapter, playbackRate, onActive, (position) => persist(null, position))
  const activeSegment = chapter?.segments.find((segment) => segment.id === activeSegmentId)
  const activeCharacterIndex = activeSegment ? findActiveCharacterIndex(activeSegment.pronunciationTimings, audio.positionMs - (activeSegment.startMs ?? 0)) : -1
  useEffect(() => { setActiveSegmentId(null); setPausedFollow(false); lastSegment.current = null; lastPosition.current = 0; window.scrollTo({ top: 0, behavior: 'auto' }) }, [chapter?.id])
  useEffect(() => { if (!chapter || !(location.state as { restoreProgress?: boolean } | null)?.restoreProgress) return; const progress = readProgress(); const segment = progress?.chapterId === chapter.id ? chapter.segments.find((item) => item.id === progress.segmentId) : undefined; if (!segment) return; lastSegment.current = segment; lastPosition.current = progress!.audioPositionMs; setActiveSegmentId(segment.id); requestAnimationFrame(() => document.getElementById(`segment-${segment.id}`)?.scrollIntoView({ block: 'center' })) }, [chapter, location.state])
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
    if (!activeSegmentId || !autoFollow || pausedFollow) return
    const target = document.getElementById(activeCharacterIndex >= 0 ? `character-${activeSegmentId}-${activeCharacterIndex}` : `segment-${activeSegmentId}`)
    if (!target) return
    const box = target.getBoundingClientRect()
    const topGuard = 96
    const bottomGuard = window.innerHeight - 180
    if (box.top < topGuard || box.bottom > bottomGuard) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeSegmentId, activeCharacterIndex, autoFollow, pausedFollow])
  if (error) return <ErrorScreen message={error} />; if (!book) return <LoadingScreen />; if (!chapter) return <ErrorScreen message="未找到这一篇。" />
  const canPlay = Boolean(chapter.audioUrl && chapter.timelineValid && audio.playable.length)
  const returnToAudio = () => { if (!activeSegmentId) return; setPausedFollow(false); document.getElementById(activeCharacterIndex >= 0 ? `character-${activeSegmentId}-${activeCharacterIndex}` : `segment-${activeSegmentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  const selectChapter = (nextChapterId: string) => { setDirectoryOpen(false); if (nextChapterId !== chapter.id) navigate(`/chapter/${nextChapterId}`) }
  return <main className="chapter-page"><header className="reader-header"><button className="icon-button" onClick={() => navigate('/')} aria-label="返回目录">‹</button><button className="chapter-title-button" onClick={() => setDirectoryOpen(true)} aria-label="打开章节目录"><p className="eyebrow">{chapter.collection}</p><h1>{chapter.title}<span aria-hidden="true">⌄</span></h1></button><button className="type-button" onClick={() => setSettingsOpen(true)} aria-label="打开阅读设置">A<span>a</span></button></header><div className="reader-main">{!chapter.timelineValid && <p className="inline-notice">此篇时间轴有误，正文仍可阅读，但无法定位朗读。</p>}{audio.audioError && <p className="inline-notice">{audio.audioError}</p>}<ReaderText chapter={chapter} activeSegmentId={activeSegmentId} activeCharacterIndex={activeCharacterIndex} showPinyin={showPinyin} fontSize={fontSize} onPlay={audio.seekAndPlay} />{pausedFollow && activeSegmentId && <button className="follow-button" onClick={returnToAudio}>回到朗读位置</button>}</div><AudioPlayer audioRef={audio.audioRef} audioUrl={chapter.audioUrl} title={chapter.title} isPlaying={audio.isPlaying} positionMs={audio.positionMs} durationMs={chapter.audioDurationMs} rate={playbackRate} canPlay={canPlay} onToggle={audio.toggle} onSkip={audio.skip} onTimeUpdate={audio.onTimeUpdate} onPlay={audio.onPlay} onPause={audio.onPause} onEnded={audio.onEnded} onError={audio.onError} /><ChapterDirectory open={directoryOpen} chapters={book.chapters} currentChapterId={chapter.id} onClose={() => setDirectoryOpen(false)} onSelect={selectChapter} /><ReaderSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} /></main>
}
const emptyChapter: ReaderChapter = { id: '', order: 0, title: '', timelineValid: false, segments: [] }
