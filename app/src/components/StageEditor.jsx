import { useState } from 'react'
import { X, Plus, ListPlus, Keyboard } from 'lucide-react'
import './StageEditor.css'

// =====================================================================
// StageEditor.jsx — Editor tahap/kolom + to-do dengan 2 mode:
//   1. Mode Input     : input nama + tombol "+ To-do" per tahap.
//   2. Mode Teks      : satu textarea berformat:
//         "Nama Tahap" [to-do 1, to-do 2]
//         "Nama Tahap 2" [to-do 1]
//      Klik "Terapkan" untuk mengurai format menjadi tahap + to-do.
// Dipakai di form "Tambah Target" dan form "Board Baru".
// =====================================================================

// Urai teks berformat menjadi [{ name, todos }].
// Baris tanpa kurung siku tetap valid: "Nama Tahap".
const parseText = (text) => {
  const stages = []
  text.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const m = trimmed.match(/^"([^"]*)"\s*(?:\[([^\]]*)\])?\s*$/)
    if (!m) return
    const name = m[1].trim()
    if (!name) return
    const todos = (m[2] || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    stages.push({ name, todos })
  })
  return stages
}

const buildText = (stages) =>
  stages
    .filter((s) => s.name && s.name.trim())
    .map((s) => {
      const todos = (s.todos || []).map((t) => t.trim()).filter(Boolean)
      return todos.length
        ? `"${s.name.trim()}" [${todos.join(', ')}]`
        : `"${s.name.trim()}"`
    })
    .join('\n')

export default function StageEditor({
  stages = [],
  onChange,
  stageLabel = 'Tahap',
  addLabel = 'Tambah Tahap',
  inputPlaceholder = '',
}) {
  const [mode, setMode] = useState('input')
  const [text, setText] = useState('')
  const [parseError, setParseError] = useState('')

  const lower = stageLabel.toLowerCase()

  const startTextMode = () => {
    setText(buildText(stages))
    setParseError('')
    setMode('text')
  }

  const goInputMode = () => {
    setText('')
    setParseError('')
    setMode('input')
  }

  const applyText = () => {
    const parsed = parseText(text)
    if (parsed.length === 0) {
      setParseError(
        `Format tidak dikenali. Contoh: "Nama ${lower}" [to-do 1, to-do 2]`
      )
      return
    }
    onChange(parsed.map((p, i) => ({ id: Date.now() + i, name: p.name, todos: p.todos })))
    setParseError('')
    setText('')
    setMode('input')
  }

  // ---------- Handler mode input ----------
  const setStageName = (i, value) =>
    onChange(stages.map((s, j) => (j === i ? { ...s, name: value } : s)))

  const setStageTodo = (i, ti, value) =>
    onChange(
      stages.map((s, j) =>
        j === i ? { ...s, todos: s.todos.map((t, k) => (k === ti ? value : t)) } : s
      )
    )

  const addStageTodo = (i) =>
    onChange(
      stages.map((s, j) => (j === i ? { ...s, todos: [...s.todos, ''] } : s))
    )

  const removeStageTodo = (i, ti) =>
    onChange(
      stages.map((s, j) =>
        j === i ? { ...s, todos: s.todos.filter((_, k) => k !== ti) } : s
      )
    )

  const addStage = () => onChange([...stages, { id: Date.now(), name: '', todos: [] }])

  const removeStage = (i) => onChange(stages.filter((_, j) => j !== i))

  const textPlaceholder =
    `"Nama ${lower} 1" [to-do 1, to-do 2, to-do 3]\n` +
    `"Nama ${lower} 2" [to-do 1]\n` +
    `"Nama ${lower} 3"`

  return (
    <div className="stage-editor">
      {/* Pilih mode */}
      <div className="stage-mode-tabs">
        <button
          type="button"
          className={`stage-mode-tab ${mode === 'input' ? 'active' : ''}`}
          onClick={() => mode === 'text' && goInputMode()}
        >
          <ListPlus size={14} /> Mode Input
        </button>
        <button
          type="button"
          className={`stage-mode-tab ${mode === 'text' ? 'active' : ''}`}
          onClick={() => mode !== 'text' && startTextMode()}
        >
          <Keyboard size={14} /> Mode Teks Editor
        </button>
      </div>

      {mode === 'input' ? (
        <div className="stage-editor-input">
          {stages.map((stage, i) => (
            <div key={stage.id} className="stage-row">
              <div className="stage-row-head">
                <input
                  type="text"
                  className="input stage-name"
                  placeholder={inputPlaceholder || `${stageLabel} ${i + 1}...`}
                  value={stage.name}
                  onChange={(e) => setStageName(i, e.target.value)}
                />
                {stages.length > 1 && (
                  <button
                    className="icon-btn"
                    onClick={() => removeStage(i)}
                    aria-label={`Hapus ${lower}`}
                    title={`Hapus ${lower}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="stage-todos">
                {stage.todos.map((todo, ti) => (
                  <div key={ti} className="todo-row">
                    <input
                      type="text"
                      className="input todo-input"
                      placeholder={`To-do ${lower} ${i + 1}...`}
                      value={todo}
                      onChange={(e) => setStageTodo(i, ti, e.target.value)}
                    />
                    <button
                      className="icon-btn"
                      onClick={() => removeStageTodo(i, ti)}
                      aria-label="Hapus to-do"
                      title="Hapus to-do"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => addStageTodo(i)}
                >
                  <Plus size={14} /> To-do
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary btn-sm btn-add-stage"
            onClick={addStage}
          >
            <Plus size={14} /> {addLabel}
          </button>
        </div>
      ) : (
        <div className="stage-text-mode">
          <textarea
            className="input stage-textarea"
            rows={6}
            placeholder={textPlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="field-hint">
            Format: <code>"Nama {lower}" [to-do 1, to-do 2]</code> — satu baris per{' '}
            {lower}. Baris tanpa kurung siku juga valid.
          </p>
          {parseError && <p className="stage-error">{parseError}</p>}
          <div className="stage-text-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={applyText}>
              Terapkan
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={goInputMode}>
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
