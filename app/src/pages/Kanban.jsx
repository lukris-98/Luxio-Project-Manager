import { useState, useEffect, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import InviteUsers from '../components/InviteUsers'
import TargetBoard from '../components/TargetBoard'
import ThemeSelect from '../components/ThemeSelect'
import AnimatedDropdown from '../components/AnimatedDropdown'
import DeadlinePicker from '../components/DeadlinePicker'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { motion } from 'framer-motion'
import {
  Plus, X, Filter, MoreHorizontal, Calendar, MessageSquare, ClipboardList,
  ChevronDown, BarChart2, MessageCircle, MoveHorizontal, Lock
} from 'lucide-react'
import './Kanban.css'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done']

export default function Kanban() {
  const {
    currentUser,
    kanbanBoards,
    addKanbanBoard,
    deleteKanbanBoard,
    toggleBoardCollaborator,
    selectedBoardId,
    setSelectedBoardId,
    labelFilter,
  } = useStore()
  const role = useEffectiveRole()
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [deleteBoard, setDeleteBoard] = useState(null)
  const [activeViewTab, setActiveViewTab] = useState('board') // board, list, kalender
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false)

  const canCreateBoard = role === 'owner' || role === 'super_admin' || role === 'admin'

  // Determine active board (respect label filter from sidebar dropdown)
  const activeBoard = useMemo(() => {
    let pool = kanbanBoards
    if (labelFilter !== null) {
      pool = kanbanBoards.filter(b => {
        const l = (b.theme || '').trim()
        return labelFilter === '' ? !l : l === labelFilter
      })
    }
    if (selectedBoardId) {
      return pool.find(b => b.id === selectedBoardId) || pool[0] || null
    }
    return pool[0] || null
  }, [selectedBoardId, kanbanBoards, labelFilter])

  useEffect(() => {
    if (activeBoard && activeBoard.id !== selectedBoardId) {
      setSelectedBoardId(activeBoard.id)
    }
  }, [activeBoard, selectedBoardId, setSelectedBoardId])

  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    theme: '',
    boardType: 'dynamic', // 'dynamic' (drag & tombol geser) | 'static' (kolom terkunci)
    deadlineType: 'deadline',
    deadline: '',
    deadlineLabel: '',
    columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
  })

  const setBoard = (key, value) => setNewBoard((b) => ({ ...b, [key]: value }))

  const handleCreateBoard = () => {
    if (newBoard.name.trim()) {
      addKanbanBoard({
        name: newBoard.name.trim(),
        description: newBoard.description.trim(),
        theme: newBoard.theme,
        boardType: newBoard.boardType,
        deadlineType: newBoard.deadlineType,
        deadline: newBoard.deadline,
        deadlineLabel: newBoard.deadlineLabel,
        columns: newBoard.columns.map(c => ({ name: c.name, todos: [] })),
        createdBy: currentUser?.id,
      })
      setNewBoard({
        name: '',
        description: '',
        theme: '',
        deadlineType: 'deadline',
        deadline: '',
        deadlineLabel: '',
        columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
      })
      setShowNewBoard(false)
    }
  }

  // Summary counts for active board
  const boardSummary = useMemo(() => {
    if (!activeBoard) return { todo: 0, inProgress: 0, review: 0, done: 0, total: 0 }
    let todo = 0, inProgress = 0, review = 0, done = 0, total = 0
    activeBoard.columns.forEach(col => {
      const count = col.tasks?.length || 0
      total += count
      const name = col.name.toLowerCase()
      if (name.includes('todo') || name.includes('do') || name.includes('mulai')) todo += count
      else if (name.includes('progress') || name.includes('jalan')) inProgress += count
      else if (name.includes('review') || name.includes('periksa')) review += count
      else if (name.includes('done') || name.includes('selesai')) done += count
    })
    return { todo, inProgress, review, done, total }
  }, [activeBoard])

  return (
    <motion.div
      className="kanban-page-new"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="kanban-header-new">
        <div className="kanban-header-left">
          <h1>Kanban</h1>
          <p>Kelola tugas dengan mudah menggunakan board.</p>
        </div>
        <div className="kanban-header-right">
          {/* Board Dropdown Selector */}
          <div className="board-select-dropdown-container">
            <button
              className="board-dropdown-btn"
              onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
            >
              <ClipboardList size={16} />
              <span>{activeBoard ? activeBoard.name : 'Pilih Board'}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatedDropdown show={boardDropdownOpen}>
              <div className="board-dropdown-menu">
                {kanbanBoards.map(b => (
                  <button
                    key={b.id}
                    className={`board-dropdown-item ${activeBoard?.id === b.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedBoardId(b.id)
                      setBoardDropdownOpen(false)
                    }}
                  >
                    {b.name}
                  </button>
                ))}
                {canCreateBoard && (
                  <button
                    className="board-dropdown-item add-new-board-btn"
                    onClick={() => {
                      setShowNewBoard(true)
                      setBoardDropdownOpen(false)
                    }}
                  >
                    + Buat Board Baru
                  </button>
                )}
              </div>
              </AnimatedDropdown>
          </div>

          <button className="btn btn-secondary">
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-secondary btn-icon-only">
            <MoreHorizontal size={16} />
          </button>
          {canCreateBoard && (
            <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>
              <Plus size={16} /> Buat Tugas
            </button>
          )}
        </div>
      </div>

      {/* Sub Header Views */}
      <div className="kanban-views-bar">
        {['board', 'list', 'kalender'].map((tab) => (
          <button
            key={tab}
            className={`view-tab-btn ${activeViewTab === tab ? 'active' : ''}`}
            onClick={() => setActiveViewTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Kanban Workspace */}
      <div className="kanban-workspace-container">
        {activeBoard ? (
          <TargetBoard board={activeBoard} />
        ) : (
          <div className="empty-kanban-state">
            <ClipboardList size={48} />
            <h3>Belum ada Board</h3>
            <p>Silakan buat board kanban baru untuk memulai pengelolaan tugas.</p>
            {canCreateBoard && (
              <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>
                + Buat Board Baru
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Dashboard Panel */}
      {activeBoard && (
        <div className="kanban-bottom-panel">
          {/* Ringkasan Board */}
          <div className="summary-board-panel">
            <h3>Ringkasan Board</h3>
            <div className="summary-tiles-grid">
              <div className="summary-tile">
                <span className="tile-title">To Do</span>
                <strong>{boardSummary.todo}</strong>
                <span className="tile-desc">tugas</span>
              </div>
              <div className="summary-tile">
                <span className="tile-title">In Progress</span>
                <strong>{boardSummary.inProgress}</strong>
                <span className="tile-desc">tugas</span>
              </div>
              <div className="summary-tile">
                <span className="tile-title">Review</span>
                <strong>{boardSummary.review}</strong>
                <span className="tile-desc">tugas</span>
              </div>
              <div className="summary-tile">
                <span className="tile-title">Done</span>
                <strong>{boardSummary.done}</strong>
                <span className="tile-desc">tugas</span>
              </div>
              <div className="summary-tile total-tile">
                <span className="tile-title">Total</span>
                <strong>{boardSummary.total}</strong>
                <span className="tile-desc">tugas</span>
              </div>
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="recent-activity-panel">
            <div className="panel-header-simple">
              <h3>Aktivitas Terbaru</h3>
              <button className="view-all-link">Lihat Semua</button>
            </div>
            <div className="activity-list-simple">
              <p className="activity-empty-simple">Belum ada aktivitas.</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {showNewBoard && (
        <div className="modal-overlay" onClick={() => setShowNewBoard(false)}>
          <div className="modal board-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Board Baru</h2>
              <button className="close-btn" onClick={() => setShowNewBoard(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Nama Board</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Misal: Website Revamp"
                  value={newBoard.name}
                  onChange={(e) => setBoard('name', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Kategori / Folder</label>
                <ThemeSelect
                  value={newBoard.theme}
                  onChange={(v) => setBoard('theme', v)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Jenis Kanban</label>
                <div className="viewtype-grid">
                  <button
                    type="button"
                    className={`viewtype-card ${newBoard.boardType === 'dynamic' ? 'selected' : ''}`}
                    onClick={() => setBoard('boardType', 'dynamic')}
                  >
                    <MoveHorizontal size={20} />
                    <span className="viewtype-title">Dinamis</span>
                    <span className="viewtype-desc">Item bisa dipindah antar kolom (drag & drop / tombol geser)</span>
                  </button>
                  <button
                    type="button"
                    className={`viewtype-card ${newBoard.boardType === 'static' ? 'selected' : ''}`}
                    onClick={() => setBoard('boardType', 'static')}
                  >
                    <Lock size={20} />
                    <span className="viewtype-title">Statis</span>
                    <span className="viewtype-desc">Item dicentang satu per satu; kolom berikutnya terbuka setelah kolom aktif selesai</span>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Deskripsi</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Jelaskan tujuan board ini..."
                  value={newBoard.description}
                  onChange={(e) => setBoard('description', e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewBoard(false)}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleCreateBoard}>
                Buat Board
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteBoard && (
        <DeleteConfirmModal
          title="Hapus Board"
          itemName={deleteBoard.name}
          message="Semua kolom & task di dalam board akan ikut terhapus."
          onConfirm={() => {
            deleteKanbanBoard(deleteBoard.id)
            setDeleteBoard(null)
          }}
          onClose={() => setDeleteBoard(null)}
        />
      )}
    </motion.div>
  )
}
