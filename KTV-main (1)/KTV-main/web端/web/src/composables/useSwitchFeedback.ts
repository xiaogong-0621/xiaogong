import { ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'

export function useSwitchFeedback() {
  const player = usePlayerStore()

  const switchAnims = ref<Record<number, { old?: boolean; new?: boolean; glow?: boolean; dim?: boolean }>>({})
  const timeouts: ReturnType<typeof setTimeout>[] = []

  function clearTimeouts() {
    timeouts.forEach(clearTimeout)
    timeouts.length = 0
  }

  function rowClass(qid: number) {
    const a = switchAnims.value[qid]
    if (!a) return {}
    return {
      'switch-old': !!a.old,
      'switch-new': !!a.new,
      'switch-glow': !!a.glow,
      'switch-dim': !!a.dim,
    }
  }

  function triggerCoverFly(containerEl: HTMLElement, targetEl: HTMLElement) {
    const newQid = player.currentQueueItemId
    if (newQid == null) return
    const row = containerEl.querySelector(`[data-playlist-qid="${newQid}"]`) as HTMLElement
    if (!row) return
    const cover = row.querySelector('img') as HTMLElement
    if (!cover) return

    const from = cover.getBoundingClientRect()
    const to = targetEl.getBoundingClientRect()
    if (from.width === 0 || to.width === 0) return

    const clone = document.createElement('div')
    const isDark = !!document.querySelector('.lyrics-overlay')
    clone.style.cssText = `
      position:fixed;z-index:9999;pointer-events:none;border-radius:8px;overflow:hidden;
      left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;
      background:${isDark ? 'rgba(113,252,254,.15)' : 'linear-gradient(135deg,#6750A4,#EADDFF)'};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.15);
    `
    const icon = document.createElement('span')
    icon.className = 'material-symbols-outlined'
    icon.style.cssText = `font-size:18px;color:${isDark ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.7)'}`
    icon.textContent = 'music_note'
    clone.appendChild(icon)
    document.body.appendChild(clone)

    const dx = to.left - from.left
    const dy = to.top - from.top
    const sx = to.width / from.width
    const sy = to.height / from.height

    clone.animate([
      {
        transform: 'translate(0,0) scale(1) rotate(0deg)',
        opacity: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      },
      {
        transform: `translate(${dx * 0.45}px,${dy * 0.3 - 24}px) scale(.72) rotate(-6deg)`,
        opacity: .85,
        boxShadow: `0 8px 24px ${isDark ? 'rgba(113,252,254,.2)' : 'rgba(103,80,164,.25)'}`,
        offset: .45,
      },
      {
        transform: `translate(${dx}px,${dy}px) scale(${sx},${sy}) rotate(0deg)`,
        opacity: .5,
        boxShadow: '0 1px 4px rgba(0,0,0,.1)',
      },
    ], {
      duration: 480,
      easing: 'cubic-bezier(.4,0,.2,1)',
      fill: 'forwards',
    }).onfinish = () => {
      clone.remove()
      targetEl.classList.add('cover-catch')
      setTimeout(() => targetEl.classList.remove('cover-catch'), 400)
    }
  }

  watch(() => player.currentQueueItemId, (newQid, oldQid) => {
    if (newQid == null || oldQid == null || newQid === oldQid) return
    clearTimeouts()

    // Reset previous state
    switchAnims.value = {}

    const newState: Record<number, { old?: boolean; new?: boolean; glow?: boolean; dim?: boolean }> = {}
    // Old song fades
    newState[oldQid] = { old: true }
    // New song rises + glows
    newState[newQid] = { new: true, glow: true }
    // Other songs dim briefly
    for (const item of player.queue) {
      const id = item.queueItemId
      if (id !== oldQid && id !== newQid) {
        newState[id] = { dim: true }
      }
    }
    switchAnims.value = newState

    // Remove dim after 300ms
    timeouts.push(setTimeout(() => {
      const s = { ...switchAnims.value }
      for (const qid of Object.keys(s)) {
        const id = Number(qid)
        if (s[id]?.dim && id !== newQid && id !== oldQid) {
          const { dim, ...rest } = s[id]
          s[id] = rest
        }
      }
      switchAnims.value = s
    }, 300))

    // Clear all after 600ms
    timeouts.push(setTimeout(() => {
      switchAnims.value = {}
    }, 600))
  })

  return { rowClass, triggerCoverFly }
}
