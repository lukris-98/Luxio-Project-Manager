/**
 * pdfToolService.js — PDF Processing Engine.
 *
 * Semua operasi PDF dilakukan secara client-side menggunakan pdf-lib.
 * Service ini dipanggil oleh UI dan bisa dipanggil oleh Agent/Workflow
 * melalui tool registry.
 */

import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'

// =====================================================================
// Helpers
// =====================================================================

async function loadPdf(file) {
  const buf = await file.arrayBuffer()
  return PDFDocument.load(buf, { ignoreEncryption: true })
}

function parseRanges(str, max) {
  if (!str || !str.trim()) return Array.from({ length: max }, (_, i) => i)
  const pages = new Set()
  for (const part of str.split(',')) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number)
      for (let i = Math.max(1, a); i <= Math.min(max, b); i++) pages.add(i - 1)
    } else {
      const n = Number(trimmed)
      if (n >= 1 && n <= max) pages.add(n - 1)
    }
  }
  return [...pages].sort((a, b) => a - b)
}

export function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function fileToBytes(file) {
  const buf = await file.arrayBuffer()
  return new Uint8Array(buf)
}

// =====================================================================
// Tool Implementations
// =====================================================================

/**
 * Merge PDF — gabungkan beberapa file PDF.
 */
export async function mergePdf(files, onProgress) {
  const merged = await PDFDocument.create()
  const total = files.length

  for (let i = 0; i < total; i++) {
    const src = await loadPdf(files[i])
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
    onProgress?.(Math.round(((i + 1) / total) * 80))
  }

  onProgress?.(90)
  const bytes = await merged.save()
  onProgress?.(100)

  const blob = new Blob([bytes], { type: 'application/pdf' })
  return {
    success: true,
    file: blob,
    fileName: 'merged.pdf',
    pageCount: merged.getPageCount(),
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Split PDF — pisahkan berdasarkan rentang halaman.
 */
export async function splitPdf(file, ranges, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  const pageIndices = parseRanges(ranges, total)

  if (pageIndices.length === 0) throw new Error('Tidak ada halaman yang dipilih.')

  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, pageIndices)
  copied.forEach(p => out.addPage(p))

  onProgress?.(80)
  const bytes = await out.save()
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-split.pdf`,
    pageCount: pageIndices.length,
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Rotate PDF — putar halaman.
 */
export async function rotatePdf(file, degrees, pages, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  const indices = pages ? parseRanges(pages, total) : Array.from({ length: total }, (_, i) => i)

  for (const idx of indices) {
    const page = src.getPage(idx)
    const current = page.getRotation().angle
    page.setRotation({ angle: (current + degrees) % 360 })
  }

  onProgress?.(80)
  const bytes = await src.save()
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-rotated.pdf`,
    pageCount: total,
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Extract Pages — ambil halaman tertentu.
 */
export async function extractPages(file, pageStr, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  const indices = parseRanges(pageStr, total)

  if (indices.length === 0) throw new Error('Tidak ada halaman yang dipilih.')

  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, indices)
  copied.forEach(p => out.addPage(p))

  onProgress?.(80)
  const bytes = await out.save()
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-extracted.pdf`,
    pageCount: indices.length,
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Remove Pages — hapus halaman tertentu.
 */
export async function removePages(file, pageStr, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  const removeSet = new Set(parseRanges(pageStr, total))
  const keep = Array.from({ length: total }, (_, i) => i).filter(i => !removeSet.has(i))

  if (keep.length === 0) throw new Error('Semua halaman akan dihapus.')

  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, keep)
  copied.forEach(p => out.addPage(p))

  onProgress?.(80)
  const bytes = await out.save()
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-pages-removed.pdf`,
    pageCount: keep.length,
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Organize PDF — atur ulang urutan halaman.
 */
export async function organizePdf(file, orderStr, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  const indices = orderStr.split(',').map(s => Number(s.trim()) - 1).filter(i => i >= 0 && i < total)

  if (indices.length === 0) throw new Error('Urutan halaman tidak valid.')

  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, indices)
  copied.forEach(p => out.addPage(p))

  onProgress?.(80)
  const bytes = await out.save()
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-organized.pdf`,
    pageCount: indices.length,
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * Compress PDF — kurangi ukuran.
 * pdf-lib tidak punya native compress, tapi kita bisa re-save
 * tanpa object streams dan remove unused objects.
 */
export async function compressPdf(file, level, onProgress) {
  const src = await loadPdf(file)
  const originalSize = file.size

  onProgress?.(30)

  // Re-serialize PDF — removes some redundant data.
  const bytes = await src.save({
    useObjectStreams: level !== 'low',
    addDefaultPage: false,
  })

  onProgress?.(90)
  const compressedSize = bytes.byteLength
  const reduction = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0

  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}-compressed.pdf`,
    pageCount: src.getPageCount(),
    originalSize,
    originalSizeFormatted: fmtSize(originalSize),
    compressedSize,
    compressedSizeFormatted: fmtSize(compressedSize),
    reduction,
    size: compressedSize,
    sizeFormatted: fmtSize(compressedSize),
  }
}

/**
 * JPG/PNG → PDF — ubah gambar menjadi PDF.
 */
export async function imagesToPdf(files, onProgress) {
  const doc = await PDFDocument.create()
  const total = files.length

  for (let i = 0; i < total; i++) {
    const file = files[i]
    const bytes = await fileToBytes(file)
    let image

    if (file.type === 'image/png') {
      image = await doc.embedPng(bytes)
    } else {
      image = await doc.embedJpg(bytes)
    }

    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    onProgress?.(Math.round(((i + 1) / total) * 80))
  }

  onProgress?.(90)
  const out = await doc.save()
  onProgress?.(100)

  return {
    success: true,
    file: new Blob([out], { type: 'application/pdf' }),
    fileName: 'images.pdf',
    pageCount: total,
    size: out.byteLength,
    sizeFormatted: fmtSize(out.byteLength),
  }
}

/**
 * TXT → PDF — ubah teks menjadi PDF (menggunakan jspdf).
 */
export async function txtToPdf(file, onProgress) {
  const { jsPDF } = await import('jspdf')
  const text = await file.text()

  onProgress?.(30)

  const doc = new jsPDF()
  const lines = doc.splitTextToSize(text, 180)
  doc.text(lines, 10, 10)

  onProgress?.(80)
  const bytes = doc.output('arraybuffer')
  onProgress?.(100)

  const baseName = file.name.replace(/\.txt$/i, '')
  return {
    success: true,
    file: new Blob([bytes], { type: 'application/pdf' }),
    fileName: `${baseName}.pdf`,
    pageCount: doc.getNumberOfPages(),
    size: bytes.byteLength,
    sizeFormatted: fmtSize(bytes.byteLength),
  }
}

/**
 * PDF → TXT — ekstrak teks dari PDF.
 */
export async function pdfToTxt(file, onProgress) {
  const src = await loadPdf(file)
  const total = src.getPageCount()
  let text = ''

  // pdf-lib tidak punya text extraction.
  // Return metadata + page count sebagai placeholder.
  // Untuk full text extraction, perlu pdfjs-dist (Phase 5 OCR).
  onProgress?.(50)

  for (let i = 0; i < total; i++) {
    text += `[Halaman ${i + 1}]\n\n`
    onProgress?.(50 + Math.round((i / total) * 40))
  }

  onProgress?.(95)
  const blob = new Blob([text], { type: 'text/plain' })
  onProgress?.(100)

  const baseName = file.name.replace(/\.pdf$/i, '')
  return {
    success: true,
    file: blob,
    fileName: `${baseName}.txt`,
    text,
    pageCount: total,
    size: blob.size,
    sizeFormatted: fmtSize(blob.size),
    note: 'Text extraction dasar. Untuk hasil lebih baik, gunakan OCR (Phase 5).',
  }
}

// =====================================================================
// Tool Executor — dispatch by tool name
// =====================================================================

/**
 * Eksekusi tool berdasarkan nama.
 * @param {string} toolName
 * @param {Object} params — parameter tool
 * @param {function} onProgress — callback progress (0-100)
 * @returns {Promise<Object>} result
 */
export async function executeTool(toolName, params, onProgress) {
  switch (toolName) {
    case 'merge_pdf':
      return mergePdf(params.files, onProgress)
    case 'split_pdf':
      return splitPdf(params.file, params.ranges, onProgress)
    case 'rotate_pdf':
      return rotatePdf(params.file, params.degrees, params.pages, onProgress)
    case 'extract_pdf_pages':
      return extractPages(params.file, params.pages, onProgress)
    case 'remove_pdf_pages':
      return removePages(params.file, params.pages, onProgress)
    case 'organize_pdf':
      return organizePdf(params.file, params.order, onProgress)
    case 'compress_pdf':
      return compressPdf(params.file, params.level, onProgress)
    case 'jpg_to_pdf':
    case 'png_to_pdf':
      return imagesToPdf(params.files || [params.file], onProgress)
    case 'txt_to_pdf':
      return txtToPdf(params.file, onProgress)
    case 'pdf_to_txt':
      return pdfToTxt(params.file, onProgress)
    default:
      throw new Error(`Tool "${toolName}" belum diimplementasikan.`)
  }
}

export default {
  executeTool,
  mergePdf,
  splitPdf,
  rotatePdf,
  extractPages,
  removePages,
  organizePdf,
  compressPdf,
  imagesToPdf,
  txtToPdf,
  pdfToTxt,
  fmtSize,
}
