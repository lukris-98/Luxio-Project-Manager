import { Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import './LabelFilterBar.css'

// =====================================================================
// LabelFilterBar — Filter umum untuk halaman Target, Kanban, Todo, Catatan.
//  - Filter berdasarkan nama label
//  - Urutkan naik/turun (tanggal atau nama)
//  - Filter rentang tanggal (createdAt)
//  - Pencarian teks
// =====================================================================

const SORT_OPTIONS = [
  { value: 'created-asc', label: 'Tanggal ↑ (lama → baru)' },
  { value: 'created-desc', label: 'Tanggal ↓ (baru → lama)' },
  { value: 'name-asc', label: 'Nama ↑ (A → Z)' },
  { value: 'name-desc', label: 'Nama ↓ (Z → A)' },
]

export default function LabelFilterBar({
  labels = [],
  search = '',
  setSearch,
  sortBy = 'created-desc',
  setSortBy,
  dateFrom = '',
  setDateFrom,
  dateTo = '',
  setDateTo,
  placeholder = 'Cari...',
}) {
  const { labelFilter, setLabelFilter } = useStore()

  const hasNone = labels.includes('')
  const named = Array.from(new Set(labels.filter((l) => l && l.trim())))
  const options = [...(hasNone ? [''] : []), ...named]

  return (
    <div className="label-filter-bar">
      <div className="label-filter-group">
        <label className="label-filter-label">Label</label>
        <select
          className="input label-filter-input"
          value={labelFilter === null ? '__all__' : labelFilter}
          onChange={(e) => {
            const v = e.target.value
            setLabelFilter(v === '__all__' ? null : v)
          }}
        >
          <option value="__all__">Semua label</option>
          {options.map((l) => (
            <option key={l || '__none__'} value={l}>
              {l || 'Tanpa label'}
            </option>
          ))}
        </select>
      </div>

      <div className="label-filter-group">
        <label className="label-filter-label">Urutkan</label>
        <select
          className="input label-filter-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="label-filter-group">
        <label className="label-filter-label">Dari tanggal</label>
        <input
          type="date"
          className="input label-filter-input"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>

      <div className="label-filter-group">
        <label className="label-filter-label">Sampai tanggal</label>
        <input
          type="date"
          className="input label-filter-input"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className="label-filter-group label-filter-search">
        <Search size={15} className="label-filter-search-icon" />
        <input
          type="text"
          className="input label-filter-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  )
}
