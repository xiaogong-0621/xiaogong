/**
 * Radial-fill + jelly-bounce heart animation.
 * Matches prototype/heart-fill.html variant B — 1.5x slower.
 */
export function useHeartAnimation() {
  let busy = false

  function toggleHeart(
    btn: HTMLElement,
    toFilled: boolean,
    onDone?: () => void,
  ) {
    if (busy) return
    busy = true

    const fillSvg = btn.querySelector('.heart-fill-svg') as HTMLElement | null
    if (!fillSvg) { busy = false; return }

    // Cancel any in-flight animation
    fillSvg.getAnimations().forEach(a => a.cancel())
    const icon = btn.querySelector('.heart-icon') as HTMLElement | null
    icon?.getAnimations().forEach(a => a.cancel())
    // Remove leftover glow
    btn.querySelector('.heart-pop-glow')?.remove()

    if (toFilled) {
      fill()
    } else {
      unfill()
    }

    function fill() {
      btn.classList.add('is-fav')
      fillSvg!.style.clipPath = 'circle(0% at 50% 55%)'
      fillSvg!.style.opacity = '1'

      fillSvg!.animate([
        { clipPath: 'circle(0% at 50% 55%)' },
        { clipPath: 'circle(75% at 50% 55%)' },
      ], { duration: 675, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })

      // Jelly bounce — starts after fill completes
      if (icon) {
        icon.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.25, 0.8)' },
          { transform: 'scale(0.88, 1.12)' },
          { transform: 'scale(1.1, 0.92)' },
          { transform: 'scale(0.97, 1.03)' },
          { transform: 'scale(1, 1)' },
        ], { duration: 1375, delay: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' })
      }

      // Pop glow — radial gradient burst at fill complete
      const glow = document.createElement('div')
      glow.className = 'heart-pop-glow'
      glow.style.cssText = 'position:absolute;inset:-4px;border-radius:50%;pointer-events:none;opacity:0;' +
        'background:radial-gradient(circle,rgba(239,68,68,0.3) 0%,transparent 70%)'
      btn.style.position = 'relative'
      btn.appendChild(glow)
      glow.animate([
        { transform: 'scale(0.5)', opacity: 0.8 },
        { transform: 'scale(2)', opacity: 0 },
      ], { duration: 1200, delay: 660, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })

      // Particles at fill complete
      spawnPop(btn, 660)

      // Resolve after all animations finish
      setTimeout(() => { busy = false; glow.remove(); onDone?.() }, 1975)
    }

    function unfill() {
      fillSvg!.style.clipPath = 'circle(75% at 50% 55%)'
      fillSvg!.style.opacity = '1'

      fillSvg!.animate([
        { clipPath: 'circle(75% at 50% 55%)' },
        { clipPath: 'circle(0% at 50% 55%)' },
      ], { duration: 480, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).onfinish = () => {
        fillSvg!.style.opacity = '0'
        btn.classList.remove('is-fav')
        busy = false
        onDone?.()
      }
    }
  }

  function spawnPop(btn: HTMLElement, delay = 0) {
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const colors = ['#ef4444', '#f87171', '#fca5a5', '#fb7185']

    setTimeout(() => {
      const layer = document.createElement('div')
      Object.assign(layer.style, {
        position: 'fixed', inset: '0',
        pointerEvents: 'none', zIndex: '9999',
      })
      document.body.appendChild(layer)

      for (let i = 0; i < 8; i++) {
        const dot = document.createElement('div')
        const size = 2 + Math.random() * 3
        Object.assign(dot.style, {
          position: 'fixed', borderRadius: '50%', pointerEvents: 'none',
          left: cx + 'px', top: cy + 'px',
          width: size + 'px', height: size + 'px',
          background: colors[Math.floor(Math.random() * colors.length)],
          opacity: '1', willChange: 'transform, opacity',
        })
        layer.appendChild(dot)

        const angle = (Math.PI * 2 * i) / 8
        const dist = 16 + Math.random() * 12
        dot.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 },
        ], { duration: 480 + Math.random() * 150, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' })
      }

      setTimeout(() => layer.remove(), 750)
    }, delay)
  }

  return { toggleHeart }
}
