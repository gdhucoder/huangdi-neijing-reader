import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReaderBook } from '../content/contentProvider'
import { readProgress } from '../stores/readerStore'
import type { ReaderBook, ReadingProgress } from '../types/reader'

export function HomePage() {
  const [book, setBook] = useState<ReaderBook | null>(null); const [error, setError] = useState<string | null>(null); const [progress, setProgress] = useState<ReadingProgress | null>(() => readProgress())
  useEffect(() => { getReaderBook().then(setBook).catch((reason: unknown) => { console.error(reason); setError(reason instanceof Error ? reason.message : '内容包无法加载。') }) }, [])
  useEffect(() => { const update = () => setProgress(readProgress()); window.addEventListener('focus', update); return () => window.removeEventListener('focus', update) }, [])
  if (error) return <ErrorScreen message={error} />
  if (!book) return <LoadingScreen />
  const currentChapter = book.chapters.find((chapter) => chapter.id === progress?.chapterId); const currentSegment = currentChapter?.segments.find((segment) => segment.id === progress?.segmentId)
  return <main className="home page-shell"><header className="home-header"><p className="eyebrow">Huangdi Neijing Reader</p><h1>{book.title}{book.subtitle && <em>{book.subtitle}</em>}</h1><p className="intro">{book.description ?? '选取适合初读者阅读的篇章，配有注音、朗读与白话解释。'}</p></header>
    {currentChapter && currentSegment && <section className="continue-reading"><p className="section-label">继续阅读</p><h2>{currentChapter.title}</h2><p>“{currentSegment.text.slice(0, 18)}{currentSegment.text.length > 18 ? '…' : ''}”</p><Link to={`/chapter/${currentChapter.id}`} state={{ restoreProgress: true }} className="continue-link">继续阅读</Link></section>}
    <section className="chapter-index"><div className="section-title"><p className="section-label">精选篇章</p><Link to="/about">关于</Link></div><ol>{book.chapters.map((chapter) => <li key={chapter.id}><Link to={`/chapter/${chapter.id}`}><span className="chapter-number">{String(chapter.order).padStart(2, '0')}</span><span><strong>{chapter.title}</strong>{chapter.subtitle && <small>{chapter.subtitle}</small>}</span><b aria-hidden="true">›</b></Link></li>)}</ol></section>
  </main>
}
export function LoadingScreen() { return <main className="center-state"><p className="eyebrow">黄帝内经 · 精选</p><p>正在准备篇章…</p></main> }
export function ErrorScreen({ message }: { message: string }) { return <main className="center-state"><p className="eyebrow">黄帝内经 · 精选</p><h1>暂时无法打开</h1><p>{message}</p><button onClick={() => window.location.reload()}>重新尝试</button></main> }
