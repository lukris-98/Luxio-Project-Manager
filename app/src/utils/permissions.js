// =====================================================================
// permissions.js — Level kewenangan anggota per tim (Item 6).
// =====================================================================
// Level: owner > super_admin > admin > manager > member > viewer.
// Tiap level punya hak akses berbeda terhadap target, task, laporan,
// dan pengelolaan anggota.
// =====================================================================

export const AUTHORITY_LEVELS = [
  { value: 'owner', label: 'Owner', rank: 6 },
  { value: 'super_admin', label: 'Super Admin', rank: 5 },
  { value: 'admin', label: 'Admin', rank: 4 },
  { value: 'manager', label: 'Manager', rank: 3 },
  { value: 'member', label: 'Member', rank: 2 },
  { value: 'viewer', label: 'Viewer', rank: 1 },
]

// Ranking level. Level tidak dikenal dianggap 'viewer' (paling rendah).
const rankOf = (authority) =>
  AUTHORITY_LEVELS.find((l) => l.value === authority)?.rank || 1

// Ambang level untuk tiap permission.
const PERMISSION_THRESHOLD = {
  create_target: 3, // manager ke atas
  edit_task: 2, // member ke atas
  view_reports: 3, // manager ke atas
  manage_members: 4, // admin ke atas
  manage_division: 5, // super_admin ke atas
  manage_team: 4, // admin ke atas
  assign_task: 3, // manager ke atas
}

export const getAuthorityLabel = (authority) =>
  AUTHORITY_LEVELS.find((l) => l.value === authority)?.label || authority || 'member'

/**
 * Cek apakah `authority` (level kewenangan) boleh melakukan `permission`.
 * @param {string} authority - level kewenangan anggota.
 * @param {string} permission - nama permission (lihat PERMISSION_THRESHOLD).
 * @returns {boolean}
 */
export function can(authority, permission) {
  const threshold = PERMISSION_THRESHOLD[permission]
  if (threshold == null) return false
  return rankOf(authority) >= threshold
}
