import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { findActiveSegmentIndex, playableSegments } from './timeline'
import type { ReaderChapter, ReaderSegment } from '../types/reader'

function playErrorMessage(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  if (name === 'NotAllowedError') return '浏览器阻止了自动播放，请解锁后点击播放继续。'
  if (name === 'AbortError') return '播放被系统中断，请解锁后点击播放继续。'
  return '音频无法开始播放，请再试一次。'
}

export function useChapterAudio(
  chapter: ReaderChapter,
  playbackRate: number,
  onActiveSegment: (segment: ReaderSegment | null, positionMs: number) => void,
  onPause: (positionMs: number) => void,
  continuous?: { selectedChapter: ReaderChapter; selectionKey: string; nextOffsetMs?: number },
) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [trackPositionMs, setTrackPositionMs] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const activeIndexRef = useRef(0)
  const sourceTransitionRef = useRef(false)
  const playable = useMemo(() => chapter.timelineValid ? playableSegments(chapter.segments) : [], [chapter.segments, chapter.timelineValid])
  const selectedChapter = continuous?.selectedChapter ?? chapter
  const { id: selectedChapterId, audioUrl } = selectedChapter
  const selectedOffsetMs = selectedChapter.audioOffsetMs ?? 0
  const selectionKey = continuous?.selectionKey
  const audioOffsetMs = chapter.audioOffsetMs ?? 0
  const nextOffsetMs = continuous?.nextOffsetMs
  const relativePosition = useCallback(
    (position: number) => Math.max(0, Math.min(position, nextOffsetMs ?? Infinity) - audioOffsetMs),
    [audioOffsetMs, nextOffsetMs],
  )
  const positionMs = relativePosition(trackPositionMs)

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate }, [playbackRate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const preserveTransition = sourceTransitionRef.current
    sourceTransitionRef.current = false
    activeIndexRef.current = 0
    if (!preserveTransition) audio.pause()
    // The selected route anchors playback. Updating the displayed chapter never
    // runs this effect, even when the shared track crosses several boundaries.
    if (!preserveTransition || selectionKey === undefined) {
      try { audio.currentTime = selectedOffsetMs / 1000 } catch { /* the new source may not have metadata yet */ }
    }
    setTrackPositionMs(selectedOffsetMs)
    setIsPlaying(preserveTransition ? !audio.paused : false)
    setAudioError(null)
  }, [selectedChapterId, audioUrl, selectedOffsetMs, selectionKey])

  const reportPosition = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const absolutePosition = Math.round(audio.currentTime * 1000)
    const nextPosition = relativePosition(absolutePosition)
    setTrackPositionMs(absolutePosition)
    const index = findActiveSegmentIndex(playable, nextPosition, activeIndexRef.current)
    if (index >= 0) activeIndexRef.current = index
    onActiveSegment(index >= 0 ? playable[index] : null, nextPosition)
  }, [onActiveSegment, playable, relativePosition])

  const playElement = async (audio: HTMLAudioElement): Promise<boolean> => {
    try {
      await audio.play()
      setAudioError(null)
      return true
    } catch (error) {
      setAudioError(playErrorMessage(error))
      return false
    }
  }

  const seekAndPlay = async (segment: ReaderSegment): Promise<boolean> => {
    const audio = audioRef.current
    if (!audio || segment.startMs === null || !chapter.audioUrl || !chapter.timelineValid) return false
    try { audio.currentTime = (audioOffsetMs + segment.startMs) / 1000 } catch { /* wait for metadata */ }
    reportPosition()
    return playElement(audio)
  }

  // Start the next source immediately, before routing to its chapter. This keeps
  // the play() call in the same media event/user action instead of waiting for a
  // React route effect, which is important while the phone is locked.
  const startSourceAndPlay = async (audioUrl?: string, startMs = 0): Promise<boolean> => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return false
    sourceTransitionRef.current = true
    if (audio.getAttribute('src') !== audioUrl) {
      audio.src = audioUrl
      audio.load()
    }
    try { audio.currentTime = startMs / 1000 } catch { /* wait for metadata */ }
    return playElement(audio)
  }

  const toggle = async (): Promise<boolean> => {
    const audio = audioRef.current
    if (!audio || !chapter.audioUrl || !playable.length) return false
    if (audio.paused) {
      if (audio.currentTime <= audioOffsetMs / 1000 ||
          (nextOffsetMs !== undefined && audio.currentTime >= nextOffsetMs / 1000)) {
        return seekAndPlay(playable[0])
      }
      return playElement(audio)
    }
    audio.pause()
    return false
  }

  const skip = async (direction: -1 | 1) => {
    const current = Math.max(0, findActiveSegmentIndex(playable, positionMs, activeIndexRef.current))
    const target = playable[Math.min(playable.length - 1, Math.max(0, current + direction))]
    if (target) await seekAndPlay(target)
  }

  return {
    audioRef,
    isPlaying,
    positionMs,
    audioError,
    setAudioError,
    playable,
    toggle,
    skip,
    seekAndPlay,
    startSourceAndPlay,
    onTimeUpdate: reportPosition,
    onPlay: () => { setAudioError(null); setIsPlaying(true) },
    onPause: () => {
      setIsPlaying(false)
      if (audioRef.current) onPause(relativePosition(Math.round(audioRef.current.currentTime * 1000)))
    },
    onEnded: () => setIsPlaying(false),
    onError: () => setAudioError('音频加载失败，请检查网络。'),
  }
}
