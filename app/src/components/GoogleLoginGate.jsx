import { Check, LogIn, Loader2, AlertTriangle } from 'lucide-react'

// =====================================================================
// GoogleLoginGate — gate OAuth bersama untuk halaman layanan Google.
// =====================================================================
// Dipakai DrivePage, GCalendarPage, dan YouTubePage supaya tampilan
// "belum terhubung" konsisten dan tidak diduplikasi di tiap halaman.
//
// Props:
//   icon        komponen ikon lucide untuk logo
//   color       warna latar kotak logo (warna brand layanan)
//   title       judul, mis. "Hubungkan Google Drive"
//   desc        satu paragraf penjelasan
//   perms       array string: izin apa yang diminta dan untuk apa
//   note        catatan kecil di bawah tombol (opsional)
//   error       pesan error (opsional)
//   busy        true saat popup consent sedang berjalan
//   onLogin     handler tombol
// =====================================================================

export default function GoogleLoginGate({
  icon: Icon,
  color = 'var(--accent)',
  title,
  desc,
  perms = [],
  note = '',
  error = '',
  busy = false,
  onLogin,
}) {
  return (
    <div className="gp-gate">
      <div className="gp-gate-card">
        {Icon && (
          <div className="gp-gate-logo" style={{ background: color }}>
            <Icon size={30} />
          </div>
        )}
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}

        {perms.length > 0 && (
          <ul className="gp-gate-perms">
            {perms.map((p) => (
              <li key={p}>
                <Check size={14} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="gp-error" style={{ marginBottom: 0 }}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg gp-gate-btn"
          onClick={onLogin}
          disabled={busy}
        >
          {busy ? <Loader2 size={16} className="gp-spin" /> : <LogIn size={16} />}
          {busy ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
        </button>

        {note && <p className="gp-gate-note">{note}</p>}
      </div>
    </div>
  )
}
