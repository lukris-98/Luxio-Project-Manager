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
  // ---------- NAVIGASI (tanpa react-router) ----------
  // appState: 'landing' | 'pricing' | 'faq' | 'checkout' | 'auth' | 'setup' | 'app'
  appState: 'landing',
  // currentPage: halaman dalam area 'app' (dashboard, projects, dll)
  currentPage: 'dashboard',

  // ---------- TEMA (dark/light, tersimpan di localStorage) ----------
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

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

  // ---------- NOTIFIKASI (in-app + browser) ----------
  // Daftar notifikasi terbaru (deadline, target/task baru, dsb).
  notifications: [],

  // ---------- CATATAN PRIBADI (per user, bisa dikunci PIN) ----------
  // privateNotes[userId] = [ { id, title, content, pin, locked, createdAt, updatedAt } ]
  privateNotes: {},

  // =====================================================================
  // ACTIONS — NAVIGASI
  // =====================================================================
  setAppState: (state) => set({ appState: state }),
  setCurrentPage: (page) => set({ currentPage: page }),

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
          ...notification,
        },
        ...get().notifications,
      ].slice(0, 50),
    }),

  markAllNotificationsRead: () =>
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    }),

  clearNotifications: () => set({ notifications: [] }),

  // =====================================================================
  // ACTIONS — CATATAN PRIBADI
  // =====================================================================
  // Setiap user punya daftar catatan sendiri (dipisah berdasarkan id user).
  addPrivateNote: (note) => {
    const userId = get().currentUser?.id
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
          ...note,
        }],
      },
    })
    return id
  },

  updatePrivateNote: (noteId, data) => {
    const userId = get().currentUser?.id
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

  deletePrivateNote: (noteId) => {
    const userId = get().currentUser?.id
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
    const userId = get().currentUser?.id
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
    const userId = get().currentUser?.id
    if (userId == null) return
    const myNotes = get().privateNotes[userId] || []
    set({
      privateNotes: {
        ...get().privateNotes,
        [userId]: myNotes.map((n) => (n.id === noteId ? { ...n, closed: false } : n)),
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
  createMemberAndAdd: ({ name, email, role = 'member', teamId, divisionId }) => {
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
   * Login ke backend. Mengembalikan { success, message }.
   */
  login: async (email, password) => {
    try {
      const res = await api.login(email, password)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      // Akun OWNER (pemilik website) langsung masuk ke area app,
      // tidak perlu lewat alur setup (tidak punya workspace sendiri).
      const isOwner = res.user.role === 'owner'
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: isOwner ? true : get().hasCompletedSetup,
        // Kalau user sudah setup, langsung ke app; kalau belum, ke setup.
        // setupStep direset 0 agar selalu mulai dari pemilihan tipe.
        appState: isOwner || get().hasCompletedSetup ? 'app' : 'setup',
        setupStep: 0,
        currentPage: isOwner ? 'admin-users' : 'dashboard',
        activeRole: res.user.role,
      })
      track('login', { role: res.user.role })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Daftar akun baru ke backend. Mengembalikan { success, message }.
   */
  register: async (name, email, password) => {
    try {
      const res = await api.register(name, email, password)
      if (!res.success) throw new Error(res.message)
      setToken(res.token)
      set({
        currentUser: res.user,
        token: res.token || null,
        isAuthenticated: true,
        hasCompletedSetup: false,
        currentPlan: 'personal',
        setupStep: 0, // user baru selalu mulai dari pemilihan tipe
        appState: 'setup', // user baru wajib lewat setup
        currentPage: 'dashboard',
        activeRole: res.user.role,
      })
      track('signup', { role: res.user.role })
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
  // ACTIONS — KANBAN (MOCK)
  // =====================================================================

  addKanbanBoard: (board) =>
    set({
      kanbanBoards: [...get().kanbanBoards, {
        id: Date.now(),
        ...board,
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

  // =====================================================================
  // ACTIONS — PROJECT / TASK (MOCK)
  // =====================================================================

  addProject: (project) => {
    const id = Date.now()
    set({
      projects: [...get().projects, {
        id,
        ...project,
        progress: 0,
        status: 'active',
        // Tahapan (stages) diisi untuk target kanban — dibuat di createTarget.
        stages: [],
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
    return id
  },

  // Buka halaman detail target tertentu.
  openProject: (id) => set({ selectedProjectId: id, currentPage: 'project-detail' }),

  addTask: (task) =>
    set({
      tasks: [...get().tasks, { id: Date.now(), ...task, status: 'pending' }],
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
    if (prev && prev.status !== 'completed') track('complete_task')
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
      version: 2,
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
        return persistedState
      },
    }
  )
)

// Role efektif: untuk akun OWNER bisa berubah-ubah (act-as),
// untuk akun lain = role aslinya.
export const useEffectiveRole = () =>
  useStore((s) => s.activeRole || s.currentUser?.role || 'member')
