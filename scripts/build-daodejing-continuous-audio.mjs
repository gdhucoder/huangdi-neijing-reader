import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname, 'public/books/daodejing-v01')
const bookPath = join(root, 'book.json')
const book = JSON.parse(readFileSync(bookPath, 'utf8'))
const chapters = [...book.chapters].sort((a, b) => a.order - b.order)
const outputRelativePath = 'audio/daodejing-continuous.mp3'
const outputPath = join(root, outputRelativePath)
const workDir = mkdtempSync(join(tmpdir(), 'daodejing-audio-'))
const listPath = join(workDir, 'concat.txt')

function probeDurationMs(filePath) {
  const value = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath], { encoding: 'utf8' }).trim()
  const durationMs = Math.round(Number(value) * 1000)
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error(`无法读取音频时长：${filePath}`)
  return durationMs
}

try {
  const concatEntries = chapters.map((entry) => {
    const filePath = join(root, entry.audio)
    if (!filePath.endsWith('.mp3')) throw new Error(`章节音频不是 MP3：${entry.audio}`)
    return { filePath, durationMs: probeDurationMs(filePath) }
  })
  writeFileSync(listPath, concatEntries.map(({ filePath }) => `file '${filePath.replaceAll("'", "'\\''")}'`).join('\n') + '\n')
  mkdirSync(dirname(outputPath), { recursive: true })
  // Re-encode the concatenated stream so the output has monotonically
  // increasing timestamps. Stream-copying independently encoded MP3 files can
  // leave non-monotonic DTS at chapter boundaries, which hurts seeking on iOS.
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-map_metadata', '-1', '-c:a', 'libmp3lame', '-ar', '16000', '-ac', '1', '-b:a', '96k', outputPath], { stdio: 'inherit' })

  let offsetMs = 0
  for (const [index, entry] of chapters.entries()) {
    const chapterPath = join(root, entry.content)
    const chapter = JSON.parse(readFileSync(chapterPath, 'utf8'))
    chapter.audio ??= {}
    chapter.audio.offset_ms = offsetMs
    writeFileSync(chapterPath, `${JSON.stringify(chapter, null, 2)}\n`)
    offsetMs += concatEntries[index].durationMs
  }

  book.audio = { format: 'mp3', mode: 'continuous', src: outputRelativePath, duration_ms: probeDurationMs(outputPath) }
  writeFileSync(bookPath, `${JSON.stringify(book, null, 2)}\n`)
  console.log(JSON.stringify({ output: outputRelativePath, chapters: chapters.length, duration_ms: book.audio.duration_ms, size_bytes: readFileSync(outputPath).byteLength }, null, 2))
} finally {
  rmSync(workDir, { recursive: true, force: true })
}
