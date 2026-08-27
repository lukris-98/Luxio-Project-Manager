// =====================================================================
// useStore.js — State global aplikasi (Zustand).
// =====================================================================
// Satu sumber kebenaran untuk state yang dipakai lintas halaman:
// auth, alur setup (company/divisi/member), project, task, dan kanban.
//
// Catatan penting:
//   - Auth (login/register) sudah terhubung ke backend via api.js.
//   - Project/task/kanban masih MOCK (hanya di memori, hilang saat reload).
//     Migrasi ke backend = langkah berikutnya (lihat README roadmap).
// =====================================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken } from '../services/api'
import { track } from '../utils/analytics'

export const APP_THEME_CONFIG = {
  dark: { scheme: 'dark', color: '#0C0C0E' },
  light: { scheme: 'light', color: '#F1F1F3' },
  'main-white-light': { scheme: 'light', color: '#FFFFFF' },
  'main-white-dark': { scheme: 'dark', color: '#000000' },
}

export const APP_THEME_VALUES = Object.keys(APP_THEME_CONFIG)
export const normalizeAppTheme = (theme) => APP_THEME_VALUES.includes(theme) ? theme : 'dark'
export const getAppThemeConfig = (theme) => APP_THEME_CONFIG[normalizeAppTheme(theme)]
export const getAppThemeFamily = (theme) => normalizeAppTheme(theme).startsWith('main-white') ? 'main-white' : 'luxio'
export const getAppThemeMode = (theme) => normalizeAppTheme(theme).endsWith('light') ? 'light' : 'dark'
export const makeAppTheme = (family, mode) => family === 'main-white'
  ? `main-white-${mode === 'light' ? 'light' : 'dark'}`
  : mode === 'light' ? 'light' : 'dark'
export const toggleAppThemeMode = (theme) => makeAppTheme(getAppThemeFamily(theme), getAppThemeMode(theme) === 'dark' ? 'light' : 'dark')

// Daftar badge gamification beserta ambang XP untuk membukanya.
export const GAMIFICATION_BADGES = [
  { id: 'starter', name: 'Pemula', icon: '🌱', desc: 'Mulai perjalananmu di Luxio', requiresXp: 0 },
  { id: 'worker', name: 'Rajin', icon: '⚒️', desc: 'Kumpulkan 100 XP', requiresXp: 100 },
  { id: 'achiever', name: 'Pencapai', icon: '🎯', desc: 'Kumpulkan 250 XP', requiresXp: 250 },
  { id: 'pro', name: 'Profesional', icon: '💼', desc: 'Kumpulkan 500 XP', requiresXp: 500 },
  { id: 'veteran', name: 'Veteran', icon: '🏆', desc: 'Kumpulkan 1000 XP', requiresXp: 1000 },
  { id: 'legend', name: 'Legenda', icon: '👑', desc: 'Kumpulkan 2000 XP', requiresXp: 2000 },
]

// Hitung level dari total XP (level naik setiap 200 XP).
export const levelFromXp = (xp) => Math.floor((xp || 0) / 200) + 1
export const xpForNextLevel = (xp) => 200 - ((xp || 0) % 200)

// Kunci data per "mode" akun. Akun OWNER punya 4 mode (owner/super_admin/
// admin/user) via fitur act-as — data tiap mode harus TERPISAH supaya tidak
// saling campur. Untuk akun non-owner, kunci data = id user.
export const dataKeyFor = (user, activeRole) => {
  if (!user || user.id == null) return null
  if (user.role === 'owner') return `${user.id}:${activeRole || 'owner'}`
  return String(user.id)
}

// Hitung ulang progress target dengan cara kelola 'kanban':
// persentase task di kolom Done terhadap seluruh task board.
const recalcBoardProgress = (state) => {
  const { kanbanBoards, projects } = state
  return projects.map((p) => {
    const board = kanbanBoards.find((b) => b.projectId === p.id)
    if (!board) return p
    const total = board.columns.reduce((n, c) => n + c.tasks.length, 0)
    if (!total) return { ...p, progress: 0 }
    const done = board.columns.find((c) => c.name === 'Done')?.tasks.length || 0
    return { ...p, progress: Math.round((done / total) * 100) }
  })
}

// Hitung ulang progress target dengan cara kelola 'todo':
// persentase task yang selesai terhadap seluruh task target tersebut.
const recalcTodoProgress = (state) => {
  const { tasks, projects } = state
  return projects.map((p) => {
    if (p.viewType !== 'todo') return p
    const projectTasks = tasks.filter((t) => t.projectId === p.id)
    if (!projectTasks.length) return { ...p, progress: 0 }
    const done = projectTasks.filter((t) => t.status === 'completed').length
    return { ...p, progress: Math.round((done / projectTasks.length) * 100) }
  })
}

// Bangun tahapan (stages) untuk target kanban dari input form:
// tiap tahap = satu kolom kanban; checklist = to-do yang diketik manual.
// Tahap berjalan berurutan: tahap pertama in_progress, sisanya terkunci
// sampai tahap sebelumnya selesai. Tanpa input apa pun, dipakai 3 kolom default.
const buildStages = (stages) => {
  const defaultStages = [
    { id: 1, name: 'To Do', status: 'in_progress', checklist: [] },
    { id: 2, name: 'In Progress', status: 'locked', checklist: [] },
    { id: 3, name: 'Done', status: 'locked', checklist: [] },
  ]
  if (!Array.isArray(stages)) return defaultStages

  const todoItems = (todos) =>
    (Array.isArray(todos) ? todos : [])
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean)
      .map((text, i) => ({ id: i + 1, text, completed: false }))

  const valid = stages.filter((s) => s && s.name && s.name.trim())
  if (valid.length === 0) return defaultStages

  return valid.map((s, idx) => ({
    id: idx + 1,
    name: s.name.trim(),
    status: idx === 0 ? 'in_progress' : 'locked',
    checklist: todoItems(s.todos),
  }))
}

// Hitung ulang member_count tiap divisi. Anggota dihitung unik dari semua
// tim di dalam divisi tersebut (satu orang bisa ada di beberapa tim).
const recomputeDivisionCounts = (divisions, teams, members) =>
  divisions.map((d) => {
    const divisionTeams = teams.filter((t) => t.divisionId === d.id)
    const memberIds = new Set()
    divisionTeams.forEach((t) => t.memberIds.forEach((m) => memberIds.add(m)))
    // Data lama (sebelum ada tim): anggota melekat langsung ke divisi.
    if (divisionTeams.length === 0) {
      members.filter((m) => m.divisionId === d.id).forEach((m) => memberIds.add(m.id))
    }
    return { ...d, memberCount: memberIds.size }
  })

// State dibungkus `persist` agar tersimpan di localStorage — refresh
// tidak menghilangkan login/state. Kunci: 'luxio-store'.
export const useStore = create(
  persist(
    (set, get) => ({
  // Helper: kunci data per mode (owner punya data terpisah per role aktif).
  modeUid: () => dataKeyFor(get().currentUser, get().activeRole) || 'local',
  // ---------- NAVIGASI (tanpa react-router) ----------
  // appState: 'landing' | 'pricing' | 'faq' | 'checkout' | 'auth' | 'setup' | 'app'
  appState: 'landing',
  // currentPage: halaman dalam area 'app' (dashboard, projects, dll)
  currentPage: 'dashboard',

  // ---------- TEMA APLIKASI (tersimpan di localStorage) ----------
  theme: 'dark',
  setTheme: (theme) => set({ theme: normalizeAppTheme(theme) }),

  // ---------- STATE ALUR SETUP ----------
  setupStep: 0,
  // companyInfo.type = tipe akun/workspace yang dipilih di awal setup:
  // 'individual' | 'grup' | 'perusahaan' | 'sekolah'. Field lain diisi
  // tergantung tipe (lihat Setup.jsx).
  companyInfo: {
    name: '',
    industry: '',
    size: '',
    type: '',
  },
  divisions: [],
  members: [],

  // ---------- AUTH & PLAN ----------
  currentUser: null,
  isAuthenticated: false,
  hasCompletedSetup: false,
  currentPlan: 'personal', // personal, profesional, grup, organisasi
  // Role yang sedang dipakai. Untuk akun OWNER bisa diubah-ubah (act-as),
  // untuk akun lain = role aslinya.
  activeRole: null,
  // Session token (Bearer) — disimpan di localStorage juga agar survive
  // refresh tanpa perlu login ulang. Token tidak pernah masuk ke state
  // zustand persist (ada di api.js localStorage), tapi perlu disimpan
  // di sini agar bisa diakses store.
  token: null,

  // ---------- STRUKTUR ORGANISASI ----------
  // Tim di dalam divisi: { id, divisionId, name, adminId, memberIds: [] }.
  // Satu anggota (akun) bisa tergabung di beberapa tim.
  teams: [],

  // ---------- DATA PROJECT / TASK (masih MOCK) ----------
  projects: [],
  tasks: [],
  // Board kanban kustom yang dibuat user (MOCK).
  kanbanBoards: [],
  // Target yang sedang dibuka di halaman detail.
  selectedProjectId: null,
  // Board kanban yang sedang dibuka (dipilih dari sidebar / tab).
  selectedBoardId: null,
  // Kolaborator global untuk task (halaman Todo global).
  todoCollaboratorIds: [],
  // Daftar tema/window (grup item di halaman target/kanban/todo/catatan).
  themes: [],
  // Filter label aktif lintas halaman (dipilih dari dropdown sidebar / filter bar).
  // null = semua label, '' = tanpa label, string = label tertentu.
  labelFilter: null,
  setLabelFilter: (label) => set({ labelFilter: label }),

  // ---------- NOTIFIKASI (in-app + browser) ----------
  // Daftar notifikasi terbaru (deadline, target/task baru, dsb).
  notifications: [],

  // ---------- CATATAN PRIBADI (per user, bisa dikunci PIN) ----------
  // privateNotes[userId] = [ { id, title, content, pin, locked, createdAt, updatedAt } ]
  privateNotes: {},
  // Catatan yang sedang dibuka dari sidebar (untuk membuka tab tertentu).
  selectedNoteId: null,

  // ---------- BAJAK / PENYIMPANAN KREDENSIAL (per user) ----------
  // vault[userId] = [ { id, category, label, username, email, password, url, notes, createdAt, updatedAt } ]
  vault: {},
  // Vault yang sedang dibuka dari sidebar (untuk membuka tab tertentu).
  selectedVaultId: null,

  addVaultEntry: (entry) => {
    const uid = get().modeUid()
    const list = get().vault[uid] || []
    set({
      vault: {
        ...get().vault,
        [uid]: [
          {
            id: Date.now(),
            category: entry.category || 'Lainnya',
            label: entry.label || 'Tanpa Judul',
            username: entry.username || '',
            email: entry.email || '',
            password: entry.password || '',
            url: entry.url || '',
            notes: entry.notes || '',
            pin: entry.pin || null,
            locked: Boolean(entry.pin),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...list,
        ],
      },
    })
  },

  updateVaultEntry: (id, data) => {
    const uid = get().modeUid()
    set({
      vault: {
        ...get().vault,
        [uid]: (get().vault[uid] || []).map((e) =>
          e.id === id ? { ...e, ...data, locked: 'pin' in data ? Boolean(data.pin) : e.locked, updatedAt: Date.now() } : e
        ),
      },
    })
  },

  deleteVaultEntry: (id) => {
    const uid = get().modeUid()
    set({
      vault: {
        ...get().vault,
        [uid]: (get().vault[uid] || []).filter((e) => e.id !== id),
      },
    })
  },

  // ---------- PENGATURAN BRANKAS (PIN utama per user) ----------
  // vaultSettings[userId] = { pin: string | null }
  vaultSettings: {},
  setVaultPin: (pin) => {
    const uid = get().modeUid()
    set({
      vaultSettings: {
        ...get().vaultSettings,
        [uid]: { pin: pin ? String(pin).trim() : null },
      },
    })
  },

  // ---------- PIN AKUN (global, per user, tersimpan di localStorage) ----------
  // PIN dipakai untuk mengunci catatan pribadi (PrivateNote) dan wajib
  // di-set setelah login pertama kali. Bisa diubah di Settings.
  userPin: '',
  setUserPin: (pin) => set({ userPin: pin }),

  // Verifikasi penghapusan (Settings > Risiko Tinggi):
  // true  => hapus akun/target/kanban/todo wajib masukkan PIN akun.
  // false => cukup ketik 'DELETE' sebagai konfirmasi.
  requirePinForDelete: false,
  setRequirePinForDelete: (value) => set({ requirePinForDelete: Boolean(value) }),

  // ---------- PROFIL (Item 2: Settings lengkap + kuota edit) ----------
  profile: null,
  profileLoading: false,
  profileError: '',

  // =====================================================================
  // ACTIONS — NAVIGASI
  // =====================================================================
  setAppState: (state) => set({ appState: state }),
  setCurrentPage: (page) => set({ currentPage: page }),

  // =====================================================================
  // ACTIONS — TEMA/WINDOW (grup item di halaman target/kanban/todo/catatan)
  // =====================================================================
  addTheme: (name) => {
    const t = name.trim()
    if (!t || get().themes.includes(t)) return
    set({ themes: [...get().themes, t] })
  },

  renameTheme: (oldName, newName) => {
    const from = oldName.trim()
    const to = newName.trim()
    if (!from || !to || from === to) return
    set({
      themes: get().themes.map((t) => (t === from ? to : t)),
      projects: get().projects.map((p) => (p.theme === from ? { ...p, theme: to } : p)),
      kanbanBoards: get().kanbanBoards.map((b) => (b.theme === from ? { ...b, theme: to } : b)),
      tasks: get().tasks.map((t) => (t.theme === from ? { ...t, theme: to } : t)),
      privateNotes: Object.fromEntries(
        Object.entries(get().privateNotes).map(([uid, notes]) => [
          uid,
          notes.map((n) => (n.theme === from ? { ...n, theme: to } : n)),
        ])
      ),
    })
  },

  removeTheme: (name) => {
    const t = name.trim()
    set({
      themes: get().themes.filter((x) => x !== t),
      projects: get().projects.map((p) => (p.theme === t ? { ...p, theme: '' } : p)),
      kanbanBoards: get().kanbanBoards.map((b) => (b.theme === t ? { ...b, theme: '' } : b)),
      tasks: get().tasks.map((x) => (x.theme === t ? { ...x, theme: '' } : x)),
      privateNotes: Object.fromEntries(
        Object.entries(get().privateNotes).map(([uid, notes]) => [
          uid,
          notes.map((n) => (n.theme === t ? { ...n, theme: '' } : n)),
        ])
      ),
    })
  },

  setProjectTheme: (projectId, theme) =>
    set({
      projects: get().projects.map((p) => (p.id === projectId ? { ...p, theme } : p)),
    }),

  setBoardTheme: (boardId, theme) =>
    set({
      kanbanBoards: get().kanbanBoards.map((b) => (b.id === boardId ? { ...b, theme } : b)),
    }),

  setNoteTheme: (noteId, theme) => {
    const userId = get().modeUid()
    if (userId == null) return
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: (get().privateNotes[userId] || []).map((n) =>
          n.id === noteId ? { ...n, theme } : n
        ),
      },
    })
  },

  // =====================================================================
  // ACTIONS — NOTIFIKASI
  // =====================================================================
  // Tambah notifikasi ke daftar (paling baru di atas, maksimal 50 item).
  addNotification: (notification) =>
    set({
      notifications: [
        {
          id: Date.now() + Math.random(),
          createdAt: Date.now(),
          read: false,
          page: '',        // target page untuk navigasi saat diklik
          params: {},       // parameter untuk navigasi
          ...notification,
        },
        ...get().notifications,
      ].slice(0, 50),
    }),

  // Tandai satu notifikasi sebagai dibaca (tanpa hapus).
  markNotificationRead: (id) =>
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }),

  markAllNotificationsRead: () =>
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    }),

  // clearNotifications: () => set({ notifications: [] }), // Dinonaktifkan — notif tidak bisa dihapus

  // Muat notifikasi dari backend & gabung dengan notifikasi lokal.
  loadServerNotifications: async () => {
    try {
      const data = await api.getNotifications()
      const serverNotifs = (data.notifications || []).map((n) => ({
        id: 'srv-' + n.id,
        title: n.title,
        body: n.body,
        type: n.kind || 'info',
        read: Boolean(n.read),
        createdAt: new Date(n.created_at).getTime(),
        sender_name: n.sender_name,
      }))
      // Hapus notifikasi server lama lalu gabung dengan yang baru.
      const local = get().notifications.filter((n) => !String(n.id).startsWith('srv-'))
      set({ notifications: [...serverNotifs, ...local].slice(0, 50) })
    } catch (e) {
      // Abaikan error jaringan — notifikasi lokal tetap jalan.
    }
  },

  // =====================================================================
  // ACTIONS — CATATAN PRIBADI
  // =====================================================================
  // Setiap user punya daftar catatan sendiri (dipisah berdasarkan id user).
  addPrivateNote: (note) => {
    const userId = get().modeUid()
    if (userId == null) return null
    const id = Date.now()
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: [...myNotes, {
          id,
          title: '',
          content: '',
          pin: null,
          locked: false,
          closed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          theme: note.theme || '',
          ...note,
        }],
      },
    })
    get().addXp(5, 'Membuat catatan baru')
    return id
  },

  updatePrivateNote: (noteId, data) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.map((n) =>
          n.id === noteId ? { ...n, ...data, updatedAt: Date.now() } : n
        ),
      },
    })
  },

  toggleNoteCollaborator: (noteId, memberId) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.map((n) => {
          if (n.id !== noteId) return n
          const has = (n.collaboratorIds || []).includes(memberId)
          return {
            ...n,
            collaboratorIds: has
              ? (n.collaboratorIds || []).filter((id) => id !== memberId)
              : [...(n.collaboratorIds || []), memberId],
            updatedAt: Date.now(),
          }
        }),
      },
    })
  },

  deletePrivateNote: (noteId) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.filter((n) => n.id !== noteId),
      },
    })
  },

  closePrivateNote: (noteId) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.map((n) => (n.id === noteId ? { ...n, closed: true } : n)),
      },
    })
  },

  openPrivateNote: (noteId) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.map((n) => (n.id === noteId ? { ...n, closed: false } : n)),
      },
    })
  },

  setSelectedNoteId: (noteId) => set({ selectedNoteId: noteId }),

  // =====================================================================
  // ACTIONS — GAMIFICATION (level, XP, badge) per user
  // =====================================================================
  // gamification[userId] = { xp, badges: [id, ...] }
  // XP didapat dari aktivitas: menyelesaikan task, checklist, target,
  // membuat catatan, dll. Badge terbuka otomatis saat ambang tercapai.
  gamification: {},
  addXp: (amount, reason = '') => {
    const userId = get().modeUid()
    if (userId == null) return
    const g = get().gamification[userId] || { xp: 0, badges: [] }
    const newXp = g.xp + Math.max(0, Number(amount) || 0)
    const badges = GAMIFICATION_BADGES
      .filter((b) => b.requiresXp != null && newXp >= b.requiresXp && !g.badges.includes(b.id))
      .map((b) => b.id)
    set({
      gamification: {
        ...get().gamification,
        [userId]: { xp: newXp, badges: [...new Set([...g.badges, ...badges])] },
      },
    })
  },

  // =====================================================================
  // ACTIONS — ALARM & TIMER (per user)
  // =====================================================================
  // alarms[userId] = [ { id, time, label, enabled, createdAt } ]
  alarms: {},
  addAlarm: ({ time, label = '' }) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myAlarms = get().alarms[userId] || []
    set({
      alarms: {
        ...get().alarms,
        [userId]: [...myAlarms, {
          id: Date.now(),
          time,
          label: label.trim() || 'Alarm',
          enabled: true,
          createdAt: Date.now(),
        }],
      },
    })
  },
  toggleAlarm: (alarmId) => {
    const userId = get().modeUid()
    if (userId == null) return
    set({
      alarms: {
        ...get().alarms,
        [userId]: (get().alarms[userId] || []).map((a) =>
          a.id === alarmId ? { ...a, enabled: !a.enabled } : a
        ),
      },
    })
  },
  deleteAlarm: (alarmId) => {
    const userId = get().modeUid()
    if (userId == null) return
    set({
      alarms: {
        ...get().alarms,
        [userId]: (get().alarms[userId] || []).filter((a) => a.id !== alarmId),
      },
    })
  },

  // =====================================================================
  // ACTIONS — RISET KONTEN (per user)
  // =====================================================================
  // researchTopics[userId] = [ { id, topic, category, notes, ideas: [], createdAt, updatedAt } ]
  researchTopics: {},
  addResearchTopic: (topic) => {
    const userId = get().modeUid()
    if (userId == null) return
    const myTopics = get().researchTopics[userId] || []
    set({
      researchTopics: {
        ...get().researchTopics,
        [userId]: [...myTopics, {
          id: Date.now(),
          topic: (topic.topic || '').trim(),
          category: topic.category || '',
          notes: topic.notes || '',
          ideas: topic.ideas || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
      },
    })
  },
  updateResearchTopic: (topicId, data) => {
    const userId = get().modeUid()
    if (userId == null) return
    set({
      researchTopics: {
        ...get().researchTopics,
        [userId]: (get().researchTopics[userId] || []).map((t) =>
          t.id === topicId ? { ...t, ...data, updatedAt: Date.now() } : t
        ),
      },
    })
  },
  deleteResearchTopic: (topicId) => {
    const userId = get().modeUid()
    if (userId == null) return
    set({
      researchTopics: {
        ...get().researchTopics,
        [userId]: (get().researchTopics[userId] || []).filter((t) => t.id !== topicId),
      },
    })
  },

  // =====================================================================
  // ACTIONS — PENILAIAN KINERJA TIM (oleh admin/super_admin/atasan)
  // =====================================================================
  // performanceRatings[memberId] = [ { id, raterId, raterName, score, feedback, category, createdAt } ]
  performanceRatings: {},
  addPerformanceRating: (memberId, { score, feedback = '', category = '' }) => {
    const rater = get().currentUser
    if (rater == null) return
    set({
      performanceRatings: {
        ...get().performanceRatings,
        [memberId]: [
          {
            id: Date.now() + Math.random(),
            raterId: rater.id,
            raterName: rater.name || 'Admin',
            score: Math.min(5, Math.max(1, Number(score) || 5)),
            feedback: feedback.trim(),
            category: category.trim(),
            createdAt: Date.now(),
          },
          ...(get().performanceRatings[memberId] || []),
        ],
      },
    })
  },
  deletePerformanceRating: (memberId, ratingId) => {
    set({
      performanceRatings: {
        ...get().performanceRatings,
        [memberId]: (get().performanceRatings[memberId] || []).filter((r) => r.id !== ratingId),
      },
    })
  },

  // =====================================================================
  // ACTIONS — KONEKSI LAYANAN EKSTERNAL (Connect: Gmail, Telegram, dll)
  // =====================================================================
  // connections[dataKey][providerId] = { connected, account, connectedAt }
  connections: {},
  connectProvider: (providerId, account = '') => {
    const uid = get().modeUid()
    set({
      connections: {
        ...get().connections,
        [uid]: {
          ...(get().connections[uid] || {}),
          [providerId]: { connected: true, account: account.trim(), connectedAt: Date.now() },
        },
      },
    })
  },
  disconnectProvider: (providerId) => {
    const uid = get().modeUid()
    set({
      connections: {
        ...get().connections,
        [uid]: {
          ...(get().connections[uid] || {}),
          [providerId]: { connected: false, account: '', connectedAt: null },
        },
      },
    })
  },

  // =====================================================================
  // ACTIONS — ALUR SETUP
  // =====================================================================
  setSetupStep: (step) => set({ setupStep: step }),
  setCompanyInfo: (info) => set({ companyInfo: { ...get().companyInfo, ...info } }),

  // Pilih tipe akun/workspace. Semua field spesifik tipe direset
  // agar alur pengisian data selalu bersih saat ganti tipe.
  setUserType: (type) =>
    set({ companyInfo: { name: '', industry: '', size: '', type } }),

  // =====================================================================
  // ACTIONS — ROLE (khusus akun OWNER: ganti-ganti role act-as)
  // =====================================================================
  setActiveRole: (role) => set({ activeRole: role }),

  // =====================================================================
  // ACTIONS — STRUKTUR ORGANISASI (Divisi, Tim, Anggota)
  // =====================================================================

  addDivision: (division) =>
    set({
      divisions: [...get().divisions, {
        id: Date.now(),
        name: division.name.trim(),
        headId: division.headId || null,
        memberCount: 0,
      }],
    }),

  renameDivision: (id, name) =>
    set({
      divisions: get().divisions.map((d) =>
        d.id === id ? { ...d, name: name.trim() } : d
      ),
    }),

  removeDivision: (id) =>
    set({
      divisions: get().divisions.filter((d) => d.id !== id),
      // Tim-tim di dalam divisi ikut terhapus.
      teams: get().teams.filter((t) => t.divisionId !== id),
    }),

  addTeam: ({ divisionId, name }) => {
    const id = Date.now()
    set({
      teams: [...get().teams, { id, divisionId, name: name.trim(), adminId: null, memberIds: [] }],
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    })
    return id
  },

  renameTeam: (id, name) =>
    set({
      teams: get().teams.map((t) =>
        t.id === id ? { ...t, name: name.trim() } : t
      ),
    }),

  removeTeam: (id) =>
    set({
      teams: get().teams.filter((t) => t.id !== id),
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    }),

  // Pindah peran admin tim dari satu anggota ke anggota lain.
  setTeamAdmin: (teamId, memberId) =>
    set({
      teams: get().teams.map((t) =>
        t.id === teamId ? { ...t, adminId: memberId } : t
      ),
    }),

  // Masukkan akun/anggota yang sudah ada ke sebuah tim (bisa lebih dari satu tim).
  addMemberToTeam: (teamId, memberId) =>
    set({
      teams: get().teams.map((t) =>
        t.id === teamId && !t.memberIds.includes(memberId)
          ? { ...t, memberIds: [...t.memberIds, memberId] }
          : t
      ),
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    }),

  removeMemberFromTeam: (teamId, memberId) =>
    set({
      teams: get().teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              memberIds: t.memberIds.filter((m) => m !== memberId),
              adminId: t.adminId === memberId ? null : t.adminId,
            }
          : t
      ),
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    }),

  // Buat akun/anggota baru lalu langsung masukkan ke sebuah tim.
  createMemberAndAdd: ({
    name, email, password = '', role = 'member', authority = 'member', teamId, divisionId,
    position = '', phone = '', gender = '', birthDate = '', address = '',
    joinDate = '', employmentStatus = '', salary = '', skills = '', education = '', notes = '',
  }) => {
    const id = Date.now()
    const divId =
      divisionId ||
      get().teams.find((t) => t.id === teamId)?.divisionId ||
      null
    set({
      members: [...get().members, {
        id,
        name: name.trim(),
        email: email.trim(),
        divisionId: divId,
        role,
        position: position.trim(),
        phone: phone.trim(),
        gender: gender.trim(),
        birthDate: birthDate.trim(),
        address: address.trim(),
        joinDate: joinDate.trim(),
        employmentStatus: employmentStatus.trim(),
        salary: salary.trim(),
        skills: skills.trim(),
        education: education.trim(),
        notes: notes.trim(),
        hasAccount: Boolean(password),
      }],
      teams: get().teams.map((t) =>
        t.id === teamId ? { ...t, memberIds: [...t.memberIds, id] } : t
      ),
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    })
    return id
  },

  addMember: (member) =>
    set({
      members: [...get().members, {
        id: Date.now(),
        name: member.name,
        email: member.email,
        divisionId: member.divisionId,
        role: member.role || 'member', // member, admin, super_admin
        authority: member.authority || 'member', // owner, super_admin, admin, manager, member, viewer
        position: member.position || '',
        phone: member.phone || '',
        gender: member.gender || '',
        birthDate: member.birthDate || '',
        address: member.address || '',
        joinDate: member.joinDate || '',
        employmentStatus: member.employmentStatus || '',
        salary: member.salary || '',
        skills: member.skills || '',
        education: member.education || '',
        notes: member.notes || '',
        hasAccount: Boolean(member.hasAccount),
      }],
    }),

  removeMember: (id) =>
    set({
      members: get().members.filter((m) => m.id !== id),
      teams: get().teams.map((t) => ({
        ...t,
        memberIds: t.memberIds.filter((m) => m !== id),
        adminId: t.adminId === id ? null : t.adminId,
      })),
      divisions: recomputeDivisionCounts(get().divisions, get().teams, get().members),
    }),

  // Ubah role member (dipakai admin/super_admin).
  updateMemberRole: (memberId, newRole) =>
    set({
      members: get().members.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      ),
    }),

  // Ubah data anggota (nama/email) — CRUD anggota.
  updateMember: (memberId, data) =>
    set({
      members: get().members.map((m) =>
        m.id === memberId ? { ...m, ...data } : m
      ),
    }),

  /**
   * Menyelesaikan alur setup. Alurnya berbeda per tipe:
   *   - individual  : tidak ada company/divisi/anggota, hanya profil.
   *   - grup        : buat company (Organisasi) + anggota.
   *   - perusahaan  : buat company + divisi + anggota.
   *   - sekolah     : buat company (Pendidikan) + kelas (divisi) + anggota.
   * Mencoba sinkronisasi ke backend (jika online), lalu selalu masuk
   * dashboard. Jika backend offline, tetap berjalan dengan data lokal
   * (demo mode) dan log error di console.
   */
  completeSetup: async () => {
    const { companyInfo, divisions, members, currentUser } = get()
    const userId = currentUser?.id
    const type = companyInfo.type

    // Tipe yang punya organisasi ikut disinkronkan ke backend.
    const hasOrg = type === 'grup' || type === 'perusahaan' || type === 'sekolah'
    const industry =
      type === 'sekolah' ? 'Pendidikan'
      : type === 'grup' ? 'Organisasi'
      : companyInfo.industry
    const size = companyInfo.size || '-'

    try {
      if (hasOrg && userId && companyInfo.name) {
        const company = await api.createCompany({
          name: companyInfo.name,
          industry,
          size,
          user_id: userId,
        })
        for (const div of divisions) {
          const createdDiv = await api.createDivision({
            company_id: company.id,
            name: div.name,
            head_id: null, // mapping kepala divisi ke backend belum diterapkan
          })
          for (const m of members.filter((x) => x.divisionId === div.id)) {
            await api.createMember({
              company_id: company.id,
              division_id: createdDiv.id,
              name: m.name,
              email: m.email,
              role: m.role,
            })
          }
        }
        set({ currentUser: { ...currentUser, company_id: company.id, company: company.name } })
      }
    } catch (e) {
      console.error('Sinkronisasi setup ke backend gagal (backend offline?)', e)
    }

    // Finalisasi state lokal & masuk dashboard.
    const updatedDivisions = divisions.map((div) => ({
      ...div,
      memberCount: members.filter((m) => m.divisionId === div.id).length,
      head: members.find((m) => m.id === div.headId)?.name || '',
    }))

    set({
      divisions: updatedDivisions,
      members,
      currentUser: get().currentUser || {
        id: Date.now(),
        name: members[0]?.name || companyInfo.name || 'User',
        email: members[0]?.email || 'user@email.com',
        role: 'super_admin',
        company: companyInfo.name || (type === 'individual' ? 'Personal' : 'Workspace'),
      },
      isAuthenticated: true,
      hasCompletedSetup: true,
      appState: 'app',
      currentPage: 'dashboard',
      activeRole: get().currentUser?.role || 'super_admin',
    })
  },

  // =====================================================================
  // ACTIONS — AUTH (terhubung ke backend)
  // =====================================================================

  /**
   * Login tahap 1. Mengembalikan { success, message, requires2FA }.
   * Bila `requires2FA` true, lanjutkan ke `verify2FA(email, code)`.
   * Bila `requiresConfirmation` true, akun belum aktif (cek email).
   */
  login: async (email, password) => {
    try {
      const res = await api.login(email, password)
      if (!res.success) {
        return {
          success: false,
          message: res.message,
          requiresConfirmation: Boolean(res.requires_confirmation),
        }
      }
      if (res.requires_2fa) {
        return { success: true, requires2FA: true, message: res.message }
      }
      if (res.requires_pin !== undefined || res.requires_pin_setup !== undefined) {
        // Owner: lanjut verifikasi PIN.
        return {
          success: true,
          requiresPin: Boolean(res.requires_pin),
          requiresPinSetup: Boolean(res.requires_pin_setup),
          message: res.message,
        }
      }
      // (tidak akan terjadi biasanya, tapi aman) — langsung set sesi.
      setToken(res.token)
      set({ currentUser: res.user, token: res.token || null })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Verifikasi kode 2FA setelah login tahap 1. Berhasil => masuk dashboard.
   */
  verify2FA: async (email, code) => {
    try {
      const res = await api.verify2FA(email, code)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      // Akun OWNER langsung masuk app; akun dengan company_id (sudah punya
      // workspace, mis. dibuat admin) juga langsung ke dashboard.
      const isOwner = res.user.role === 'owner'
      const hasCompany = Boolean(res.user.company_id)
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: isOwner || hasCompany ? true : get().hasCompletedSetup,
        appState: isOwner || hasCompany || get().hasCompletedSetup ? 'app' : 'setup',
        setupStep: 0,
        currentPage: isOwner ? 'admin-users' : 'dashboard',
        activeRole: res.user.role,
      })
      track('login', { role: res.user.role, method: '2fa' })
      get().seedOwnerDummyData()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Verifikasi PIN owner (gantikan 2FA email untuk owner).
   * Bila PIN belum ada, PIN disimpan & langsung login.
   */
  verifyPin: async (email, pin) => {
    try {
      const res = await api.verifyPin(email, pin)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: true,
        appState: 'app',
        setupStep: 0,
        currentPage: 'admin-users',
        activeRole: res.user.role,
        userPin: pin,
      })
      track('login', { role: res.user.role, method: 'pin' })
      // Seed data demo untuk owner (hanya sekali).
      get().seedOwnerDummyData()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Ganti PIN akun (owner) — sinkron ke backend.
   */
  changePin: async (pin) => {
    try {
      await api.setPin(pin)
      set({ userPin: pin })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Aktivasi akun lewat token email konfirmasi.
   * Berhasil => sesi langsung dibuat, masuk dashboard.
   */
  verifyEmail: async (token) => {
    try {
      const res = await api.verifyEmail(token)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      const isOwner = res.user.role === 'owner'
      const hasCompany = Boolean(res.user.company_id)
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: isOwner || hasCompany ? true : get().hasCompletedSetup,
        appState: isOwner || hasCompany || get().hasCompletedSetup ? 'app' : 'setup',
        setupStep: 0,
        currentPage: isOwner ? 'admin-users' : 'dashboard',
        activeRole: res.user.role,
      })
      track('signup_verified', { role: res.user.role })
      get().seedOwnerDummyData()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Daftar akun baru ke backend. Mengembalikan { success, message }.
   * Akun baru belum aktif — harus klik link konfirmasi di email.
   */
  register: async (name, email, password, username) => {
    try {
      const res = await api.register(name, email, password, username)
      if (!res.success) throw new Error(res.message)
      return { success: true, requiresConfirmation: true, message: res.message }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Login/daftar via Google (token id_token dari Google Identity Services).
   * Berhasil => sesi langsung dibuat seperti verify2FA (tanpa 2FA/PIN).
   */
  googleLogin: async (token) => {
    try {
      const res = await api.googleLogin(token)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      const isOwner = res.user.role === 'owner'
      const hasCompany = Boolean(res.user.company_id)
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: isOwner || hasCompany ? true : get().hasCompletedSetup,
        appState: isOwner || hasCompany || get().hasCompletedSetup ? 'app' : 'setup',
        setupStep: 0,
        currentPage: isOwner ? 'admin-users' : 'dashboard',
        activeRole: res.user.role,
      })
      track('login', { role: res.user.role, method: 'google' })
      get().seedOwnerDummyData()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  logout: async () => {
    // Cabut sesi di backend (best-effort) lalu bersihkan state lokal.
    try { await api.logout() } catch (e) { /* abaikan bila backend offline */ }
    setToken(null)
    set({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      appState: 'landing',
      currentPage: 'dashboard',
      activeRole: null,
    })
  },

  // =====================================================================
  // ACTIONS — PROFIL (Item 2)
  // =====================================================================

  // Muat profil lengkap (termasuk kuota edit bulanan) dari backend.
  loadProfile: async () => {
    set({ profileLoading: true, profileError: '' })
    try {
      const profile = await api.getProfile()
      set({ profile, profileLoading: false })
      return profile
    } catch (e) {
      set({ profileError: 'Gagal memuat profil. Pastikan backend online.', profileLoading: false })
      return null
    }
  },

  /**
   * Perbarui profil. Tanpa user_id => ubah profil sendiri (kuota 3x/bulan);
   * dengan user_id (admin/super_admin) => ubah data user lain (kuota 10x).
   * Berhasil => currentUser ikut diperbarui.
   */
  updateProfile: async (data) => {
    try {
      const profile = await api.updateProfile(data)
      const { currentUser } = get()
      const own = !data.user_id || data.user_id === currentUser?.id
      if (own && currentUser) {
        set({
          currentUser: {
            ...currentUser,
            name: profile.name,
            email: profile.email,
            username: profile.username,
          },
          profile,
        })
      } else {
        set({ profile })
      }
      return { success: true, profile }
    } catch (e) {
      let message = 'Gagal menyimpan profil.'
      if (e.status === 429) message = 'Kuota edit bulanan sudah habis. Tunggu bulan berikutnya.'
      if (e.status === 409) message = 'Email atau username sudah dipakai akun lain.'
      return { success: false, message, status: e.status }
    }
  },

  // Ganti foto profil (data URL base64) — sinkron ke backend + state.
  updateAvatar: async (avatarUrl) => {
    try {
      const res = await api.updateAvatar(avatarUrl)
      const { currentUser, profile } = get()
      set({
        currentUser: currentUser ? { ...currentUser, avatar_url: avatarUrl } : currentUser,
        profile: profile ? { ...profile, avatar_url: avatarUrl } : profile,
      })
      return { success: true, avatar_url: res.avatar_url }
    } catch (e) {
      return { success: false, message: e.message || 'Gagal mengubah foto profil.' }
    }
  },

  // =====================================================================
  // ACTIONS — DEMO DATA (khusus Owner, seed sekali)
  // =====================================================================

  seedOwnerDummyData: () => {
    const { projects, currentUser } = get()
    if (!currentUser || currentUser.role !== 'owner') return
    const now = Date.now()
    const userId = currentUser.id

    // Tema/label yang dipakai
    const themes = ['Marketing', 'Development', 'Event']

    // ---------- Target (projects) ----------
    const p1 = {
      id: now + 1,
      createdAt: now - 1209600000,
      name: 'Meningkatkan Brand Awareness Q3',
      description: 'Target quarterly untuk meningkatkan brand awareness melalui kampanye digital dan kolaborasi KOL.',
      viewType: 'kanban',
      theme: 'Marketing',
      priority: 'high',
      type: 'quarterly',
      deadlineType: 'deadline',
      deadline: '2026-09-30',
      deadlineLabel: '',
      createdBy: userId,
      assigneeId: userId,
      division: '',
      divisionId: '',
      progress: 35,
      status: 'active',
      stages: [
        { id: 1, name: 'Riset & Strategi', status: 'completed', checklist: [
          { id: 1, text: 'Analisis kompetitor', completed: true },
          { id: 2, text: 'Tentukan target audience', completed: true },
        ]},
        { id: 2, name: 'Eksekusi Kampanye', status: 'in_progress', checklist: [
          { id: 3, text: 'Buat konten visual', completed: true },
          { id: 4, text: 'Jadwalkan posting', completed: false },
          { id: 5, text: 'Kolaborasi KOL', completed: false },
        ]},
        { id: 3, name: 'Evaluasi', status: 'locked', checklist: [
          { id: 6, text: 'Laporan mingguan', completed: false },
          { id: 7, text: 'Review KPI', completed: false },
        ]},
      ],
      collaboratorIds: [],
    }

    const p2 = {
      id: now + 2,
      createdAt: now - 864000000,
      name: 'Launch Fitur Chat & Grup',
      description: 'Rilis fitur chat antar anggota dan grup otomatis per divisi untuk rilis Q4.',
      viewType: 'kanban',
      theme: 'Development',
      priority: 'high',
      type: 'project',
      deadlineType: 'deadline',
      deadline: '2026-10-15',
      deadlineLabel: '',
      createdBy: userId,
      assigneeId: userId,
      division: '',
      divisionId: '',
      progress: 15,
      status: 'active',
      stages: [
        { id: 1, name: 'Planning', status: 'completed', checklist: [
          { id: 8, text: 'Finalisasi fitur', completed: true },
        ]},
        { id: 2, name: 'Development', status: 'in_progress', checklist: [
          { id: 9, text: 'Backend chat API', completed: true },
          { id: 10, text: 'Frontend chat UI', completed: false },
        ]},
        { id: 3, name: 'Testing', status: 'locked', checklist: [
          { id: 11, text: 'Unit test', completed: false },
          { id: 12, text: 'QA', completed: false },
        ]},
        { id: 4, name: 'Launch', status: 'locked', checklist: [
          { id: 13, text: 'Deploy', completed: false },
        ]},
      ],
      collaboratorIds: [],
    }

    const p3 = {
      id: now + 3,
      createdAt: now - 432000000,
      name: 'Persiapan Event Akhir Tahun',
      description: 'Persiapan acara akhir tahun untuk seluruh anggota tim.',
      viewType: 'todo',
      theme: 'Event',
      priority: 'medium',
      type: 'project',
      deadlineType: 'deadline',
      deadline: '2026-12-20',
      deadlineLabel: '',
      createdBy: userId,
      assigneeId: userId,
      division: '',
      divisionId: '',
      progress: 0,
      status: 'active',
      stages: [],
      collaboratorIds: [],
    }

    // ---------- Kanban Boards ----------
    const board1 = {
      id: now + 10,
      projectId: p1.id,
      name: 'Kampanye Brand Awareness',
      description: 'Board kanban untuk kampanye brand awareness Q3',
      theme: 'Marketing',
      deadlineType: 'deadline',
      deadline: '2026-09-30',
      deadlineLabel: '',
      createdBy: userId,
      createdAt: now - 1200000000,
      columns: [
        { id: 100, name: 'To Do', tasks: [
          { id: 200, title: 'Desain konten feed Instagram', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-10', deadlineLabel: '', assignedTo: userId },
          { id: 201, title: 'Hubungi 3 KOL potensial', priority: 'medium', deadlineType: 'deadline', deadline: '2026-09-15', deadlineLabel: '', assignedTo: userId },
          { id: 202, title: 'Persiapan budget iklan', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-20', deadlineLabel: '', assignedTo: userId },
        ]},
        { id: 101, name: 'In Progress', tasks: [
          { id: 203, title: 'Jadwalkan posting mingguan', priority: 'medium', deadlineType: 'deadline', deadline: '2026-09-08', deadlineLabel: '', assignedTo: userId },
          { id: 204, title: 'Buat konten video Reels', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-12', deadlineLabel: '', assignedTo: userId },
        ]},
        { id: 102, name: 'Done', tasks: [
          { id: 205, title: 'Audit akun sosial media', priority: 'low', deadlineType: 'deadline', deadline: '2026-08-25', deadlineLabel: '', assignedTo: userId },
          { id: 206, title: 'Buat moodboard visual', priority: 'medium', deadlineType: 'deadline', deadline: '2026-08-28', deadlineLabel: '', assignedTo: userId },
        ]},
      ],
      collaboratorIds: [],
    }

    const board2 = {
      id: now + 11,
      projectId: p2.id,
      name: 'Fitur Chat',
      description: 'Development board untuk fitur chat & grup',
      theme: 'Development',
      deadlineType: 'deadline',
      deadline: '2026-10-15',
      deadlineLabel: '',
      createdBy: userId,
      createdAt: now - 840000000,
      columns: [
        { id: 110, name: 'Planning', tasks: [
          { id: 210, title: 'Review PRD fitur chat', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-05', deadlineLabel: '', assignedTo: userId },
        ]},
        { id: 111, name: 'Development', tasks: [
          { id: 211, title: 'Buat schema database chat', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-12', deadlineLabel: '', assignedTo: userId },
          { id: 212, title: 'Implementasi API send message', priority: 'high', deadlineType: 'deadline', deadline: '2026-09-20', deadlineLabel: '', assignedTo: userId },
          { id: 213, title: 'UI komponen chat bubble', priority: 'medium', deadlineType: 'deadline', deadline: '2026-09-22', deadlineLabel: '', assignedTo: userId },
          { id: 214, title: 'Fitur grup chat otomatis', priority: 'medium', deadlineType: 'deadline', deadline: '2026-09-28', deadlineLabel: '', assignedTo: userId },
        ]},
        { id: 112, name: 'Testing', tasks: [
          { id: 215, title: 'Test send/receive message', priority: 'high', deadlineType: 'deadline', deadline: '2026-10-05', deadlineLabel: '', assignedTo: userId },
        ]},
        { id: 113, name: 'Launch', tasks: [
          { id: 216, title: 'Deploy ke staging', priority: 'medium', deadlineType: 'deadline', deadline: '2026-10-10', deadlineLabel: '', assignedTo: userId },
          { id: 217, title: 'Deploy ke production', priority: 'high', deadlineType: 'deadline', deadline: '2026-10-15', deadlineLabel: '', assignedTo: userId },
        ]},
      ],
      collaboratorIds: [],
    }

    // ---------- To-do Tasks (global + project 3) ----------
    const todoTasks = [
      { id: now + 300, projectId: p3.id, title: 'Cari venue acara', description: 'Cari tempat yang muat 50 orang dengan budget sesuai', status: 'pending', priority: 'high', deadlineType: 'deadline', deadline: '2026-11-01', deadlineLabel: '', assignedTo: userId, theme: 'Event', createdAt: now - 400000000 },
      { id: now + 301, projectId: p3.id, title: 'Buat daftar tamu undangan', description: 'Kumpulkan nama anggota & partner yang diundang', status: 'pending', priority: 'medium', deadlineType: 'deadline', deadline: '2026-11-10', deadlineLabel: '', assignedTo: userId, theme: 'Event', createdAt: now - 380000000 },
      { id: now + 302, projectId: p3.id, title: 'Tentukan tema acara', description: 'Konsep acara: formal / casual / outdoor', status: 'completed', priority: 'medium', deadlineType: 'deadline', deadline: '2026-10-25', deadlineLabel: '', assignedTo: userId, theme: 'Event', createdAt: now - 350000000 },
      { id: now + 303, projectId: p3.id, title: 'Siapkan konsumsi & doorprize', description: 'Koordinasi catering dan hadiah', status: 'pending', priority: 'low', deadlineType: 'deadline', deadline: '2026-12-01', deadlineLabel: '', assignedTo: userId, theme: 'Event', createdAt: now - 300000000 },
      { id: now + 304, projectId: p3.id, title: 'Buat rundown acara', description: 'Susun jadwal acara dari awal sampai akhir', status: 'pending', priority: 'medium', deadlineType: 'deadline', deadline: '2026-12-05', deadlineLabel: '', assignedTo: userId, theme: 'Event', createdAt: now - 250000000 },
      // Global tasks
      { id: now + 305, projectId: '', title: 'Update profile perusahaan', description: 'Pastikan data perusahaan di profil sudah terbaru', status: 'pending', priority: 'low', deadlineType: 'deadline', deadline: '2026-09-20', deadlineLabel: '', assignedTo: userId, theme: '', createdAt: now - 200000000 },
      { id: now + 306, projectId: '', title: 'Cek notifikasi dan pengingat', description: 'Review semua notifikasi yang belum dibaca', status: 'completed', priority: 'medium', deadlineType: 'custom', deadline: '', deadlineLabel: 'Bulanan', assignedTo: userId, theme: '', createdAt: now - 150000000 },
      { id: now + 307, projectId: '', title: 'Backup database', description: 'Lakukan backup database secara berkala', status: 'pending', priority: 'high', deadlineType: 'everyday', deadline: '', deadlineLabel: '', assignedTo: userId, theme: '', createdAt: now - 100000000 },
    ]

    // ---------- Catatan Pribadi ----------
    const notes = [
      {
        id: now + 400,
        title: 'Ide Fitur Baru',
        content: '<p>Daftar fitur yang mungkin ditambahkan ke depannya:</p><ul><li>Integrasi Google Calendar</li><li>Export laporan PDF</li><li>Dark mode kustom</li><li>Template target mingguan</li></ul>',
        pin: null,
        locked: false,
        closed: false,
        theme: 'Development',
        createdAt: now - 500000000,
        updatedAt: now - 480000000,
        collaboratorIds: [],
      },
      {
        id: now + 401,
        title: 'Catatan Rapat — Evaluasi Q3',
        content: '<p><strong>Tanggal:</strong> 1 September 2026</p><p><strong>Hadir:</strong> Tim Inti</p><p><strong>Agenda:</strong></p><ol><li>Review progress kampanye — 35%</li><li>Kendala: budget iklan belum disetujui</li><li>Target: 50% di akhir bulan</li><li>Next action: approve budget minggu depan</li></ol>',
        pin: null,
        locked: false,
        closed: false,
        theme: 'Marketing',
        createdAt: now - 450000000,
        updatedAt: now - 420000000,
        collaboratorIds: [],
      },
      {
        id: now + 402,
        title: 'Password & API Key',
        content: '<p>Daftar kredensial penting (dilindungi PIN):</p><ul><li>Backend API: <code>https://api.luxio.id</code></li><li>Neon DB: tersimpan di .env</li><li>SMTP: Gmail app password</li></ul><p><em>Jangan bagikan catatan ini ke siapa pun.</em></p>',
        pin: '1234',
        locked: true,
        closed: false,
        theme: 'Development',
        createdAt: now - 400000000,
        updatedAt: now - 350000000,
        collaboratorIds: [],
      },
    ]

    // ---------- Divisi & Tim (struktur perusahaan) ----------
    const divisions = [
      { id: now + 500, name: 'Marketing', headId: null, memberCount: 7 },
      { id: now + 501, name: 'Teknologi', headId: null, memberCount: 14 },
      { id: now + 502, name: 'Keuangan', headId: null, memberCount: 2 },
      { id: now + 503, name: 'SDM', headId: null, memberCount: 3 },
      { id: now + 504, name: 'Operasional', headId: null, memberCount: 8 },
      { id: now + 505, name: 'Eksekutif', headId: null, memberCount: 4 },
    ]

    const teams = [
      { id: now + 600, divisionId: now + 500, name: 'Tim Kreatif', adminId: null, memberIds: [] },
      { id: now + 601, divisionId: now + 500, name: 'Tim Digital', adminId: null, memberIds: [] },
      { id: now + 602, divisionId: now + 501, name: 'Tim Frontend', adminId: null, memberIds: [] },
      { id: now + 603, divisionId: now + 501, name: 'Tim Backend', adminId: null, memberIds: [] },
      { id: now + 604, divisionId: now + 501, name: 'Tim QA', adminId: null, memberIds: [] },
      { id: now + 605, divisionId: now + 502, name: 'Tim Akuntansi', adminId: null, memberIds: [] },
      { id: now + 606, divisionId: now + 503, name: 'Tim Rekrutmen', adminId: null, memberIds: [] },
      { id: now + 607, divisionId: now + 504, name: 'Tim Logistik', adminId: null, memberIds: [] },
      { id: now + 608, divisionId: now + 505, name: 'Tim Direksi', adminId: null, memberIds: [] },
    ]

    // Anggota: role + jabatan. Eksekutif & manajer untuk mode super_admin/admin,
    // karyawan berbagai jabatan untuk mode user.
    const members = [
      // Eksekutif (super_admin)
      { id: now + 700, name: 'Alexander Chen', email: 'superadmin1@luxio.id', role: 'super_admin', authority: 'super_admin', position: 'Chief Executive Officer', employmentStatus: 'Full-time', divisionId: now + 505, hasAccount: true },
      { id: now + 701, name: 'Priya Sharma', email: 'superadmin2@luxio.id', role: 'super_admin', authority: 'super_admin', position: 'Chief Technology Officer', employmentStatus: 'Full-time', divisionId: now + 505, hasAccount: true },
      { id: now + 702, name: 'Marcus Tan', email: 'superadmin3@luxio.id', role: 'super_admin', authority: 'super_admin', position: 'Chief Financial Officer', employmentStatus: 'Full-time', divisionId: now + 505, hasAccount: true },
      { id: now + 703, name: 'Aiko Tanaka', email: 'superadmin4@luxio.id', role: 'super_admin', authority: 'super_admin', position: 'Chief Operating Officer', employmentStatus: 'Full-time', divisionId: now + 505, hasAccount: true },
      // Admin / manajer
      { id: now + 704, name: 'Budi Santoso', email: 'admin1@luxio.id', role: 'admin', authority: 'admin', position: 'Engineering Manager', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 705, name: 'Dewi Lestari', email: 'admin4@luxio.id', role: 'admin', authority: 'admin', position: 'HR Manager', employmentStatus: 'Full-time', divisionId: now + 503, hasAccount: true },
      { id: now + 706, name: 'Rina Marlina', email: 'admin6@luxio.id', role: 'admin', authority: 'admin', position: 'Marketing Manager', employmentStatus: 'Full-time', divisionId: now + 500, hasAccount: true },
      { id: now + 707, name: 'Hendra Gunawan', email: 'admin9@luxio.id', role: 'admin', authority: 'admin', position: 'Legal & Compliance Manager', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
      // Marketing
      { id: now + 708, name: 'Maya Kusuma', email: 'user8@luxio.id', role: 'member', authority: 'member', position: 'Content Writer', employmentStatus: 'Full-time', divisionId: now + 500, hasAccount: true },
      { id: now + 709, name: 'Intan Permata', email: 'user10@luxio.id', role: 'member', authority: 'member', position: 'Social Media Specialist', employmentStatus: 'Full-time', divisionId: now + 500, hasAccount: true },
      { id: now + 710, name: 'Salsabila Nur', email: 'user27@luxio.id', role: 'member', authority: 'member', position: 'Copywriter', employmentStatus: 'Kontrak', divisionId: now + 500, hasAccount: true },
      { id: now + 711, name: 'Galih Pratama', email: 'user7@luxio.id', role: 'member', authority: 'viewer', position: 'Desainer Grafis', employmentStatus: 'Full-time', divisionId: now + 500, hasAccount: true },
      // Teknologi
      { id: now + 712, name: 'Reza Alfarizi', email: 'user1@luxio.id', role: 'member', authority: 'member', position: 'Software Engineer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 713, name: 'Nadia Zahra', email: 'user2@luxio.id', role: 'member', authority: 'member', position: 'Frontend Developer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 714, name: 'Dimas Arya', email: 'user3@luxio.id', role: 'member', authority: 'member', position: 'Backend Developer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 715, name: 'Vina Oktaviani', email: 'user4@luxio.id', role: 'member', authority: 'member', position: 'UI/UX Designer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 716, name: 'Sarah Amelia', email: 'user6@luxio.id', role: 'member', authority: 'member', position: 'Quality Assurance', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 717, name: 'Gilang Ramadhan', email: 'user15@luxio.id', role: 'member', authority: 'member', position: 'Mobile Developer', employmentStatus: 'Kontrak', divisionId: now + 501, hasAccount: true },
      { id: now + 718, name: 'Rizky Ananda', email: 'user5@luxio.id', role: 'member', authority: 'member', position: 'Data Analyst', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      // Keuangan
      { id: now + 719, name: 'Bayu Saputra', email: 'user11@luxio.id', role: 'member', authority: 'member', position: 'Accountant', employmentStatus: 'Full-time', divisionId: now + 502, hasAccount: true },
      { id: now + 720, name: 'Agus Prasetyo', email: 'admin3@luxio.id', role: 'admin', authority: 'admin', position: 'Finance Manager', employmentStatus: 'Full-time', divisionId: now + 502, hasAccount: true },
      // SDM
      { id: now + 721, name: 'Citra Ayu', email: 'user12@luxio.id', role: 'member', authority: 'member', position: 'Recruitment Specialist', employmentStatus: 'Full-time', divisionId: now + 503, hasAccount: true },
      { id: now + 722, name: 'Melati Putri', email: 'user21@luxio.id', role: 'member', authority: 'member', position: 'Training & Development', employmentStatus: 'Part-time', divisionId: now + 503, hasAccount: true },
      // Operasional
      { id: now + 723, name: 'Joko Susilo', email: 'user18@luxio.id', role: 'member', authority: 'member', position: 'Logistics Coordinator', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
      { id: now + 724, name: 'Lukman Hakim', email: 'user20@luxio.id', role: 'member', authority: 'member', position: 'Procurement Officer', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
      { id: now + 725, name: 'Taufik Hidayat', email: 'user28@luxio.id', role: 'member', authority: 'member', position: 'Field Technician', employmentStatus: 'Kontrak', divisionId: now + 504, hasAccount: true },
      { id: now + 726, name: 'Fitri Handayani', email: 'user14@luxio.id', role: 'member', authority: 'member', position: 'Business Analyst', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
      { id: now + 727, name: 'Eko Wahyudi', email: 'user13@luxio.id', role: 'member', authority: 'member', position: 'Customer Support', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
      // Tambahan karyawan (mode user)
      { id: now + 728, name: 'Hana Safitri', email: 'user16@luxio.id', role: 'member', authority: 'member', position: 'Security Engineer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 729, name: 'Irfan Maulana', email: 'user17@luxio.id', role: 'member', authority: 'member', position: 'System Administrator', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 730, name: 'Kartika Dewi', email: 'user19@luxio.id', role: 'member', authority: 'member', position: 'Public Relations', employmentStatus: 'Full-time', divisionId: now + 500, hasAccount: true },
      { id: now + 731, name: 'Nanda Pradana', email: 'user22@luxio.id', role: 'member', authority: 'member', position: 'Database Administrator', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 732, name: 'Olivia Marbun', email: 'user23@luxio.id', role: 'member', authority: 'viewer', position: 'Research Assistant', employmentStatus: 'Magang', divisionId: now + 501, hasAccount: true },
      { id: now + 733, name: 'Panji Wicaksono', email: 'user24@luxio.id', role: 'member', authority: 'member', position: 'Network Engineer', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 734, name: 'Queen Adelia', email: 'user25@luxio.id', role: 'member', authority: 'member', position: 'Event Coordinator', employmentStatus: 'Kontrak', divisionId: now + 500, hasAccount: true },
      { id: now + 735, name: 'Rangga Pribadi', email: 'user26@luxio.id', role: 'member', authority: 'member', position: 'Data Scientist', employmentStatus: 'Full-time', divisionId: now + 501, hasAccount: true },
      { id: now + 736, name: 'Umi Kalsum', email: 'user29@luxio.id', role: 'member', authority: 'viewer', position: 'Administrative Assistant', employmentStatus: 'Part-time', divisionId: now + 504, hasAccount: true },
      { id: now + 737, name: 'Yoga Pratama', email: 'user30@luxio.id', role: 'member', authority: 'member', position: 'Project Coordinator', employmentStatus: 'Full-time', divisionId: now + 504, hasAccount: true },
    ]

    // Sebarkan anggota ke tim (berdasarkan divisi).
    const dist = {}
    members.forEach((m) => {
      const teamOfDiv = teams.find((t) => t.divisionId === m.divisionId)
      if (!teamOfDiv) return
      if (!dist[teamOfDiv.id]) dist[teamOfDiv.id] = []
      dist[teamOfDiv.id].push(m.id)
    })
    Object.keys(dist).forEach((tid) => {
      const idx = teams.findIndex((t) => t.id === Number(tid))
      if (idx >= 0) teams[idx].memberIds = dist[tid]
    })

    const state = {}
    const existing = get()

    if (existing.projects.length === 0) {
      Object.assign(state, {
        projects: [p1, p2, p3],
        kanbanBoards: [board1, board2],
        tasks: todoTasks,
        themes,
      })
    }

    // Catatan demo di-seed per mode akun (owner punya data terpisah per role).
    const modeKey = get().modeUid()
    const myNotes = existing.privateNotes[modeKey] || []
    if (myNotes.length === 0) {
      Object.assign(state, {
        privateNotes: { ...existing.privateNotes, [modeKey]: notes },
      })
    }

    if (existing.divisions.length === 0) {
      Object.assign(state, { divisions, teams, members })
    }

    if (Object.keys(state).length > 0) {
      set(state)
    }
  },
  // =====================================================================

  /**
   * Upgrade akun ke plan berbayar. Role berubah otomatis: grup => admin,
   * organisasi => super_admin. currentUser ikut diperbarui.
   */
  upgradeAccount: async (data) => {
    try {
      const res = await api.upgradeAccount(data)
      const { currentUser } = get()
      if (currentUser) {
        set({
          currentUser: {
            ...currentUser,
            role: res.role,
            plan: res.plan,
            company: res.company_name || currentUser.company,
            company_id: res.company_id || currentUser.company_id,
          },
          activeRole: res.role,
        })
      }
      return { success: true, res }
    } catch (e) {
      return { success: false, message: e.status === 400 ? 'Data tidak valid.' : 'Gagal upgrade akun.' }
    }
  },

  // =====================================================================
  // ACTIONS — CHAT (Item 5)
  // =====================================================================
  conversations: [],
  chatMessages: {},
  chatContacts: [],
  chatLoading: false,

  loadConversations: async () => {
    try {
      const res = await api.chatConversations()
      set({ conversations: res.conversations || [] })
      return res.conversations || []
    } catch (e) {
      return []
    }
  },

  loadChatMessages: async (conversationId) => {
    if (!conversationId) return []
    try {
      const res = await api.chatMessages(conversationId)
      set({ chatMessages: { ...get().chatMessages, [conversationId]: res.messages || [] } })
      return res.messages || []
    } catch (e) {
      return []
    }
  },

  sendChatMessage: async (payload) => {
    try {
      const res = await api.chatSend(payload)
      const convId = res.conversation_id
      const list = get().chatMessages[convId] || []
      set({
        chatMessages: {
          ...get().chatMessages,
          [convId]: [...list, {
            id: res.message_id,
            conversation_id: convId,
            sender_id: res.sender_id,
            body: res.body,
            created_at: res.created_at,
            sender_name: get().currentUser?.name || '',
            is_system: false,
          }],
        },
      })
      return { success: true, res }
    } catch (e) {
      return { success: false, message: 'Gagal mengirim pesan.' }
    }
  },

  loadChatContacts: async () => {
    try {
      const res = await api.chatContacts()
      set({ chatContacts: res.contacts || [] })
      return res.contacts || []
    } catch (e) {
      return []
    }
  },

  addChatContact: async (userCode) => {
    try {
      const res = await api.chatAddContact(userCode)
      const contacts = get().chatContacts
      if (!contacts.some((c) => c.id === res.contact.id)) {
        set({ chatContacts: [...contacts, res.contact] })
      }
      return { success: true, contact: res.contact }
    } catch (e) {
      return { success: false, message: e.status === 404 ? 'Kode user tidak ditemukan.' : 'Gagal menambah kontak.' }
    }
  },

  createChatGroup: async (data) => {
    try {
      const res = await api.chatGroupCreate(data)
      await get().loadConversations()
      return { success: true, res }
    } catch (e) {
      return { success: false, message: 'Gagal membuat grup chat.' }
    }
  },

  // =====================================================================
  // ACTIONS — AI AGENT (Item 8)
  // =====================================================================
  agentMessages: [],

  sendAgentMessage: async (message) => {
    const history = get().agentMessages
    set({ agentMessages: [...history, { id: Date.now() + Math.random(), sender: 'user', body: message, createdAt: Date.now() }] })
    try {
      const res = await api.agentChat(message)
      set({
        agentMessages: [
          ...get().agentMessages,
          { id: Date.now() + Math.random(), sender: 'agent', body: res.text || res.message || JSON.stringify(res), createdAt: Date.now() },
        ],
      })
      return { success: true, res }
    } catch (e) {
      set({
        agentMessages: [
          ...get().agentMessages,
          { id: Date.now() + Math.random(), sender: 'agent', body: 'Maaf, agent tidak merespons. Pastikan backend online.', createdAt: Date.now() },
        ],
      })
      return { success: false }
    }
  },

  clearAgentMessages: () => set({ agentMessages: [] }),

  // =====================================================================
  // ACTIONS — KANBAN (MOCK)
  // =====================================================================

  addKanbanBoard: (board) =>
    set({
      kanbanBoards: [...get().kanbanBoards, {
        id: Date.now(),
        createdAt: Date.now(),
        ...board,
        theme: board.theme || '',
        collaboratorIds: board.collaboratorIds || [],
        columns: Array.isArray(board.columns) && board.columns.length
          ? board.columns
              .map((c) => (typeof c === 'string' ? { name: c, todos: [] } : c))
              .filter((c) => c && c.name && c.name.trim())
              .map((c, i) => ({
                id: i + 1,
                name: c.name.trim(),
                tasks: (Array.isArray(c.todos) ? c.todos : [])
                  .map((t) => (typeof t === 'string' ? t.trim() : ''))
                  .filter(Boolean)
                  .map((title, j) => ({ id: Date.now() + j, title })),
              }))
          : [
              { id: 1, name: 'To Do', tasks: [] },
              { id: 2, name: 'In Progress', tasks: [] },
              { id: 3, name: 'Done', tasks: [] },
            ],
      }],
    }),

  addKanbanTask: (boardId, columnId, task) => {
    const { kanbanBoards } = get()
    const updatedBoards = kanbanBoards.map((board) => {
      if (board.id !== boardId) return board
      const updatedColumns = board.columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, { id: Date.now(), ...task }] }
          : col
      )
      return { ...board, columns: updatedColumns }
    })
    set({ kanbanBoards: updatedBoards, projects: recalcBoardProgress(get()) })
  },

  moveKanbanTask: (boardId, fromColumnId, toColumnId, taskId) => {
    const { kanbanBoards } = get()
    const updatedBoards = kanbanBoards.map((board) => {
      if (board.id !== boardId) return board
      let movedTask = null
      const updatedColumns = board.columns
        .map((col) => {
          if (col.id === fromColumnId) {
            const task = col.tasks.find((t) => t.id === taskId)
            if (task) movedTask = task
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          }
          return col
        })
        .map((col) =>
          col.id === toColumnId && movedTask
            ? { ...col, tasks: [...col.tasks, movedTask] }
            : col
        )
      return { ...board, columns: updatedColumns }
    })
    set({ kanbanBoards: updatedBoards, projects: recalcBoardProgress(get()) })
  },

  deleteKanbanBoard: (boardId) =>
    set({ kanbanBoards: get().kanbanBoards.filter((b) => b.id !== boardId) }),

  toggleBoardCollaborator: (boardId, memberId) =>
    set({
      kanbanBoards: get().kanbanBoards.map((b) => {
        if (b.id !== boardId) return b
        const has = (b.collaboratorIds || []).includes(memberId)
        return {
          ...b,
          collaboratorIds: has
            ? (b.collaboratorIds || []).filter((id) => id !== memberId)
            : [...(b.collaboratorIds || []), memberId],
        }
      }),
    }),

  // =====================================================================
  // ACTIONS — PROJECT / TASK (MOCK)
  // =====================================================================

  addProject: (project) => {
    const id = Date.now()
    set({
      projects: [...get().projects, {
        id,
        createdAt: Date.now(),
        ...project,
        progress: 0,
        status: 'active',
        // Tahapan (stages) diisi untuk target kanban — dibuat di createTarget.
        stages: [],
        // Kolaborator (multi-user): id member yang ikut mengerjakan target.
        collaboratorIds: project.collaboratorIds || [],
        // Tema/window: grup target (mis. "Project Rumah").
        theme: project.theme || '',
      }],
    })
    return id
  },

  // Buat target baru (visi). Untuk cara kelola 'kanban', tahapan (kolom +
  // to-do) dibangun dari input form dan mengalir berurutan: tahap pertama
  // berjalan, sisanya terkunci sampai tahap sebelumnya selesai.
  createTarget: (data) => {
    const id = get().addProject(data)
    if (data.viewType === 'kanban') {
      const stages = buildStages(data.stages)
      set({
        projects: get().projects.map((p) => (p.id === id ? { ...p, stages } : p)),
      })
    }
    track('create_target', { viewType: data.viewType || 'todo' })
    get().addXp(20, 'Membuat target baru')
    return id
  },

  // Buka halaman detail target tertentu.
  openProject: (id) => set({ selectedProjectId: id, currentPage: 'project-detail' }),

  // Buka halaman kanban dan pilih board tertentu.
  openKanbanBoard: (boardId) => set({ selectedBoardId: boardId, currentPage: 'kanban' }),

  addTask: (task) =>
    set({
      tasks: [...get().tasks, { id: Date.now(), createdAt: Date.now(), ...task, status: 'pending', theme: task.theme || '' }],
      projects: recalcTodoProgress(get()),
    }),

  // Toggle status task (pending <-> completed).
  toggleTaskStatus: (taskId) => {
    const prev = get().tasks.find((t) => t.id === taskId)
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      ),
      projects: recalcTodoProgress(get()),
    })
    if (prev && prev.status !== 'completed') {
      track('complete_task')
      get().addXp(10, 'Menyelesaikan task')
    }
  },

  deleteTask: (taskId) =>
    set({
      tasks: get().tasks.filter((t) => t.id !== taskId),
      projects: recalcTodoProgress(get()),
    }),

  // Hapus target + task & board kanban yang terkait dengannya.
  deleteProject: (projectId) =>
    set({
      projects: get().projects.filter((p) => p.id !== projectId),
      tasks: get().tasks.filter((t) => t.projectId !== projectId),
      kanbanBoards: get().kanbanBoards.filter((b) => b.projectId !== projectId),
    }),

  // ---- Kolaborasi multi-user di target ----

  // Tambah/ubah daftar kolaborator sebuah target (member yang ikut kerja).
  setProjectCollaborators: (projectId, collaboratorIds) =>
    set({
      projects: get().projects.map((p) =>
        p.id === projectId ? { ...p, collaboratorIds: [...collaboratorIds] } : p
      ),
    }),

  toggleProjectCollaborator: (projectId, memberId) =>
    set({
      projects: get().projects.map((p) => {
        if (p.id !== projectId) return p
        const has = (p.collaboratorIds || []).includes(memberId)
        return {
          ...p,
          collaboratorIds: has
            ? (p.collaboratorIds || []).filter((id) => id !== memberId)
            : [...(p.collaboratorIds || []), memberId],
        }
      }),
    }),

  // Kolaborator global untuk task (halaman Todo).
  toggleTodoCollaborator: (memberId) =>
    set({
      todoCollaboratorIds: get().todoCollaboratorIds.includes(memberId)
        ? get().todoCollaboratorIds.filter((id) => id !== memberId)
        : [...get().todoCollaboratorIds, memberId],
    }),

  // Toggle checklist + hitung ulang progress + auto-unlock stage berikutnya.
  toggleChecklist: (projectId, stageId, checklistId) => {
    const { projects } = get()
    const updatedProjects = projects.map((p) => {
      if (p.id !== projectId) return p

      const updatedStages = p.stages.map((s) =>
        s.id === stageId
          ? { ...s, checklist: s.checklist.map((c) =>
              c.id === checklistId ? { ...c, completed: !c.completed } : c
            ) }
          : s
      )

      // Hitung progress dari checklist yang selesai.
      let total = 0
      let completed = 0
      updatedStages.forEach((stage) =>
        stage.checklist.forEach((item) => {
          total++
          if (item.completed) completed++
        })
      )
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0

      // Auto-unlock stage berikutnya jika stage aktif selesai.
      updatedStages.forEach((stage, idx) => {
        if (stage.status === 'in_progress' && idx < updatedStages.length - 1) {
          if (stage.checklist.every((c) => c.completed)) {
            updatedStages[idx + 1] = { ...updatedStages[idx + 1], status: 'in_progress' }
          }
        }
      })

      // Semua tahap selesai => target tercapai.
      const allDone = updatedStages.every((s) => s.status === 'completed')
      return { ...p, stages: updatedStages, progress, status: allDone ? 'completed' : p.status }
    })
    set({ projects: updatedProjects })
  },

  // Tandai satu stage selesai + unlock stage berikutnya.
  completeStage: (projectId, stageId) => {
    const { projects } = get()
    const updatedProjects = projects.map((p) => {
      if (p.id !== projectId) return p

      const updatedStages = p.stages.map((s) => {
        if (s.id === stageId) {
          return {
            ...s,
            status: 'completed',
            checklist: s.checklist.map((c) => ({ ...c, completed: true })),
          }
        }
        if (s.id === stageId + 1) {
          return { ...s, status: 'in_progress' }
        }
        return s
      })

      let total = 0
      let completed = 0
      updatedStages.forEach((stage) =>
        stage.checklist.forEach((item) => {
          total++
          if (item.completed) completed++
        })
      )
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0

      // Semua tahap selesai => target tercapai.
      const allDone = updatedStages.every((s) => s.status === 'completed')
      return { ...p, stages: updatedStages, progress, status: allDone ? 'completed' : p.status }
    })
    set({ projects: updatedProjects })
  },

  // Ringkasan statistik untuk dashboard.
  getStats: () => {
    const { projects, tasks } = get()
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
    }
  },
    }),
    {
      name: 'luxio-store', // kunci localStorage untuk persist state
      // Versi state tersimpan. Naikkan versi (dan update `migrate`) jika
      // struktur state berubah di masa depan.
      version: 5,
      // Bersihkan state lama dari build sebelumnya yang sempat rusak:
      // data v0 bisa punya appState 'landing' walau isAuthenticated true,
      // membuat user "logout" sendiri setelah refresh.
      migrate: (persistedState, version) => {
        if (version < 1) {
          const s = persistedState && typeof persistedState === 'object' ? persistedState : {}
          const authed = Boolean(s.isAuthenticated && s.currentUser)
          return {
            ...s,
            isAuthenticated: authed,
            hasCompletedSetup: authed ? Boolean(s.hasCompletedSetup) : false,
            appState: authed ? (s.appState === 'setup' ? 'setup' : 'app') : 'landing',
          }
        }
        if (version < 2) {
          // v1 bisa masih membawa data dummy (project/task/kanban mock)
          // dari sesi sebelum data demo dihapus.
          const s = persistedState && typeof persistedState === 'object' ? persistedState : {}
          return {
            ...s,
            projects: [],
            tasks: [],
            kanbanBoards: [],
          }
        }
        if (version < 3) {
          // v2 bisa menyimpan appState 'pricing'/'faq'/'checkout' dari sesi
          // publik sebelumnya sehingga setelah refresh halaman langsung terbuka
          // ke Pricing, bukan Landing. Reset ke 'landing' untuk pengguna yang
          // belum login; yang sudah login diarahkan ke app oleh App.jsx.
          const s = persistedState && typeof persistedState === 'object' ? persistedState : {}
          const authed = Boolean(s.isAuthenticated && s.currentUser)
          return {
            ...s,
            appState: authed ? (s.appState === 'setup' ? 'setup' : 'app') : 'landing',
          }
        }
        if (version < 4) {
          // v3: inisialisasi field baru (gamification, alarm, riset, penilaian)
          // agar selalu bertipe object walau belum pernah diisi.
          const s = persistedState && typeof persistedState === 'object' ? persistedState : {}
          return {
            ...s,
            gamification: s.gamification || {},
            alarms: s.alarms || {},
            researchTopics: s.researchTopics || {},
            performanceRatings: s.performanceRatings || {},
            vaultSettings: s.vaultSettings || {},
          }
        }
        if (version < 5) {
          // v4: akun OWNER kini punya data TERPISAH per mode role
          // (owner/super_admin/admin/user) supaya tidak saling campur.
          // Data lama yang dulu di-key oleh id user dipindahkan ke kunci
          // mode saat ini (id:role), sisanya mulai bersih di mode lain.
          const s = persistedState && typeof persistedState === 'object' ? persistedState : {}
          const u = s.currentUser
          if (u && u.role === 'owner' && u.id != null) {
            const uid = String(u.id)
            const role = ['owner', 'super_admin', 'admin', 'user'].includes(s.activeRole) ? s.activeRole : 'owner'
            const key = `${uid}:${role}`
            const rekey = (obj) => {
              if (!obj || typeof obj !== 'object') return obj || {}
              if (obj[uid] == null) return obj
              return { ...obj, [key]: obj[uid] }
            }
            return {
              ...s,
              privateNotes: rekey(s.privateNotes),
              vault: rekey(s.vault),
              alarms: rekey(s.alarms),
              researchTopics: rekey(s.researchTopics),
              gamification: rekey(s.gamification),
              vaultSettings: rekey(s.vaultSettings),
            }
          }
          return s
        }
        return persistedState
      },
    }
  )
)

// Role efektif: untuk akun OWNER bisa berubah-ubah (act-as),
// untuk akun lain = role aslinya.
export const useEffectiveRole = () =>
  useStore((s) => s.activeRole || s.currentUser?.role || 'member')
