import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AudioPlayer } from '../audio/AudioPlayer'
import { useChapterAudio } from '../audio/useChapterAudio'
import { ReaderSettings } from '../components/ReaderSettings'
import { getReaderBook } from '../content/contentProvider'
import { ReaderText } from '../reader/ReaderText'
import { readProgress, saveProgress } from '../stores/readerStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { ReaderBook, ReaderChapter, ReaderSegment } from '../types/reader'
import { ErrorScreen, LoadingScreen } from './HomePage'

export function ChapterPage() {
  const { chapterId } = useParams(); const navigate = useNavigate(); const location = useLocation(); const [book, setBook] = useState<ReaderBook | null>(null); const [error, setError] = useState<string | null>(null); const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null); const [settingsOpen, setSettingsOpen] = useState(false); const [pausedFollow, setPausedFollow] = useState(false)
  const { fontSize, showPinyin, autoFollow, playbackRate } = useSettingsStore(); const programmaticScroll = useRef(false); const scrollTimer = useRef<number | undefined>(undefined); const lastSegment = useRef<ReaderSegment | null>(null); const lastPosition = useRef(0)
  useEffect(() => { getReaderBook().then(setBook).catch((reason: unknown) => { console.error(reason); setError(reason instanceof Error ? reason.message : '内容包无法加载。') }) }, [])
  const chapter = book?.chapters.find((candidate) => candidate.id === chapterId)
  const persist = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (!book || !chapter) return; const target = segment ?? lastSegment.current; if (!target) return; lastSegment.current = target; lastPosition.current = positionMs; saveProgress({ bookId: book.id, chapterId: chapter.id, segmentId: target.id, audioPositionMs: positionMs }) }, [book, chapter])
  const onActive = useCallback((segment: ReaderSegment | null, positionMs: number) => { if (segment) { lastSegment.current = segment; setActiveSegmentId(segment.id); persist(segment, positionMs) } }, [persist])
  const audio = useChapterAudio(chapter ?? emptyChapter, playbackRate, onActive, (position) => persist(null, position))
  useEffect(() => { if (!chapter || !(location.state as { restoreProgress?: boolean } | null)?.restoreProgress) return; const progress = readProgress(); const segment = progress?.chapterId === chapter.id ? chapter.segments.find((item) => item.id === progress.segmentId) : undefined; if (!segment) return; lastSegment.current = segment; lastPosition.current = progress!.audioPositionMs; setActiveSegmentId(segment.id); requestAnimationFrame(() => document.getElementById(`segment-${segment.id}`)?.scrollIntoView({ block: 'center' })) }, [chapter, location.state])
  useEffect(() => { const onScroll = () => { if (!programmaticScroll.current) setPausedFollow(true) }; window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  useEffect(() => { const onHidden = () => { if (document.visibilityState === 'hidden') persist(null, lastPosition.current) }; document.addEventListener('visibilitychange', onHidden); return () => { document.removeEventListener('visibilitychange', onHidden); persist(null, lastPosition.current) } }, [persist])
  useEffect(() => { if (!activeSegmentId || !autoFollow || pausedFollow) return; programmaticScroll.current = true; document.getElementById(`segment-${activeSegmentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); window.clearTimeout(scrollTimer.current); scrollTimer.current = window.setTimeout(() => { programmaticScroll.current = false }, 700) }, [activeSegmentId, autoFollow, pausedFollow])
  if (error) return <ErrorScreen message={error} />; if (!book) return <LoadingScreen />; if (!chapter) return <ErrorScreen message="未找到这一篇。" />
  const canPlay = Boolean(chapter.audioUrl && chapter.timelineValid && audio.playable.length)
  const returnToAudio = () => { if (!activeSegmentId) return; setPausedFollow(false); programmaticScroll.current = true; document.getElementById(`segment-${activeSegmentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); window.setTimeout(() => { programmaticScroll.current = false }, 700) }
  return <main className="chapter-page"><header className="reader-header"><button className="icon-button" onClick={() => navigate('/')} aria-label="返回目录">‹</button><div><p className="eyebrow">{chapter.collection}</p><h1>{chapter.title}</h1></div><button className="type-button" onClick={() => setSettingsOpen(true)} aria-label="打开阅读设置">A<span>a</span></button></header><div className="reader-main">{!chapter.timelineValid && <p className="inline-notice">此篇时间轴有误，正文仍可阅读，但无法定位朗读。</p>}{audio.audioError && <p className="inline-notice">{audio.audioError}</p>}<ReaderText chapter={chapter} activeSegmentId={activeSegmentId} showPinyin={showPinyin} fontSize={fontSize} onPlay={audio.seekAndPlay} />{pausedFollow && activeSegmentId && <button className="follow-button" onClick={returnToAudio}>回到朗读位置</button>}</div><AudioPlayer audioRef={audio.audioRef} audioUrl={chapter.audioUrl} title={chapter.title} isPlaying={audio.isPlaying} positionMs={audio.positionMs} durationMs={chapter.audioDurationMs} rate={playbackRate} canPlay={canPlay} onToggle={audio.toggle} onSkip={audio.skip} onTimeUpdate={audio.onTimeUpdate} onPlay={audio.onPlay} onPause={audio.onPause} onEnded={audio.onEnded} onError={audio.onError} /><ReaderSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} /></main>
}
const emptyChapter: ReaderChapter = { id: '', order: 0, title: '', timelineValid: false, segments: [] }
