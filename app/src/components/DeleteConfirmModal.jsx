import { useState } from 'react'
import { useStore } from '../store/useStore'
import { X, Trash2, Lock, AlertTriangle } from 'lucide-react'
import './DeleteConfirmModal.css'

// =====================================================================
// DeleteConfirmModal — Konfirmasi penghapusan berlapis.
// =====================================================================
// Mengikuti pengaturan "Verifikasi Penghapusan" di Settings:
//   - requirePinForDelete = true  => wajib masukkan PIN akun yang sedang
//     dipakai (userPin). Cocok dengan PIN pengunci catatan pribadi.
//   - requirePinForDelete = false => wajib ketik 'DELETE' (huruf besar).
// Dipakai untuk menghapus akun, target, kanban, to-do, dsb.
// =====================================================================

export default function DeleteConfirmModal({
  title = 'Konfirmasi Hapus',
  message = '',
  confirmLabel = 'Ya, Hapus',
  itemName = '',
  onConfirm,
  onClose,
}) {
  const userPin = useStore((s) => s.userPin)
  const requirePinForDelete = useStore((s) => s.requirePinForDelete)
  const [pin, setPin] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  const canSubmit = requirePinForDelete
    ? pin.length >= 4
    : typed === 'DELETE'

  const handleSubmit = () => {
    if (!canSubmit) return
    if (requirePinForDelete) {
      if (pin !== userPin) {
        setError('PIN salah. Gunakan PIN akun yang sedang dipakai.')
        return
      }
    }
    onConfirm()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {message && <p className="delete-warning">{message}</p>}
          {itemName && (
            <p className="delete-warning">
              Yakin ingin menghapus <strong>{itemName}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
          )}

          <div className="delete-verify-box">
            <div className="delete-verify-head">
              <AlertTriangle size={15} />
              <span>Verifikasi penghapusan</span>
            </div>

            {requirePinForDelete ? (
              <div className="input-group">
                <label className="input-label">Masukkan PIN akun</label>
                <div className="input-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    className="input"
                    inputMode="numeric"
                    placeholder="PIN akun (4–6 digit)"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label">Ketik <strong>DELETE</strong> untuk melanjutkan</label>
                <input
                  type="text"
                  className="input"
                  placeholder="DELETE"
                  value={typed}
                  onChange={(e) => { setTyped(e.target.value); setError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  autoFocus
                />
              </div>
            )}

            {error && <span className="delete-verify-error">{error}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-danger" disabled={!canSubmit} onClick={handleSubmit}>
            <Trash2 size={16} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
