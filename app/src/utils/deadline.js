// =====================================================================
// deadline.js — helper menampilkan deadline target/task.
// =====================================================================
// Deadline bisa bertipe:
//   - 'deadline'  : tanggal tertentu (item.deadline)
//   - 'everyday'  : berulang setiap hari -> tampil "Setiap Hari"
//   - 'custom'    : label buatan sendiri (item.deadlineLabel)
// =====================================================================

export const deadlineText = (item) => {
  if (!item) return ''
  if (item.deadlineType === 'everyday') return 'Setiap Hari'
  if (item.deadlineType === 'custom') return item.deadlineLabel || 'Kustom'
  const d = item.deadline || item.dueDate
  return d || ''
}
