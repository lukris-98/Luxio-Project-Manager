/**
 * pdfToolRegistry.js — Tool Registry untuk PDF Tools.
 *
 * Setiap PDF operation terdaftar sebagai tool dengan schema, permission,
 * dan metadata yang konsisten. Registry bisa dipakai oleh UI, Agent,
 * dan Workflow Engine.
 */

// =====================================================================
// Tool Definitions
// =====================================================================

const TOOLS = [
  // ══════════════════════════════════════════════════════════════════
  // EDITOR PDF TOOLS — Organize, Optimize, Edit
  // ══════════════════════════════════════════════════════════════════
  
  // ── ORGANIZE ──────────────────────────────────────────────────────
  {
    name: 'merge_pdf',
    category: 'organize',
    tab: 'editor',
    icon: 'Merge',
    label: 'Merge PDF',
    description: 'Gabungkan beberapa PDF menjadi satu dokumen.',
    accept: '.pdf',
    multiple: true,
    minFiles: 2,
    maxFiles: 20,
    input_schema: {
      files: { type: 'array', required: true, label: 'File PDF (minimal 2)' },
    },
    output_schema: { file: 'blob', page_count: 'number' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },
  {
    name: 'split_pdf',
    category: 'organize',
    tab: 'editor',
    icon: 'Split',
    label: 'Split PDF',
    description: 'Pisahkan PDF berdasarkan rentang halaman.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      ranges: { type: 'string', required: false, label: 'Rentang halaman (cth: 1-3,5,7-9)', placeholder: '1-3,5,7-9' },
    },
    output_schema: { files: 'blob[]' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },
  {
    name: 'edit_pdf',
    category: 'organize',
    tab: 'editor',
    icon: 'Pencil',
    label: 'Edit PDF',
    description: 'Edit PDF: rotate, hapus, dan atur ulang halaman dalam satu tool.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      // Operations akan disimpan di state component, tidak di form
    },
    output_schema: { file: 'blob', page_count: 'number' },
    permissions: ['pdf.edit'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },
  {
    name: 'extract_pdf_pages',
    category: 'organize',
    tab: 'editor',
    icon: 'Scissors',
    label: 'Extract Pages',
    description: 'Ambil halaman tertentu dari PDF.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      pages: { type: 'string', required: true, label: 'Halaman (cth: 1-3,5)', placeholder: '1-3,5' },
    },
    output_schema: { file: 'blob', page_count: 'number' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },

  // ── OPTIMIZE ──────────────────────────────────────────────────────
  {
    name: 'compress_pdf',
    category: 'optimize',
    tab: 'editor',
    icon: 'Minimize2',
    label: 'Compress PDF',
    description: 'Kurangi ukuran file PDF.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      level: { type: 'select', required: true, label: 'Level kompresi', options: [
        { value: 'low', label: 'Rendah (kualitas tinggi)' },
        { value: 'medium', label: 'Sedang' },
        { value: 'high', label: 'Tinggi (ukuran kecil)' },
      ]},
    },
    output_schema: { file: 'blob', original_size: 'number', compressed_size: 'number', reduction: 'number' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },

  // ══════════════════════════════════════════════════════════════════
  // CONVERTER PDF TOOLS — Convert TO and FROM PDF
  // ══════════════════════════════════════════════════════════════════

  // ── CONVERT TO PDF ────────────────────────────────────────────────
  {
    name: 'word_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'FileText',
    label: 'Word → PDF',
    description: 'Ubah dokumen Word (DOC/DOCX) menjadi PDF.',
    accept: '.doc,.docx',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File Word' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'excel_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'FileText',
    label: 'Excel → PDF',
    description: 'Ubah spreadsheet Excel (XLS/XLSX) menjadi PDF.',
    accept: '.xls,.xlsx',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File Excel' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'ppt_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'FileText',
    label: 'PowerPoint → PDF',
    description: 'Ubah presentasi PowerPoint (PPT/PPTX) menjadi PDF.',
    accept: '.ppt,.pptx',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PowerPoint' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'image_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'Image',
    label: 'Image → PDF',
    description: 'Ubah gambar (JPG, PNG, WEBP) menjadi PDF.',
    accept: '.jpg,.jpeg,.png,.webp',
    multiple: true,
    minFiles: 1,
    maxFiles: 50,
    input_schema: {
      files: { type: 'array', required: true, label: 'File Gambar (JPG/PNG/WEBP)' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: true,
  },
  {
    name: 'txt_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'FileText',
    label: 'Text → PDF',
    description: 'Ubah file teks (TXT) menjadi PDF.',
    accept: '.txt',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File TXT' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: true,
  },
  {
    name: 'html_to_pdf',
    category: 'convert_to',
    tab: 'converter',
    icon: 'FileText',
    label: 'HTML → PDF',
    description: 'Ubah file HTML menjadi PDF.',
    accept: '.html,.htm',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File HTML' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },

  // ── CONVERT FROM PDF ──────────────────────────────────────────────
  {
    name: 'pdf_to_word',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → Word',
    description: 'Ubah PDF menjadi dokumen Word (DOCX).',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'pdf_to_excel',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → Excel',
    description: 'Ubah PDF menjadi spreadsheet Excel (XLSX).',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'pdf_to_ppt',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → PowerPoint',
    description: 'Ubah PDF menjadi presentasi PowerPoint (PPTX).',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'pdf_to_image',
    category: 'convert_from',
    tab: 'converter',
    icon: 'Image',
    label: 'PDF → Image',
    description: 'Ubah setiap halaman PDF menjadi gambar (JPG/PNG).',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      format: { type: 'select', required: true, label: 'Format gambar', options: [
        { value: 'jpg', label: 'JPG' },
        { value: 'png', label: 'PNG' },
      ]},
      quality: { type: 'select', required: false, label: 'Kualitas', options: [
        { value: 0.5, label: 'Rendah' },
        { value: 0.8, label: 'Sedang' },
        { value: 1.0, label: 'Tinggi' },
      ]},
    },
    output_schema: { files: 'blob[]' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'pdf_to_txt',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → Text',
    description: 'Ekstrak teks dari PDF menjadi file TXT.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob', text: 'string' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: true,
  },
  {
    name: 'pdf_to_csv',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → CSV',
    description: 'Ekstrak tabel dari PDF menjadi CSV.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
  {
    name: 'pdf_to_html',
    category: 'convert_from',
    tab: 'converter',
    icon: 'FileText',
    label: 'PDF → HTML',
    description: 'Ubah PDF menjadi HTML.',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.export'],
    supports_agent: true,
    phase: 2,
    implemented: false,
  },
]

// =====================================================================
// Category Definitions
// =====================================================================

export const CATEGORIES = [
  { id: 'organize', label: 'Organize', icon: 'FolderOpen', description: 'Atur halaman PDF' },
  { id: 'optimize', label: 'Optimize', icon: 'Zap', description: 'Kurangi ukuran & perbaiki' },
  { id: 'page_mgmt', label: 'Page Management', icon: 'Layout', description: 'Nomor, watermark, crop' },
  { id: 'convert_to', label: 'Convert to PDF', icon: 'ArrowRightToLine', description: 'Ubah format ke PDF' },
  { id: 'convert_from', label: 'Convert from PDF', icon: 'ArrowLeftFromLine', description: 'Ubah PDF ke format lain' },
  { id: 'editor', label: 'Edit', icon: 'Pencil', description: 'Edit konten PDF' },
  { id: 'security', label: 'Security', icon: 'Shield', description: 'Proteksi & enkripsi' },
  { id: 'ocr', label: 'OCR & Extraction', icon: 'ScanLine', description: 'Ekstrak teks & tabel' },
]

// =====================================================================
// Registry API
// =====================================================================

/**
 * Ambil semua tool yang terdaftar.
 * @param {Object} opts
 * @param {string} [opts.category] — filter by category
 * @param {string} [opts.tab] — filter by tab (editor/converter)
 * @param {string} [opts.search] — search by name/description
 * @param {boolean} [opts.agentOnly] — hanya tool yang support agent
 * @param {number} [opts.phase] — filter by phase
 */
export function listTools(opts = {}) {
  let result = [...TOOLS]

  if (opts.category) {
    result = result.filter(t => t.category === opts.category)
  }
  if (opts.tab) {
    result = result.filter(t => t.tab === opts.tab)
  }
  if (opts.search) {
    const q = opts.search.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  }
  if (opts.agentOnly) {
    result = result.filter(t => t.supports_agent)
  }
  if (opts.phase !== undefined) {
    result = result.filter(t => t.phase <= opts.phase)
  }

  return result
}

/**
 * Ambil tool berdasarkan name.
 */
export function getTool(name) {
  return TOOLS.find(t => t.name === name) || null
}

/**
 * Ambil tools berdasarkan category.
 */
export function getToolsByCategory() {
  const map = {}
  for (const cat of CATEGORIES) {
    map[cat.id] = TOOLS.filter(t => t.category === cat.id)
  }
  return map
}

/**
 * Cari tools berdasarkan capability (untuk Agent).
 */
export function findToolsByCapability(query) {
  const q = query.toLowerCase()
  return TOOLS.filter(t =>
    t.supports_agent && (
      t.name.includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.includes(q) ||
      (t.label && t.label.toLowerCase().includes(q))
    )
  )
}

export default { listTools, getTool, getToolsByCategory, findToolsByCapability, CATEGORIES }
