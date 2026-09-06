// =====================================================================
// youtubeReportingApi.js — Klien YouTube Reporting API v1 (bulk reports)
// =====================================================================
// Model kerjanya ASINKRON dan berbeda jauh dari Analytics API:
//   1. reportTypes.list      → lihat jenis laporan yang tersedia
//   2. jobs.create           → daftarkan job untuk satu reportType
//   3. tunggu (laporan pertama muncul ±1 hari, backfill s/d 30 hari)
//   4. jobs.reports.list     → daftar laporan harian yang sudah jadi
//   5. GET report.downloadUrl → unduh file CSV
//
// Catatan arsitektur: file CSV bisa besar dan alurnya perlu penjadwalan,
// jadi untuk produksi sebaiknya dijalankan di backend/cron. Halaman di
// frontend ini dipakai untuk MENGELOLA job dan mengunduh laporan kecil
// secara manual, bukan sebagai pipeline data.
//
// Scope: yt-analytics.readonly (ikut YOUTUBE_PAGE_SCOPES → satu popup).
// Dokumentasi: koleksi dokumentasi api/google api/youtube-reporting-docs/
// =====================================================================

import { googleFetch } from './googleAuth'
import { YOUTUBE_PAGE_SCOPES } from './youtubeApi'

const BASE = 'https://youtubereporting.googleapis.com/v1'

// ---------- Jenis laporan ----------

/**
 * Daftar reportType yang bisa dipakai akun ini.
 * includeSystemManaged=true menambahkan laporan yang dikelola sistem
 * (umumnya hanya tersedia untuk content owner).
 */
export const listReportTypes = async ({ includeSystemManaged = false, pageToken = '' } = {}) => {
  const params = new URLSearchParams({
    includeSystemManaged: String(includeSystemManaged),
    pageSize: '100',
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/reportTypes?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    reportTypes: (data.reportTypes || []).map((t) => ({
      id: t.id,
      name: t.name || t.id,
      systemManaged: Boolean(t.systemManaged),
      deprecateTime: t.deprecateTime || '',
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

// ---------- Job ----------

export const listJobs = async ({ includeSystemManaged = false, pageToken = '' } = {}) => {
  const params = new URLSearchParams({
    includeSystemManaged: String(includeSystemManaged),
    pageSize: '100',
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/jobs?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    jobs: (data.jobs || []).map(mapJob),
    nextPageToken: data.nextPageToken || '',
  }
}

const mapJob = (j) => ({
  id: j.id,
  reportTypeId: j.reportTypeId || '',
  name: j.name || j.reportTypeId || j.id,
  createTime: j.createTime || '',
  expireTime: j.expireTime || '',
  systemManaged: Boolean(j.systemManaged),
})

/**
 * Buat job. `name` bebas (nama tampilan), `reportTypeId` wajib dari
 * listReportTypes(). Laporan pertama biasanya baru ada besok.
 */
export const createJob = async (reportTypeId, name = '') => {
  const data = await googleFetch(`${BASE}/jobs`, {
    method: 'POST',
    scopes: YOUTUBE_PAGE_SCOPES,
    body: { reportTypeId, ...(name ? { name } : {}) },
  })
  return mapJob(data)
}

export const getJob = async (jobId) => {
  const data = await googleFetch(`${BASE}/jobs/${jobId}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return mapJob(data)
}

/** Hapus job. Laporan yang sudah dibuat tetap bisa diunduh sampai kedaluwarsa. */
export const deleteJob = (jobId) =>
  googleFetch(`${BASE}/jobs/${jobId}`, { method: 'DELETE', scopes: YOUTUBE_PAGE_SCOPES })

// ---------- Laporan ----------

/**
 * Daftar laporan yang sudah dihasilkan sebuah job.
 * createdAfter berguna untuk sinkronisasi inkremental: simpan waktu
 * pemrosesan terakhir, lalu ambil hanya yang lebih baru.
 */
export const listReports = async (jobId, { createdAfter = '', startTimeAtOrAfter = '', pageToken = '' } = {}) => {
  const params = new URLSearchParams({ pageSize: '100' })
  if (createdAfter) params.set('createdAfter', createdAfter)
  if (startTimeAtOrAfter) params.set('startTimeAtOrAfter', startTimeAtOrAfter)
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/jobs/${jobId}/reports?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    reports: (data.reports || []).map((r) => ({
      id: r.id,
      jobId: r.jobId || jobId,
      startTime: r.startTime || '',
      endTime: r.endTime || '',
      createTime: r.createTime || '',
      downloadUrl: r.downloadUrl || '',
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

/**
 * Unduh isi laporan sebagai teks CSV.
 * downloadUrl WAJIB dipanggil dengan header Authorization — karena itu
 * memakai googleFetch, bukan membuka URL langsung di tab baru.
 */
export const downloadReportCsv = async (downloadUrl) => {
  const res = await googleFetch(downloadUrl, { scopes: YOUTUBE_PAGE_SCOPES, raw: true })
  return res.text()
}

/** Parser CSV sederhana (laporan YouTube tidak memakai koma dalam nilai). */
export const parseCsv = (text) => {
  const lines = String(text || '').trim().split(/\r?\n/)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',')
  const rows = lines.slice(1).filter(Boolean).map((line) => line.split(','))
  return { headers, rows }
}

/** Unduh + parse sekaligus, dibatasi N baris pertama untuk pratinjau. */
export const previewReport = async (downloadUrl, limit = 50) => {
  const csv = await downloadReportCsv(downloadUrl)
  const { headers, rows } = parseCsv(csv)
  return { headers, rows: rows.slice(0, limit), totalRows: rows.length, raw: csv }
}
