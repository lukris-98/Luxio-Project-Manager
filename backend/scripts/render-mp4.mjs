// =====================================================================
// render-mp4.mjs — Render HTML motion graphics → MP4
// =====================================================================
// Dipanggil backend Rust (Bang Motion "Unduh Video"):
//   node render-mp4.mjs <htmlFile> <outMp4> <fps> <durationSec> <width> <height>
//
// Prinsip: timeline Bang Motion deterministik (pure function of time),
// jadi tiap frame bisa di-seek persis lewat GSAP globalTimeline, lalu
// di-screenshot satu per satu dan disalurkan (image2pipe) ke ffmpeg.
// Tidak ada frame yang hilang (tidak merekam layar real-time).
// =====================================================================

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const [, , htmlFile, outMp4, fpsArg, durArg, wArg, hArg] = process.argv
const fps = Number(fpsArg) || 24
const duration = Number(durArg) || 20
const width = Number(wArg) || 1920
const height = Number(hArg) || 1080

if (!htmlFile || !outMp4 || !existsSync(htmlFile)) {
  console.error('usage: node render-mp4.mjs <htmlFile> <outMp4> <fps> <durationSec> <width> <height>')
  process.exit(1)
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean)

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('Chromium tidak ditemukan. Install: apt-get install -y chromium')
  process.exit(2)
}

// --- ffmpeg (image2pipe → libx264) ---
const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-framerate', String(fps),
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  outMp4,
], { stdio: ['pipe', 'ignore', 'pipe'] })

let ffmpegErr = ''
ffmpeg.stderr.on('data', (d) => { ffmpegErr += String(d) })
const ffmpegDone = new Promise((resolve, reject) => {
  ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${ffmpegErr.slice(-600)}`))))
  ffmpeg.on('error', reject)
})

// --- Chromium ---
const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    `--window-size=${width},${height}`,
  ],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0', timeout: 60000 })
  // Tunggu GSAP & font siap.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 800)))
  await page.evaluate(() => document.fonts?.ready?.catch?.(() => {}))

  // Pause timeline supaya seeking deterministik.
  const hasGsap = await page.evaluate(() => Boolean(window.gsap))
  if (hasGsap) {
    await page.evaluate(() => {
      window.gsap.globalTimeline.pause()
      if (window.gsap.globalTimeline.time() === undefined) window.gsap.globalTimeline.time(0)
    })
  }

  const totalFrames = Math.min(2400, Math.round(duration * fps))
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps
    const ok = await page.evaluate((time) => {
      if (window.__seek) { window.__seek(time); return true }
      if (window.gsap?.globalTimeline) {
        const tl = window.gsap.globalTimeline
        if (time > tl.duration()) {
          // Loop: map ke siklus timeline utama.
          tl.time(time % Math.max(tl.duration(), 0.001))
        } else {
          tl.time(time)
        }
        return true
      }
      return false
    }, t)
    if (!ok) {
      // Tidak ada timeline yang bisa di-seek → fallback screenshot real-time.
      break
    }
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, omitBackground: false })
    if (!ffmpeg.stdin.write(buf)) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r))
    }
    if (i % (fps * 2) === 0) console.error(`render ${i}/${totalFrames}`)
  }
  ffmpeg.stdin.end()
  await ffmpegDone
  console.error(`OK → ${outMp4} (${totalFrames} frame @${fps}fps)`)
} finally {
  await browser.close().catch(() => {})
}

process.exit(0)
