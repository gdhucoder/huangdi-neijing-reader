import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReaderBook } from '../content/contentProvider'
import type { ReaderBook } from '../types/reader'
import { ErrorScreen, LoadingScreen } from './HomePage'
export function AboutPage() {
  const [book, setBook] = useState<ReaderBook | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => { getReaderBook().then(setBook).catch((reason: unknown) => { console.error(reason); setError(reason instanceof Error ? reason.message : '内容包无法加载。') }) }, [])
  if (error) return <ErrorScreen message={error} />; if (!book) return <LoadingScreen />
  return <main className="about page-shell"><Link to="/" className="back-link">‹ 返回目录</Link><p className="eyebrow">{book.title} · {book.subtitle ?? '精选'}</p><h1>关于本项目</h1><p>这里收录古籍原文、注音、语音朗读和现代汉语解释。阅读器只呈现已出版的内容包，不生成或改写其中的原文、拼音与译文。</p>{book.sources.length > 0 && <section><h2>内容说明</h2><dl>{book.sources.map((source) => <div key={`${source.label}-${source.value}`}><dt>{source.label}</dt><dd>{source.value}</dd></div>)}</dl></section>}<p className="about-note">本项目是阅读端；内容制作、校音与音频出版由 AncientMedicalTTS 独立完成。</p></main>
}
