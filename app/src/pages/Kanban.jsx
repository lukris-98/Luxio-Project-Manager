import { useState, useEffect, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import TargetBoard from '../components/TargetBoard'
import ThemeSelect from '../components/ThemeSelect'
import AnimatedDropdown from '../components/AnimatedDropdown'
import DeadlinePicker from '../components/DeadlinePicker'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import TemplateGallery from '../components/TemplateGallery'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import {
  Plus, X, Calendar, ClipboardList, ChevronDown, KanbanSquare, Clock,
  CheckCircle2, AlertCircle, MoveHorizontal, Lock, FileStack, ArrowLeft,
  MoreVertical, Trash2, Pencil, Folder, Target
} from 'lucide-react'
import { formatDate } from '../utils/date'
import './Kanban.css'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done']
const PIE_COLORS = ['#0780FA', '#FFB830', '#A78BFA', '#00D9A5']

export default function Kanban() {
  const {
    currentUser, kanbanBoards, addKanbanBoard, deleteKanbanBoard,
    selectedBoardId, setSelectedBoardId, labelFilter, projects,
  } = useStore()
  const role = useEffectiveRole()
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [deleteBoard, setDeleteBoard] = useState(null)
  const [boardFilter, setBoardFilter] = useState('all')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [templateData, setTemplateData] = useState(null)
  const [editingBoard, setEditingBoard] = useState(null)

  const canCreateBoard = role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'user'

  const isBoardOverdue = (b) => {
    if (!b.deadline) return false
    return new Date(b.deadline) < new Date()
  }

  // Filtered boards
  const filteredBoards = useMemo(() => {
    let pool = kanbanBoards
    if (labelFilter !== null) {
      pool = pool.filter(b => {
        const l = (b.theme || '').trim()
        return labelFilter === '' ? !l : l === labelFilter
      })
    }
    if (boardFilter === 'failed') {
      pool = pool.filter(b => isBoardOverdue(b))
    }
    return pool
  }, [kanbanBoards, labelFilter, boardFilter])

  // Active board for detail view
  const activeBoard = selectedBoardId
    ? kanbanBoards.find(b => b.id === selectedBoardId) || null
    : null

  // Statistics
  const stats = useMemo(() => {
    const total = kanbanBoards.length
    const totalTasks = kanbanBoards.reduce((n, b) =>
      n + b.columns.reduce((m, c) => m + (c.tasks?.length || 0), 0), 0)
    const doneTasks = kanbanBoards.reduce((n, b) => {
      const doneCol = b.columns.find(c => c.name.toLowerCase().includes('done') || c.name.toLowerCase().includes('selesai'))
      return n + (doneCol?.tasks?.length || 0)
    }, 0)
    const overdue = kanbanBoards.filter(b => isBoardOverdue(b)).length
    const dynamic = kanbanBoards.filter(b => b.boardType !== 'static').length
    return { total, totalTasks, doneTasks, overdue, dynamic }
  }, [kanbanBoards])

  // Pie chart: tasks per board
  const pieData = useMemo(() =>
    kanbanBoards.slice(0, 6).map(b => ({
      name: b.name,
      value: b.columns.reduce((n, c) => n + (c.tasks?.length || 0), 0),
    })).filter(d => d.value > 0)
  , [kanbanBoards])

  // Board summary for detail view — match by EXACT column names to avoid
  // "do" matching both "To Do" and "Done".
  const boardSummary = useMemo(() => {
    if (!activeBoard) return { todo: 0, inProgress: 0, review: 0, done: 0, total: 0 }
    let todo = 0, inProgress = 0, review = 0, done = 0, total = 0
    activeBoard.columns.forEach(col => {
      const count = col.tasks?.length || 0
      total += count
      const name = col.name.toLowerCase().trim()
      // Prioritaskan pencocokan yang lebih spesifik dulu.
      if (name.includes('done') || name.includes('selesai')) done += count
      else if (name.includes('review') || name.includes('periksa')) review += count
      else if (name.includes('progress') || name.includes('jalan') || name.includes('doing')) inProgress += count
      else todo += count // default: semua kolom lain dianggap "to do"
    })
    return { todo, inProgress, review, done, total }
  }, [activeBoard])

  const [newBoard, setNewBoard] = useState({
    name: '', description: '', theme: '', boardType: 'dynamic',
    deadlineType: 'deadline', deadline: '', deadlineLabel: '',
    columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
  })

  const setBoard = (key, value) => setNewBoard((b) => ({ ...b, [key]: value }))

  useEffect(() => {
    if (templateData) {
      setNewBoard({
        name: templateData.name || '', description: templateData.description || '',
        theme: templateData.theme || '', boardType: templateData.boardType || 'dynamic',
        deadlineType: templateData.deadlineType || 'deadline',
        deadline: templateData.deadline || '', deadlineLabel: templateData.deadlineLabel || '',
        columns: Array.isArray(templateData.columns) && templateData.columns.length
          ? templateData.columns.map((c, i) => ({ id: i + 1, name: c.name || '', todos: c.todos || [] }))
          : DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
      })
      setShowNewBoard(true)
    }
  }, [templateData])

  const handleCreateBoard = () => {
    if (newBoard.name.trim()) {
      addKanbanBoard({
        name: newBoard.name.trim(), description: newBoard.description.trim(),
        theme: newBoard.theme, boardType: newBoard.boardType,
        deadlineType: newBoard.deadlineType, deadline: newBoard.deadline,
        deadlineLabel: newBoard.deadlineLabel,
        columns: newBoard.columns.map(c => ({ name: c.name, todos: [] })),
        createdBy: currentUser?.id,
      })
      setNewBoard({
        name: '', description: '', theme: '', deadlineType: 'deadline',
        deadline: '', deadlineLabel: '',
        columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
      })
      setShowNewBoard(false)
    }
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }

  // ===== DETAIL VIEW: board selected =====
  if (activeBoard) {
    return (
      <motion.div className="kanban-page-new" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="kanban-detail-header">
          <button className="btn btn-ghost" onClick={() => setSelectedBoardId(null)}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="kanban-detail-title">
            <h1>{activeBoard.name}</h1>
            {activeBoard.theme && <span className="badge badge-muted"><Folder size={12} /> {activeBoard.theme}</span>}
            <span className={`badge ${activeBoard.boardType === 'static' ? 'badge-muted' : 'badge-info'}`}>
              {activeBoard.boardType === 'static' ? <Lock size={12} /> : <MoveHorizontal size={12} />}
              {activeBoard.boardType === 'static' ? 'Statis' : 'Dinamis'}
            </span>
            {isBoardOverdue(activeBoard) && <span className="badge badge-danger"><AlertCircle size={12} /> Failed</span>}
          </div>
          <div className="kanban-detail-actions">
            {canCreateBoard && (
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteBoard(activeBoard)}>
                <Trash2 size={14} /> Hapus
              </button>
            )}
          </div>
        </div>

        {/* Dashboard: chart left + info right, above the board */}
        <div className="kanban-detail-dashboard">
          {/* Left: pie chart */}
          {boardSummary.total > 0 && (
            <div className="chart-panel">
              <div className="panel-header"><h2>Progress Board</h2></div>
              <div className="donut-chart-container">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'To Do', value: boardSummary.todo },
                        { name: 'In Progress', value: boardSummary.inProgress },
                        { name: 'Review', value: boardSummary.review },
                        { name: 'Done', value: boardSummary.done },
                      ].filter(d => d.value > 0)}
                      dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={3} stroke="none"
                    >
                      {[
                        { name: 'To Do', value: boardSummary.todo, color: '#FFB830' },
                        { name: 'In Progress', value: boardSummary.inProgress, color: '#0780FA' },
                        { name: 'Review', value: boardSummary.review, color: '#A78BFA' },
                        { name: 'Done', value: boardSummary.done, color: '#00D9A5' },
                      ].filter(d => d.value > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-label"><strong>{boardSummary.total}</strong><span>task</span></div>
              </div>
              <div className="chart-legends">
                <div className="legend-item"><span className="legend-dot" style={{ background: '#FFB830' }} /><span className="legend-name">To Do</span><strong className="legend-val">{boardSummary.todo}</strong></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#0780FA' }} /><span className="legend-name">In Progress</span><strong className="legend-val">{boardSummary.inProgress}</strong></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#A78BFA' }} /><span className="legend-name">Review</span><strong className="legend-val">{boardSummary.review}</strong></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#00D9A5' }} /><span className="legend-name">Done</span><strong className="legend-val">{boardSummary.done}</strong></div>
              </div>
            </div>
          )}

          {/* Right: board info panel */}
          <div className="chart-panel kanban-info-panel">
            <div className="panel-header"><h2>Info Board</h2></div>
            <div className="kanban-info-grid">
              <div className="kanban-info-item">
                <span className="kanban-info-label">Jenis</span>
                <span className="kanban-info-value">{activeBoard.boardType === 'static' ? 'Statis' : 'Dinamis'}</span>
              </div>
              <div className="kanban-info-item">
                <span className="kanban-info-label">Kolom</span>
                <span className="kanban-info-value">{activeBoard.columns.length}</span>
              </div>
              <div className="kanban-info-item">
                <span className="kanban-info-label">Total Task</span>
                <span className="kanban-info-value">{boardSummary.total}</span>
              </div>
              <div className="kanban-info-item">
                <span className="kanban-info-label">Selesai</span>
                <span className="kanban-info-value" style={{ color: '#00D9A5' }}>
                  {boardSummary.total > 0 ? Math.round((boardSummary.done / boardSummary.total) * 100) : 0}%
                </span>
              </div>
              {activeBoard.deadline && (
                <div className="kanban-info-item">
                  <span className="kanban-info-label">Deadline</span>
                  <span className="kanban-info-value">{formatDate(activeBoard.deadline)}</span>
                </div>
              )}
              {activeBoard.theme && (
                <div className="kanban-info-item">
                  <span className="kanban-info-label">Folder</span>
                  <span className="kanban-info-value">{activeBoard.theme}</span>
                </div>
              )}
              {activeBoard.description && (
                <div className="kanban-info-item kanban-info-desc">
                  <span className="kanban-info-label">Deskripsi</span>
                  <span className="kanban-info-value">{activeBoard.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Board workspace */}
        <div className="kanban-workspace-container">
          <TargetBoard board={activeBoard} />
        </div>

        {deleteBoard && (
          <DeleteConfirmModal
            title="Hapus Board" itemName={deleteBoard.name}
            message="Semua kolom & task di dalam board akan ikut terhapus."
            onConfirm={() => { deleteKanbanBoard(deleteBoard.id); setDeleteBoard(null); setSelectedBoardId(null) }}
            onClose={() => setDeleteBoard(null)}
          />
        )}
      </motion.div>
    )
  }

  // ===== LIST VIEW: dashboard + board list =====
  return (
    <motion.div className="kanban-page-new" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="kanban-header-new" variants={itemVariants}>
        <div className="kanban-header-left">
          <h1>Kanban</h1>
          <p>Kelola tugas dengan mudah menggunakan board.</p>
        </div>
        <div className="kanban-header-right">
          {canCreateBoard && (
            <div className="create-btn-wrap">
              <button className="btn btn-primary" onClick={() => setCreateDropdownOpen((v) => !v)}>
                <Plus size={16} /> Buat Board <ChevronDown size={14} />
              </button>
              <AnimatedDropdown show={createDropdownOpen}>
                <div className="create-dropdown-menu">
                  <button onClick={() => { setCreateDropdownOpen(false); setTemplateData(null); setShowNewBoard(true) }}>
                    <Plus size={14} /> Buat Baru
                  </button>
                  <button onClick={() => { setCreateDropdownOpen(false); setShowTemplateGallery(true) }}>
                    <FileStack size={14} /> Dari Template
                  </button>
                </div>
              </AnimatedDropdown>
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Summary */}
      <motion.div className="target-kpi-grid" variants={itemVariants}>
        <div className="kpi-card target-active">
          <div className="kpi-icon-wrapper red"><KanbanSquare size={22} /></div>
          <div className="kpi-content">
            <span>Total Board</span><strong>{stats.total}</strong>
            <small className="trend-up">{stats.dynamic} dinamis</small>
          </div>
        </div>
        <div className="kpi-card target-achieved">
          <div className="kpi-icon-wrapper green"><CheckCircle2 size={22} /></div>
          <div className="kpi-content">
            <span>Task Selesai</span><strong>{stats.doneTasks}</strong>
            <small className="trend-up">{stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}% dari total</small>
          </div>
        </div>
        <div className="kpi-card target-progress">
          <div className="kpi-icon-wrapper blue"><Target size={22} /></div>
          <div className="kpi-content">
            <span>Total Task</span><strong>{stats.totalTasks}</strong>
            <small className="trend-up">di semua board</small>
          </div>
        </div>
        <div className="kpi-card target-overdue">
          <div className="kpi-icon-wrapper orange"><AlertCircle size={22} /></div>
          <div className="kpi-content">
            <span>Failed</span><strong>{stats.overdue}</strong>
            <small className="trend-warning">Lewat deadline</small>
          </div>
        </div>
      </motion.div>

      {/* Charts row */}
      {pieData.length > 0 && (
        <motion.div className="target-charts-row" variants={itemVariants}>
          <div className="chart-panel target-donut-panel">
            <div className="panel-header"><h2>Distribusi Task per Board</h2></div>
            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={3} stroke="none">
                    {pieData.map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label"><strong>{stats.totalTasks}</strong><span>task</span></div>
            </div>
            <div className="chart-legends">
              {pieData.map((d, idx) => (
                <div key={d.name} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="legend-name">{d.name}</span>
                  <strong className="legend-val">{d.value} task</strong>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Status filter tabs */}
      <motion.div className="target-status-tabs" variants={itemVariants}>
        <button className={`target-status-tab ${boardFilter === 'all' ? 'active' : ''}`} onClick={() => setBoardFilter('all')}>Semua</button>
        <button className={`target-status-tab ${boardFilter === 'failed' ? 'active' : ''}`} onClick={() => setBoardFilter('failed')}>
          <AlertCircle size={13} /> Failed ({kanbanBoards.filter(b => isBoardOverdue(b)).length})
        </button>
      </motion.div>

      {/* Board list */}
      <motion.div className="target-list-panel" variants={itemVariants}>
        <div className="panel-header">
          <h2>Daftar Board</h2>
          <span className="target-list-count">{filteredBoards.length} board</span>
        </div>
        <div className="target-list">
          {filteredBoards.length === 0 ? (
            <div className="target-list-empty">
              <KanbanSquare size={40} /><p>Belum ada board kanban.</p>
              {canCreateBoard && (
                <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>+ Buat Board Baru</button>
              )}
            </div>
          ) : (
            filteredBoards.map((b) => {
              const totalTasks = b.columns.reduce((n, c) => n + (c.tasks?.length || 0), 0)
              const doneCol = b.columns.find(c => c.name.toLowerCase().includes('done') || c.name.toLowerCase().includes('selesai'))
              const doneTasks = doneCol?.tasks?.length || 0
              const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
              const overdue = isBoardOverdue(b)
              return (
                <div key={b.id} className={`target-list-row ${overdue ? 'is-overdue' : ''}`} onClick={() => setSelectedBoardId(b.id)}>
                  <span className={`target-row-status-bar ${overdue ? 'failed' : 'in_progress'}`} />
                  <div className="target-row-main">
                    <div className="target-row-title">
                      <span className="target-row-icon"><KanbanSquare size={16} /></span>
                      <strong>{b.name}</strong>
                      <span className={`badge ${b.boardType === 'static' ? 'badge-muted' : 'badge-info'}`}>
                        {b.boardType === 'static' ? 'Statis' : 'Dinamis'}
                      </span>
                    </div>
                    <p className="target-row-desc">{b.description || `${b.columns.length} kolom · ${totalTasks} task`}</p>
                    <div className="target-row-meta">
                      {b.theme && <span className="badge category-badge"><Folder size={12} /> {b.theme}</span>}
                      {b.deadline && <span className="target-period"><Calendar size={12} /> {formatDate(b.deadline)}</span>}
                    </div>
                  </div>
                  <div className="target-row-progress">
                    <div className="target-row-progress-top"><span>Selesai</span><strong>{pct}%</strong></div>
                    <div className="table-progress-track"><div className={`table-progress-fill ${overdue ? 'failed' : 'in_progress'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                  <span className={`status-pill ${overdue ? 'status-failed' : 'status-in_progress'}`}>{overdue ? 'Failed' : `${totalTasks} task`}</span>
                  <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn" onClick={() => setActiveMenuId(activeMenuId === b.id ? null : b.id)}><MoreVertical size={16} /></button>
                    <AnimatedDropdown show={activeMenuId === b.id}>
                      <div className="table-dropdown-menu">
                        <button onClick={() => { setSelectedBoardId(b.id); setActiveMenuId(null) }}>Detail</button>
                        <button onClick={() => { deleteKanbanBoard(b.id); setActiveMenuId(null) }} className="danger">Hapus</button>
                      </div>
                    </AnimatedDropdown>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Create Board Modal */}
      {showNewBoard && (
        <div className="modal-overlay" onClick={() => setShowNewBoard(false)}>
          <div className="modal board-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Board Baru</h2>
              <button className="close-btn" onClick={() => setShowNewBoard(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Nama Board</label>
                <input type="text" className="input" placeholder="Misal: Website Revamp" value={newBoard.name} onChange={(e) => setBoard('name', e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Kategori / Folder</label>
                <ThemeSelect value={newBoard.theme} onChange={(v) => setBoard('theme', v)} />
              </div>
              <div className="input-group">
                <label className="input-label">Jenis Kanban</label>
                <div className="viewtype-grid">
                  <button type="button" className={`viewtype-card ${newBoard.boardType === 'dynamic' ? 'selected' : ''}`} onClick={() => setBoard('boardType', 'dynamic')}>
                    <MoveHorizontal size={20} /><span className="viewtype-title">Dinamis</span>
                    <span className="viewtype-desc">Item bisa dipindah antar kolom</span>
                  </button>
                  <button type="button" className={`viewtype-card ${newBoard.boardType === 'static' ? 'selected' : ''}`} onClick={() => setBoard('boardType', 'static')}>
                    <Lock size={20} /><span className="viewtype-title">Statis</span>
                    <span className="viewtype-desc">Item dicentang satu per satu; kolom terkunci berurutan</span>
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Deskripsi</label>
                <textarea className="input" rows={2} placeholder="Jelaskan tujuan board ini..." value={newBoard.description} onChange={(e) => setBoard('description', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewBoard(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreateBoard}>Buat Board</button>
            </div>
          </div>
        </div>
      )}

      {deleteBoard && (
        <DeleteConfirmModal title="Hapus Board" itemName={deleteBoard.name}
          message="Semua kolom & task di dalam board akan ikut terhapus."
          onConfirm={() => { deleteKanbanBoard(deleteBoard.id); setDeleteBoard(null) }}
          onClose={() => setDeleteBoard(null)} />
      )}

      {showTemplateGallery && (
        <TemplateGallery type="kanbans" onClose={() => setShowTemplateGallery(false)}
          onUse={(data) => setTemplateData(data)}
          currentData={null} currentName="" />
      )}
    </motion.div>
  )
}
