import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  notify,
  alreadyNotified,
  markNotified,
  daysUntil,
  formatDate,
} from '../utils/notify'

// =====================================================================
// ReminderWatcher.jsx — Memantau deadline & item baru lalu memunculkan
// notifikasi (sistem browser + in-app) di laptop/tablet/HP.
// =====================================================================
// - Setiap 60 detik dicek project & task yang deadlinenya hari ini/besok.
// - Setiap deadline hanya mengingatkan satu kali (lokal storage dedupe).
// - Saat target/task dengan deadline baru dibuat, langsung dikirim notif.
// =====================================================================

const toKey = (prefix, id, date) => `${prefix}-${id}-${date}`

export default function ReminderWatcher() {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const addNotification = useStore((s) => s.addNotification)

  // Melacak item yang pernah dilihat untuk notif "baru dibuat".
  const seenProjects = useRef(new Set())
  const seenTasks = useRef(new Set())

  // Minta izin notifikasi sekali saat aplikasi terbuka (best-effort).
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {})
      } catch (e) {
        // Browser memblokir prompt di luar user gesture — abaikan.
      }
    }
  }, [])

  const fire = (notif) => {
    notify(notif)
    addNotification({ title: notif.title, body: notif.body, type: notif.type || 'deadline' })
  }

  // Pengecekan deadline rutin.
  useEffect(() => {
    const checkDeadlines = () => {
      const queue = []

      projects.forEach((p) => {
        if (!p.deadline || p.status === 'completed') return
        const diff = daysUntil(p.deadline)
        const key = toKey('project', p.id, p.deadline)
        if (diff === 0 && !alreadyNotified(key)) {
          queue.push({
            key,
            title: 'Deadline hari ini!',
            body: `Target "${p.name}" jatuh tempo hari ini (${formatDate(p.deadline)})`,
            tag: key,
            type: 'deadline',
          })
        } else if (diff === 1 && !alreadyNotified(key)) {
          queue.push({
            key,
            title: 'Deadline besok',
            body: `Target "${p.name}" berakhir besok (${formatDate(p.deadline)})`,
            tag: key,
            type: 'deadline',
          })
        }
      })

      tasks.forEach((t) => {
        const dl = t.deadline || t.dueDate
        if (!dl || t.status === 'completed') return
        const diff = daysUntil(dl)
        const key = toKey('task', t.id, dl)
        if (diff === 0 && !alreadyNotified(key)) {
          queue.push({
            key,
            title: 'Deadline hari ini!',
            body: `Task "${t.title}" jatuh tempo hari ini (${formatDate(dl)})`,
            tag: key,
            type: 'deadline',
          })
        } else if (diff === 1 && !alreadyNotified(key)) {
          queue.push({
            key,
            title: 'Deadline besok',
            body: `Task "${t.title}" berakhir besok (${formatDate(dl)})`,
            tag: key,
            type: 'deadline',
          })
        }
      })

      queue.forEach((n) => {
        markNotified(n.key)
        fire(n)
      })
    }

    checkDeadlines()
    const id = setInterval(checkDeadlines, 60000)
    return () => clearInterval(id)
  }, [projects, tasks, addNotification])

  // Notifikasi saat target baru dengan deadline dibuat.
  useEffect(() => {
    projects.forEach((p) => {
      if (seenProjects.current.has(p.id)) return
      seenProjects.current.add(p.id)
      if (p.deadline) {
        fire({
          title: 'Target baru dibuat',
          body: `${p.name} — deadline ${formatDate(p.deadline)}`,
          tag: `project-created-${p.id}`,
          type: 'create',
        })
      }
    })
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notifikasi saat task baru dengan deadline dibuat.
  useEffect(() => {
    tasks.forEach((t) => {
      if (seenTasks.current.has(t.id)) return
      seenTasks.current.add(t.id)
      const dl = t.deadline || t.dueDate
      if (dl) {
        fire({
          title: 'Task baru dibuat',
          body: `${t.title} — deadline ${formatDate(dl)}`,
          tag: `task-created-${t.id}`,
          type: 'create',
        })
      }
    })
  }, [tasks]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
