import { useState } from 'react'
import { useStore } from '../store/useStore'
import { daysUntil, formatDate } from '../utils/notify'
import './HeadlineMarquee.css'

// =====================================================================
// HeadlineMarquee.jsx — Teks berita berjalan kanan → kiri di header.
// =====================================================================
// Headline diambil dari deadline project/task yang paling dekat.
// Jika tidak ada data deadline, dipakai headline default (berita promo).
// Animasi: 3 putaran (kanan ke kiri) lalu berhenti dan menghilang.
// =====================================================================

const DEFAULT_HEADLINES = [
  '🚀 Luxio siap membantu tim kamu mencapai target lebih cepat',
  '⏰ Setiap target & task dengan deadline kini otomatis diingatkan',
  '📱 Notifikasi bisa muncul di laptop, tablet, maupun HP',
  '🎯 12 Target Aktif · 8 Selesai · 4 On Progress',
]

export default function HeadlineMarquee({ items, speed = 18 }) {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const [finished, setFinished] = useState(false)

  const buildHeadlines = () => {
    const rows = []

    const pushDeadline = (label, name, deadline) => {
      const diff = daysUntil(deadline)
      if (diff === null) return
      if (diff < 0) rows.push(`🔴 Sudah lewat: ${label} "${name}" (${formatDate(deadline)})`)
      else if (diff === 0) rows.push(`⏰ Hari ini: ${label} "${name}" jatuh tempo (${formatDate(deadline)})`)
      else if (diff === 1) rows.push(`🔔 Besok: ${label} "${name}" berakhir (${formatDate(deadline)})`)
      else rows.push(`🗓️ ${formatDate(deadline)}: ${label} "${name}" (${diff} hari lagi)`)
    }

    projects.forEach((p) => {
      if (p.deadline) pushDeadline('Target', p.name, p.deadline)
    })
    tasks.forEach((t) => {
      const dl = t.deadline || t.dueDate
      if (dl && t.status !== 'completed') pushDeadline('Task', t.title, dl)
    })

    rows.sort((a, b) => a.localeCompare(b))
    return rows.length > 0 ? rows.slice(0, 5) : DEFAULT_HEADLINES
  }

  const headlines = items && items.length > 0 ? items : buildHeadlines()
  if (finished) return null

  const text = headlines.map((h) => `✦ ${h}`).join('   ')

  return (
    <div className="headline-marquee" role="marquee" aria-label="Headline berita">
      <div
        className="headline-marquee-track"
        style={{ animationDuration: `${Math.max(text.length / 6, 8)}s` }}
        onAnimationEnd={() => setFinished(true)}
      >
        {text}
      </div>
    </div>
  )
}
