import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import Select from '../components/Select'
import { motion } from 'framer-motion'
import { ClipboardList, Users, Loader2, X } from 'lucide-react'
import { api } from '../services/api'
import './AttendanceAdmin.css'

// =====================================================================
// AttendanceAdmin.jsx — Dashboard Absensi (khusus admin/super_admin/owner).
// =====================================================================
// - Filter per tim (dropdown dari store `teams`).
// - Tabel rekap per user per hari: checkin/checkout + foto thumbnail.
// - Baris merah bila checkin_missing, kuning bila checkout_missing.
// - Status checkin 'outside' ditandai badge oranye.
// =====================================================================

const ALLOWED_ROLES = ['admin', 'super_admin', 'owner']

const STATUS_LABEL = {
  present: 'Hadir',
  outside: 'Di luar area',
}

const fmtTime = (t) =>
  t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

export default function AttendanceAdmin() {
  const { currentUser, teams, setCurrentPage } = useStore()
  const role = currentUser?.role
  const isAllowed = ALLOWED_ROLES.includes(role)

  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState('')

  // Guard: hanya admin/super_admin/owner yang boleh melihat halaman ini.
  useEffect(() => {
    if (!isAllowed) setCurrentPage('dashboard')
  }, [isAllowed, setCurrentPage])

  const loadData = useCallback(() => {
    if (!currentUser?.company_id) return
    setLoading(true)
    setError('')
    api.getAttendanceAdmin(currentUser.company_id, selectedTeamId || null)
      .then((res) => setRecords(res.records || []))
      .catch(() => setError('Gagal memuat data absensi. Pastikan backend online.'))
      .finally(() => setLoading(false))
  }, [currentUser?.company_id, selectedTeamId])

  // Re-fetch setiap filter tim berubah.
  useEffect(() => {
    loadData()
  }, [loadData])

  if (!isAllowed) return null

  return (
    <Layout>
      <motion.div
        className="att-admin-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>Dashboard Absensi</h1>
            <p>Rekap absen masuk & pulang seluruh anggota (khusus admin)</p>
          </div>
        </motion.div>

        <div className="att-admin-filters">
          <div className="att-admin-filter">
            <label className="input-label">Filter Tim</label>
            <Select
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder="Semua Tim"
              options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
            />
          </div>
          {!loading && (
            <span className="att-admin-count">
              <Users size={14} /> {records.length} rekor
            </span>
          )}
        </div>

        {error && <div className="att-admin-error">{error}</div>}

        <div className="att-admin-card">
          {loading ? (
            <div className="att-admin-loading">
              <Loader2 size={16} className="spin" />
              <span>Memuat data absensi...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="att-admin-empty">Belum ada data absensi untuk filter ini.</div>
          ) : (
            <div className="att-admin-table-wrap">
              <table className="att-admin-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Tanggal</th>
                    <th>Checkin</th>
                    <th>Checkout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={`${r.user_id}-${r.date}`}
                      className={`att-row ${r.checkin_missing ? 'row-checkin-missing' : ''} ${r.checkout_missing ? 'row-checkout-missing' : ''}`}
                    >
                      <td className="att-user">{r.user_name || '-'}</td>
                      <td className="nowrap">{r.date || '-'}</td>
                      <td>
                        {r.checkin_missing ? (
                          <span className="att-missing">BELUM CHECKIN</span>
                        ) : (
                          <AttendanceCell data={r.checkin} onZoom={setZoom} />
                        )}
                      </td>
                      <td>
                        {r.checkout_missing ? (
                          <span className="att-missing missing-checkout">BELUM CHECKOUT</span>
                        ) : (
                          <AttendanceCell data={r.checkout} onZoom={setZoom} />
                        )}
                      </td>
                      <td>
                        <span className={`att-status ${r.status}`}>
                          {STATUS_LABEL[r.status] || r.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lightbox foto bukti absen */}
        {zoom && (
          <div className="att-zoom-overlay" onClick={() => setZoom('')}>
            <img className="att-zoom-img" src={zoom} alt="Bukti absen" />
            <button className="att-zoom-close" onClick={() => setZoom('')} aria-label="Tutup">
              <X size={20} />
            </button>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}

/* ---------------- Sel checkin/checkout (waktu + thumbnail) ---------------- */

function AttendanceCell({ data, onZoom }) {
  if (!data) return <span className="att-empty">-</span>
  return (
    <div className="att-cell">
      {data.photo_url && (
        <img
          className="att-thumb"
          src={data.photo_url}
          alt="Bukti absen"
          onClick={() => onZoom(data.photo_url)}
        />
      )}
      <div className="att-cell-info">
        <span className="att-time">{fmtTime(data.created_at || data.time)}</span>
        {data.status === 'outside' && <span className="att-outside">Di luar area</span>}
      </div>
    </div>
  )
}
