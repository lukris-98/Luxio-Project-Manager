import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import AnimatedDropdown from './AnimatedDropdown'
import './ContributorStack.css'

// =====================================================================
// ContributorStack.jsx — Stack avatar kontributor yang saling menumpuk
// (lingkaran pertama penuh, berikutnya setengah terhalang). Klik membuka
// popover ke ATAS-KIRI berisi: foto, nama, jabatan, % kontribusi,
// tombol keluarkan (X) per anggota, dan tombol "Tambah Anggota".
// =====================================================================
export default function ContributorStack({
  contributors = [],
  contributionOf = () => 0,
  onRemove,
  onAdd,
  label = 'Contributors',
  max = 4,
}) {
  const [open, setOpen] = useState(false)

  const initials = (name = 'U') =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const avatar = (m, lead) => (
    <span key={m.id} className={`contrib-avatar ${lead ? 'lead' : ''}`}>
      {m.avatar_url ? (
        <img src={m.avatar_url} alt={m.name} />
      ) : (
        <span>{initials(m.name)}</span>
      )}
    </span>
  )

  return (
    <div className="contrib-cell" onClick={(e) => e.stopPropagation()}>
      <button
        className="contrib-stack"
        onClick={() => setOpen((v) => !v)}
        title={`${contributors.length} contributor`}
      >
        {contributors.slice(0, max).map((m, i) => avatar(m, i === 0))}
        {contributors.length > max && (
          <span className="contrib-avatar more">+{contributors.length - max}</span>
        )}
        {contributors.length === 0 && (
          <span className="contrib-avatar more"><UserPlus size={12} /></span>
        )}
      </button>

      {open && <div className="contrib-backdrop" onClick={() => setOpen(false)} />}
      <AnimatedDropdown show={open}>
        <div className="contrib-popover">
          <div className="contrib-pop-head">
            <span>{label}</span>
            <span className="contrib-pop-count">{contributors.length}</span>
          </div>
          <div className="contrib-pop-list">
            {contributors.length === 0 && (
              <p className="contrib-pop-empty">Belum ada contributor.</p>
            )}
            {contributors.map((m, i) => (
              <div key={m.id} className="contrib-pop-item">
                {avatar(m, i === 0)}
                <div className="contrib-pop-info">
                  <span className="contrib-pop-name">
                    {m.name}
                    {i === 0 && <span className="contrib-pop-lead-badge">Ketua</span>}
                  </span>
                  <span className="contrib-pop-pos">{m.position || m.role || 'Anggota'}</span>
                  <div className="contrib-pop-pct-track">
                    <div
                      className="contrib-pop-pct-fill"
                      style={{ width: `${contributionOf(m.id)}%` }}
                    />
                  </div>
                  <span className="contrib-pop-pct">{contributionOf(m.id)}% kontribusi</span>
                </div>
                {onRemove && (
                  <div className="contrib-pop-actions">
                    <button
                      className="contrib-pop-remove"
                      onClick={() => onRemove(m.id)}
                      title="Keluarkan dari project ini"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {onAdd && (
            <button className="contrib-pop-add" onClick={onAdd}>
              <UserPlus size={14} /> Tambah Anggota
            </button>
          )}
        </div>
      </AnimatedDropdown>
    </div>
  )
}
