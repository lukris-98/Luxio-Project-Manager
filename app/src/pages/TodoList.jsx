import { useState } from 'react'
import Layout from '../components/Layout'
import InviteUsers from '../components/InviteUsers'
import TargetTodo from '../components/TargetTodo'
import LabelFilterBar from '../components/LabelFilterBar'
import { useStore, useEffectiveRole } from '../store/useStore'
import { motion } from 'framer-motion'
import { FolderOpen, ListTodo } from 'lucide-react'
import './TodoList.css'

export default function TodoList() {
  const { todoCollaboratorIds, toggleTodoCollaborator, tasks, themes, labelFilter } = useStore()
  const role = useEffectiveRole()
  const canInvite = role === 'owner' || role === 'super_admin' || role === 'admin'
  const [sortBy, setSortBy] = useState('created-desc')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const labelOptions = tasks.map((t) => (t.theme || '').trim())

  // Filter task berdasarkan label, tanggal, nama, dan pencarian.
  let filteredTasks = tasks.filter((t) => {
    if (labelFilter === null) return true
    const l = (t.theme || '').trim()
    if (labelFilter === '') return !l
    return l === labelFilter
  })
  const q = search.trim().toLowerCase()
  if (q) {
    filteredTasks = filteredTasks.filter((t) =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }
  const fromT = dateFrom ? new Date(dateFrom).getTime() : null
  const toT = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
  if (fromT || toT) {
    filteredTasks = filteredTasks.filter((t) => {
      const tm = t.createdAt || 0
      if (fromT && tm < fromT) return false
      if (toT && tm > toT) return false
      return true
    })
  }
  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'created-asc') return (a.createdAt || 0) - (b.createdAt || 0)
    if (sortBy === 'created-desc') return (b.createdAt || 0) - (a.createdAt || 0)
    if (sortBy === 'name-asc') return (a.title || '').localeCompare(b.title || '')
    return (b.title || '').localeCompare(a.title || '')
  })

  // Kelompokkan task per label.
  const groups = {}
  filteredTasks.forEach((t) => {
    const key = (t.theme || '').trim()
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  const ordered = Object.entries(groups).sort(([a], [b]) => {
    if (a === '') return -1
    if (b === '') return 1
    return a.localeCompare(b)
  })

  return (
    <Layout>
      <motion.div
        className="todo-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-header">
          <div className="page-header-left">
            <h1>Todo List</h1>
            <p>Kelola tugas harian dalam label</p>
          </div>
          <div className="page-header-right">
            {canInvite && (
              <InviteUsers
                collaborators={todoCollaboratorIds}
                onToggle={toggleTodoCollaborator}
              />
            )}
          </div>
        </div>

        {tasks.length > 0 && (
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
            placeholder="Cari tugas..."
          />
        )}

        {ordered.map(([theme, themeTasks]) => (
          <div key={theme || '__none__'} className="todo-theme-section">
            <div className="todo-theme-head">
              <FolderOpen size={16} />
              <h2>{theme || 'Tanpa Label'}</h2>
              <span className="todo-theme-count">{themeTasks.length} tugas</span>
            </div>
            <TargetTodo theme={theme} tasks={themeTasks} />
          </div>
        ))}

        {tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="empty-state">
            <ListTodo size={40} />
            <h3>Tidak ada tugas yang cocok</h3>
            <p>Coba ubah filter label, tanggal, atau kata kunci pencarian</p>
          </div>
        )}

        {tasks.length === 0 && themes.length === 0 && (
          <div className="empty-state">
            <ListTodo size={40} />
            <h3>Belum ada tugas</h3>
            <p>Buat to-do list untuk mulai tracking tugas</p>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
