// =====================================================================
// crypto.js — Enkripsi AES-GCM (Web Crypto API) untuk data pribadi
// sebelum dikirim ke backend / disimpan sebagai backup.
// =====================================================================
// Data dienkripsi dengan kunci turunan dari password yang dimasukkan
// user (PBKDF2). Password tidak pernah dikirim ke server.
// =====================================================================

const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 16
const IV_LENGTH = 12

function textEncoder() { return new TextEncoder() }
function textDecoder() { return new TextDecoder() }

// Turunkan AES-GCM key dari password + salt.
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', textEncoder().encode(password),
    'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Enkripsi data JSON menjadi string base64 terenkripsi.
// Format: base64(salt || iv || ciphertext)
export async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)
  const plaintext = textEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, SALT_LENGTH)
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)
  return btoa(String.fromCharCode(...combined))
}

// Dekripsi string base64 terenkripsi. Mengembalikan data asli.
export async function decryptData(encoded, password) {
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const salt = raw.slice(0, SALT_LENGTH)
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH)
  const key = await deriveKey(password, salt)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(textDecoder().decode(plaintext))
}

// Ekspor data sebagai file JSON yang bisa diunduh.
export function downloadJson(data, filename = 'luxio-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Baca file JSON yang diupload user.
export function readUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)) } catch (e) { reject(new Error('File JSON tidak valid')) }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsText(file)
  })
}