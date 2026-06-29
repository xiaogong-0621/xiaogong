/**
 * Click-feedback particle burst.
 * Small red dots radiate outward from the click target, like a button splash.
 * Used on favorite/unfavorite hearts across the app.
 */
export function useParticleBurst() {
  const colors = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fb7185', '#f43f5e']

  function burst(el: HTMLElement, count = 14) {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const layer = document.createElement('div')
    Object.assign(layer.style, {
      position: 'fixed', inset: '0',
      pointerEvents: 'none', zIndex: '9999',
    })
    document.body.appendChild(layer)

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div')
      const size = 2 + Math.random() * 5
      Object.assign(dot.style, {
        position: 'fixed', borderRadius: '50%', pointerEvents: 'none',
        left: cx + 'px', top: cy + 'px',
        width: size + 'px', height: size + 'px',
        background: colors[Math.floor(Math.random() * colors.length)],
        opacity: '1', willChange: 'transform, opacity',
      })
      layer.appendChild(dot)

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const dist = 15 + Math.random() * 30
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist + 10
      const dur = 280 + Math.random() * 180

      dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' })
    }

    setTimeout(() => layer.remove(), 550)
  }

  return { burst }
}
