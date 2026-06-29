export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPlayCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
  return count.toString()
}

export function formatUserStatus(status: string): string {
  const map: Record<string, string> = { active: '启用', disabled: '禁用' }
  return map[status] || status
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
