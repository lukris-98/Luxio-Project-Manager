import { useState } from 'react'
import { useStore } from '../store/useStore'
import TargetForm from '../components/TargetForm'
import LabelFilterBar from '../components/LabelFilterBar'
import { motion } from 'framer-motion'
import { Target, Plus, CalendarClock, KanbanSquare, ListTodo, FolderOpen, Percent } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import './Projects.css'

const VIEW_LABELS = {
  kanban: 'Kanban',
  todo: 'To-do',
  workflow: 'Workflow',
}

// Hitung jumlah kanban & to-do list yang dimiliki sebuah target.
function countsOf(project, kanbanBoards, tasks) {
  const boards = kanbanBoards.filter((b) => b.projectId === project.id).length
  const todos = tasks.filter((t) => t.projectId === project.id).length
  const stages = project.stages || []
  return { kanban: boards + stages.length, todo: todos }
}

export default function Projects() {
  const { projects, divisions, members, companyInfo, kanbanBoards, tasks, openProject, labelFilter } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('created-desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const isIndividual = companyInfo?.type === 'individual'

  const assigneeName = (project) =>
    members.find((m) => m.id === project.assigneeId)?.name

  // Kelompokkan target per label; tanpa label masuk grup "Tanpa Label".
  const groupByTheme = () => {
    const groups = {}
    filtered().forEach((p) => {
      const key = (p.theme || '').trim()
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '') return 1
      if (b === '') return -1
      return a.localeCompare(b)
    })
  }

  // Filter target berdasarkan label, tanggal, nama, dan pencarian.
  const filtered = () => {
    let list = projects.filter((p) => {
      if (labelFilter === null) return true
      const l = (p.theme || '').trim()
      if (labelFilter === '') return !l
      return l === labelFilter
    })
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }
    const fromT = dateFrom ? new Date(dateFrom).getTime() : null
    const toT = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
    if (fromT || toT) {
      list = list.filter((p) => {
        const t = p.createdAt || 0
        if (fromT && t < fromT) return false
        if (toT && t > toT) return false
        return true
      })
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'created-asc') return (a.createdAt || 0) - (b.createdAt || 0)
      if (sortBy === 'created-desc') return (b.createdAt || 0) - (a.createdAt || 0)
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
      return (b.name || '').localeCompare(a.name || '')
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <>
      <motion.div
        className="projects-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Target</h1>
            <p>Kelola target dalam label (grup pekerjaan)</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Target Baru
          </button>
        </motion.div>

        {/* Filter & Search */}
        {projects.length > 0 && (
          <LabelFilterBar
            labels={projects.map((p) => (p.theme || '').trim())}
            search={query}
            setSearch={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            placeholder="Cari target..."
          />
        )}

        {projects.length === 0 ? (
          <motion.div className="empty-state-full" variants={itemVariants}>
            <Target size={48} />
            <h3>Belum ada target</h3>
            <p>Buat target pertama kamu untuk mulai tracking progress tim</p>
          </motion.div>
        ) : filtered().length === 0 ? (
          <motion.div className="empty-state-full" variants={itemVariants}>
            <Target size={48} />
            <h3>Tidak ada target yang cocok</h3>
            <p>Coba ubah filter label, tanggal, atau kata kunci pencarian</p>
          </motion.div>
        ) : (
          groupByTheme().map(([theme, list]) => {
            return (
              <motion.div key={theme || '__none__'} className="theme-section" variants={itemVariants}>
                <div className="theme-head">
                  <FolderOpen size={18} className="theme-head-icon" />
                  <h2>{theme || 'Tanpa Label'}</h2>
                  <span className="theme-count">{list.length} target</span>
                </div>

                <div className="projects-grid">
                  {list.map((project) => {
                    const c = countsOf(project, kanbanBoards, tasks)
                    return (
                      <motion.div
                        key={project.id}
                        className={`project-card ${project.status === 'completed' ? 'achieved' : ''}`}
                        variants={itemVariants}
                        onClick={() => openProject(project.id)}
                      >
                        <div className="project-card-header">
                          <div className="project-icon">
                            <Target size={18} />
                          </div>
                          <div className="project-badges">
                            {project.status === 'completed' && (
                              <span className="badge achieved-badge">Tercapai</span>
                            )}
                            {project.viewType && (
                              <span className={`badge viewtype-badge-${project.viewType}`}>
                                {VIEW_LABELS[project.viewType]}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="project-name">{project.name}</h3>
                        {project.description && (
                          <p className="project-desc">{project.description}</p>
                        )}
                        <div className="project-meta">
                          <span>{project.division || assigneeName(project) || 'Personal'}</span>
                          {deadlineText(project) && (
                            <span className="project-deadline">
                              <CalendarClock size={12} /> {deadlineText(project)}
                            </span>
                          )}
                        </div>

                        {/* Data thumbnail: progress, kanban, to-do */}
                        <div className="project-thumb-stats">
                          <div className="thumb-stat">
                            <Percent size={14} />
                            <span>{project.progress || 0}%</span>
                          </div>
                          <div className="thumb-stat">
                            <KanbanSquare size={14} />
                            <span>{c.kanban}</span>
                          </div>
                          <div className="thumb-stat">
                            <ListTodo size={14} />
                            <span>{c.todo}</span>
                          </div>
                        </div>

                        <div className="project-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })
        )}

        {showForm && (
          <TargetForm
            onClose={() => setShowForm(false)}
            onCreated={(id) => openProject(id)}
          />
        )}
      </motion.div>
    </>
  )
}
