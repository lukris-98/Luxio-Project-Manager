import { useState, useEffect } from 'react'
import Select from './Select'
import { CalendarClock, Repeat, PenLine } from 'lucide-react'
import './DeadlinePicker.css'

const TYPES = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'everyday', label: 'Setiap Hari' },
  { value: 'custom', label: 'Kustom' },
]

// Pilih tipe deadline: Deadline (tanggal tertentu), Setiap Hari, atau Kustom
// (label buatan sendiri). Keluaran: { deadlineType, deadline, deadlineLabel }.
export default function DeadlinePicker({ value = {}, onChange }) {
  const [type, setType] = useState(value.deadlineType || 'deadline')
  const [date, setDate] = useState(value.deadline || '')
  const [label, setLabel] = useState(value.deadlineLabel || '')

  useEffect(() => {
    setType(value.deadlineType || 'deadline')
    setDate(value.deadline || '')
    setLabel(value.deadlineLabel || '')
  }, [value.deadlineType, value.deadline, value.deadlineLabel])

  const emit = (t, d, l) =>
    onChange({ deadlineType: t, deadline: d, deadlineLabel: l })

  return (
    <div className="deadline-picker">
      <div className="deadline-picker-row">
        <Select
          allowReset={false}
          value={type}
          onChange={(v) => { setType(v); emit(v, date, label) }}
          options={TYPES}
        />
        {type === 'deadline' && (
          <div className="input-with-icon deadline-date-wrap">
            <CalendarClock size={16} />
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => { setDate(e.target.value); emit(type, e.target.value, label) }}
            />
          </div>
        )}
      </div>

      {type === 'everyday' && (
        <p className="field-hint deadline-hint">
          <Repeat size={12} /> Berulang setiap hari — tanpa tanggal tertentu.
        </p>
      )}

      {type === 'custom' && (
        <div className="input-with-icon deadline-custom-wrap">
          <PenLine size={16} />
          <input
            type="text"
            className="input"
            placeholder="cth: H+7 setelah rilis, Akhir bulan"
            value={label}
            onChange={(e) => { setLabel(e.target.value); emit(type, date, e.target.value) }}
          />
        </div>
      )}
    </div>
  )
}
