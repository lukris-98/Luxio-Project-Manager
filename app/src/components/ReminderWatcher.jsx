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
// - Setiap 15 menit dicek project & task yang deadlinenya hari ini/besok.
// - Setiap deadline hanya mengingatkan satu kali (lokal storage dedupe).
// - Saat target/task dengan deadline baru dibuat, langsung dikirim notif.
// =====================================================================

const SEEN_PROJECTS_KEY = 'luxio-seen-projects'
const SEEN_TASKS_KEY = 'luxio-seen-tasks'
const toKey = (prefix, id, date) => `${prefix}-${id}-${date}`

// Muat daftar item yang sudah pernah dilihat dari localStorage.
function loadSeen(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || '[]'))
  } catch {
    return new Set()
  }
}

// Simpan Set ke localStorage.
function saveSeen(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // localStorage penuh — abaikan.
  }
}

export default function ReminderWatcher() {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const addNotification = useStore((s) => s.addNotification)

  // Melacak item yang pernah dilihat — persist ke localStorage agar
  // tidak memunculkan notif "baru dibuat" setiap kali ganti halaman.
  const seenProjects = useRef(loadSeen(SEEN_PROJECTS_KEY))
  const seenTasks = useRef(loadSeen(SEEN_TASKS_KEY))

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
    addNotification({
      title: notif.title,
      body: notif.body,
      type: notif.type || 'deadline',
      page: notif.page || '',
      params: notif.params || {},
    })
  }

  // Pengecekan deadline rutin (setiap 15 menit + saat aplikasi dibuka).
  useEffect(() => {
    const checkDeadlines = () => {
      const today = []
      const tomorrow = []

      projects.forEach((p) => {
        if (!p.deadline || p.status === 'completed') return
        const diff = daysUntil(p.deadline)
        const key = toKey('project', p.id, p.deadline)
        if (diff === 0 && !alreadyNotified(key)) {
          today.push({ key, name: p.name, date: formatDate(p.deadline) })
        } else if (diff === 1 && !alreadyNotified(key)) {
          tomorrow.push({ key, name: p.name, date: formatDate(p.deadline) })
        }
      })

      tasks.forEach((t) => {
        const dl = t.deadline || t.dueDate
        if (!dl || t.status === 'completed') return
        const diff = daysUntil(dl)
        const key = toKey('task', t.id, dl)
        if (diff === 0 && !alreadyNotified(key)) {
          today.push({ key, name: t.title, date: formatDate(dl) })
        } else if (diff === 1 && !alreadyNotified(key)) {
          tomorrow.push({ key, name: t.title, date: formatDate(dl) })
        }
      })

      // Gabung jadi SATU notifikasi per kelompok agar tidak banjir toast.
      if (today.length > 0) {
        today.forEach((n) => markNotified(n.key))
        fire({
          title: `Deadline hari ini (${today.length})`,
          body: today.slice(0, 5).map((n) => `• ${n.name} — ${n.date}`).join('\n') + (today.length > 5 ? `\n+${today.length - 5} lainnya` : ''),
          tag: 'deadline-today',
          type: 'deadline',
          page: 'projects',
        })
      }

      if (tomorrow.length > 0) {
        tomorrow.forEach((n) => markNotified(n.key))
        fire({
          title: `Deadline besok (${tomorrow.length})`,
          body: tomorrow.slice(0, 5).map((n) => `• ${n.name} — ${n.date}`).join('\n') + (tomorrow.length > 5 ? `\n+${tomorrow.length - 5} lainnya` : ''),
          tag: 'deadline-tomorrow',
          type: 'deadline',
          page: 'projects',
        })
      }
    }

    checkDeadlines()
    const id = setInterval(checkDeadlines, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [projects, tasks, addNotification])

  // Notifikasi saat target baru dengan deadline dibuat — digabung jadi satu.
  useEffect(() => {
    let dirty = false
    const created = []
    projects.forEach((p) => {
      if (seenProjects.current.has(p.id)) return
      seenProjects.current.add(p.id)
      dirty = true
      if (p.deadline) {
        created.push(`${p.name} (${formatDate(p.deadline)})`)
      }
    })
    if (dirty) saveSeen(SEEN_PROJECTS_KEY, seenProjects.current)
    if (created.length > 0) {
      fire({
        title: `Target baru dibuat (${created.length})`,
        body: created.slice(0, 5).join('\n') + (created.length > 5 ? `\n+${created.length - 5} lainnya` : ''),
        tag: `project-created-batch`,
        type: 'create',
        page: 'projects',
      })
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notifikasi saat task baru dengan deadline dibuat — digabung jadi satu.
  useEffect(() => {
    let dirty = false
    const created = []
    tasks.forEach((t) => {
      if (seenTasks.current.has(t.id)) return
      seenTasks.current.add(t.id)
      dirty = true
      const dl = t.deadline || t.dueDate
      if (dl) {
        created.push(`${t.title} (${formatDate(dl)})`)
      }
    })
    if (dirty) saveSeen(SEEN_TASKS_KEY, seenTasks.current)
    if (created.length > 0) {
      fire({
        title: `Task baru dibuat (${created.length})`,
        body: created.slice(0, 5).join('\n') + (created.length > 5 ? `\n+${created.length - 5} lainnya` : ''),
        tag: `task-created-batch`,
        type: 'create',
        page: 'todo-list',
      })
    }
  }, [tasks]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
