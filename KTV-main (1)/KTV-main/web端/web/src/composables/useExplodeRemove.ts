/**
 * HyperOS-style explode remove animation.
 *
 * Usage:
 *   const { trigger, cleanup } = useExplodeRemove()
 *   // in click handler:
 *   await trigger(cardEl)        // plays animation, collapses, removes DOM
 *   // or: trigger(cardEl, { autoRemove: false })  // animate only, remove yourself
 *   // on unmount: cleanup()
 */
export function useExplodeRemove() {
  let rafId: number | null = null
  let active = false

  interface ExplodeOptions {
    particleCount?: number
    duration?: [number, number]   // [min, max] ms
    colors?: string[]
    sizes?: [number, number]      // [min, max] px
    collapseDuration?: number     // ms
    autoRemove?: boolean          // remove element from DOM after collapse
  }

  const defaults: Required<ExplodeOptions> = {
    particleCount: 28,
    duration: [420, 620],
    colors: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fb7185', '#f43f5e', '#ff6b6b', '#ff8787'],
    sizes: [3, 8],
    collapseDuration: 260,
    autoRemove: true,
  }

  /**
   * Trigger the explode-remove animation on a DOM element.
   * Returns a restore function to cancel mid-animation.
   */
  function trigger(el: HTMLElement, opts?: ExplodeOptions) {
    if (active) return () => {}
    active = true

    const o = { ...defaults, ...opts }
    const rect = el.getBoundingClientRect()

    // 1. Trigger: scale 1 → 0.97, opacity 1 → 0.85, 100ms
    el.style.transition = 'transform 0.1s ease, opacity 0.1s ease'
    el.style.transform = 'scale(0.97)'
    el.style.opacity = '0.85'

    const stageB = setTimeout(() => {
      el.style.transition = 'transform 0.45s cubic-bezier(.22,.61,.36,1), opacity 0.45s ease-out'
      el.style.transform = 'scale(0.94)'
      el.style.opacity = '0'

      createCardParticles(el, rect, o)
    }, 100)

    const stageC = setTimeout(() => {
      el.style.transition = `max-height ${o.collapseDuration}ms ease, margin-bottom ${o.collapseDuration}ms ease, padding ${o.collapseDuration}ms ease`
      el.style.maxHeight = '0'
      el.style.marginBottom = '0'
      el.style.paddingTop = '0'
      el.style.paddingBottom = '0'
      el.style.overflow = 'hidden'
    }, 530)

    const done = setTimeout(() => {
      if (o.autoRemove) el.remove()
      active = false
    }, 530 + o.collapseDuration + 50)

    // Return restore function to cancel mid-animation
    return function restore() {
      clearTimeout(stageB)
      clearTimeout(stageC)
      clearTimeout(done)

      el.style.transition = 'transform 0.25s ease, opacity 0.25s ease, max-height 0.25s ease, margin-bottom 0.25s ease, padding 0.25s ease'
      el.style.transform = ''
      el.style.opacity = ''
      el.style.maxHeight = ''
      el.style.marginBottom = ''
      el.style.paddingTop = ''
      el.style.paddingBottom = ''
      el.style.overflow = ''

      setTimeout(() => {
        el.style.transition = ''
      }, 260)

      active = false
    }
  }

  /** Cancel any running animation and reset */
  function cleanup(el?: HTMLElement) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    active = false
    if (el) {
      el.style.transition = ''
      el.style.transform = ''
      el.style.opacity = ''
      el.style.maxHeight = ''
      el.style.marginBottom = ''
      el.style.paddingTop = ''
      el.style.paddingBottom = ''
      el.style.overflow = ''
    }
  }

  return { trigger, cleanup }
}

// --- Internal helpers ---

interface ResolvedOptions {
  particleCount: number
  duration: [number, number]
  colors: string[]
  sizes: [number, number]
  collapseDuration: number
  autoRemove: boolean
}

function createCardParticles(
  el: HTMLElement,
  rect: DOMRect,
  o: ResolvedOptions
) {
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed', inset: '0',
    pointerEvents: 'none', zIndex: '9999',
  })
  document.body.appendChild(container)

  // Sample points across the card surface (grid + randomness)
  const points = generateSurfacePoints(rect, o.particleCount)

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i]
    const size = o.sizes[0] + Math.random() * (o.sizes[1] - o.sizes[0])
    const color = o.colors[Math.floor(Math.random() * o.colors.length)]
    const dur = o.duration[0] + Math.random() * (o.duration[1] - o.duration[0])

    const dot = document.createElement('div')
    Object.assign(dot.style, {
      position: 'fixed', borderRadius: '50%', pointerEvents: 'none',
      left: x + 'px', top: y + 'px',
      width: size + 'px', height: size + 'px',
      background: color,
      opacity: '1', willChange: 'transform, opacity',
    })
    container.appendChild(dot)

    // Direction: outward from card center + randomness
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const angle = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5) * 0.9
    const dist = 30 + Math.random() * 70
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist + 20 // slight downward gravity

    dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.4}px,${dy * 0.4}px) scale(1.2)`, opacity: 0.8, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0, offset: 1 },
    ], {
      duration: dur,
      easing: 'cubic-bezier(.22,.61,.36,1)',
      fill: 'forwards',
    })
  }

  // Edge shimmer: thin highlight strip along card edges
  const shimmer = document.createElement('div')
  Object.assign(shimmer.style, {
    position: 'fixed', pointerEvents: 'none',
    left: rect.left + 'px', top: rect.top + 'px',
    width: rect.width + 'px', height: rect.height + 'px',
    borderRadius: window.getComputedStyle(el).borderRadius || '8px',
    border: '2px solid rgba(248,113,113,0.4)',
    opacity: '1', willChange: 'transform, opacity',
  })
  container.appendChild(shimmer)
  shimmer.animate([
    { transform: 'scale(1)', opacity: 0.5 },
    { transform: 'scale(1.04)', opacity: 0 },
  ], { duration: 400, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' })

  setTimeout(() => container.remove(), o.duration[1] + 100)
}

/** Generate evenly-distributed random points across a rect surface */
function generateSurfacePoints(rect: DOMRect, count: number) {
  const points: { x: number; y: number }[] = []
  const margin = 8

  for (let i = 0; i < count; i++) {
    points.push({
      x: rect.left + margin + Math.random() * (rect.width - margin * 2),
      y: rect.top + margin + Math.random() * (rect.height - margin * 2),
    })
  }
  return points
}
