import { useState, useEffect } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Layout from '../components/Layout'
import InviteUsers from '../components/InviteUsers'
import TargetBoard from '../components/TargetBoard'
import ThemeSelect from '../components/ThemeSelect'
import LabelFilterBar from '../components/LabelFilterBar'
import StageEditor from '../components/StageEditor'
import DeadlinePicker from '../components/DeadlinePicker'
import { motion } from 'framer-motion'
import { Plus, X, FolderOpen, KanbanSquare } from 'lucide-react'
import './Kanban.css'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

export default function Kanban() {
  const { currentUser, kanbanBoards, addKanbanBoard, deleteKanbanBoard, toggleBoardCollaborator, selectedBoardId, labelFilter } = useStore()
  const role = useEffectiveRole()
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [sortBy, setSortBy] = useState('created-desc')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    theme: '',
    deadlineType: 'deadline',
    deadline: '',
    deadlineLabel: '',
    columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
  })
  const [selectedBoard, setSelectedBoard] = useState(null)

  const canCreateBoard = role === 'owner' || role === 'super_admin' || role === 'admin'

  // Saat board dipilih dari sidebar (openKanbanBoard), aktifkan board tsb.
  useEffect(() => {
    if (selectedBoardId && kanbanBoards.some((b) => b.id === selectedBoardId)) {
      setSelectedBoard(kanbanBoards.find((b) => b.id === selectedBoardId))
    }
  }, [selectedBoardId, kanbanBoards])

  const setBoard = (key, value) => setNewBoard((b) => ({ ...b, [key]: value }))

  const resetBoard = () =>
    setNewBoard({
      name: '',
      description: '',
      theme: '',
      deadlineType: 'deadline',
      deadline: '',
      deadlineLabel: '',
      columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
    })

  const handleCreateBoard = () => {
    const cols = newBoard.columns
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), todos: c.todos }))
    if (newBoard.name.trim()) {
      addKanbanBoard({
        name: newBoard.name.trim(),
        description: newBoard.description.trim(),
        theme: newBoard.theme,
        deadlineType: newBoard.deadlineType,
        deadline: newBoard.deadline,
        deadlineLabel: newBoard.deadlineLabel,
        columns: cols.length ? cols : undefined,
        createdBy: currentUser?.id,
      })
      resetBoard()
      setShowNewBoard(false)
    }
  }

  const currentBoard = kanbanBoards.find((b) => b.id === selectedBoard?.id) || null

  // Filter + urutkan board berdasarkan label, tanggal, nama, dan pencarian.
  const labelOptions = kanbanBoards.map((b) => (b.theme || '').trim())
  let filteredBoards = kanbanBoards.filter((b) => {
    if (labelFilter === null) return true
    const l = (b.theme || '').trim()
    if (labelFilter === '') return !l
    return l === labelFilter
  })
  const q = search.trim().toLowerCase()
  if (q) {
    filteredBoards = filteredBoards.filter((b) =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    )
  }
  const fromT = dateFrom ? new Date(dateFrom).getTime() : null
  const toT = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
  if (fromT || toT) {
    filteredBoards = filteredBoards.filter((b) => {
      const t = b.createdAt || 0
      if (fromT && t < fromT) return false
      if (toT && t > toT) return false
      return true
    })
  }
  filteredBoards = [...filteredBoards].sort((a, b) => {
    if (sortBy === 'created-asc') return (a.createdAt || 0) - (b.createdAt || 0)
    if (sortBy === 'created-desc') return (b.createdAt || 0) - (a.createdAt || 0)
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
    return (b.name || '').localeCompare(a.name || '')
  })

  // Kelompokkan board per label.
  const groups = {}
  filteredBoards.forEach((b) => {
    const key = (b.theme || '').trim()
    if (!groups[key]) groups[key] = []
    groups[key].push(b)
  })

  return (
    <Layout>
      <motion.div
        className="kanban-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-header">
          <div className="page-header-left">
            <h1>Kanban</h1>
            <p>Buat dan kelola board kanban dalam label</p>
          </div>
          <div className="page-header-right">
            {currentBoard && canCreateBoard && (
              <InviteUsers
                collaborators={currentBoard.collaboratorIds || []}
                onToggle={(id) => toggleBoardCollaborator(currentBoard.id, id)}
              />
            )}
            {canCreateBoard && (
              <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>
                <Plus size={16} />
                Board Baru
              </button>
            )}
          </div>
        </div>

        {kanbanBoards.length > 0 && (
          <LabelFilterBar
            labels={labelOptions}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            placeholder="Cari board..."
          />
        )}

        {kanbanBoards.length === 0 ? (
          <div className="empty-state">
            <KanbanSquare size={40} />
            <h3>Belum ada board</h3>
            <p>Buat board kanban untuk mengelola task tim kamu</p>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="empty-state">
            <KanbanSquare size={40} />
            <h3>Tidak ada board yang cocok</h3>
            <p>Coba ubah filter label, tanggal, atau kata kunci pencarian</p>
          </div>
        ) : (
          Object.entries(groups)
            .sort(([a], [b]) => {
              if (a === '') return 1
              if (b === '') return -1
              return a.localeCompare(b)
            })
            .map(([theme, boards]) => (
              <div key={theme || '__none__'} className="kanban-theme-section">
                <div className="kanban-theme-head">
                  <FolderOpen size={16} />
                  <h2>{theme || 'Tanpa Label'}</h2>
                  <span className="kanban-theme-count">{boards.length} board</span>
                </div>
                <div className="kanban-board-cards">
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      className={`kanban-board-card ${currentBoard?.id === board.id ? 'active' : ''}`}
                      onClick={() => setSelectedBoard(board)}
                    >
                      <span className="kanban-board-card-name">{board.name}</span>
                      <span className="kanban-board-card-meta">
                        {board.columns.reduce((n, c) => n + c.tasks.length, 0)} task
                      </span>
                      {canCreateBoard && (
                        <span
                          className="kanban-board-card-delete"
                          onClick={(e) => { e.stopPropagation(); deleteKanbanBoard(board.id) }}
                          aria-label="Hapus board"
                        >
                          <X size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}

        {/* Board aktif ditampilkan di bawah */}
        {currentBoard && (
          <div className="kanban-active-board">
            <div className="kanban-active-head">
              <h2>{currentBoard.name}</h2>
            </div>
            <TargetBoard board={currentBoard} />
          </div>
        )}

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
                    placeholder="Misal: Marketing Campaign"
                    value={newBoard.name}
                    onChange={(e) => setBoard('name', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Label</label>
                  <ThemeSelect
                    value={newBoard.theme}
                    onChange={(v) => setBoard('theme', v)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Deskripsi</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Jelaskan tujuan board ini (opsional)..."
                    value={newBoard.description}
                    onChange={(e) => setBoard('description', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Deadline</label>
                  <DeadlinePicker
                    value={newBoard}
                    onChange={(v) => setNewBoard((b) => ({ ...b, ...v }))}
                  />
                </div>

                <div className="input-group kanban-flow">
                  <label className="input-label">Kolom & To-do</label>
                  <p className="field-hint">
                    Tulis kolom/tahap dan to-do tiap kolom. To-do langsung menjadi task
                    di kolom board.
                  </p>

                  <StageEditor
                    stages={newBoard.columns}
                    onChange={(columns) => setBoard('columns', columns)}
                    stageLabel="Kolom"
                    addLabel="Tambah Kolom"
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
      </motion.div>
    </Layout>
  )
}
