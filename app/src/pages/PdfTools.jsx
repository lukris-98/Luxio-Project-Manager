import { useState, useMemo, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { listTools, getToolsByCategory, CATEGORIES, getTool } from '../services/pdfToolRegistry'
import { executeTool, fmtSize } from '../services/pdfToolService'
import { saveAs } from 'file-saver'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Upload, Download, FileText, Merge, Split, RotateCw, Scissors,
  Trash2, ListOrdered, Minimize2, Image, ArrowRightToLine, ArrowLeftFromLine,
  Pencil, Shield, ScanLine, Layout, FolderOpen, Zap, X, Play, CheckCircle2,
  AlertCircle, Clock, Loader2, Eye, ChevronDown, ChevronUp, RefreshCw, Plus
} from 'lucide-react'
import './PdfTools.css'

const ICON_MAP = {
  Merge, Split, RotateCw, Scissors, Trash2, ListOrdered, Minimize2,
  Image, FileText, ArrowRightToLine, ArrowLeftFromLine, Pencil,
  Shield, ScanLine, Layout, FolderOpen, Zap,
}

function ToolIcon({ name, size = 20 }) {
  const Icon = ICON_MAP[name] || FileText
  return <Icon size={size} />
}

const CAT_ICONS = {
  organize: FolderOpen,
  optimize: Zap,
  page_mgmt: Layout,
  convert_to: ArrowRightToLine,
  convert_from: ArrowLeftFromLine,
  editor: Pencil,
  security: Shield,
  ocr: ScanLine,
}

export default function PdfTools() {
  const { currentUser } = useStore()
  const [search, setSearch] = useState('')
  const [activeTool, setActiveTool] = useState(null)
  const [jobStatus, setJobStatus] = useState(null) // null | 'processing' | 'completed' | 'failed'
  const [jobProgress, setJobProgress] = useState(0)
  const [jobResult, setJobResult] = useState(null)
  const [jobError, setJobError] = useState(null)
  const [recentOps, setRecentOps] = useState([])
  const [formValues, setFormValues] = useState({})
  const [files, setFiles] = useState([])
  const fileRef = useRef(null)
  const [showRecent, setShowRecent] = useState(true)

  // All tools grouped by category
  const toolsByCategory = useMemo(() => getToolsByCategory(), [])

  // Filtered tools
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES.filter(c => (toolsByCategory[c.id] || []).length > 0)
    const q = search.toLowerCase()
    return CATEGORIES.filter(c => {
      const tools = toolsByCategory[c.id] || []
      return tools.some(t =>
        t.name.includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }).map(c => ({
      ...c,
      _tools: (toolsByCategory[c.id] || []).filter(t =>
        t.name.includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      ),
    }))
  }, [search, toolsByCategory])

  // Open tool modal
  const openTool = useCallback((tool) => {
    setActiveTool(tool)
    setFormValues({})
    setFiles([])
    setJobStatus(null)
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)
  }, [])

  // Close tool modal
  const closeTool = useCallback(() => {
    setActiveTool(null)
    setJobStatus(null)
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)
  }, [])

  // Handle file input
  const handleFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => activeTool?.multiple ? [...prev, ...selected] : selected)
  }, [activeTool])

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // Execute tool
  const handleExecute = useCallback(async () => {
    if (!activeTool) return
    if (files.length === 0 && activeTool.accept) return

    setJobStatus('processing')
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)

    const startTime = Date.now()

    try {
      const params = { ...formValues }
      if (activeTool.multiple) {
        params.files = files
      } else {
        params.file = files[0]
      }

      const result = await executeTool(activeTool.name, params, (p) => setJobProgress(p))

      setJobResult(result)
      setJobStatus('completed')

      // Add to recent ops
      setRecentOps(prev => [{
        id: Date.now(),
        tool: activeTool.label,
        toolName: activeTool.name,
        fileName: files.map(f => f.name).join(', '),
        status: 'completed',
        duration: Date.now() - startTime,
        outputName: result.fileName,
        outputSize: result.sizeFormatted,
        pageCount: result.pageCount,
        result,
        timestamp: new Date(),
      }, ...prev].slice(0, 20))
    } catch (err) {
      setJobError(err.message || 'Terjadi kesalahan.')
      setJobStatus('failed')
      setRecentOps(prev => [{
        id: Date.now(),
        tool: activeTool.label,
        toolName: activeTool.name,
        fileName: files.map(f => f.name).join(', '),
        status: 'failed',
        duration: Date.now() - startTime,
        error: err.message,
        timestamp: new Date(),
      }, ...prev].slice(0, 20))
    }
  }, [activeTool, files, formValues])

  // Download result
  const handleDownload = useCallback(() => {
    if (!jobResult?.file) return
    saveAs(jobResult.file, jobResult.fileName || 'result.pdf')
  }, [jobResult])

  // Use result as input for next tool
  const handleUseAsInput = useCallback(() => {
    if (!jobResult?.file) return
    const f = new File([jobResult.file], jobResult.fileName || 'result.pdf', { type: 'application/pdf' })
    setFiles([f])
    setJobStatus(null)
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)
  }, [jobResult])

  return (
    <motion.div className="pdf-tools-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="pdf-header">
        <div className="pdf-header-left">
          <h1>PDF Tools</h1>
          <p>Proses, konversi, dan kelola dokumen PDF.</p>
        </div>
      </div>

      {/* Search */}
      <div className="pdf-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Cari tool PDF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="pdf-search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tool Grid by Category */}
      <div className="pdf-tools-content">
        {filteredCategories.map(cat => {
          const tools = cat._tools || toolsByCategory[cat.id] || []
          if (tools.length === 0) return null
          const CatIcon = CAT_ICONS[cat.id] || FolderOpen
          return (
            <div key={cat.id} className="pdf-category-section">
              <div className="pdf-category-header">
                <CatIcon size={16} />
                <h2>{cat.label}</h2>
                <span className="pdf-category-count">{tools.length}</span>
              </div>
              <div className="pdf-tool-grid">
                {tools.map(tool => (
                  <div
                    key={tool.name}
                    className={`pdf-tool-card ${!tool.implemented ? 'coming-soon' : ''}`}
                    onClick={() => tool.implemented && openTool(tool)}
                  >
                    <div className="pdf-tool-card-icon">
                      <ToolIcon name={tool.icon} size={22} />
                    </div>
                    <div className="pdf-tool-card-info">
                      <strong>{tool.label}</strong>
                      <p>{tool.description}</p>
                      {tool.accept && (
                        <span className="pdf-tool-formats">{tool.accept.replace(/\./g, '').toUpperCase()}</span>
                      )}
                    </div>
                    {!tool.implemented && <span className="pdf-coming-soon-badge">Segera</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {filteredCategories.length === 0 && (
          <div className="pdf-empty">
            <Search size={40} />
            <p>Tidak ada tool yang cocok dengan "{search}"</p>
          </div>
        )}
      </div>

      {/* Recent Operations */}
      {recentOps.length > 0 && (
        <div className="pdf-recent-section">
          <div className="pdf-recent-header" onClick={() => setShowRecent(v => !v)}>
            <h2><Clock size={16} /> Operasi Terakhir</h2>
            {showRecent ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {showRecent && (
            <div className="pdf-recent-list">
              {recentOps.map(op => (
                <div key={op.id} className={`pdf-recent-item ${op.status}`}>
                  <div className="pdf-recent-status">
                    {op.status === 'completed' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <div className="pdf-recent-info">
                    <strong>{op.tool}</strong>
                    <span>{op.fileName}</span>
                  </div>
                  <div className="pdf-recent-meta">
                    {op.outputSize && <span>{op.outputSize}</span>}
                    {op.pageCount && <span>{op.pageCount} hal</span>}
                    <span>{op.duration < 1000 ? `${op.duration}ms` : `${(op.duration / 1000).toFixed(1)}s`}</span>
                  </div>
                  {op.result?.file && (
                    <button className="pdf-recent-download" onClick={() => saveAs(op.result.file, op.outputName)}>
                      <Download size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tool Modal */}
      <AnimatePresence>
        {activeTool && (
          <div className="modal-overlay" onClick={closeTool}>
            <motion.div
              className="modal pdf-tool-modal"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <div className="pdf-modal-title">
                  <ToolIcon name={activeTool.icon} size={20} />
                  <h2>{activeTool.label}</h2>
                </div>
                <button className="close-btn" onClick={closeTool}><X size={18} /></button>
              </div>

              <div className="modal-body">
                <p className="pdf-modal-desc">{activeTool.description}</p>

                {/* File upload area */}
                {!jobResult && (
                  <>
                    <div
                      className="pdf-upload-area"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
                      onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                      onDrop={e => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('dragover')
                        const dropped = Array.from(e.dataTransfer.files).filter(f => {
                          if (!activeTool.accept) return true
                          const ext = '.' + f.name.split('.').pop().toLowerCase()
                          return activeTool.accept.split(',').some(a => a.trim() === ext)
                        })
                        setFiles(prev => activeTool.multiple ? [...prev, ...dropped] : dropped)
                      }}
                    >
                      <Upload size={32} />
                      <p>Klik atau drag & drop file di sini</p>
                      <small>{activeTool.accept ? `Format: ${activeTool.accept}` : 'Semua file'}</small>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={activeTool.accept}
                        multiple={activeTool.multiple}
                        hidden
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="pdf-file-list">
                        {files.map((f, i) => (
                          <div key={i} className="pdf-file-item">
                            <FileText size={14} />
                            <span className="pdf-file-name">{f.name}</span>
                            <span className="pdf-file-size">{fmtSize(f.size)}</span>
                            <button onClick={() => removeFile(i)}><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dynamic form fields */}
                    {Object.entries(activeTool.input_schema).map(([key, schema]) => {
                      if (key === 'file' || key === 'files') return null
                      if (schema.type === 'select') {
                        return (
                          <div key={key} className="input-group">
                            <label className="input-label">{schema.label}</label>
                            <select
                              className="input"
                              value={formValues[key] || ''}
                              onChange={e => setFormValues(v => ({ ...v, [key]: e.target.value }))}
                            >
                              <option value="">Pilih...</option>
                              {schema.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )
                      }
                      return (
                        <div key={key} className="input-group">
                          <label className="input-label">{schema.label}</label>
                          <input
                            type="text"
                            className="input"
                            placeholder={schema.placeholder || ''}
                            value={formValues[key] || ''}
                            onChange={e => setFormValues(v => ({ ...v, [key]: e.target.value }))}
                          />
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Progress */}
                {jobStatus === 'processing' && (
                  <div className="pdf-progress">
                    <Loader2 size={20} className="spinning" />
                    <div className="pdf-progress-bar">
                      <div className="pdf-progress-fill" style={{ width: `${jobProgress}%` }} />
                    </div>
                    <span>{jobProgress}%</span>
                  </div>
                )}

                {/* Result */}
                {jobStatus === 'completed' && jobResult && (
                  <div className="pdf-result">
                    <div className="pdf-result-header">
                      <CheckCircle2 size={24} />
                      <h3>Operasi Berhasil</h3>
                    </div>
                    <div className="pdf-result-info">
                      <div className="pdf-result-row">
                        <span>Output</span>
                        <strong>{jobResult.fileName}</strong>
                      </div>
                      <div className="pdf-result-row">
                        <span>Ukuran</span>
                        <strong>{jobResult.sizeFormatted}</strong>
                      </div>
                      {jobResult.pageCount && (
                        <div className="pdf-result-row">
                          <span>Halaman</span>
                          <strong>{jobResult.pageCount}</strong>
                        </div>
                      )}
                      {jobResult.reduction !== undefined && (
                        <div className="pdf-result-row highlight">
                          <span>Kompresi</span>
                          <strong>{jobResult.reduction}% lebih kecil</strong>
                        </div>
                      )}
                      {jobResult.originalSizeFormatted && (
                        <div className="pdf-result-row">
                          <span>Ukuran asli</span>
                          <strong>{jobResult.originalSizeFormatted} → {jobResult.compressedSizeFormatted}</strong>
                        </div>
                      )}
                    </div>
                    <div className="pdf-result-actions">
                      <button className="btn btn-primary" onClick={handleDownload}>
                        <Download size={14} /> Download
                      </button>
                      <button className="btn btn-secondary" onClick={handleUseAsInput}>
                        <RefreshCw size={14} /> Gunakan Sebagai Input
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setJobResult(null); setJobStatus(null); setFiles([]) }}>
                        <Plus size={14} /> Jalankan Lagi
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {jobStatus === 'failed' && (
                  <div className="pdf-error">
                    <AlertCircle size={24} />
                    <h3>Gagal</h3>
                    <p>{jobError}</p>
                    <button className="btn btn-secondary" onClick={() => { setJobStatus(null); setJobError(null) }}>
                      <RefreshCw size={14} /> Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!jobResult && jobStatus !== 'processing' && (
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeTool}>Batal</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleExecute}
                    disabled={files.length === 0}
                  >
                    <Play size={14} /> Jalankan
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
