import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { listTools, getToolsByCategory, CATEGORIES, getTool } from '../services/pdfToolRegistry'
import { executeTool, fmtSize } from '../services/pdfToolService'
import { saveAs } from 'file-saver'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Upload, Download, FileText, Merge, Split, RotateCw, Scissors,
  Trash2, ListOrdered, Minimize2, Image, ArrowRightToLine, ArrowLeftFromLine,
  Pencil, Shield, ScanLine, Layout, FolderOpen, Zap, X, Play, CheckCircle2,
  AlertCircle, Clock, Loader2, Eye, ChevronDown, ChevronUp, RefreshCw, Plus,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut
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
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'converter' | 'ai'
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

  // PDF Preview states
  const [pdfPreview, setPdfPreview] = useState(null) // { url, numPages, currentPage, allPages }
  const [previewPage, setPreviewPage] = useState(1)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [renderingPages, setRenderingPages] = useState(false)
  const canvasRef = useRef(null)
  const pdfDocRef = useRef(null)
  const allPagesCanvasRefs = useRef([])
  const [allPagesRendered, setAllPagesRendered] = useState([])
  
  // Split PDF specific states
  const [splitMode, setSplitMode] = useState('default') // 'default' | 'custom'
  const [splitFileCount, setSplitFileCount] = useState(3)
  const [pageAssignments, setPageAssignments] = useState({}) // { pageNum: fileNum }
  const [hoveredPage, setHoveredPage] = useState(null)
  const [draggedPage, setDraggedPage] = useState(null)
  
  // Edit PDF specific states
  const [editOperations, setEditOperations] = useState([]) // [{ originalPageNum, pageNum, rotation, deleted, dataUrl }]
  const [customRotation, setCustomRotation] = useState({}) // { pageNum: degrees }
  const [showRotationModal, setShowRotationModal] = useState(null) // pageNum or null

  // All tools grouped by category
  const toolsByCategory = useMemo(() => getToolsByCategory(), [])

  // Filtered tools based on active tab and search
  const filteredCategories = useMemo(() => {
    const tabTools = listTools({ tab: activeTab })
    
    if (!search.trim()) {
      return CATEGORIES.filter(c => {
        const catTools = tabTools.filter(t => t.category === c.id)
        return catTools.length > 0
      }).map(c => ({
        ...c,
        _tools: tabTools.filter(t => t.category === c.id)
      }))
    }
    
    const q = search.toLowerCase()
    return CATEGORIES.filter(c => {
      const catTools = tabTools.filter(t => t.category === c.id)
      return catTools.some(t =>
        t.name.includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }).map(c => ({
      ...c,
      _tools: tabTools.filter(t =>
        t.category === c.id && (
          t.name.includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        )
      ),
    }))
  }, [activeTab, search])

  // Render all pages as thumbnails
  const renderAllPages = useCallback(async (pdf) => {
    setRenderingPages(true)
    
    try {
      const pages = []
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        
        const scale = 1
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { alpha: false })
        
        if (!context) {
          throw new Error(`Canvas context gagal dibuat untuk halaman ${pageNum}`)
        }
        
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        
        await page.render({
          canvasContext: context,
          viewport
        }).promise
        
        const dataUrl = canvas.toDataURL('image/png')
        
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error(`Gagal membuat dataUrl untuk halaman ${pageNum}`)
        }
        
        pages.push({
          pageNum,
          dataUrl,
          width: canvas.width,
          height: canvas.height
        })
        
        console.log(`[PDF] Page ${pageNum} rendered`, canvas.width, canvas.height, dataUrl.length)
        
        // Bersihkan canvas sementara
        canvas.width = 1
        canvas.height = 1
      }
      
      console.log('[PDF] All pages rendered:', pages.length)
      
      setAllPagesRendered(pages)
      
      if (activeTool?.name === 'edit_pdf') {
        const operations = pages.map((page) => ({
          originalPageNum: page.pageNum,
          pageNum: page.pageNum,
          rotation: 0,
          deleted: false
        }))
        
        setEditOperations(operations)
        
        console.log('[PDF] Edit operations initialized:', operations)
      }
      
    } catch (error) {
      console.error('[PDF] renderAllPages failed:', error)
    } finally {
      setRenderingPages(false)
    }
  }, [activeTool])

  // Load PDF for preview
  const loadPdfPreview = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') return
    
    console.log('Loading PDF preview for:', file.name, 'Tool:', activeTool?.name)
    
    setPreviewLoading(true)
    setAllPagesRendered([])
    setEditOperations([])
    
    try {
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist')
      
      console.log('pdfjs-dist loaded, version:', pdfjsLib.version)
      
      // Use local bundled worker to avoid CSP issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      
      // PRIORITAS: Gunakan ArrayBuffer, bukan blob URL
      // Ini menghindari CSP error: "Refused to connect to 'blob:http://localhost:5173/...'"
      console.log('Reading PDF as ArrayBuffer...')
      const arrayBuffer = await file.arrayBuffer()
      
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer)
      })
      
      const pdf = await loadingTask.promise
      
      console.log('PDF loaded, pages:', pdf.numPages)
      
      pdfDocRef.current = pdf
      
      // Object URL hanya untuk kebutuhan UI jika diperlukan (tidak untuk PDF.js)
      const fileUrl = URL.createObjectURL(file)
      
      setPdfPreview({
        url: fileUrl,
        numPages: pdf.numPages,
        fileName: file.name
      })
      setPreviewPage(1)
      setPreviewZoom(1)
      
      // Render all pages for editor tools
      if (activeTool?.tab === 'editor') {
        console.log('Rendering all pages for editor tool')
        await renderAllPages(pdf)
      }
    } catch (error) {
      console.error('Error loading PDF:', error)
    } finally {
      setPreviewLoading(false)
    }
  }, [activeTool, renderAllPages])

  // Render current page
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDocRef.current || !canvasRef.current) return
    
    try {
      const page = await pdfDocRef.current.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      const viewport = page.getViewport({ scale: previewZoom })
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }, [previewZoom])

  // Re-render when page or zoom changes
  useEffect(() => {
    if (pdfPreview && previewPage) {
      renderPage(previewPage)
    }
  }, [pdfPreview, previewPage, previewZoom, renderPage])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreview?.url) {
        URL.revokeObjectURL(pdfPreview.url)
      }
    }
  }, [pdfPreview?.url])

  // Open tool modal
  const openTool = useCallback((tool) => {
    setActiveTool(tool)
    setFormValues({})
    setFiles([])
    setJobStatus(null)
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)
    setPdfPreview(null)
    pdfDocRef.current = null
    setPreviewPage(1)
    setPreviewZoom(1)
    setAllPagesRendered([])
    
    // Reset split states
    setSplitMode('default')
    setSplitFileCount(3)
    setPageAssignments({})
    setHoveredPage(null)
    setDraggedPage(null)
    
    // Reset edit states
    setEditOperations([])
    setCustomRotation({})
    setShowRotationModal(null)
  }, [])

  // Handle page assignment for split PDF
  const handlePageAssignment = useCallback((pageNum, fileNum) => {
    setPageAssignments(prev => ({
      ...prev,
      [pageNum]: fileNum
    }))
  }, [])
  
  // Edit PDF handlers
  const handleRotatePage = useCallback((pageNum) => {
    setEditOperations(prev => prev.map(op => 
      op.pageNum === pageNum 
        ? { ...op, rotation: (op.rotation + 90) % 360 }
        : op
    ))
  }, [])
  
  // Debug effect for edit PDF
  useEffect(() => {
    if (activeTool?.name === 'edit_pdf' && pdfPreview) {
      console.log('Edit PDF State:', {
        pdfPreview: !!pdfPreview,
        editOpsCount: editOperations.length,
        pagesRendered: allPagesRendered.length,
        loading: previewLoading,
        rendering: renderingPages
      })
    }
  }, [activeTool, pdfPreview, editOperations.length, allPagesRendered.length, previewLoading, renderingPages])
  
  // DOM Debugging Effect
  useEffect(() => {
    if (activeTool?.name !== 'edit_pdf') return
    
    console.log('[PDF DEBUG]', {
      pdfPreview,
      editOperations,
      allPagesRendered,
      renderingPages,
      previewLoading
    })
    
    requestAnimationFrame(() => {
      const images = document.querySelectorAll('.pdf-page-image')
      
      console.log('[PDF DEBUG] DOM images:', images.length)
      
      images.forEach((img, index) => {
        console.log(`[PDF DEBUG] Image ${index + 1}`, {
          src: img.src?.substring(0, 50),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          clientWidth: img.clientWidth,
          clientHeight: img.clientHeight,
          display: getComputedStyle(img).display,
          visibility: getComputedStyle(img).visibility,
          opacity: getComputedStyle(img).opacity
        })
      })
    })
  }, [
    activeTool,
    pdfPreview,
    editOperations,
    allPagesRendered,
    renderingPages,
    previewLoading
  ])
  
  // Layout Debugging Effect - Mencari kenapa preview tidak terlihat
  useEffect(() => {
    if (activeTool?.name !== 'edit_pdf') return
    if (allPagesRendered.length === 0) return
    
    requestAnimationFrame(() => {
      const images = [...document.querySelectorAll('.pdf-page-image')]
      
      console.log('[PDF LAYOUT DEBUG]', {
        imageCount: images.length
      })
      
      images.forEach((img, index) => {
        const rect = img.getBoundingClientRect()
        const style = getComputedStyle(img)
        
        console.log(`[PDF LAYOUT DEBUG] IMAGE ${index + 1}`, {
          rect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          },
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          position: style.position,
          zIndex: style.zIndex,
          transform: style.transform,
          visibleInViewport: 
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
        })
        
        // Check parent hierarchy
        let current = img
        let level = 0
        while (current && level < 10) {
          const parentRect = current.getBoundingClientRect()
          const parentStyle = getComputedStyle(current)
          
          console.log(`[PDF PARENT LEVEL ${level}]`, {
            tag: current.tagName,
            className: current.className,
            rect: {
              top: parentRect.top,
              left: parentRect.left,
              width: parentRect.width,
              height: parentRect.height
            },
            display: parentStyle.display,
            visibility: parentStyle.visibility,
            opacity: parentStyle.opacity,
            overflow: parentStyle.overflow,
            overflowX: parentStyle.overflowX,
            overflowY: parentStyle.overflowY,
            position: parentStyle.position,
            zIndex: parentStyle.zIndex
          })
          
          current = current.parentElement
          level++
        }
        
        // Check what element is covering the image
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const elementAtPoint = document.elementFromPoint(centerX, centerY)
        
        console.log('[PDF COVER DEBUG]', {
          expectedElement: 'IMG.pdf-page-image',
          actualElement: elementAtPoint?.tagName + '.' + elementAtPoint?.className,
          isCovered: elementAtPoint !== img
        })
      })
    })
  }, [activeTool, allPagesRendered, editOperations])
  
  const handleDeletePage = useCallback((pageNum) => {
    setEditOperations(prev => prev.map(op => 
      op.pageNum === pageNum 
        ? { ...op, deleted: !op.deleted }
        : op
    ))
  }, [])
  
  const handleCustomRotation = useCallback((pageNum, degrees) => {
    setEditOperations(prev => prev.map(op => 
      op.pageNum === pageNum 
        ? { ...op, rotation: degrees % 360 }
        : op
    ))
    setShowRotationModal(null)
  }, [])
  
  const handleReorderPages = useCallback((fromIndex, toIndex) => {
    setEditOperations(prev => {
      const newOps = [...prev]
      const [moved] = newOps.splice(fromIndex, 1)
      newOps.splice(toIndex, 0, moved)
      // Update pageNum to reflect new order
      return newOps.map((op, idx) => ({ ...op, pageNum: idx + 1 }))
    })
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((pageNum) => {
    setDraggedPage(pageNum)
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e, pageNum) => {
    e.preventDefault()
  }, [])

  // Handle drop to reorder
  const handleDrop = useCallback((e, targetPageNum) => {
    e.preventDefault()
    if (draggedPage === null || draggedPage === targetPageNum) return

    // For split_pdf: reorder visual only
    if (activeTool?.name === 'split_pdf') {
      const newPages = [...allPagesRendered]
      const draggedIndex = newPages.findIndex(p => p.pageNum === draggedPage)
      const targetIndex = newPages.findIndex(p => p.pageNum === targetPageNum)
      
      const [removed] = newPages.splice(draggedIndex, 1)
      newPages.splice(targetIndex, 0, removed)
      
      setAllPagesRendered(newPages)
    }
    
    // For edit_pdf: reorder operations
    if (activeTool?.name === 'edit_pdf') {
      const draggedIndex = editOperations.findIndex(op => op.pageNum === draggedPage)
      const targetIndex = editOperations.findIndex(op => op.pageNum === targetPageNum)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        handleReorderPages(draggedIndex, targetIndex)
      }
    }
    
    setDraggedPage(null)
  }, [draggedPage, allPagesRendered, activeTool, editOperations, handleReorderPages])

  // Close tool modal
  const closeTool = useCallback(() => {
    setActiveTool(null)
    setJobStatus(null)
    setJobProgress(0)
    setJobResult(null)
    setJobError(null)
    setPdfPreview(null)
    pdfDocRef.current = null
    setPreviewPage(1)
    setPreviewZoom(1)
    setAllPagesRendered([])
  }, [])

  // Handle file input
  const handleFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files || [])
    const newFiles = activeTool?.multiple ? [...files, ...selected] : selected
    
    // Validasi minFiles dan maxFiles
    if (activeTool?.minFiles && newFiles.length < activeTool.minFiles) {
      setJobError(`Tool ini memerlukan minimal ${activeTool.minFiles} file`)
      setFiles(newFiles)
      return
    }
    
    if (activeTool?.maxFiles && newFiles.length > activeTool.maxFiles) {
      setJobError(`Tool ini hanya dapat memproses maksimal ${activeTool.maxFiles} file`)
      setFiles(newFiles.slice(0, activeTool.maxFiles))
      return
    }
    
    setFiles(newFiles)
    setJobError(null)
    
    // Auto-load preview for first PDF file
    if (newFiles.length > 0 && newFiles[0].type === 'application/pdf') {
      loadPdfPreview(newFiles[0])
    }
  }, [activeTool, files, loadPdfPreview])

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    // Clear preview if removing the previewed file
    if (idx === 0) {
      setPdfPreview(null)
      pdfDocRef.current = null
      setAllPagesRendered([])
    }
  }, [])

  // Execute tool
  const handleExecute = useCallback(async () => {
    if (!activeTool) return
    
    // Validasi minFiles
    if (activeTool.minFiles && files.length < activeTool.minFiles) {
      setJobError(`Tool ini memerlukan minimal ${activeTool.minFiles} file. Anda hanya memilih ${files.length} file.`)
      setJobStatus('failed')
      return
    }
    
    // Validasi maxFiles
    if (activeTool.maxFiles && files.length > activeTool.maxFiles) {
      setJobError(`Tool ini hanya dapat memproses maksimal ${activeTool.maxFiles} file. Anda memilih ${files.length} file.`)
      setJobStatus('failed')
      return
    }
    
    if (files.length === 0 && activeTool.accept) {
      setJobError('Silakan upload file terlebih dahulu')
      setJobStatus('failed')
      return
    }

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
      
      // Add split PDF specific parameters
      if (activeTool.name === 'split_pdf') {
        params.splitMode = splitMode
        params.pageAssignments = pageAssignments
        params.splitFileCount = splitFileCount
      }
      
      // Add edit PDF specific parameters
      if (activeTool.name === 'edit_pdf') {
        params.operations = editOperations
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
  }, [activeTool, files, formValues, splitMode, pageAssignments, splitFileCount, editOperations])

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

      {/* Tab Navigation */}
      <div className="pdf-tabs">
        <button
          className={`pdf-tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <Pencil size={16} />
          Editor PDF
        </button>
        <button
          className={`pdf-tab ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => setActiveTab('converter')}
        >
          <RefreshCw size={16} />
          Converter PDF
        </button>
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
                <button className="close-btn" onClick={closeTool} title="Tutup">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p className="pdf-modal-desc">{activeTool.description}</p>

                {/* File upload area */}
                {!jobResult && jobStatus !== 'processing' && (
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
                        
                        const newFiles = activeTool.multiple ? [...files, ...dropped] : dropped
                        
                        // Validasi minFiles dan maxFiles
                        if (activeTool?.maxFiles && newFiles.length > activeTool.maxFiles) {
                          setJobError(`Maksimal ${activeTool.maxFiles} file`)
                          setFiles(newFiles.slice(0, activeTool.maxFiles))
                        } else {
                          setFiles(newFiles)
                          setJobError(null)
                        }
                        
                        // Auto-load preview for first PDF file
                        if (newFiles.length > 0 && newFiles[0].type === 'application/pdf') {
                          loadPdfPreview(newFiles[0])
                        }
                      }}
                    >
                      <Upload size={32} />
                      <p>Klik atau drag & drop file di sini</p>
                      <small>
                        {activeTool.accept ? `Format: ${activeTool.accept}` : 'Semua file'}
                        {activeTool.minFiles && activeTool.minFiles > 1 && (
                          <span style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>
                            Minimal {activeTool.minFiles} file diperlukan
                          </span>
                        )}
                        {activeTool.maxFiles && (
                          <span style={{ display: 'block', marginTop: '4px' }}>
                            Maksimal {activeTool.maxFiles} file
                          </span>
                        )}
                      </small>
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
                            <button onClick={() => removeFile(i)} title="Hapus file">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Split PDF Mode Selector */}
                    {activeTool?.name === 'split_pdf' && files.length > 0 && pdfPreview && (
                      <div className="split-mode-selector">
                        <div className="split-mode-header">
                          <h3>Mode Split</h3>
                        </div>
                        <div className="split-mode-options">
                          <label className={`split-mode-option ${splitMode === 'default' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="splitMode"
                              value="default"
                              checked={splitMode === 'default'}
                              onChange={() => {
                                setSplitMode('default')
                                setPageAssignments({})
                              }}
                            />
                            <div className="split-mode-content">
                              <strong>Default Split</strong>
                              <p>Setiap halaman menjadi file terpisah ({pdfPreview.numPages} file)</p>
                            </div>
                          </label>
                          
                          <label className={`split-mode-option ${splitMode === 'custom' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="splitMode"
                              value="custom"
                              checked={splitMode === 'custom'}
                              onChange={() => {
                                setSplitMode('custom')
                                setPageAssignments({})
                              }}
                            />
                            <div className="split-mode-content">
                              <strong>Custom Split</strong>
                              <p>Tentukan sendiri pembagian halaman</p>
                            </div>
                          </label>
                        </div>
                        
                        {splitMode === 'custom' && (
                          <div className="split-file-count">
                            <label>Jumlah file output:</label>
                            <div className="split-count-control">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSplitFileCount(c => Math.max(2, c - 1))}
                                disabled={splitFileCount <= 2}
                              >
                                -
                              </button>
                              <span className="split-count-value">{splitFileCount} file</span>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSplitFileCount(c => Math.min(pdfPreview.numPages, c + 1))}
                                disabled={splitFileCount >= pdfPreview.numPages}
                              >
                                +
                              </button>
                            </div>
                            <p className="field-hint">
                              Hover pada halaman untuk assign ke file output. Halaman yang tidak di-assign akan masuk ke file 1.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PDF Preview - Edit PDF Tool (Rotate, Delete, Reorder) */}
                    {(() => {
                      const shouldShow = activeTool?.name === 'edit_pdf' && 
                                        files.length > 0 && 
                                        pdfPreview && 
                                        jobStatus !== 'completed'
                      
                      console.log('[PDF JSX CONDITION]', {
                        tool: activeTool?.name,
                        files: files.length,
                        pdfPreview: Boolean(pdfPreview),
                        jobStatus,
                        renderingPages,
                        editOperations: editOperations.length,
                        allPagesRendered: allPagesRendered.length,
                        shouldShow
                      })
                      
                      return shouldShow
                    })() && (
                      <div className="pdf-preview-container">
                        <div className="pdf-preview-header">
                          <div className="pdf-preview-info">
                            <Eye size={16} />
                            <span>
                              Preview PDF: {pdfPreview.fileName}
                            </span>
                          </div>
                          <span>
                            {allPagesRendered.length} halaman
                          </span>
                        </div>
                    
                        <div className="pdf-all-pages-viewer">
                          {renderingPages ? (
                            <div className="pdf-preview-loading">
                              <Loader2 size={24} className="spinning" />
                              <span>Merender halaman PDF...</span>
                            </div>
                          ) : allPagesRendered.length === 0 ? (
                            <div className="pdf-preview-loading">
                              <span>Preview PDF belum tersedia</span>
                            </div>
                          ) : (
                            <div className="pdf-pages-grid">
                              {editOperations.map((op, index) => {
                                const page = allPagesRendered.find(p => p.pageNum === op.originalPageNum)
                                
                                if (!page) {
                                  console.warn('[PDF] Page data tidak ditemukan:', op.originalPageNum)
                                  return null
                                }
                                
                                return (
                                  <div
                                    key={`${op.originalPageNum}-${index}`}
                                    className={`pdf-page-thumbnail edit-page ${draggedPage === op.pageNum ? 'dragging' : ''} ${op.deleted ? 'deleted' : ''}`}
                                    draggable={!op.deleted}
                                    onDragStart={() => !op.deleted && setDraggedPage(op.pageNum)}
                                    onDragOver={(e) => { e.preventDefault() }}
                                    onDrop={(e) => handleDrop(e, op.pageNum)}
                                  >
                                    {/* Page Controls Overlay */}
                                    {!op.deleted && (
                                      <div className="edit-page-controls">
                                        <button
                                          className="edit-btn rotate-btn"
                                          onClick={() => handleRotatePage(op.pageNum)}
                                          title="Rotate 90°"
                                        >
                                          <RotateCw size={14} />
                                        </button>
                                        <button
                                          className="edit-btn custom-rotate-btn"
                                          onClick={() => setShowRotationModal(op.pageNum)}
                                          title="Custom rotation"
                                        >
                                          {op.rotation}°
                                        </button>
                                        <button
                                          className="edit-btn delete-btn"
                                          onClick={() => handleDeletePage(op.pageNum)}
                                          title="Delete page"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                    
                                    {op.deleted && (
                                      <div className="deleted-overlay">
                                        <button
                                          className="undo-delete-btn"
                                          onClick={() => handleDeletePage(op.pageNum)}
                                          title="Restore page"
                                        >
                                          <RefreshCw size={14} /> Restore
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div className="pdf-page-number">
                                      Hal. {op.pageNum} {op.originalPageNum !== op.pageNum && `(asli: ${op.originalPageNum})`}
                                      {op.rotation !== 0 && ` • ${op.rotation}°`}
                                    </div>
                                    
                                    <img 
                                      src={page.dataUrl} 
                                      alt={`Halaman ${op.originalPageNum}`}
                                      className="pdf-page-image"
                                      draggable={false}
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        height: 'auto',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                        transform: `rotate(${op.rotation}deg)`,
                                        opacity: op.deleted ? 0.3 : 1
                                      }}
                                      onLoad={(event) => {
                                        console.log(`[PDF] Image ${op.originalPageNum} loaded`, {
                                          width: event.currentTarget.naturalWidth,
                                          height: event.currentTarget.naturalHeight
                                        })
                                      }}
                                      onError={(event) => {
                                        console.error(`[PDF] Image ${op.originalPageNum} failed`, event)
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Custom Rotation Modal */}
                        {showRotationModal !== null && (
                          <div className="custom-rotation-modal" onClick={() => setShowRotationModal(null)}>
                            <div className="custom-rotation-content" onClick={(e) => e.stopPropagation()}>
                              <h3>Custom Rotation</h3>
                              <p>Masukkan derajat rotasi (0-359)</p>
                              <input
                                type="number"
                                min="0"
                                max="359"
                                defaultValue={editOperations.find(op => op.pageNum === showRotationModal)?.rotation || 0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCustomRotation(showRotationModal, parseInt(e.target.value) || 0)
                                  }
                                }}
                                autoFocus
                              />
                              <div className="custom-rotation-actions">
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setShowRotationModal(null)}
                                >
                                  Batal
                                </button>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={(e) => {
                                    const input = e.target.closest('.custom-rotation-content').querySelector('input')
                                    handleCustomRotation(showRotationModal, parseInt(input.value) || 0)
                                  }}
                                >
                                  Terapkan
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PDF Preview - All Pages Grid for Editor Tools (except edit_pdf) */}
                    {pdfPreview && activeTool?.tab === 'editor' && activeTool?.name !== 'edit_pdf' && (
                      <div className="pdf-preview-container">
                        <div className="pdf-preview-header">
                          <div className="pdf-preview-info">
                            <Eye size={16} />
                            <span>
                              Preview: {pdfPreview.fileName} ({pdfPreview.numPages} halaman)
                              {activeTool?.name === 'split_pdf' && ' - Drag untuk reorder'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pdf-all-pages-viewer">
                          {previewLoading || renderingPages ? (
                            <div className="pdf-preview-loading">
                              <Loader2 size={24} className="spinning" />
                              <span>Memuat semua halaman...</span>
                            </div>
                          ) : (
                            <div className="pdf-pages-grid">
                              {allPagesRendered.map((page) => {
                                const assignedFile = pageAssignments[page.pageNum] || 1
                                const isDragging = draggedPage === page.pageNum
                                
                                return (
                                  <div
                                    key={page.pageNum}
                                    className={`pdf-page-thumbnail ${isDragging ? 'dragging' : ''}`}
                                    draggable={activeTool?.name === 'split_pdf'}
                                    onDragStart={() => handleDragStart(page.pageNum)}
                                    onDragOver={(e) => handleDragOver(e, page.pageNum)}
                                    onDrop={(e) => handleDrop(e, page.pageNum)}
                                    onMouseEnter={() => setHoveredPage(page.pageNum)}
                                    onMouseLeave={() => setHoveredPage(null)}
                                  >
                                    <div className="pdf-page-number">
                                      Hal. {page.pageNum}
                                      {splitMode === 'custom' && activeTool?.name === 'split_pdf' && (
                                        <span className="pdf-page-file-badge" style={{ 
                                          background: `hsl(${(assignedFile - 1) * (360 / splitFileCount)}, 70%, 60%)`
                                        }}>
                                          File {assignedFile}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <img 
                                      src={page.dataUrl} 
                                      alt={`Halaman ${page.pageNum}`}
                                      className="pdf-page-image"
                                    />
                                    
                                    {/* Checkbox overlay for split custom mode */}
                                    {splitMode === 'custom' && 
                                     activeTool?.name === 'split_pdf' && 
                                     hoveredPage === page.pageNum && (
                                      <div className="pdf-page-overlay">
                                        <div className="pdf-page-file-selector">
                                          {Array.from({ length: splitFileCount }, (_, i) => i + 1).map(fileNum => (
                                            <label
                                              key={fileNum}
                                              className={`pdf-file-checkbox ${assignedFile === fileNum ? 'checked' : ''}`}
                                              style={{
                                                '--file-color': `hsl(${(fileNum - 1) * (360 / splitFileCount)}, 70%, 60%)`
                                              }}
                                            >
                                              <input
                                                type="radio"
                                                name={`page-${page.pageNum}`}
                                                checked={assignedFile === fileNum}
                                                onChange={() => handlePageAssignment(page.pageNum, fileNum)}
                                              />
                                              <span>File {fileNum}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PDF Preview - Single Page Navigator for Converter Tools */}
                    {pdfPreview && activeTool?.tab === 'converter' && (
                      <div className="pdf-preview-container">
                        <div className="pdf-preview-header">
                          <div className="pdf-preview-info">
                            <Eye size={16} />
                            <span>Preview: {pdfPreview.fileName}</span>
                          </div>
                          <div className="pdf-preview-controls">
                            <button
                              className="pdf-preview-btn"
                              onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))}
                              disabled={previewZoom <= 0.5}
                              title="Zoom out"
                            >
                              <ZoomOut size={14} />
                            </button>
                            <span className="pdf-preview-zoom">{Math.round(previewZoom * 100)}%</span>
                            <button
                              className="pdf-preview-btn"
                              onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))}
                              disabled={previewZoom >= 3}
                              title="Zoom in"
                            >
                              <ZoomIn size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="pdf-preview-viewer">
                          {previewLoading ? (
                            <div className="pdf-preview-loading">
                              <Loader2 size={24} className="spinning" />
                              <span>Memuat preview...</span>
                            </div>
                          ) : (
                            <canvas ref={canvasRef} className="pdf-preview-canvas" />
                          )}
                        </div>

                        <div className="pdf-preview-footer">
                          <button
                            className="pdf-preview-btn"
                            onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                            disabled={previewPage <= 1}
                            title="Halaman sebelumnya"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="pdf-preview-page">
                            Halaman {previewPage} / {pdfPreview.numPages}
                          </span>
                          <button
                            className="pdf-preview-btn"
                            onClick={() => setPreviewPage(p => Math.min(pdfPreview.numPages, p + 1))}
                            disabled={previewPage >= pdfPreview.numPages}
                            title="Halaman selanjutnya"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
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
                    
                    {/* For Split PDF with multiple files */}
                    {jobResult.files && Array.isArray(jobResult.files) ? (
                      <>
                        <div className="pdf-result-info">
                          <div className="pdf-result-row">
                            <span>Mode</span>
                            <strong>{jobResult.mode === 'default' ? 'Default Split' : 'Custom Split'}</strong>
                          </div>
                          <div className="pdf-result-row">
                            <span>Total File</span>
                            <strong>{jobResult.totalFiles} file</strong>
                          </div>
                        </div>
                        
                        <div className="pdf-split-results">
                          <h4>File yang dihasilkan:</h4>
                          <div className="pdf-split-file-list">
                            {jobResult.files.map((fileResult, idx) => (
                              <div key={idx} className="pdf-split-file-item">
                                <div className="pdf-split-file-info">
                                  <FileText size={14} />
                                  <div>
                                    <strong>{fileResult.fileName}</strong>
                                    <span>{fileResult.pageCount} hal • {fileResult.sizeFormatted}</span>
                                  </div>
                                </div>
                                <button 
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => saveAs(fileResult.file, fileResult.fileName)}
                                  title="Download file ini"
                                >
                                  <Download size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pdf-result-actions">
                          <button 
                            className="btn btn-primary" 
                            onClick={() => {
                              // Download all files as zip (future enhancement)
                              // For now, download one by one
                              jobResult.files.forEach((fileResult, idx) => {
                                setTimeout(() => {
                                  saveAs(fileResult.file, fileResult.fileName)
                                }, idx * 500)
                              })
                            }}
                          >
                            <Download size={14} /> Download Semua
                          </button>
                          <button className="btn btn-ghost" onClick={() => { 
                            setJobResult(null)
                            setJobStatus(null)
                            setFiles([])
                            setPdfPreview(null)
                            setAllPagesRendered([])
                            setPageAssignments({})
                          }}>
                            <Plus size={14} /> Split Lagi
                          </button>
                        </div>
                      </>
                    ) : jobResult.operationsApplied ? (
                      /* For Edit PDF */
                      <>
                        <div className="pdf-result-info">
                          <div className="pdf-result-row">
                            <span>Output</span>
                            <strong>{jobResult.fileName}</strong>
                          </div>
                          <div className="pdf-result-row">
                            <span>Ukuran</span>
                            <strong>{jobResult.sizeFormatted}</strong>
                          </div>
                          <div className="pdf-result-row">
                            <span>Halaman</span>
                            <strong>{jobResult.pageCount}</strong>
                          </div>
                          {jobResult.operationsApplied.rotated > 0 && (
                            <div className="pdf-result-row">
                              <span>Rotated</span>
                              <strong>{jobResult.operationsApplied.rotated} halaman</strong>
                            </div>
                          )}
                          {jobResult.operationsApplied.deleted > 0 && (
                            <div className="pdf-result-row">
                              <span>Deleted</span>
                              <strong>{jobResult.operationsApplied.deleted} halaman</strong>
                            </div>
                          )}
                        </div>
                        <div className="pdf-result-actions">
                          <button className="btn btn-primary" onClick={handleDownload}>
                            <Download size={14} /> Download
                          </button>
                          <button className="btn btn-secondary" onClick={handleUseAsInput}>
                            <RefreshCw size={14} /> Edit Lagi
                          </button>
                          <button className="btn btn-ghost" onClick={() => { 
                            setJobResult(null)
                            setJobStatus(null)
                            setFiles([])
                            setPdfPreview(null)
                            setAllPagesRendered([])
                            setEditOperations([])
                          }}>
                            <Plus size={14} /> Baru
                          </button>
                        </div>
                      </>
                    ) : (
                      /* For other tools with single file output */
                      <>
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
                      </>
                    )}
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
                    disabled={
                      files.length === 0 || 
                      (activeTool?.name === 'edit_pdf' && editOperations.length === 0)
                    }
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
