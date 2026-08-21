import { useEffect, useRef } from 'react'

// =====================================================================
// ConfettiBurst.jsx — Efek party popper (konfeti canvas) tanpa library.
// Meledak dari bagian atas tengah layar saat `active` bernilai true,
// lalu membersihkan dirinya sendiri. Overlay transparan, tidak
// menghalangi interaksi (pointer-events: none).
// =====================================================================

const COLORS = ['#FF6B35', '#22D3EE', '#A78BFA', '#4ADE80', '#FBBF24', '#F472B6', '#60A5FA']

export default function ConfettiBurst({ active, duration = 3500 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = window.innerWidth
    const H = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Konfeti meledak dari titik di atas tengah (seperti party popper).
    const originX = W / 2
    const originY = H * 0.35
    const pieces = []
    const count = 160
    for (let i = 0; i < count; i++) {
      // Arah dominan ke atas, menyebar ke kiri-kanan.
      const rad = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6
      const speed = 7 + Math.random() * 11
      pieces.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 0.16,
        life: 1,
        decay: 0.006 + Math.random() * 0.01,
      })
    }

    const start = performance.now()
    let raf = 0

    const tick = (now) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, W, H)
      let alive = 0
      pieces.forEach((p) => {
        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rot += p.vr
        p.life -= p.decay
        if (p.life <= 0) return
        alive++
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(p.life, 0)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (alive > 0 && elapsed < duration) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, W, H)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active, duration])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 300,
      }}
    />
  )
}
