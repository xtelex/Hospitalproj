import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Don't animate the navbar: adding `transform` to a `position: sticky` header can break stickiness in some browsers.
const SELECTOR = 'main section, main [data-st], main .container > *'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
}

function markStaggerChildren(container) {
  const kids = Array.from(container.children || [])
  kids.forEach((child, idx) => {
    child.style.setProperty('--st-delay', `${Math.min(idx, 10) * 80}ms`)
  })
}

function keepVisible(el) {
  return el.tagName === 'HEADER' || el.closest('header') !== null
}

export default function ScrollTransitions() {
  const location = useLocation()

  useEffect(() => {
    // If an older build added scroll-transition classes to the navbar, remove them.
    // This avoids breaking `position: sticky` for the header during HMR / soft reloads.
    for (const el of Array.from(document.querySelectorAll('header'))) {
      if (!(el instanceof HTMLElement)) continue
      el.classList.remove('st', 'st-in')
      el.style.removeProperty('--st-delay')
      el.style.removeProperty('--st-enter-y')
      el.style.removeProperty('--st-par')
    }

    if (prefersReducedMotion()) return

    const observed = new WeakSet()

    const setupElement = (el, idx) => {
      if (!(el instanceof HTMLElement)) return
      if (!el.classList.contains('st')) el.classList.add('st')

      // Only set a default delay if caller hasn't set one (lets pages override)
      if (!el.style.getPropertyValue('--st-delay')) {
        el.style.setProperty('--st-delay', `${Math.min(idx, 8) * 35}ms`)
      }

      if (el.hasAttribute('data-st-stagger')) markStaggerChildren(el)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target
          if (!(el instanceof HTMLElement)) continue

          // Enter: animate in
          if (entry.isIntersecting && entry.intersectionRatio >= 0.14) {
            el.classList.add('st-in')
            continue
          }

          // Exit: remove so it can replay next time (scroll down OR up)
          // Keep header visible once revealed so it never “disappears”.
          if (keepVisible(el)) continue
          if (!entry.isIntersecting || entry.intersectionRatio <= 0.02) {
            el.classList.remove('st-in')
          }
        }
      },
      { root: null, threshold: [0, 0.02, 0.14], rootMargin: '0px 0px -10% 0px' },
    )

    const refresh = () => {
      const elements = Array.from(document.querySelectorAll(SELECTOR)).filter(
        (el) => el instanceof HTMLElement,
      )
      if (!elements.length) return

      for (const [idx, el] of elements.entries()) {
        setupElement(el, idx)
        if (!observed.has(el)) {
          observed.add(el)
          io.observe(el)
        }
      }
    }

    const revealInView = () => {
      const elements = Array.from(document.querySelectorAll(SELECTOR)).filter(
        (el) => el instanceof HTMLElement,
      )
      const vh = window.innerHeight || 1
      for (const el of elements) {
        const r = el.getBoundingClientRect()
        const inView = r.top < vh * 0.92 && r.bottom > vh * 0.08
        if (inView) el.classList.add('st-in')
      }
    }

    // Observe after a frame so first paint happens, then reveal (landing transition)
    requestAnimationFrame(() => {
      refresh()
      requestAnimationFrame(() => {
        revealInView()
      })
    })

    // Catch dynamically inserted content (e.g. data fetched, skeleton -> cards)
    let refreshRaf = 0
    const scheduleRefresh = () => {
      if (refreshRaf) return
      refreshRaf = window.requestAnimationFrame(() => {
        refreshRaf = 0
        refresh()
      })
    }

    const mo = new MutationObserver(() => scheduleRefresh())
    mo.observe(document.body, { childList: true, subtree: true })

    // Smooth scroll-linked depth (subtle parallax)
    const progressEls = Array.from(document.querySelectorAll('main section')).filter(
      (el) => el instanceof HTMLElement,
    )

    let rafId = 0
    const onFrame = () => {
      rafId = 0
      const vh = window.innerHeight || 1
      for (const el of progressEls) {
        const r = el.getBoundingClientRect()
        const center = r.top + r.height / 2
        const t = (center - vh * 0.5) / (vh * 0.9)
        const clamped = Math.max(-1, Math.min(1, t))
        el.style.setProperty('--st-par', `${clamped * -10}px`)
      }
    }

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(onFrame)
    }

    onFrame()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      if (refreshRaf) window.cancelAnimationFrame(refreshRaf)
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [location.pathname])

  return null
}
