// =====================================================================
// bangMotionApi.js — Generator motion graphics ala Bang Motion
// (https://github.com/bangtutorial/bang-motion) untuk Luxio.
// =====================================================================
// Konsep: skill Bang Motion mengajarkan agent membuat motion graphics
// "bukan slide" — satu file index.html autoplay+loop, kamera bergerak,
// subjek persisten, anti-pola PPT. Di Luxio, prinsip inti skill itu
// dienkapsulasi sebagai SYSTEM PROMPT (di bawah), lalu:
//   1. User menulis prompt (mis. "opener 30 detik untuk aplikasi catatan").
//   2. Model AI milik user (provider terdaftar di Pengaturan → AI Provider)
//      menghasilkan satu file HTML lengkap.
//   3. HTML disimpan otomatis ke Backblaze B2 (bucket luxio-motion) lewat
//      proxy backend, dan dirender ulang via iframe (srcdoc / blob URL).
//   4. Galeri hasil di halaman menyimpan metadata (nama, prompt, ukuran,
//      tanggal, fileId) agar bisa dipratinjau & dipakai ulang sebagai
//      template (prompt baru → hasil berbeda tiap generasi).
// =====================================================================

import { callAIChat } from '../utils/aiConfig'
import { listBuckets, createBucket, uploadFile } from './b2Api'

export const MOTION_BUCKET = 'luxio-motion'

// ---------------------------------------------------------------------
// SYSTEM PROMPT — distilasi aturan inti Bang Motion (SKILL.md):
// satu dunia kontinu, kamera bergerak, anti-slide, deterministic timeline,
// gaya lahir dari tema, autoplay+loop, single-file HTML.
// ---------------------------------------------------------------------
export const BANG_MOTION_SYSTEM_PROMPT = `You are Bang Motion, an expert motion-graphics engineer. You output ONE complete, self-contained HTML file (motion graphics video that plays in the browser). Hard rules:

OUTPUT FORMAT
- Output ONLY the HTML code, no explanations, no markdown fences.
- Single file: inline CSS + JS. External CDN allowed ONLY for GSAP (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js) and Google Fonts.
- Fixed 16:9 stage that scales to fit the window (aspect-ratio preserved), autoplay on load, loops forever, no player chrome, no captions.
- Deterministic timeline: every frame is a pure function of time. Use a single master GSAP timeline (repeat: -1) or a rAF loop driven by elapsed time.

ANTI-POWERPOINT RULES (violations = failure)
- Scenes change because the WORLD or CAMERA moves — never a fading <section>.
- One continuous world: a subject/visual through-line persists across scenes.
- Camera choreography: close-up → glide → zoom out → hold. Text appears AFTER camera settles.
- Motion every second; at least two transition types, at least one in real depth (scale/parallax/z). No flat block wipes.
- Background is layered (2–3 depth planes), never flat.
- At most two text levels per scene. Sentence case, medium weight. One highlighted keyword per line.
- Numbers live inside the scene (on objects, signage), not floating on top.
- No text below 30px on a 1080-wide stage.
- Viewpoint changes: never three consecutive scenes from the same angle.

STYLE (born from the theme, never generic)
- Derive a palette from the subject's brand/theme; pick a characterful display font from Google Fonts; choose a background surface, a background motion language (parallax strips, drifting shapes, flow field, orbiting bodies — NOT streaks sliding sideways), and a motion signature.
- Pick a "highlight shape" for keywords (underline swipe, circle scribble, block mark, bracket snap, dot trail, ribbon) and use it consistently.
- Include one special moment (signature beat) roughly at 60–75% of the duration.
- Two consecutive projects for the same prompt must look DIFFERENT: vary palette direction, font pairing, transition set, and background motion each time.

DURATION: honor the requested duration (default 20s). Scene rundown first inside a JS comment.
Respond with the HTML file only.`

/** Bangun prompt user final dari form halaman. */
export const buildMotionUserPrompt = ({ prompt, style, duration, ratio, extras }) => {
  const lines = [
    `Create a motion graphics piece about: ${prompt}`,
    `- Duration: ${duration} seconds`,
    `- Aspect ratio: ${ratio === '9:16' ? '9:16 vertical (portrait stage)' : ratio === '1:1' ? '1:1 square stage' : '16:9 widescreen'}`,
    style && style !== 'auto' ? `- Visual style: ${style}` : '- Visual style: derive the most fitting style from the theme; make it bold and unique.',
    extras ? `- Extra direction: ${extras}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

/** Ekstrak HTML murni dari jawaban model (buang fence / penjelasan). */
export const extractHtml = (raw) => {
  let text = String(raw || '').trim()
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.search(/<!DOCTYPE html|<html/i)
  if (start > 0) text = text.slice(start)
  const end = text.toLowerCase().lastIndexOf('</html>')
  if (end !== -1) text = text.slice(0, end + 7)
  return text.trim()
}

// ---------------------------------------------------------------------
// Penyimpanan hasil ke Backblaze B2 (via proxy backend → api.backblazeb2.com)
// ---------------------------------------------------------------------

/** Pastikan bucket luxio-motion ada (buat bila belum). */
export const ensureMotionBucket = async () => {
  const buckets = await listBuckets()
  const found = buckets.find((b) => b.bucketName === MOTION_BUCKET)
  if (found) return found
  return createBucket(MOTION_BUCKET, true)
}

/**
 * Simpan satu hasil ke B2: upload HTML + kembalikan metadata lengkap
 * (fileName, fileId, size, uploadTimestamp).
 */
export const saveMotionToB2 = async (html, meta) => {
  const bucket = await ensureMotionBucket()
  const slug = (meta.title || 'motion').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'motion'
  const fileName = `bang-motion/${Date.now()}-${slug}.html`
  const bytes = new TextEncoder().encode(html)
  const uploaded = await uploadFile(bucket.bucketId, new File([bytes], fileName.split('/').pop(), { type: 'text/html' }))
  return {
    id: uploaded?.fileId || `${Date.now()}`,
    fileName,
    fileId: uploaded?.fileId || '',
    size: bytes.length,
    uploadTimestamp: uploaded?.uploadTimestamp || Date.now(),
    ...meta,
  }
}

// Galeri hasil di localStorage (metadata saja; HTML asli ada di B2).
const GALLERY_KEY = 'luxio_bang_motion_gallery'

export const loadGallery = () => {
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]') } catch { return [] }
}

export const saveToGallery = (item) => {
  const list = loadGallery()
  // Metadata saja — html asli ada di B2 (hemat localStorage; diambil
  // kembali lewat proxy saat dipakai sebagai template).
  const { html, ...meta } = item
  list.unshift(meta)
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list.slice(0, 60))) } catch { /* penuh */ }
  return list
}

/**
 * Ambil HTML sebuah item galeri dari B2 (via downloadUrl, bucket private
 * → lewat proxy). Return string HTML.
 */
export const fetchMotionHtml = async (item) => {
  if (item.html) return item.html
  if (!item.fileName) throw new Error('Item tidak punya file di B2.')
  const { b2EnsureAppSession, downloadFileViaProxy } = await import('./b2Api')
  await b2EnsureAppSession()
  const blob = await downloadFileViaProxy(MOTION_BUCKET, item.fileName)
  return blob.text()
}

export const removeFromGallery = (id) => {
  const list = loadGallery().filter((x) => x.id !== id)
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list)) } catch { /* abaikan */ }
  return list
}
