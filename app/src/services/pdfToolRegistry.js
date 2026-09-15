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
  // ── ORGANIZE ──────────────────────────────────────────────────────
  {
    name: 'merge_pdf',
    category: 'organize',
    icon: 'Merge',
    label: 'Merge PDF',
    description: 'Gabungkan beberapa PDF menjadi satu dokumen.',
    accept: '.pdf',
    multiple: true,
    input_schema: {
      files: { type: 'array', required: true, label: 'File PDF' },
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
    icon: 'Split',
    label: 'Split PDF',
    description: 'Pisahkan PDF berdasarkan rentang halaman.',
    accept: '.pdf',
    multiple: false,
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
    name: 'rotate_pdf',
    category: 'organize',
    icon: 'RotateCw',
    label: 'Rotate PDF',
    description: 'Putar halaman PDF 90°, 180°, atau 270°.',
    accept: '.pdf',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      degrees: { type: 'select', required: true, label: 'Derajat', options: [
        { value: 90, label: '90°' },
        { value: 180, label: '180°' },
        { value: 270, label: '270°' },
      ]},
      pages: { type: 'string', required: false, label: 'Halaman (kosong = semua)', placeholder: '1,3,5-7' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.edit'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },
  {
    name: 'extract_pdf_pages',
    category: 'organize',
    icon: 'Scissors',
    label: 'Extract Pages',
    description: 'Ambil halaman tertentu dari PDF.',
    accept: '.pdf',
    multiple: false,
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
  {
    name: 'remove_pdf_pages',
    category: 'organize',
    icon: 'Trash2',
    label: 'Remove Pages',
    description: 'Hapus halaman tertentu dari PDF.',
    accept: '.pdf',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      pages: { type: 'string', required: true, label: 'Halaman yang dihapus', placeholder: '2,4,6-8' },
    },
    output_schema: { file: 'blob', page_count: 'number' },
    permissions: ['pdf.edit'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },
  {
    name: 'organize_pdf',
    category: 'organize',
    icon: 'ListOrdered',
    label: 'Organize PDF',
    description: 'Atur ulang urutan halaman PDF.',
    accept: '.pdf',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
      order: { type: 'string', required: true, label: 'Urutan baru (cth: 3,1,2,5,4)', placeholder: '3,1,2,5,4' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.edit'],
    supports_agent: true,
    phase: 1,
    implemented: true,
  },

  // ── OPTIMIZE ──────────────────────────────────────────────────────
  {
    name: 'compress_pdf',
    category: 'optimize',
    icon: 'Minimize2',
    label: 'Compress PDF',
    description: 'Kurangi ukuran file PDF.',
    accept: '.pdf',
    multiple: false,
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

  // ── CONVERT — TO PDF ──────────────────────────────────────────────
  {
    name: 'jpg_to_pdf',
    category: 'convert_to',
    icon: 'Image',
    label: 'JPG → PDF',
    description: 'Ubah gambar JPG menjadi PDF.',
    accept: '.jpg,.jpeg',
    multiple: true,
    input_schema: {
      files: { type: 'array', required: true, label: 'File JPG' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: true,
  },
  {
    name: 'png_to_pdf',
    category: 'convert_to',
    icon: 'Image',
    label: 'PNG → PDF',
    description: 'Ubah gambar PNG menjadi PDF.',
    accept: '.png',
    multiple: true,
    input_schema: {
      files: { type: 'array', required: true, label: 'File PNG' },
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
    icon: 'FileText',
    label: 'TXT → PDF',
    description: 'Ubah file teks menjadi PDF.',
    accept: '.txt',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File TXT' },
    },
    output_schema: { file: 'blob' },
    permissions: ['pdf.create'],
    supports_agent: true,
    phase: 2,
    implemented: true,
  },

  // ── CONVERT — FROM PDF ────────────────────────────────────────────
  {
    name: 'pdf_to_jpg',
    category: 'convert_from',
    icon: 'Image',
    label: 'PDF → JPG',
    description: 'Ubah setiap halaman PDF menjadi gambar JPG.',
    accept: '.pdf',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
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
    icon: 'FileText',
    label: 'PDF → TXT',
    description: 'Ekstrak teks dari PDF menjadi file TXT.',
    accept: '.pdf',
    multiple: false,
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
    name: 'pdf_to_png',
    category: 'convert_from',
    icon: 'Image',
    label: 'PDF → PNG',
    description: 'Ubah setiap halaman PDF menjadi gambar PNG.',
    accept: '.pdf',
    multiple: false,
    input_schema: {
      file: { type: 'file', required: true, label: 'File PDF' },
    },
    output_schema: { files: 'blob[]' },
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
 * @param {string} [opts.search] — search by name/description
 * @param {boolean} [opts.agentOnly] — hanya tool yang support agent
 * @param {number} [opts.phase] — filter by phase
 */
export function listTools(opts = {}) {
  let result = [...TOOLS]

  if (opts.category) {
    result = result.filter(t => t.category === opts.category)
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
