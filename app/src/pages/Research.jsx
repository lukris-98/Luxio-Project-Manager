import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import Select from '../components/Select'
import {
  Check, ExternalLink, GitBranch, GripVertical, Hash, ListPlus, Pencil,
  LocateFixed, Move, Plus, Search, Table2, Tags, Trash2, X,
} from 'lucide-react'
import './Research.css'

const DEFAULT_CATEGORIES = ['Ide', 'Riset', 'Draft', 'Produksi', 'Selesai']
const FIELD_TYPES = [
  { value: 'text', label: 'Huruf & angka' },
  { value: 'number', label: 'Angka' },
  { value: 'date', label: 'Tanggal' },
  { value: 'link', label: 'Tautan / Link' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
]

function OptionTagsInput({ options = [], onChange }) {
  const [inputValue, setInputValue] = useState('')

  const addOption = (val) => {
    const trimmed = val.trim()
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      addOption(inputValue)
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && options.length > 0) {
      onChange(options.slice(0, options.length - 1))
    }
  }

  return (
    <div className="option-tags-container">
      {options.map((opt, idx) => (
        <span key={idx} className="option-tag">
          {opt}
          <button
            type="button"
            onClick={() => onChange(options.filter((_, i) => i !== idx))}
            className="option-tag-remove"
            title="Hapus opsi"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="option-tag-input"
        value={inputValue}
        onChange={(e) => {
          if (e.target.value.includes(',')) {
            const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            const next = [...options]
            parts.forEach((p) => { if (!next.includes(p)) next.push(p) })
            onChange(next)
            setInputValue('')
          } else {
            setInputValue(e.target.value)
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          addOption(inputValue)
          setInputValue('')
        }}
        placeholder={options.length === 0 ? 'Ketik opsi, tekan koma atau Enter...' : 'Tambah...'}
      />
    </div>
  )
}

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

const defaultSchema = () => [
  { id: 'col-name', label: 'Nama', type: 'text', options: [] },
  { id: 'col-age', label: 'Umur', type: 'number', options: [] },
  { id: 'col-date', label: 'Tanggal', type: 'date', options: [] },
]

const defaultMindNodes = (topic) => [
  { id: 'node-root', label: topic || 'Topik utama', x: 760, y: 360, tone: 'root' },
]

const makeTopicForm = (category = 'Ide') => ({
  topic: '',
  category,
  notes: '',
  viewMode: 'table',
  tableSchema: defaultSchema(),
})

const createBlankRow = (schema = []) => {
  const row = { id: makeId('row') }
  schema.forEach((col) => {
    row[col.id] = col.type === 'checkbox' ? false : ''
  })
  return row
}

const normalizeTopic = (topic) => {
  const tableSchema = Array.isArray(topic.tableSchema) && topic.tableSchema.length ? topic.tableSchema : defaultSchema()
  let tableRows = Array.isArray(topic.tableRows) ? topic.tableRows : []
  if (tableRows.length === 0) {
    tableRows = [createBlankRow(tableSchema)]
  }
  return {
    ...topic,
    category: topic.category || 'Ide',
    viewMode: topic.viewMode || 'table',
    tableSchema,
    tableRows,
    mindNodes: Array.isArray(topic.mindNodes) && topic.mindNodes.length ? topic.mindNodes : defaultMindNodes(topic.topic),
  }
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function sanitizeValue(type, value) {
  if (type === 'text') return String(value || '').replace(/[^\p{L}\p{N}\s._-]/gu, '')
  if (type === 'number') return String(value || '').replace(/[^\d.-]/g, '')
  return value
}

export default function Research() {
  const { currentUser, activeRole, researchTopics, addResearchTopic, updateResearchTopic, deleteResearchTopic } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)
  const topics = useMemo(() => {
    if (dataKey == null || !researchTopics) return []
    return (researchTopics[dataKey] || []).map(normalizeTopic)
  }, [dataKey, researchTopics])

  const categories = useMemo(() => {
    const names = new Set(DEFAULT_CATEGORIES)
    topics.forEach((topic) => names.add(topic.category || 'Ide'))
    return [...names]
  }, [topics])

  const [activeCategory, setActiveCategory] = useState('Ide')
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mindInteraction, setMindInteraction] = useState(null)
  const [selectedMindNodeId, setSelectedMindNodeId] = useState('node-root')
  const [mindViewport, setMindViewport] = useState({ x: -460, y: -140, zoom: 1 })
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [form, setForm] = useState(makeTopicForm('Ide'))
  const mindBoardRef = useRef(null)

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory(categories[0] || 'Ide')
  }, [activeCategory, categories])

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase()
    return topics
      .filter((topic) => topic.category === activeCategory)
      .filter((topic) => {
        if (!q) return true
        return (
          (topic.topic || '').toLowerCase().includes(q) ||
          (topic.notes || '').toLowerCase().includes(q) ||
          (topic.tableSchema || []).some((col) => (col.label || '').toLowerCase().includes(q)) ||
          (topic.mindNodes || []).some((node) => (node.label || '').toLowerCase().includes(q))
        )
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
  }, [topics, activeCategory, search])

  const selectedTopic = useMemo(() => {
    const current = topics.find((topic) => topic.id === selectedTopicId)
    return current || filteredTopics[0] || null
  }, [topics, selectedTopicId, filteredTopics])

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = topics.filter((topic) => topic.category === category).length
      return acc
    }, {})
  }, [categories, topics])

  const resetForm = (category = activeCategory) => {
    setEditingId(null)
    setForm(makeTopicForm(category))
  }

  const openCreateTopic = () => {
    resetForm(activeCategory)
    setTopicModalOpen(true)
  }

  const closeTopicModal = () => {
    setTopicModalOpen(false)
    resetForm(activeCategory)
  }

  const handleSaveTopic = () => {
    const topicName = form.topic.trim()
    const categoryName = form.category.trim() || 'Ide'
    if (!topicName) return
    const tableSchema = form.viewMode === 'table'
      ? (Array.isArray(form.tableSchema) && form.tableSchema.length ? form.tableSchema : defaultSchema())
      : []
    const payload = {
      topic: topicName,
      category: categoryName,
      notes: form.notes.trim(),
      viewMode: form.viewMode,
      tableSchema,
    }
    if (editingId) {
      updateResearchTopic(editingId, payload)
      setSelectedTopicId(editingId)
    } else {
      const mindNodes = form.viewMode === 'mindmap' ? defaultMindNodes(topicName) : defaultMindNodes(topicName)
      addResearchTopic({ ...payload, tableSchema, tableRows: [], mindNodes })
    }
    setActiveCategory(categoryName)
    setTopicModalOpen(false)
    resetForm(categoryName)
  }

  const startEdit = (topic) => {
    setEditingId(topic.id)
    setForm({
      topic: topic.topic || '',
      category: topic.category || activeCategory,
      notes: topic.notes || '',
      viewMode: topic.viewMode || 'table',
      tableSchema: Array.isArray(topic.tableSchema) && topic.tableSchema.length ? topic.tableSchema : defaultSchema(),
    })
    setTopicModalOpen(true)
  }

  const setFormViewMode = (viewMode) => {
    setForm((prev) => ({
      ...prev,
      viewMode,
      tableSchema: viewMode === 'table' && (!prev.tableSchema || prev.tableSchema.length === 0)
        ? defaultSchema()
        : prev.tableSchema,
    }))
  }

  const addFormColumn = () => {
    setForm((prev) => ({
      ...prev,
      tableSchema: [
        ...(prev.tableSchema || []),
        { id: makeId('col'), label: 'Kolom Baru', type: 'text', options: [] },
      ],
    }))
  }

  const updateFormColumn = (columnId, patch) => {
    setForm((prev) => ({
      ...prev,
      tableSchema: (prev.tableSchema || []).map((col) => col.id === columnId ? { ...col, ...patch } : col),
    }))
  }

  const deleteFormColumn = (columnId) => {
    setForm((prev) => ({
      ...prev,
      tableSchema: (prev.tableSchema || []).filter((col) => col.id !== columnId),
    }))
  }

  const updateSelectedTopic = (patch) => {
    if (!selectedTopic) return
    updateResearchTopic(selectedTopic.id, patch)
  }

  const addColumn = () => {
    if (!selectedTopic) return
    updateSelectedTopic({
      tableSchema: [
        ...selectedTopic.tableSchema,
        { id: makeId('col'), label: 'Kolom Baru', type: 'text', options: [] },
      ],
    })
  }

  const updateColumn = (columnId, patch) => {
    updateSelectedTopic({
      tableSchema: selectedTopic.tableSchema.map((col) => col.id === columnId ? { ...col, ...patch } : col),
    })
  }

  const deleteColumn = (columnId) => {
    updateSelectedTopic({
      tableSchema: selectedTopic.tableSchema.filter((col) => col.id !== columnId),
      tableRows: selectedTopic.tableRows.map((row) => {
        const next = { ...row }
        delete next[columnId]
        return next
      }),
    })
  }

  const addRow = () => {
    if (!selectedTopic) return
    const row = { id: makeId('row') }
    selectedTopic.tableSchema.forEach((col) => {
      row[col.id] = col.type === 'checkbox' ? false : ''
    })
    updateSelectedTopic({ tableRows: [...selectedTopic.tableRows, row] })
  }

  const updateCell = (rowId, column, value) => {
    if (!selectedTopic) return
    const sanitized = sanitizeValue(column.type, value)
    const updatedRows = selectedTopic.tableRows.map((row) =>
      row.id === rowId ? { ...row, [column.id]: sanitized } : row
    )

    // Periksa apakah baris terakhir tabel sudah terisi data
    const lastRow = updatedRows[updatedRows.length - 1]
    const isLastRowFilled = lastRow && Object.keys(lastRow).some(
      (k) => k !== 'id' && lastRow[k] !== '' && lastRow[k] !== false && lastRow[k] != null
    )

    let finalRows = updatedRows
    if (isLastRowFilled) {
      // Otomatis buat baris kosong di bagian bawah
      finalRows = [...updatedRows, createBlankRow(selectedTopic.tableSchema)]
    }

    updateSelectedTopic({ tableRows: finalRows })
  }

  const deleteRow = (rowId) => {
    if (!selectedTopic) return
    let filtered = selectedTopic.tableRows.filter((row) => row.id !== rowId)
    if (filtered.length === 0) {
      filtered = [createBlankRow(selectedTopic.tableSchema)]
    }
    updateSelectedTopic({ tableRows: filtered })
  }

  const addMindNode = (parentId = selectedMindNodeId) => {
    if (!selectedTopic) return
    const root = selectedTopic.mindNodes[0]
    const parent = selectedTopic.mindNodes.find((node) => node.id === parentId) || root
    const siblingCount = selectedTopic.mindNodes.filter((node) => (node.parentId || root.id) === parent.id).length
    const direction = parent.id === root.id && siblingCount % 2 === 1 ? -1 : 1
    const nextIndex = selectedTopic.mindNodes.length
    const nextNode = {
      id: makeId('node'),
      parentId: parent.id,
      label: 'Ide baru',
      x: parent.x + (parent.id === root.id ? 280 * direction : 240),
      y: parent.y + (siblingCount - 1) * 72 + (parent.id === root.id ? 0 : 86),
      tone: `tone-${(nextIndex % 5) + 1}`,
    }
    updateSelectedTopic({
      mindNodes: [...selectedTopic.mindNodes, nextNode],
    })
    setSelectedMindNodeId(nextNode.id)
  }

  const updateMindNode = (nodeId, patch) => {
    updateSelectedTopic({
      mindNodes: selectedTopic.mindNodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node),
    })
  }

  const deleteMindNode = (nodeId) => {
    if (selectedTopic.mindNodes.length <= 1) return
    const rootId = selectedTopic.mindNodes[0].id
    const parentId = selectedTopic.mindNodes.find((node) => node.id === nodeId)?.parentId || rootId
    updateSelectedTopic({
      mindNodes: selectedTopic.mindNodes
        .filter((node) => node.id !== nodeId)
        .map((node) => node.parentId === nodeId ? { ...node, parentId } : node),
    })
    setSelectedMindNodeId(parentId)
  }

  const getMindPoint = (event) => {
    const rect = mindBoardRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (event.clientX - rect.left - mindViewport.x) / mindViewport.zoom,
      y: (event.clientY - rect.top - mindViewport.y) / mindViewport.zoom,
    }
  }

  const handleMindBoardDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setMindInteraction({
      type: 'pan',
      startX: event.clientX,
      startY: event.clientY,
      originX: mindViewport.x,
      originY: mindViewport.y,
    })
  }

  const handleMindNodeDown = (event, node) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getMindPoint(event)
    setSelectedMindNodeId(node.id)
    setMindInteraction({
      type: 'node',
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    })
  }

  const handleMindMove = (event) => {
    if (!mindInteraction || !selectedTopic) return
    if (mindInteraction.type === 'pan') {
      setMindViewport((viewport) => ({
        ...viewport,
        x: mindInteraction.originX + event.clientX - mindInteraction.startX,
        y: mindInteraction.originY + event.clientY - mindInteraction.startY,
      }))
      return
    }
    const point = getMindPoint(event)
    updateMindNode(mindInteraction.nodeId, {
      x: Math.max(24, Math.min(point.x - mindInteraction.offsetX, 1700)),
      y: Math.max(24, Math.min(point.y - mindInteraction.offsetY, 920)),
    })
  }

  const resetMindViewport = () => {
    setMindViewport({ x: -460, y: -140, zoom: 1 })
  }

  const zoomMind = (delta, anchor) => {
    if (!anchor || !mindBoardRef.current) {
      setMindViewport((viewport) => ({
        ...viewport,
        zoom: Math.max(0.55, Math.min(1.7, Number((viewport.zoom + delta).toFixed(2)))),
      }))
      return
    }
    const rect = mindBoardRef.current.getBoundingClientRect()
    setMindViewport((viewport) => {
      const nextZoom = Math.max(0.55, Math.min(1.7, Number((viewport.zoom + delta).toFixed(2))))
      const screenX = anchor.clientX - rect.left
      const screenY = anchor.clientY - rect.top
      const worldX = (screenX - viewport.x) / viewport.zoom
      const worldY = (screenY - viewport.y) / viewport.zoom
      return {
        x: screenX - worldX * nextZoom,
        y: screenY - worldY * nextZoom,
        zoom: nextZoom,
      }
    })
  }

  const zoomMindFromCenter = (delta) => {
    const rect = mindBoardRef.current?.getBoundingClientRect()
    if (!rect) {
      zoomMind(delta)
      return
    }
    zoomMind(delta, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    })
  }

  const handleMindWheel = (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -1 : 1
    const speed = event.ctrlKey ? 0.05 : 0.08
    zoomMind(direction * speed, event)
  }

  const renderCellInput = (row, column) => {
    const value = row[column.id]
    if (column.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => updateCell(row.id, column, e.target.checked)}
        />
      )
    }
    if (column.type === 'select') {
      const selectOptions = (column.options || []).map((option) => ({ value: option, label: option }))
      return (
        <Select
          value={value || ''}
          onChange={(val) => updateCell(row.id, column, val)}
          options={selectOptions}
          placeholder="Pilih..."
          allowReset={true}
          className="table-cell-select"
        />
      )
    }
    if (column.type === 'link') {
      const href = value ? (value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`) : '#'
      return (
        <div className="research-cell-link">
          <input
            type="text"
            placeholder="https://..."
            value={value || ''}
            onChange={(e) => updateCell(row.id, column, e.target.value)}
          />
          {value && (
            <a href={href} target="_blank" rel="noopener noreferrer" title="Buka tautan di tab baru">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )
    }
    return (
      <input
        type={column.type === 'date' ? 'date' : 'text'}
        inputMode={column.type === 'number' ? 'numeric' : undefined}
        value={value || ''}
        onChange={(e) => updateCell(row.id, column, e.target.value)}
      />
    )
  }

  return (
    <>
      <div className="research-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Riset Konten</h1>
            <p>Kelola kategori, topik, tabel riset, dan mind map dalam satu ruang kerja.</p>
          </div>
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={openCreateTopic}>
              <Plus size={16} /> Tambah
            </button>
          </div>
        </div>

        <div className="research-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={category === activeCategory ? 'active' : ''}
              onClick={() => { setActiveCategory(category); setSelectedTopicId(null); resetForm(category) }}
            >
              <Tags size={14} />
              <span>{category}</span>
              <b>{categoryCounts[category] || 0}</b>
            </button>
          ))}
        </div>

        <div className="research-workspace">
          <main className="research-panel">
            <div className="research-content-tools">
              <div className="research-search">
                <Search size={15} />
                <input
                  placeholder="Cari topik, kolom, atau node..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="research-topic-strip">
                {filteredTopics.length === 0 ? (
                  <div className="research-empty-mini">
                    <ListPlus size={20} />
                    <span>Belum ada topik di tab ini.</span>
                  </div>
                ) : filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    className={selectedTopic?.id === topic.id ? 'active' : ''}
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    {topic.viewMode === 'mindmap' ? <GitBranch size={15} /> : <Table2 size={15} />}
                    <span>{topic.topic || 'Tanpa Judul'}</span>
                    <small>{formatDate(topic.updatedAt || topic.createdAt)}</small>
                  </button>
                ))}
              </div>
            </div>

            {!selectedTopic ? (
              <div className="empty-state">
                <ListPlus size={44} />
                <h3>Pilih atau buat topik riset</h3>
                <p>Setiap kategori punya daftar topiknya sendiri.</p>
              </div>
            ) : (
              <>
                <div className="research-panel-head">
                  <div>
                    <span className="research-cat-badge"><Tags size={12} /> {selectedTopic.category}</span>
                    <h2>{selectedTopic.topic}</h2>
                    {selectedTopic.notes && <p>{selectedTopic.notes}</p>}
                  </div>
                  <div className="research-panel-actions">
                    <button className="vault-btn" title="Edit topik" onClick={() => startEdit(selectedTopic)}>
                      <Pencil size={15} />
                    </button>
                    <button className="vault-btn vault-btn-danger" title="Hapus topik" onClick={() => setDeleteTarget(selectedTopic)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="research-view-switch">
                  <button
                    className={selectedTopic.viewMode === 'table' ? 'active' : ''}
                    onClick={() => updateSelectedTopic({ viewMode: 'table' })}
                  >
                    <Table2 size={15} /> Tabel Riset
                  </button>
                  <button
                    className={selectedTopic.viewMode === 'mindmap' ? 'active' : ''}
                    onClick={() => updateSelectedTopic({ viewMode: 'mindmap' })}
                  >
                    <GitBranch size={15} /> Mind Mapping
                  </button>
                </div>

                {selectedTopic.viewMode === 'table' ? (
                  <section className="research-table-view">
                    <div className="research-table-toolbar">
                      <button className="btn btn-secondary" onClick={() => setColumnModalOpen(true)}>
                        <Pencil size={14} /> Edit Table
                      </button>
                      <span><Hash size={13} /> {selectedTopic.tableRows.length} data</span>
                    </div>

                    <div className="research-table-wrap">
                      <table className="research-data-table">
                        <thead>
                          <tr>
                            {selectedTopic.tableSchema.map((column) => <th key={column.id}>{column.label || 'Kolom'}</th>)}
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTopic.tableRows.length === 0 ? (
                            <tr>
                              <td colSpan={selectedTopic.tableSchema.length + 1} className="research-table-empty">
                                Belum ada baris data.
                              </td>
                            </tr>
                          ) : selectedTopic.tableRows.map((row) => (
                            <tr key={row.id}>
                              {selectedTopic.tableSchema.map((column) => (
                                <td key={column.id}>{renderCellInput(row, column)}</td>
                              ))}
                              <td className="research-row-action">
                                {selectedTopic.tableRows.length > 1 && (
                                  <button className="vault-btn vault-btn-danger" title="Hapus baris" onClick={() => deleteRow(row.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : (
                  <section className="research-mind-view">
                    <div className="research-builder-head mind-builder-head">
                      <div>
                        <h3>Mind Mapping</h3>
                        <p>Pilih node, tambah cabang, lalu geser kanvas atau node untuk mengatur peta riset.</p>
                      </div>
                      <div className="mind-toolbar">
                        <button className="mind-tool-btn primary" onClick={() => addMindNode()} title="Tambah cabang" type="button">
                          <Plus size={15} />
                          <span>Cabang</span>
                        </button>
                        <button className="mind-tool-btn" onClick={resetMindViewport} title="Reset posisi" type="button">
                          <LocateFixed size={15} />
                        </button>
                      </div>
                    </div>
                    <div
                      ref={mindBoardRef}
                      className="mind-board"
                      onPointerDown={handleMindBoardDown}
                      onPointerMove={handleMindMove}
                      onPointerUp={() => setMindInteraction(null)}
                      onPointerCancel={() => setMindInteraction(null)}
                      onPointerLeave={() => setMindInteraction(null)}
                    >
                      <div className="mind-board-hint">
                        <Move size={14} />
                        <span>Geser area kosong untuk pan</span>
                      </div>
                      <div
                        className="mind-stage"
                        style={{
                          transform: `translate(${mindViewport.x}px, ${mindViewport.y}px) scale(${mindViewport.zoom})`,
                        }}
                      >
                        <svg className="mind-lines" viewBox="0 0 1900 1040">
                          {selectedTopic.mindNodes.slice(1).map((node) => {
                            const root = selectedTopic.mindNodes[0]
                            const parent = selectedTopic.mindNodes.find((item) => item.id === node.parentId) || root
                            const startX = parent.x + 92
                            const startY = parent.y + 32
                            const endX = node.x + 92
                            const endY = node.y + 32
                            const bend = Math.max(90, Math.abs(endX - startX) * 0.44)
                            const direction = endX >= startX ? 1 : -1
                            const d = `M ${startX} ${startY} C ${startX + bend * direction} ${startY}, ${endX - bend * direction} ${endY}, ${endX} ${endY}`
                            return <path key={node.id} d={d} className={`mind-line ${node.tone || 'tone-1'}`} />
                          })}
                        </svg>
                        {selectedTopic.mindNodes.map((node, index) => (
                          <div
                            key={node.id}
                            className={`mind-node${index === 0 ? ' root' : ''}${selectedMindNodeId === node.id ? ' selected' : ''} ${node.tone || 'tone-1'}`}
                            style={{ left: node.x, top: node.y }}
                            onPointerDown={(e) => handleMindNodeDown(e, node)}
                          >
                            <span className="mind-node-dot" />
                            <input
                              value={node.label}
                              onPointerDown={(e) => e.stopPropagation()}
                              onFocus={() => setSelectedMindNodeId(node.id)}
                              onChange={(e) => updateMindNode(node.id, { label: e.target.value })}
                            />
                            <div className="mind-node-actions">
                              <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => addMindNode(node.id)}
                                title="Tambah cabang"
                                type="button"
                              >
                                <Plus size={12} />
                              </button>
                              {index > 0 && (
                                <button
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => deleteMindNode(node.id)}
                                  title="Hapus node"
                                  type="button"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mind-mini-map">
                        {selectedTopic.mindNodes.map((node, index) => (
                          <span
                            key={node.id}
                            className={index === 0 ? 'root' : ''}
                            style={{
                              left: `${Math.max(4, Math.min(92, (node.x / 1900) * 100))}%`,
                              top: `${Math.max(6, Math.min(88, (node.y / 1040) * 100))}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {topicModalOpen && (
        <div className="research-modal-backdrop" onMouseDown={closeTopicModal}>
          <div
            className="research-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-topic-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="research-modal-head">
              <div>
                <h2 id="research-topic-modal-title">{editingId ? 'Edit Topik' : 'Tambah Topik'}</h2>
                <p>Atur kategori, catatan, dan bentuk riset dari satu tempat.</p>
              </div>
              <button className="vault-btn" onClick={closeTopicModal} title="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="research-topic-form research-topic-form-modal">
              <div className="research-form-grid">
                <div className="research-form-stack">
                  <div className="input-group">
                    <label className="input-label">Nama Topik</label>
                    <input
                      className="input"
                      placeholder="cth: Kalender konten Q4"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Catatan</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Ringkasan riset, referensi, atau konteks..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Kategori / Tab</label>
                  <input
                    className="input"
                    list="research-categories"
                    placeholder="Pilih atau buat kategori"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                  <datalist id="research-categories">
                    {categories.map((category) => <option key={category} value={category} />)}
                  </datalist>
                </div>
                <div className="input-group">
                  <label className="input-label">Tampilan Riset</label>
                  <div className="research-mode-toggle">
                    <button
                      className={form.viewMode === 'table' ? 'active' : ''}
                      onClick={() => setFormViewMode('table')}
                      type="button"
                    >
                      <Table2 size={15} /> Tabel
                    </button>
                    <button
                      className={form.viewMode === 'mindmap' ? 'active' : ''}
                      onClick={() => setFormViewMode('mindmap')}
                      type="button"
                    >
                      <GitBranch size={15} /> Mind Map
                    </button>
                  </div>
                </div>
              </div>

              {form.viewMode === 'table' && (
                <div className="research-form-table-builder">
                  <div className="research-builder-head">
                    <div>
                      <h3>Custom Header Tabel</h3>
                      <p>Atur nama kolom dan jenis input sebelum topik dibuat.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={addFormColumn} type="button">
                      <Plus size={14} /> Kolom
                    </button>
                  </div>

                  <div className="research-column-builder research-column-builder-compact">
                    {(form.tableSchema || []).map((column) => (
                      <div key={column.id} className="research-column-card">
                        <GripVertical size={15} />
                        <input
                          className="input"
                          value={column.label}
                          onChange={(e) => updateFormColumn(column.id, { label: e.target.value })}
                          placeholder="Nama kolom"
                        />
                        <select
                          className="input"
                          value={column.type}
                          onChange={(e) => updateFormColumn(column.id, { type: e.target.value })}
                        >
                          {FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                        <button
                          className="vault-btn vault-btn-danger"
                          onClick={() => deleteFormColumn(column.id)}
                          title="Hapus kolom"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {(form.tableSchema || []).filter((col) => col.type === 'select').length > 0 && (
                    <div className="dropdown-options-builder-section">
                      <div className="dropdown-options-section-head">
                        <h3>Kelola Opsi Dropdown</h3>
                        <p>Atur daftar pilihan untuk kolom bertipe Dropdown di bawah ini.</p>
                      </div>
                      {(form.tableSchema || [])
                        .filter((col) => col.type === 'select')
                        .map((col) => (
                          <div key={col.id} className="dropdown-option-manage-card">
                            <div className="dropdown-option-manage-header">
                              <span className="dropdown-column-badge">{col.label || 'Kolom Dropdown'}</span>
                              <small>Ketik opsi lalu tekan koma (,) atau Enter untuk menambah</small>
                            </div>
                            <OptionTagsInput
                              options={col.options || []}
                              onChange={(newOpts) => updateFormColumn(col.id, { options: newOpts })}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div className="research-form-actions">
                <button className="btn btn-secondary" onClick={closeTopicModal} type="button">Batal</button>
                <button className="btn btn-primary" disabled={!form.topic.trim()} onClick={handleSaveTopic} type="button">
                  <Check size={15} /> {editingId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {columnModalOpen && selectedTopic && (
        <div className="research-modal-backdrop" onMouseDown={() => setColumnModalOpen(false)}>
          <div
            className="research-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-column-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="research-modal-head">
              <div>
                <h2 id="research-column-modal-title">Custom Header Tabel</h2>
                <p>Atur nama kolom dan jenis input untuk tiap kolom.</p>
              </div>
              <button className="vault-btn" onClick={() => setColumnModalOpen(false)} title="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="research-column-builder-modal">
              <div className="research-column-builder">
                {selectedTopic.tableSchema.length === 0 ? (
                  <div className="research-empty-mini">Belum ada kolom. Klik "Tambah Kolom" di bawah.</div>
                ) : (
                  selectedTopic.tableSchema.map((column) => (
                    <div key={column.id} className="research-column-card">
                      <GripVertical size={15} />
                      <input
                        className="input"
                        value={column.label}
                        onChange={(e) => updateColumn(column.id, { label: e.target.value })}
                        placeholder="Nama kolom"
                      />
                      <select
                        className="input"
                        value={column.type}
                        onChange={(e) => updateColumn(column.id, { type: e.target.value })}
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <button
                        className="vault-btn vault-btn-danger"
                        onClick={() => deleteColumn(column.id)}
                        title="Hapus kolom"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {selectedTopic.tableSchema.filter((col) => col.type === 'select').length > 0 && (
                <div className="dropdown-options-builder-section">
                  <div className="dropdown-options-section-head">
                    <h3>Kelola Opsi Dropdown</h3>
                    <p>Atur daftar pilihan untuk kolom bertipe Dropdown di bawah ini.</p>
                  </div>
                  {selectedTopic.tableSchema
                    .filter((col) => col.type === 'select')
                    .map((col) => (
                      <div key={col.id} className="dropdown-option-manage-card">
                        <div className="dropdown-option-manage-header">
                          <span className="dropdown-column-badge">{col.label || 'Kolom Dropdown'}</span>
                          <small>Ketik opsi lalu tekan koma (,) atau Enter untuk menambah</small>
                        </div>
                        <OptionTagsInput
                          options={col.options || []}
                          onChange={(newOpts) => updateColumn(col.id, { options: newOpts })}
                        />
                      </div>
                    ))}
                </div>
              )}

              <div className="research-modal-footer">
                <button className="btn btn-secondary" onClick={addColumn} type="button">
                  <Plus size={14} /> Tambah Kolom
                </button>
                <button className="btn btn-primary" onClick={() => setColumnModalOpen(false)} type="button">
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Hapus Topik Riset"
          itemName={deleteTarget.topic}
          message="Topik riset beserta tabel dan mind map-nya akan dihapus permanen."
          onConfirm={() => {
            deleteResearchTopic(deleteTarget.id)
            setDeleteTarget(null)
            setSelectedTopicId(null)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
