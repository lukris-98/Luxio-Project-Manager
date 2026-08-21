import { useState } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Layout from '../components/Layout'
import TargetBoard from '../components/TargetBoard'
import StageEditor from '../components/StageEditor'
import DeadlinePicker from '../components/DeadlinePicker'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import './Kanban.css'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

export default function Kanban() {
  const { currentUser, kanbanBoards, addKanbanBoard, deleteKanbanBoard } = useStore()
  const role = useEffectiveRole()
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    deadlineType: 'deadline',
    deadline: '',
    deadlineLabel: '',
    columns: DEFAULT_COLUMNS.map((name, i) => ({ id: i + 1, name, todos: [] })),
  })
  const [selectedBoard, setSelectedBoard] = useState(null)

  const canCreateBoard = role === 'owner' || role === 'super_admin' || role === 'admin'

  const setBoard = (key, value) => setNewBoard((b) => ({ ...b, [key]: value }))

  const resetBoard = () =>
    setNewBoard({
      name: '',
      description: '',
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

  const currentBoard = kanbanBoards.find((b) => b.id === selectedBoard?.id) || kanbanBoards[0]

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
            <p>Buat dan kelola board kanban tim</p>
          </div>
          {canCreateBoard && (
            <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>
              <Plus size={16} />
              Board Baru
            </button>
          )}
        </div>

        {kanbanBoards.length > 0 && (
          <div className="board-tabs">
            {kanbanBoards.map((board) => (
              <div className="board-tab-wrap" key={board.id}>
                <button
                  className={`board-tab ${currentBoard?.id === board.id ? 'active' : ''}`}
                  onClick={() => setSelectedBoard(board)}
                >
                  {board.name}
                </button>
                {canCreateBoard && (
                  <button
                    className="board-tab-delete"
                    onClick={() => deleteKanbanBoard(board.id)}
                    aria-label="Hapus board"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {currentBoard ? (
          <TargetBoard board={currentBoard} />
        ) : (
          <div className="empty-state">
            <h3>Belum ada board</h3>
            <p>Buat board kanban untuk mengelola task tim kamu</p>
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
