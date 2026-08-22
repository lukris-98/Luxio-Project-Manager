import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import Select from '../components/Select'
import { motion } from 'framer-motion'
import { ClipboardList, Users, Loader2, X, Eye, Plus, DollarSign, Printer } from 'lucide-react'
import { api } from '../services/api'
import { jsPDF } from 'jspdf'
import './AttendanceAdmin.css'

// =====================================================================
// AttendanceAdmin.jsx — Dashboard Absensi & Gaji (khusus admin).
// =====================================================================
// Tab "Kehadiran": rekap checkin/checkout per user per hari.
// Tab "Gaji": kalkulasi gaji bulanan + insentif + cetak PDF.
// =====================================================================

const ALLOWED_ROLES = ['admin', 'super_admin', 'owner']

const STATUS_LABEL = {
  present: 'Hadir',
  outside: 'Di luar area',
}

const fmtTime = (t) =>
  t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

const fmtRp = (n) => {
  const num = Number(n || 0)
  return 'Rp ' + num.toLocaleString('id-ID')
}

export default function AttendanceAdmin() {
  const { currentUser, teams, setCurrentPage } = useStore()
  const role = currentUser?.role
  const isAllowed = ALLOWED_ROLES.includes(role)

  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState('')

  // Tab
  const [tab, setTab] = useState('kehadiran')
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [salaries, setSalaries] = useState([])
  const [salLoading, setSalLoading] = useState(false)
  const [salError, setSalError] = useState('')
  const [preview, setPreview] = useState(null)
  const [incentiveFor, setIncentiveFor] = useState(null)
  const [incAmount, setIncAmount] = useState('')
  const [incReason, setIncReason] = useState('')
  const [incSaving, setIncSaving] = useState(false)

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

  const loadSalary = useCallback(() => {
    if (!currentUser?.company_id) return
    if (!month) return
    setSalLoading(true)
    setSalError('')
    api.salaryMonthly(currentUser.company_id, month, selectedTeamId || null)
      .then((res) => setSalaries(res.records || []))
      .catch(() => setSalError('Gagal memuat data gaji. Pastikan backend online.'))
      .finally(() => setSalLoading(false))
  }, [currentUser?.company_id, month, selectedTeamId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (tab === 'gaji') loadSalary()
  }, [tab, loadSalary])

  const cetakPDF = (row) => {
    const doc = new jsPDF()
    const companyName = currentUser?.company || 'LUXIO'
    doc.setFontSize(16)
    doc.text(`${companyName} — Rincian Gaji`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Bulan: ${month}`, 14, 28)
    doc.text(`Karyawan: ${row.name}`, 14, 34)
    doc.text(`Posisi: ${row.position || '-'}`, 14, 40)
    doc.line(14, 46, 196, 46)
    doc.setFontSize(11)
    doc.text(`Gaji Pokok: ${fmtRp(row.base_salary)}`, 14, 54)
    doc.text(`Hari Hadir: ${row.present_days || 0}`, 14, 62)
    doc.text(`Total Checkin: ${row.total_checkins || 0}`, 14, 70)
    const incentives = row.incentives || []
    let y = 80
    if (incentives.length > 0) {
      doc.text('Insentif:', 14, y)
      y += 7
      incentives.forEach((inc) => {
        doc.text(`- ${inc.reason || 'Insentif'}: ${fmtRp(inc.amount)}`, 20, y)
        y += 7
      })
      y += 2
      doc.text(`Total Insentif: ${fmtRp(row.total_incentive)}`, 14, y)
      y += 8
    } else {
      doc.text('Insentif: -', 14, y)
      y += 7
      doc.text('Total Insentif: Rp 0', 14, y)
      y += 8
    }
    doc.setFontSize(13)
    doc.text(`Total Gaji: ${fmtRp(row.total_salary)}`, 14, y)
    doc.setFontSize(9)
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 290)
    doc.save(`gaji-${row.name}-${month}.pdf`)
  }

  const submitIncentive = async () => {
    const amount = Number(incAmount)
    if (!incentiveFor || !amount || amount <= 0 || !incReason.trim()) {
      setSalError('Jumlah dan alasan insentif wajib diisi.')
      return
    }
    setIncSaving(true)
    try {
      await api.salaryAddIncentive({
        user_id: incentiveFor.user_id,
        month,
        amount,
        reason: incReason.trim(),
      })
      setIncentiveFor(null)
      setIncAmount('')
      setIncReason('')
      loadSalary()
    } catch (e) {
      setSalError('Gagal menambah insentif. Pastikan backend online.')
    } finally {
      setIncSaving(false)
    }
  }

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
            <p>Rekap absen masuk & pulang serta kalkulasi gaji (khusus admin)</p>
          </div>
        </motion.div>

        <div className="att-admin-tabs">
          <button
            className={`att-admin-tab ${tab === 'kehadiran' ? 'active' : ''}`}
            onClick={() => setTab('kehadiran')}
          >
            <ClipboardList size={15} /> Kehadiran
          </button>
          <button
            className={`att-admin-tab ${tab === 'gaji' ? 'active' : ''}`}
            onClick={() => setTab('gaji')}
          >
            <DollarSign size={15} /> Gaji
          </button>
        </div>

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
          {tab === 'gaji' && (
            <div className="att-admin-filter">
              <label className="input-label">Bulan</label>
              <input
                type="month"
                className="input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          )}
          {tab === 'kehadiran' && !loading && (
            <span className="att-admin-count">
              <Users size={14} /> {records.length} rekor
            </span>
          )}
        </div>

        {tab === 'kehadiran' && (
          <>
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
          </>
        )}

        {tab === 'gaji' && (
          <>
            {salError && <div className="att-admin-error">{salError}</div>}
            <div className="att-admin-card">
              {salLoading ? (
                <div className="att-admin-loading">
                  <Loader2 size={16} className="spin" />
                  <span>Memuat data gaji...</span>
                </div>
              ) : salaries.length === 0 ? (
                <div className="att-admin-empty">Belum ada data gaji untuk filter ini.</div>
              ) : (
                <div className="att-admin-table-wrap">
                  <table className="att-admin-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Posisi</th>
                        <th>Gaji Pokok</th>
                        <th>Hari Hadir</th>
                        <th>Total Checkin</th>
                        <th>Insentif</th>
                        <th>Total Gaji</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((r) => (
                        <tr key={r.member_id || r.user_id}>
                          <td className="att-user">{r.name || '-'}</td>
                          <td>{r.position || '-'}</td>
                          <td className="nowrap">{fmtRp(r.base_salary)}</td>
                          <td>{r.present_days ?? 0}</td>
                          <td>{r.total_checkins ?? 0}</td>
                          <td className="nowrap">{fmtRp(r.total_incentive)}</td>
                          <td className="nowrap sal-total">{fmtRp(r.total_salary)}</td>
                          <td>
                            <div className="sal-actions">
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Preview Gaji"
                                onClick={() => setPreview(r)}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Tambah Insentif"
                                disabled={!r.user_id}
                                onClick={() => {
                                  setIncentiveFor(r)
                                  setIncAmount('')
                                  setIncReason('')
                                }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Lightbox foto */}
        {zoom && (
          <div className="att-zoom-overlay" onClick={() => setZoom('')}>
            <img className="att-zoom-img" src={zoom} alt="Bukti absen" />
            <button className="att-zoom-close" onClick={() => setZoom('')} aria-label="Tutup">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Modal Preview Gaji */}
        {preview && (
          <div className="sal-modal-overlay" onClick={() => setPreview(null)}>
            <div className="sal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sal-modal-head">
                <h3>Rincian Gaji</h3>
                <button className="btn-icon" onClick={() => setPreview(null)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>
              <div className="sal-modal-body">
                <div className="sal-info-row">
                  <span className="sal-info-label">Nama</span>
                  <span className="sal-info-value">{preview.name}</span>
                </div>
                <div className="sal-info-row">
                  <span className="sal-info-label">Posisi</span>
                  <span className="sal-info-value">{preview.position || '-'}</span>
                </div>
                <div className="sal-info-row">
                  <span className="sal-info-label">Bulan</span>
                  <span className="sal-info-value">{month}</span>
                </div>
                <div className="sal-info-row">
                  <span className="sal-info-label">Gaji Pokok</span>
                  <span className="sal-info-value">{fmtRp(preview.base_salary)}</span>
                </div>
                <div className="sal-info-row">
                  <span className="sal-info-label">Hari Hadir</span>
                  <span className="sal-info-value">{preview.present_days ?? 0}</span>
                </div>
                <div className="sal-info-row">
                  <span className="sal-info-label">Total Checkin</span>
                  <span className="sal-info-value">{preview.total_checkins ?? 0}</span>
                </div>

                <div className="sal-divider" />

                <div className="sal-info-row">
                  <span className="sal-info-label">Insentif</span>
                  <span className="sal-info-value">{fmtRp(preview.total_incentive)}</span>
                </div>
                {(preview.incentives || []).length > 0 && (
                  <div className="sal-incentive-list">
                    {(preview.incentives || []).map((inc) => (
                      <div key={inc.id} className="sal-incentive-item">
                        <span className="sal-inc-reason">{inc.reason || 'Insentif'}</span>
                        <span className="sal-inc-amount">{fmtRp(inc.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="sal-divider" />

                <div className="sal-info-row sal-total-row">
                  <span className="sal-info-label">Total Gaji</span>
                  <span className="sal-info-value sal-total">{fmtRp(preview.total_salary)}</span>
                </div>
              </div>
              <div className="sal-modal-actions">
                <button className="btn btn-primary btn-sm" onClick={() => { cetakPDF(preview); setPreview(null) }}>
                  <Printer size={14} /> Cetak PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreview(null)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal / Inline Tambah Insentif */}
        {incentiveFor && (
          <div className="sal-modal-overlay" onClick={() => setIncentiveFor(null)}>
            <div className="sal-modal sal-modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="sal-modal-head">
                <h3>Tambah Insentif</h3>
                <button className="btn-icon" onClick={() => setIncentiveFor(null)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>
              <div className="sal-modal-body">
                <p className="sal-inc-for">
                  {incentiveFor.name} — {month}
                </p>
                <div className="input-group">
                  <label className="input-label">Jumlah (Rp)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="500000"
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Alasan</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="mis. Bonus lembur"
                    value={incReason}
                    onChange={(e) => setIncReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="sal-modal-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={submitIncentive}
                  disabled={incSaving}
                >
                  {incSaving ? 'Menyimpan...' : 'Simpan Insentif'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIncentiveFor(null)}>
                  Batal
                </button>
              </div>
            </div>
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