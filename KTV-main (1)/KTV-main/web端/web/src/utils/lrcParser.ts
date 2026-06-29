export interface LyricLine {
  time: number  // seconds
  text: string
}

/**
 * Parse standard LRC format: [mm:ss.xx] lyric text
 */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  const re = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/
  for (const raw of lrc.split('\n')) {
    const m = raw.trim().match(re)
    if (!m) continue
    const min = parseInt(m[1])
    const sec = parseInt(m[2])
    const ms = m[3].length === 3 ? parseInt(m[3]) : parseInt(m[3]) * 10
    lines.push({ time: min * 60 + sec + ms / 1000, text: m[4] })
  }
  return lines.sort((a, b) => a.time - b.time)
}

/**
 * Find the index of the currently active lyric line.
 */
export function findCurrentLine(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i
    else break
  }
  return idx
}
