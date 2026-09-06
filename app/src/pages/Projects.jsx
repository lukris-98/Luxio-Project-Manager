import { useState, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import TargetForm from '../components/TargetForm'
import ContributorStack from '../components/ContributorStack'
import AnimatedDropdown from '../components/AnimatedDropdown'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import {
  Target, Plus, Calendar, CalendarClock, CheckCircle2, TrendingUp, AlertCircle,
  MoreVertical, Folder, Clock, PauseCircle, Ban, CheckCheck
} from 'lucide-react'
import { formatDate } from '../utils/date'
import './Projects.css'

const PIE_COLORS = ['#00D9A5', '#0780FA', '#FFB830', '#8B8BA7'] // Tercapai, On Progress, Tertunda, Belum Dimulai

// Tab status daftar target.
const STATUS_TABS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'scheduled', label: 'Terjadwal', icon: CalendarClock },
  { id: 'on_progress', label: 'On Progress', icon: Clock },
  { id: 'pending', label: 'Pending', icon: PauseCircle },
  { id: 'cancelled', label: 'Cancelled', icon: Ban },
  { id: 'done', label: 'Done', icon: CheckCheck },
]

// Status target di baris daftar (bahasa Inggris).
const STATUS_META = {
  completed: { label: 'Done', key: 'completed', color: '#00D9A5' },
  in_progress: { label: 'On Progress', key: 'in_progress', color: '#0780FA' },
  active: { label: 'On Progress', key: 'in_progress', color: '#0780FA' },
  pending: { label: 'Pending', key: 'pending', color: '#FFB830' },
  cancelled: { label: 'Cancelled', key: 'cancelled', color: '#E94560' },
}

export default function Projects() {
  const { projects, members, currentUser, openProject, deleteProject, labelFilter, setProjectCollaborators } = useStore()
  const role = useEffectiveRole()
  const [activeTab, setActiveTab] = useState('ringkasan') // ringkasan, saya, tim, periode
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedMonth] = useState('Agustus 2026')
  const [activeMenuId, setActiveMenuId] = useState(null)

  const canCreate = role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'user'

  // Hitung kontributor + ketua (assignee) sebuah target.
  // Minimal 1 contributor: pembuat project (assignee/createdBy/currentUser).
  const contributorsOf = (p) => {
    const list = []
    let leaderId = p.assigneeId || p.createdBy
    let leader = leaderId ? members.find((m) => m.id === leaderId) : null
    if (!leader && currentUser) leader = currentUser
    if (leader) list.push(leader)
    ;(p.collaboratorIds || []).forEach((id) => {
      if (list.some((m) => m.id === id)) return
      const m = members.find((x) => x.id === id)
      if (m) list.push(m)
    })
    return list
  }

  // Estimasi persentase kontribusi tiap anggota dalam project ini.
  const contributionOf = (p, memberId) => {
    const cols = contributorsOf(p)
    if (cols.length === 0) return 0
    // Peran kepemimpinan diberi bobot lebih: ketua dianggap paling berkontribusi.
    const idx = cols.findIndex((m) => m.id === memberId)
    if (idx === 0) return cols.length === 1 ? 100 : Math.round(60 / cols.length + 20)
    return Math.round(40 / Math.max(1, cols.length - 1))
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projects.length
    const active = projects.filter(p => p.status !== 'completed').length
    const completed = projects.filter(p => p.status === 'completed').length
    const avgProgress = total > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total) : 0
    const late = projects.filter(p => p.status !== 'completed' && p.deadline && new Date(p.deadline) < new Date()).length

    return { total, active, completed, avgProgress, late }
  }, [projects])

  // Pie chart data
  const pieData = useMemo(() => {
    const tercapai = projects.filter(p => p.status === 'completed').length
    const onProgress = projects.filter(p => p.status === 'in_progress').length
    const tertunda = projects.filter(p => p.status === 'pending').length
    const belumDimulai = projects.filter(p => !p.status || p.status === 'none').length
    const total = projects.length || 1

    return [
      { name: 'Tercapai', value: tercapai, pct: Math.round((tercapai / total) * 100) },
      { name: 'On Progress', value: onProgress, pct: Math.round((onProgress / total) * 100) },
      { name: 'Tertunda', value: tertunda, pct: Math.round((tertunda / total) * 100) },
      { name: 'Belum Dimulai', value: belumDimulai, pct: Math.round((belumDimulai / total) * 100) },
    ].filter(d => d.value > 0)
  }, [projects])

  // Category statistics
  const categoryStats = useMemo(() => {
    const cats = {}
    projects.forEach(p => {
      const cat = p.theme || 'Umum'
      if (!cats[cat]) cats[cat] = { total: 0, completed: 0, progressSum: 0 }
      cats[cat].total += 1
      cats[cat].progressSum += (p.progress || 0)
      if (p.status === 'completed') cats[cat].completed += 1
    })

    return Object.entries(cats).map(([name, data]) => ({
      name,
      progress: Math.round(data.progressSum / data.total),
      ratio: `${data.completed}/${data.total} target`
    })).slice(0, 4)
  }, [projects])

  // Filter project list based on active tab + label filter + status filter
  //   - "Saya"  : project yang anggotanya cuma saya sendiri
  //   - "Tim"   : project yang dikerjakan minimal 2 orang
  //   - "Selesai": project berstatus completed (pengganti tab Periode)
  const filteredProjects = useMemo(() => {
    let list = projects
    const memberCount = (p) => {
      const ids = new Set(p.collaboratorIds || [])
      if (p.assigneeId) ids.add(p.assigneeId)
      return ids.size
    }
    if (activeTab === 'saya') {
      list = list.filter(p => memberCount(p) <= 1)
    } else if (activeTab === 'tim') {
      list = list.filter(p => memberCount(p) >= 2)
    } else if (activeTab === 'selesai') {
      list = list.filter(p => p.status === 'completed')
    }
    if (labelFilter !== null) {
      list = list.filter(p => {
        const l = (p.theme || '').trim()
        return labelFilter === '' ? !l : l === labelFilter
      })
    }
    if (statusFilter === 'scheduled') {
      // Terjadwal: punya deadline di masa depan dan belum mulai dikerjakan.
      const today = new Date()
      list = list.filter(p => {
        if (p.status === 'completed' || p.status === 'cancelled') return false
        if (!p.deadline) return false
        return new Date(p.deadline) >= today && (p.progress || 0) === 0
      })
    } else if (statusFilter === 'on_progress') {
      list = list.filter(p => p.status === 'in_progress' || p.status === 'active')
    } else if (statusFilter === 'pending') {
      list = list.filter(p => p.status === 'pending' || (!p.status || p.status === 'none'))
    } else if (statusFilter === 'cancelled') {
      list = list.filter(p => p.status === 'cancelled')
    } else if (statusFilter === 'done') {
      list = list.filter(p => p.status === 'completed')
    }
    return list
  }, [projects, activeTab, labelFilter, statusFilter])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="projects-page luxio-target-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="target-header" variants={itemVariants}>
        <div className="target-header-left">
          <h1>Projects</h1>
          <p>Pantau dan capai target bersama tim.</p>
        </div>
        <div className="target-header-actions">
          <div className="month-picker">
            <span>{selectedMonth}</span>
            <Calendar size={16} />
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Buat Target
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs — periode diganti "Selesai" (project yang sudah selesai) */}
      <motion.div className="target-tabs-bar" variants={itemVariants}>
        {[['ringkasan', 'Ringkasan'], ['saya', 'Saya'], ['tim', 'Tim'], ['selesai', 'Selesai']].map(([tab, label]) => (
          <button
            key={tab}
            className={`target-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {activeTab === 'ringkasan' && (
        <>
          {/* KPI Summary Cards */}
          <motion.div className="target-kpi-grid" variants={itemVariants}>
            <div className="kpi-card target-active">
              <div className="kpi-icon-wrapper red">
                <Target size={22} />
              </div>
              <div className="kpi-content">
                <span>Target Aktif</span>
                <strong>{stats.active}</strong>
                <small className="trend-up">{stats.late} target akan selesai ↗</small>
              </div>
            </div>
            <div className="kpi-card target-achieved">
              <div className="kpi-icon-wrapper green">
                <CheckCircle2 size={22} />
              </div>
              <div className="kpi-content">
                <span>Target Tercapai</span>
                <strong>{stats.completed}</strong>
                <small className="trend-up">{projects.length > 0 ? Math.round((stats.completed / projects.length) * 100) : 0}% dari total target ↗</small>
              </div>
            </div>
            <div className="kpi-card target-progress">
              <div className="kpi-icon-wrapper blue">
                <TrendingUp size={22} />
              </div>
              <div className="kpi-content">
                <span>Rata-rata Progress</span>
                <strong>{stats.avgProgress}%</strong>
                <small className="trend-up">+12% dari bulan lalu ↗</small>
              </div>
            </div>
            <div className="kpi-card target-overdue">
              <div className="kpi-icon-wrapper orange">
                <AlertCircle size={22} />
              </div>
              <div className="kpi-content">
                <span>Akan Lewat Batas</span>
                <strong>{stats.late}</strong>
                <small className="trend-warning">Perlu perhatian ↗</small>
              </div>
            </div>
          </motion.div>

          {/* Charts Row */}
          <motion.div className="target-charts-row" variants={itemVariants}>
            {/* Donut Chart */}
            <div className="chart-panel target-donut-panel">
              <div className="panel-header">
                <h2>Progress Projects</h2>
                <button className="panel-action-btn">Lihat Semua</button>
              </div>
              <div className="donut-chart-container">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData.length ? pieData : [{ name: 'Belum Dimulai', value: 1, pct: 100 }]}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {(pieData.length ? pieData : [{ name: 'Belum Dimulai', value: 1 }]).map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-label">
                  <strong>{stats.avgProgress}%</strong>
                  <span>Rata-rata</span>
                </div>
              </div>
              <div className="chart-legends">
                {pieData.map((d, idx) => (
                  <div key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="legend-name">{d.name}</span>
                    <strong className="legend-val">{d.value} target ({d.pct}%)</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Bars */}
            <div className="chart-panel target-category-panel">
              <div className="panel-header">
                <h2>Projects Berdasarkan Kategori</h2>
                <button className="panel-action-btn">Lihat Semua</button>
              </div>
              <div className="category-bars-list">
                {categoryStats.length === 0 ? (
                  <p className="empty-category-text">Belum ada kategori target.</p>
                ) : (
                  categoryStats.map((cat, idx) => (
                    <div key={cat.name} className="category-bar-row">
                      <div className="category-bar-info">
                        <span className="cat-name">
                          <Folder size={14} /> {cat.name}
                        </span>
                        <span className="cat-ratio">{cat.ratio}</span>
                      </div>
                      <div className="category-progress-track">
                        <div
                          className="category-progress-fill"
                          style={{
                            width: `${cat.progress}%`,
                            backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                          }}
                        />
                        <span className="cat-pct-label">{cat.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* List: Daftar Target */}
      <motion.div className="target-list-panel" variants={itemVariants}>
        <div className="panel-header">
          <h2>Daftar Projects</h2>
          <span className="target-list-count">{filteredProjects.length} target</span>
        </div>

        {/* Status tabs */}
        <div className="target-status-tabs">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`target-status-tab ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {Icon && <Icon size={13} />}
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="target-list">
          {filteredProjects.length === 0 ? (
            <div className="target-list-empty">
              <Target size={40} />
              <p>Tidak ada target pada status ini.</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const pct = p.progress || 0
              const statusMeta = STATUS_META[p.status] || STATUS_META.pending
              const statusKey = statusMeta.key
              const contributors = contributorsOf(p)
              const isDone = p.status === 'completed'
              return (
                <div
                  key={p.id}
                  className={`target-list-row ${isDone ? 'is-done' : ''}`}
                  onClick={() => openProject(p.id)}
                >
                  <span className={`target-row-status-bar ${statusKey}`} />
                  <div className="target-row-main">
                    <div className="target-row-title">
                      <span className="target-row-icon"><Target size={16} /></span>
                      <strong>{p.name}</strong>
                      {isDone && <CheckCircle2 size={15} className="target-row-done" />}
                    </div>
                    <p className="target-row-desc">{p.description || 'Tidak ada deskripsi'}</p>
                    <div className="target-row-meta">
                      <span className="badge category-badge"><Folder size={12} /> {p.theme || 'Umum'}</span>
                      <span className="target-period"><Calendar size={12} /> 1 Jul - {p.deadline ? formatDate(p.deadline) : '30 Sep 2026'}</span>
                    </div>
                  </div>

                  <div className="target-row-progress">
                    <div className="target-row-progress-top">
                      <span>Progress</span>
                      <strong>{pct}%</strong>
                    </div>
                    <div className="table-progress-track">
                      <div className={`table-progress-fill ${statusKey}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <span className={`status-pill status-${statusKey}`}>
                    {statusMeta.label}
                  </span>

                  {/* Stack kontributor + dropdown (minimal 1 = pembuat project) */}
                  <ContributorStack
                    contributors={contributors}
                    contributionOf={(memberId) => contributionOf(p, memberId)}
                    onRemove={(memberId) =>
                      setProjectCollaborators(
                        p.id,
                        (p.collaboratorIds || []).filter((id) => id !== memberId)
                      )
                    }
                    onAdd={() => { setEditingProject(p); setShowForm(true) }}
                  />

                  <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn" onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}>
                      <MoreVertical size={16} />
                    </button>
                    <AnimatedDropdown show={activeMenuId === p.id}>
                      <div className="table-dropdown-menu">
                        <button onClick={() => { openProject(p.id); setActiveMenuId(null); }}>Detail</button>
                        <button onClick={() => { setEditingProject(p); setShowForm(true); setActiveMenuId(null); }}>Edit</button>
                        <button onClick={() => { deleteProject(p.id); setActiveMenuId(null); }} className="danger">Hapus</button>
                      </div>
                    </AnimatedDropdown>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      {showForm && (
        <TargetForm
          onClose={() => { setShowForm(false); setEditingProject(null) }}
          initial={editingProject}
          onCreated={(id) => { setShowForm(false); setEditingProject(null); openProject(id) }}
        />
      )}
    </motion.div>
  )
}
