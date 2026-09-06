import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api'
import { useStore } from '../store/useStore'
import {
  loadAiConfig, saveAiConfig, DEFAULT_AI_CONFIG, normalizeBaseUrl, fetchModelsDirect, modelKeyFor, callAIChat,
} from '../utils/aiConfig'
import {
  Bot, Send, Search, Loader, Check, Trash2, Settings, RefreshCw, Cpu, Network, MessageSquare, Sparkles, ListTodo, Play, X, Copy, Square, CheckSquare, ClipboardList, KanbanSquare, StickyNote, Lock, ChevronRight, FileText, Image as ImageIcon, MoreVertical, FastForward,
} from 'lucide-react'
import './AgentChat.css'

const TABS = [
  { id: 'chat', label: 'Agent', icon: MessageSquare },
  { id: 'orchestrator', label: 'Orchestrator', icon: Network },
]

// Halaman yang bisa di-CRUD lewat slash command "/".
// wizard: true → masuk alur tanya-jawab terpandu bersama agent.
// navigate: halaman tujuan langsung (tanpa wizard).
const SLASH_PAGES = [
  { id: 'project', label: 'Project', desc: 'Wizard project (nama → jenis → isi)', icon: ClipboardList, wizard: true, template: '' },
  { id: 'kanban', label: 'Kanban', desc: 'Wizard board kanban (project → kolom → item)', icon: KanbanSquare, wizard: true, template: '' },
  { id: 'todo-list', label: 'Todolist', desc: 'Wizard todolist (project → list → task)', icon: ListTodo, wizard: true, template: '' },
  { id: 'private-note', label: 'Catatan', desc: 'Wizard catatan pribadi (judul → isi → label)', icon: StickyNote, wizard: true, template: '' },
  { id: 'vault', label: 'Brankas', desc: 'Buka langsung halaman brankas', icon: Lock, navigate: 'vault', template: '' },
]

// Pemetaan kind wizard → mode JSON final dari agent.
const WIZARD_KIND_MODE = {
  project: 'project_setup',
  kanban: 'kanban_setup',
  'todo-list': 'todo_setup',
  'private-note': 'note_setup',
}

// System prompt 3 mode: ask (jawab teks markdown biasa) / plan (todolist JSON)
// / action (CRUD aplikasi JSON). Ask TIDAK dibungkus JSON agar respons
// model tetap alami & rapi — plan/action saja yang memakai JSON envelope.
const PLAN_SYSTEM_PROMPT = `Kamu adalah asisten AI aplikasi Luxio (Project Manager). Pilih salah satu dari 4 perilaku di bawah, lalu ikuti FORMATNYA dengan disiplin.

=== 0) MODE WIZARD — HANYA bila user memulai dengan perintah slash: "/project", "/kanban", "/todo-list", "/private-note" ===
Kamu menjalankan wizard tanya-jawab terpandu sesuai perintah yang user ketik (lihat pesan user pertama transkrip). SATU tahap per pesan; selalu tunggu jawaban user sebelum lanjut.

--- Alur /project ---
Tahap 1: Tanya NAMA project.  → Tunggu.
Tahap 2: Tanya DESKRIPSI (tegaskan boleh dikosongkan / skip).  → Tunggu.
Tahap 3: Tanyakan JENIS MANAJEMEN — (a) Kanban saja, (b) Todolist saja, (c) Keduanya.  → Tunggu.
Tahap 3a (khusus Kanban): JENIS kanban — statis (alur terkunci, item tidak bisa dipindah antar tahap) atau dinamis (drag & drop bebas).  → Tunggu.
Tahap 3b (khusus Kanban): JUMLAH & NAMA tahap/kolom (usulkan dari konteks).  → Tunggu.
Tahap 3c (khusus Kanban): Usulkan ITEM tiap tahap berdasarkan konteks pembahasan, minta konfirmasi.  → Tunggu.
Tahap 3d (khusus Todolist): Usulkan daftar task (judul + detail singkat + priority), minta konfirmasi.  → Tunggu.
FORMAT hasil final /project (HANYA JSON valid):
{"mode":"project_setup","summary":"ringkasan singkat","setup":{"name":"nama project","description":"deskripsi atau kosong","includeKanban":true,"includeTodo":false,"kanban":{"boardName":"nama board","boardType":"static"|"dynamic","columns":[{"name":"Nama Tahap","items":["item 1","item 2"]}]},"todos":[{"title":"judul task","description":"detail singkat","priority":"low|medium|high"}]}}
- "columns" HANYA bila includeKanban true; "todos" HANYA bila includeTodo true (boleh keduanya).
- "boardType": "static" bila user memilih statis, "dynamic" bila dinamis.

--- Alur /kanban ---
Tahap 1: Tanya PROJECT TUJUAN — tampilkan daftar project dari KONTEKS WORKSPACE (beri nomor 1,2,...) + opsi "buat project baru".  → Tunggu.
Tahap 1b (bila memilih buat baru): tanya NAMA + DESKRIPSI project barunya.  → Tunggu.
Tahap 2: Tanya NAMA BOARD.  → Tunggu.
Tahap 3: JENIS kanban — statis / dinamis.  → Tunggu.
Tahap 4: JUMLAH & NAMA kolom/tahap (usulkan dari konteks).  → Tunggu.
Tahap 5: Usulkan ITEM tiap kolom, minta konfirmasi.  → Tunggu.
FORMAT hasil final /kanban (HANYA JSON valid):
{"mode":"kanban_setup","summary":"ringkasan singkat","setup":{"projectRef":"nama project tujuan","boardName":"nama board","boardType":"static"|"dynamic","columns":[{"name":"Nama Kolom","items":["item 1","item 2"]}]}}

--- Alur /todo-list ---
Tahap 1: Tanya PROJECT TUJUAN (daftar dari KONTEKS WORKSPACE + opsi buat baru).  → Tunggu.
Tahap 1b (bila memilih buat baru): tanya NAMA + DESKRIPSI.  → Tunggu.
Tahap 2: Tanya NAMA LIST/kelompok task (tegaskan boleh skip → tanpa kelompok).  → Tunggu.
Tahap 3: Usulkan daftar task, minta konfirmasi/penyesuaian.  → Tunggu.
FORMAT hasil final /todo-list (HANYA JSON valid):
{"mode":"todo_setup","summary":"ringkasan singkat","setup":{"projectRef":"nama project tujuan","listName":"nama list atau kosong","todos":[{"title":"judul task","description":"detail singkat","priority":"low|medium|high"}]}}

--- Alur /private-note ---
Tahap 1: Tanya JUDUL catatan.  → Tunggu.
Tahap 2: Tanyakan ISI catatan — tawarkan menuliskan draf dari konteks pembicaraan.  → Tunggu.
Tahap 3: Tanya LABEL/kategori (opsional, boleh skip).  → Tunggu.
FORMAT hasil final /private-note (HANYA JSON valid):
{"mode":"note_setup","summary":"ringkasan singkat","setup":{"title":"judul catatan","content":"isi catatan lengkap","theme":"label atau kosong"}}

ATURAN TAHAPAN WIZARD (berlaku untuk SEMUA alur):
- SATU tahap per balasan. Jangan menanyakan dua hal sekaligus.
- Bila user menjawab "skip"/"lewati": JANGAN tanya ulang — isikan sendiri secara mandiri dari konteks percakapan (deskripsi/list/label boleh dikosongkan) lalu langsung lanjut ke tahap berikutnya.
- Bila user menjawab angka/huruf opsi (mis. "1" atau "c"), itu merujuk daftar pilihan yang kamu tawarkan pada pesan sebelumnya.
- Bila user menjawab "buat"/"lanjutkan"/"oke" padahal data belum lengkap: isi sisa tahap sendiri dari konteks lalu langsung balas JSON final.
- Tulis nama project, nama board, nama tahap, item, task, dan judul TANPA tanda petik/kutip — tulis langsung. Contoh salah: "Tugas Rumah". Contoh benar: Tugas Rumah.
- FORMAT tahap pertanyaan: teks/markdown singkat yang ramah (BUKAN JSON), berisi PERTANYAAN tahap berikutnya saja.
- Semua usulan harus relevan dengan konteks pembahasan user (JANGAN generik/bohong).
- projectRef pada /kanban dan /todo-list WAJIB salah satu nama project dari KONTEKS WORKSPACE, KECUALI user meminta project baru (maka projectRef = nama project baru tersebut).

=== 1) MODE ASK (perilaku DEFAULT untuk semua pertanyaan biasa) ===
Gunakan untuk: pertanyaan faktual, penjelasan konsep, obrolan, tutorial singkat, perbandingan, rekomendasi, saran, atau apa pun yang HANYA butuh jawaban teks (bukan membuat data di aplikasi).
FORMAT: Jawab LANGSUNG teks markdown yang rapi — JANGAN bungkus JSON, JANGAN tulis "mode" di jawabanmu.
Aturan penyajian profesional:
- Faktual/info → heading + paragraf + bullet penting.
- Tutorial/langkah → list bernomor (1. 2. 3.) yang jelas.
- Perbandingan → TABEL markdown (kolom perbandingan).
- Rekomendasi/analisis → heading + bullet + kesimpulan.
- Kode/program → potongan kode dalam blok \`\`\`nama_bahasa, sertakan penjelasan singkat.
- Data terstruktur (mis. JSON) → bungkus dalam blok \`\`\`json.
- Klarifikasi/evaluasi → terima masukan, jelaskan ulang lebih sederhana.
Jangan membuat informasi palsu — jika tidak yakin katakan tidak tahu. Gunakan bahasa Indonesia yang sopan & efektif. Akhiri dengan tawaran membantu hal lain (opsional).

=== 2) MODE PLAN — HANYA untuk pekerjaan bertahap yang MENGHASILKAN KONTEN/KARYA ===
Gunakan untuk: membuat artikel, konsep, riset, strategi, rancangan, website, konten panjang, atau rencana kerja (TANPA membuat data baru di aplikasi).
FORMAT: Balas HANYA satu JSON valid (tanpa teks lain, tanpa markdown):
{"mode":"plan","summary":"ringkasan satu kalimat","plan":[{"id":1,"title":"judul tugas singkat","detail":"apa yang dikerjakan"}]}
- Maksimal 8 item, urut logis, spesifik.

=== 3) MODE ACTION — HANYA bila user meminta membuat/mengubah/menghapus data di APLIKASI ===
Pemicu: user menyebut buat/ubah/hapus/buka "project", "kanban", "todolist/task", "catatan", "brankas", atau minta navigasi halaman.
FORMAT: Balas HANYA satu JSON valid:
{"mode":"action","summary":"ringkasan yang akan dikerjakan","actions":[
  {"type":"create_project","name":"...","description":"...","viewType":"kanban"|"todo","priority":"low|medium|high"},
  {"type":"create_kanban","projectRef":"__NEW__","boardName":"...","columns":["To Do","In Progress","Done"]},
  {"type":"add_todo","projectRef":"...","title":"...","description":"...","priority":"..."},
  {"type":"add_kanban_task","boardRef":"...","column":"To Do","title":"..."},
  {"type":"delete_project","projectRef":"..."},
  {"type":"delete_kanban","boardRef":"..."},
  {"type":"navigate","page":"project-detail|kanban|todo-list|private-note|vault","projectRef":"..."},
  {"type":"notify","title":"...","body":"..."}
]}
- "projectRef": "__NEW__" = project baru dalam daftar action yang sama.
- Untuk "buat project + kanban + todolist": susun berurutan create_project → create_kanban → add_todo/add_kanban_task.
- Isi kolom/task dengan langkah nyata menuju tujuan user (riset singkat dalam pikiranmu).
- Jangan menciptakan data palsu.

PENTING:
- Mode ASK & tahap pertanyaan WIZARD harus teks biasa (BUKAN JSON). Mode PLAN/ACTION/final WIZARD (project_setup/kanban_setup/todo_setup/note_setup) harus JSON MURNI.
- Jangan mencampur teks dan JSON dalam satu respons.
- Selalu bahasa Indonesia kecuali user minta bahasa lain.`

// =====================================================================
// Helper JSON + copy
// =====================================================================
function extractJSON(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons AI tidak valid (bukan JSON).')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function tryParseIntent(text) {
  try {
    const obj = extractJSON(text)
    if (!obj || typeof obj !== 'object') return null
    if (obj.mode === 'ask') {
      return { mode: 'ask', answer: String(obj.answer || obj.content || '').trim() }
    }
    if (obj.mode === 'plan' && Array.isArray(obj.plan) && obj.plan.length) {
      return {
        mode: 'plan',
        summary: String(obj.summary || '').trim(),
        tasks: obj.plan.slice(0, 8).map((t, i) => ({
          id: t.id ?? i + 1,
          title: String(t.title || t.task || '').trim(),
          detail: String(t.detail || '').trim(),
          status: 'pending',
        })).filter((t) => t.title),
      }
    }
    if (obj.mode === 'action' && Array.isArray(obj.actions)) {
      return { mode: 'action', summary: String(obj.summary || '').trim(), actions: obj.actions }
    }
    if (['project_setup', 'kanban_setup', 'todo_setup', 'note_setup'].includes(obj.mode)) {
      // "setup" dipakai format baru; "projectSetup" = format lama /project.
      const s = obj.setup || obj.projectSetup
      if (!s || typeof s !== 'object') return null
      const normColumns = (cols) => (Array.isArray(cols) ? cols
        .map((c) => ({
          name: String(c?.name || '').trim(),
          items: Array.isArray(c?.items) ? c.items.map((x) => String(x).trim()).filter(Boolean) : [],
        }))
        .filter((c) => c.name) : [])
      const normTodos = (arr) => (Array.isArray(arr) ? arr
        .map((t) => ({
          title: String(t?.title || '').trim(),
          description: String(t?.description || '').trim(),
          priority: ['low', 'medium', 'high'].includes(t?.priority) ? t.priority : 'medium',
        }))
        .filter((t) => t.title) : [])
      if (obj.mode === 'project_setup') {
        const kanban = (s.includeKanban !== false) && s.kanban && Array.isArray(s.kanban.columns) && s.kanban.columns.length
          ? {
              boardName: String(s.kanban.boardName || s.name || 'Kanban'),
              boardType: s.kanban.boardType === 'static' ? 'static' : 'dynamic',
              columns: normColumns(s.kanban.columns),
            }
          : null
        const todos = (s.includeTodo !== false) && Array.isArray(s.todos) ? normTodos(s.todos) : []
        if (!kanban && !todos.length) return null
        return {
          mode: 'project_setup',
          summary: String(obj.summary || '').trim(),
          setup: {
            name: String(s.name || '').trim(),
            description: String(s.description || '').trim(),
            kanban,
            todos,
          },
        }
      }
      if (obj.mode === 'kanban_setup') {
        const columns = normColumns(s.columns)
        if (!columns.length) return null
        return {
          mode: 'kanban_setup',
          summary: String(obj.summary || '').trim(),
          setup: {
            projectRef: String(s.projectRef || '').trim(),
            boardName: String(s.boardName || 'Kanban').trim(),
            boardType: s.boardType === 'static' ? 'static' : 'dynamic',
            columns,
          },
        }
      }
      if (obj.mode === 'todo_setup') {
        const todos = normTodos(s.todos)
        if (!todos.length) return null
        return {
          mode: 'todo_setup',
          summary: String(obj.summary || '').trim(),
          setup: {
            projectRef: String(s.projectRef || '').trim(),
            listName: String(s.listName || '').trim(),
            todos,
          },
        }
      }
      // note_setup
      const content = String(s.content || '').trim()
      if (!content && !String(s.title || '').trim()) return null
      return {
        mode: 'note_setup',
        summary: String(obj.summary || '').trim(),
        setup: {
          title: String(s.title || '').trim(),
          content,
          theme: String(s.theme || '').trim(),
        },
      }
    }
  } catch {}
  return null
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback untuk lingkungan non-secure.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      return true
    } catch { return false }
  }
}

// =====================================================================
// Inline formatting (bold, italic, `code`)
// =====================================================================
function renderInline(text) {
  const out = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m
  let key = 0
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('`')) out.push(<code key={key} className="agent-msg-code">{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>)
    key += 1
    last = regex.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// =====================================================================
// Kotak kode profesional: label bahasa + tombol salin kode
// =====================================================================
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="agent-code-block">
      <div className="agent-code-head">
        <span className="agent-code-lang">{lang || 'code'}</span>
        <button
          type="button"
          className="agent-code-copy"
          onClick={async () => { const ok = await copyText(code); if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500) } }}
        >
          {copied ? <><Check size={11} /> Disalin</> : <><Copy size={11} /> Salin kode</>}
        </button>
      </div>
      <pre className="agent-msg-pre"><code>{code}</code></pre>
    </div>
  )
}

// =====================================================================
// Render teks AI menjadi blok rapi: paragraf, list, heading, tabel, kode.
// =====================================================================
function renderTable(rows) {
  if (!rows.length) return null
  const separator = rows[1] && /^[\s|:.-]+$/.test(rows[1].replace(/[^|:\-.\s]/g, ''))
  const header = separator ? rows[0] : rows[0]
  const dataRows = separator ? rows.slice(2) : rows.slice(1)
  const parseRow = (r) => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
  const headers = parseRow(header)
  return (
    <div key={`t${Math.random()}`} className="agent-msg-table-wrap">
      <table className="agent-msg-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr></thead>
        <tbody>
          {dataRows.filter((r) => r.trim() && r.includes('|')).map((r, i) => (
            <tr key={i}>{parseRow(r).map((c, j) => <td key={j}>{renderInline(c)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderRich(text) {
  if (!text) return null
  const blocks = []
  const cleaned = String(text).replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push({ lang: (lang || '').trim(), code: code.replace(/\n$/, '') })
    return `\u0000${blocks.length - 1}\u0000`
  })
  // Normalisasi: marker list sendiri di baris sendiri → gabung dengan baris berikutnya.
  const rawLines = cleaned.split('\n')
  const merged = []
  for (let i = 0; i < rawLines.length; i += 1) {
    const t = rawLines[i].trim()
    const next = i + 1 < rawLines.length ? rawLines[i + 1].trim() : ''
    const marker = t.match(/^(\d+[.)]|[-*•])\s*$/)
    if (marker && next && !next.match(/^(\d+[.)]|[-*•]|#|[|>]|```|\u0000)/)) {
      const prefix = marker[1].includes('.') || marker[1].includes(')') ? marker[1].replace(/[.)]$/, '') + '. ' : '• '
      merged.push(prefix + next)
      i += 1
    } else {
      merged.push(rawLines[i])
    }
  }
  const lines = merged
  const out = []
  let para = []
  let list = null
  let table = null
  const flushPara = () => {
    if (para.length) { out.push(<p key={`p${out.length}`} className="agent-msg-p">{renderInline(para.join(' '))}</p>); para = [] }
  }
  const flushList = () => {
    if (list) {
      out.push(<div key={`l${out.length}`} className={`agent-msg-list ${list.ordered ? 'ordered' : ''}`}>{
        list.items.map((it, i) => <div key={i} className="agent-msg-list-item"><span className="agent-msg-list-mark">{list.ordered ? `${i + 1}.` : '•'}</span><span>{it}</span></div>)
      }</div>)
      list = null
    }
  }
  const flushTable = () => {
    if (table && table.length > 1) { out.push(renderTable(table)); table = null }
    else if (table) { table.forEach((l) => para.push(l)); table = null; flushPara() }
  }
  lines.forEach((line) => {
    const trimmed = line.trim()
    const codeMatch = trimmed.match(/^\u0000(\d+)\u0000$/)
    if (codeMatch) { flushPara(); flushList(); flushTable(); const b = blocks[Number(codeMatch[1])]; out.push(<CodeBlock key={`c${out.length}`} code={b.code} lang={b.lang} />); return }
    if (trimmed.startsWith('|')) { flushPara(); flushList(); table = table || []; table.push(trimmed); return }
    if (table) flushTable()
    if (/^#{1,3}\s/.test(trimmed)) { flushPara(); flushList(); out.push(<h4 key={`h${out.length}`} className="agent-msg-h">{renderInline(trimmed.replace(/^#{1,3}\s/, ''))}</h4>); return }
    if (/^[-*•]\s/.test(trimmed)) { flushPara(); flushTable(); if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }; list.items.push(renderInline(trimmed.replace(/^[-*•]\s/, ''))); return }
    if (/^\d+[.)]\s/.test(trimmed)) { flushPara(); flushTable(); if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }; list.items.push(renderInline(trimmed.replace(/^\d+[.)]\s/, ''))); return }
    if (trimmed === '') { flushPara(); flushList(); flushTable(); return }
    para.push(trimmed)
  })
  flushPara(); flushList(); flushTable()
  return out
}

export default function AgentChat() {
  const { companyInfo, projects, kanbanBoards, addProject, addKanbanBoard, addTask, addKanbanTask, addNotification, openProject, openKanbanBoard, setCurrentPage, deleteProject, deleteKanbanBoard, deleteTask, addPrivateNote } = useStore()
  const [activeTab, setActiveTab] = useState('chat')
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG)
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const [providers, setProviders] = useState([])
  const [activeProvider, setActiveProvider] = useState(null)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [aiModels, setAiModels] = useState([])
  const [aiMsg, setAiMsg] = useState('')
  const [aiErr, setAiErr] = useState('')
  const lastFetchedUrl = useRef('')
  const autoFetchTimer = useRef(null)

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya asisten AI Luxio.\n\nSaya bisa:\n1. **Mode Ask** — jawab pertanyaan biasa\n2. **Mode Plan** — buat todolist interaktif untuk pekerjaan bertahap\n3. **Mode Action** — buat/ubah data aplikasi (project, kanban, todolist) langsung dari chat\n4. **Wizard /** — dipandu tanya-jawab sampai datanya jadi. Perintah:\n     • **/project** — buat project (nama → deskripsi → kanban/todolist)\n     • **/kanban** — buat board kanban (project → jenis → tahap → item)\n     • **/todo-list** — buat todolist (project → list → task)\n     • **/private-note** — buat catatan pribadi (judul → isi → label)\n     • **/vault** — langsung buka halaman Brankas\n\nCoba: *"Buat konsep landing page"* (plan), *"Buat project baru bernama Website Edukasi dengan kanban"* (action), atau ketik salah satu wizard di atas.\nSetiap jawaban AI punya menu **titik tiga (⋯)** — klik lalu pilih **Buat jadi Project** agar agent merancang project lengkap dari konteks pembicaraan kita. Semua wizard punya tombol **Skip** — agent akan mengisi sendiri dari konteks.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [runningTaskId, setRunningTaskId] = useState(null)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [showInputMenu, setShowInputMenu] = useState(false)
  const [showModelSwitcher, setShowModelSwitcher] = useState(false)
  const [attachments, setAttachments] = useState([])
  // Wizard slash-command (/project, /kanban, /todo-list, /private-note) — null = nonaktif.
  // kind = perintah asal; stage = 'name' saat berjalan, 'done' saat siap dibuat.
  const [wizard, setWizard] = useState(null)
  // Menu titik tiga (⋯) pada hasil generate agent + status "Buat jadi Project".
  const [msgMenuIdx, setMsgMenuIdx] = useState(null)
  const [setupBusy, setSetupBusy] = useState(false)
  const chatEndRef = useRef(null)
  const modelSwitcherRef = useRef(null)
  const inputMenuWrapRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const chatFieldRef = useRef(null)

  // Orchestrator state
  const [orch, setOrch] = useState({ goal: '', analyzing: false, todos: [], results: {}, running: false })
  const [orchError, setOrchError] = useState('')

  const [toast, setToast] = useState('')
  const flash = useCallback((msg) => { setToast(msg); window.setTimeout(() => setToast(''), 2500) }, [])

  useEffect(() => {
    const cfg = loadAiConfig()
    if (cfg) setAiConfig(cfg)
  }, [])

  useEffect(() => {
    api.getAIProviders()
      .then((res) => { const list = res.providers || []; setProviders(list); setActiveProvider(list.find((p) => p.is_active) || list[0] || null) })
      .catch(() => {})
  }, [])

  // Kumpulkan konteks workspace dari store (meniru "context gathering").
  const buildContext = useCallback(() => {
    const parts = []
    if (companyInfo?.name) parts.push(`Workspace/Perusahaan: ${companyInfo.name}`)
    if (Array.isArray(projects) && projects.length) {
      const names = projects.slice(0, 12).map((p) => p.name).filter(Boolean)
      if (names.length) parts.push(`Proyek di workspace: ${names.join(', ')}`)
    }
    if (parts.length) return parts.join('\n')
    return ''
  }, [companyInfo, projects])

  const persistConfig = (cfg) => {
    setAiConfig(cfg); setAiMsg(''); setAiErr(''); saveAiConfig(cfg); flash('Konfigurasi AI tersimpan')
  }

  const handleFetchModels = async (cfgOverride) => {
    const cfg = cfgOverride || aiConfig
    const baseUrl = normalizeBaseUrl(cfg.base_url)
    if (!baseUrl) return setAiErr('Isi Base URL dulu.')
    if (!cfg.api_key || !cfg.api_key.trim()) return setAiErr('Isi API Key dulu untuk mengambil daftar model.')
    setFetchingModels(true); setAiErr(''); setAiMsg('')
    let models = []; let usedBackend = false
    try {
      models = await fetchModelsDirect(cfg)
    } catch {
      try {
        const res = await api.fetchAIModels({ api_type: cfg.api_type, base_url: baseUrl, api_key: cfg.api_key.trim() })
        models = res.models || []; usedBackend = true
      } catch {
        setAiErr('Gagal fetch model. Cek Base URL, API Key, dan koneksi.')
        setFetchingModels(false); return
      }
    }
    setAiModels(models)
    lastFetchedUrl.current = modelKeyFor(cfg)
    if (models.length > 0) {
      setAiMsg(`${models.length} model ditemukan${usedBackend ? ' (via server)' : ' (langsung browser)'} dari ${baseUrl}.`)
      if (!cfg.model && models.length === 1) setAiConfig((c) => ({ ...c, model: models[0] }))
    } else {
      setAiErr('Tidak ada model ditemukan. Cek Base URL & API Key.')
    }
    setFetchingModels(false)
  }

  useEffect(() => {
    if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current)
    const baseUrl = normalizeBaseUrl(aiConfig.base_url)
    const hasKey = Boolean(aiConfig.api_key && aiConfig.api_key.trim())
    const urlComplete = /^https?:\/\/.+\..+/.test(baseUrl)
    if (!baseUrl || !hasKey || !urlComplete) return
    const key = modelKeyFor(aiConfig)
    if (key === lastFetchedUrl.current) return
    setAiModels([])
    autoFetchTimer.current = setTimeout(() => { handleFetchModels(aiConfig) }, 1200)
    return () => { if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiConfig.base_url, aiConfig.api_key, aiConfig.api_type])

  const fillFromActiveProvider = () => {
    if (!activeProvider) return
    setAiConfig((c) => ({ ...c, api_type: activeProvider.api_type || c.api_type, base_url: activeProvider.base_url || c.base_url, model: activeProvider.model || c.model }))
    setAiMsg(`Prefill dari provider "${activeProvider.display_name || activeProvider.provider_id}". Masukkan API Key.`)
    setAiErr('')
  }

  const configReady = Boolean(aiConfig.base_url && aiConfig.api_key && aiConfig.model)

  const requireConfig = () => {
    if (configReady) return true
    setAiErr('Lengkapi konfigurasi AI dulu (Base URL, API Key, Model).')
    setAiConfigOpen(true)
    return false
  }

  const handleCopyMessage = async (content) => {
    const ok = await copyText(content)
    flash(ok ? 'Pesan disalin' : 'Gagal menyalin')
  }

  // ---- Input: lampiran (file / gambar), menu titik tiga, model switcher ----
  const addAttachment = (kind, name, payload, mime = '') => {
    setAttachments((prev) => [...prev, { kind, name, payload, mime, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }])
    flash(`${name} dilampirkan`)
  }

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  const handleFilePick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => addAttachment('file', f.name, String(reader.result || ''), f.type)
    reader.readAsText(f)
  }

  const handleImagePick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => addAttachment('image', f.name, reader.result, f.type)
    reader.readAsDataURL(f)
  }

  // Cek dukungan model terhadap lampiran (perkiraan: gambar hanya model vision).
  const modelLooksVision = () => {
    const m = (aiConfig.model || '').toLowerCase()
    return /vision|gpt-4o|gpt-4\.1|gemini|claude|qwen.*vl|llava|pixtral|glm-4v|internvl|openai|grok-2-vision/i.test(m) || m.includes('mini') === false
  }
  const supportsImage = Boolean(aiConfig.model) && modelLooksVision()
  const supportsFile = Boolean(aiConfig.model)

  // Tutup menu titik tiga / model bila klik di luar.
  useEffect(() => {
    const onClick = (ev) => {
      const inModel = modelSwitcherRef.current && modelSwitcherRef.current.contains(ev.target)
      const inMenu = inputMenuWrapRef.current && inputMenuWrapRef.current.contains(ev.target)
      if (!inModel && !inMenu) {
        setShowInputMenu(false)
        setShowModelSwitcher(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const pickModel = (m) => {
    setAiConfig((c) => ({ ...c, model: m }))
    saveAiConfig({ ...aiConfig, model: m })
    setShowModelSwitcher(false)
  }

  // ---- Jalankan aksi CRUD dari AI (mode action) ----
  const executeActions = async (actions) => {
    const idRefs = {}
    const done = []
    const failed = []
    let lastProjectId = null
    let lastBoardId = null
    let navigate = null

    for (const a of actions || []) {
      try {
        if (a.type === 'create_project') {
          const id = addProject({
            name: a.name || 'Project Baru',
            description: a.description || '',
            viewType: a.viewType === 'kanban' ? 'kanban' : 'todo',
            priority: a.priority || 'medium',
          })
          idRefs['__NEW__'] = id
          idRefs[a.name] = id
          lastProjectId = id
          done.push(`Project "${a.name}" dibuat`)
        } else if (a.type === 'create_kanban') {
          const projectId = idRefs[a.projectRef] || idRefs['__NEW__']
          if (!projectId) throw new Error('Project tidak ditemukan')
          addKanbanBoard({
            projectId,
            name: a.boardName || 'Kanban',
            boardType: a.boardType === 'static' ? 'static' : 'dynamic',
            columns: Array.isArray(a.columns) ? a.columns.map((c) => ({ name: String(c), todos: [] })) : [],
          })
          const created = useStore.getState().kanbanBoards
            .filter((b) => b.projectId === projectId && b.name === (a.boardName || 'Kanban'))
            .sort((a2, b2) => b2.createdAt - a2.createdAt)[0]
          const boardId = created ? created.id : null
          idRefs[a.boardRef || a.boardName] = boardId
          idRefs['__KANBAN__'] = boardId
          lastBoardId = boardId
          done.push(`Board kanban "${a.boardName || 'Kanban'}" dibuat`)
        } else if (a.type === 'add_kanban_task') {
          const freshBoards = useStore.getState().kanbanBoards
          const projectId = idRefs[a.projectRef] || idRefs['__NEW__']
          const board = projectId
            ? freshBoards.find((b) => b.projectId === projectId && (b.id === idRefs[a.boardRef] || b.name === a.boardRef))
            : freshBoards.find((b) => b.id === idRefs[a.boardRef] || b.name === a.boardRef)
          if (!board) throw new Error('Board kanban tidak ditemukan')
          const col = board.columns.find((c) => (a.column || 'To Do').toLowerCase() === String(c.name).toLowerCase()) || board.columns[0]
          addKanbanTask(board.id, col.id, { title: a.title })
          done.push(`Task kanban "${a.title}" ditambahkan`)
        } else if (a.type === 'add_todo') {
          const projectId = idRefs[a.projectRef] || idRefs['__NEW__']
          if (!projectId) throw new Error('Project tidak ditemukan')
          addTask({
            projectId,
            title: a.title || 'Task',
            description: a.description || '',
            priority: a.priority || 'medium',
          })
          done.push(`Task "${a.title}" ditambahkan ke todolist`)
        } else if (a.type === 'delete_project') {
          const projectId = idRefs[a.projectRef] || (useStore.getState().projects.find((p) => p.name === a.projectRef) || {}).id
          if (projectId) { deleteProject(projectId); done.push(`Project "${a.projectRef}" dihapus`) }
        } else if (a.type === 'delete_kanban') {
          const boardId = idRefs[a.boardRef] || (useStore.getState().kanbanBoards.find((b) => b.name === a.boardRef) || {}).id
          if (boardId) { deleteKanbanBoard(boardId); done.push(`Board kanban "${a.boardRef}" dihapus`) }
        } else if (a.type === 'delete_todo') {
          const taskId = idRefs[a.taskRef]
          if (taskId) { deleteTask(taskId); done.push(`Task "${a.taskRef}" dihapus`) }
        } else if (a.type === 'navigate') {
          navigate = { page: a.page || '', projectId: idRefs[a.projectRef] || lastProjectId, boardId: idRefs[a.boardRef] || lastBoardId }
        } else if (a.type === 'notify') {
          addNotification({ title: a.title || 'Notifikasi AI', body: a.body || '', type: 'ai', page: '', params: {} })
        } else {
          done.push(`Aksi "${a.type}" tidak dikenal (diabaikan)`)
        }
      } catch (e) {
        failed.push(`${a.type}: ${e.message}`)
      }
    }

    // Notifikasi "project baru dibuat" → klik navigasi ke halaman terkait.
    const navPage = navigate?.page || (lastBoardId ? 'kanban' : lastProjectId ? 'project-detail' : '')
    const navParams = lastBoardId ? { boardId: lastBoardId } : lastProjectId ? { projectId: lastProjectId } : {}
    if (navPage) {
      addNotification({
        title: lastProjectId ? '🛠️ AI Agent membuat project baru' : '🤖 AI Agent selesai bekerja',
        body: done.join(', ') || 'Lihat hasilnya',
        type: 'ai',
        page: navPage,
        params: navParams,
      })
    }

    let resultText = ''
    if (done.length) resultText += `**✅ Yang sudah dikerjakan:**\n${done.map((d) => `- ${d}`).join('\n')}`
    if (failed.length) resultText += `\n\n**⚠️ Gagal:**\n${failed.map((d) => `- ${d}`).join('\n')}`
    resultText += `\n\n${navPage ? '🔔 **Notifikasi terkirim** — klik lonceng di kanan atas untuk membuka halamannya.' : ''}`
    return resultText
  }

  // =====================================================================
  // Wizard slash-command — alur tanya-jawab terpandu pembuatan data.
  // kind: 'project' | 'kanban' | 'todo-list' | 'private-note'
  // =====================================================================
  const WIZARD_FIRST_QUESTION = {
    project: '🧭 **Wizard Pembuatan Project**\n\nBaik, kita buat project bersama-sama.\n\n**1/3 — Apa nama projectnya?**\nKetik nama yang kamu mau (contoh: Peluncuran Website Kopi). Atau klik Skip biar saya yang kasih nama dari konteks.',
    kanban: '🧭 **Wizard Board Kanban**\n\nSiap, kita buat board kanban.\n\n**1/4 — Board ini untuk project mana?**\nDaftar project di workspace:\n(1) — lihat pilihan di bawah —\nKetik nama project yang sudah ada, atau tulis nama baru untuk langsung dibuatkan projectnya.',
    'todo-list': '🧭 **Wizard Todolist**\n\nSiap, kita buat todolist.\n\n**1/3 — Todolist ini untuk project mana?**\nKetik nama project yang sudah ada di workspace, atau tulis nama baru untuk langsung dibuatkan projectnya.',
    'private-note': '🧭 **Wizard Catatan Pribadi**\n\nSiap, kita buat catatan.\n\n**1/3 — Apa judul catatannya?**\nKetik judulnya (atau klik Skip biar saya beri judul dari konteks pembicaraan kita).',
  }

  const startWizard = (kind) => {
    const firstQuestion = WIZARD_FIRST_QUESTION[kind]
    if (!firstQuestion) return
    // Transkrip wizard dibangun sebagai percakapan user/assistant yang
    // bergantian rapi dan SELALU berakhir dengan pesan user — beberapa
    // provider menolak array messages yang berakhir dengan role system.
    setWizard({
      kind,
      stage: 'name',
      transcript: [
        { role: 'user', content: `/${kind}` },
        { role: 'assistant', content: firstQuestion.replace(/\*/g, '') },
      ],
    })
    setMessages((prev) => [...prev, { role: 'assistant', wizardStage: kind, content: firstQuestion }])
  }

  // Jawaban user pada tahap wizard dikirim ke AI (bukan mode normal).
  const sendWizardAnswer = async (answer) => {
    const content = answer.trim()
    if (!content || busy) return
    if (!requireConfig()) return
    const nextTranscript = [...(wizard.transcript || []), { role: 'user', content }]
    setMessages((prev) => [...prev, { role: 'user', content }])
    setChatInput('')
    setBusy(true)
    try {
      // Satu system message di awal (aturan wizard di dalamnya) + transkrip
      // user/assistant bergantian. TANPA history biasa & TANPA system kedua
      // agar urutan role valid di semua provider.
      const ctx = buildContext()
      const sys = `${PLAN_SYSTEM_PROMPT}${ctx ? `\n\n=== KONTEKS WORKSPACE SAAT INI ===\n${ctx}` : ''}`
      const reply = await callAIChat(aiConfig, [
        { role: 'system', content: sys },
        ...nextTranscript.map((t) => ({ role: t.role, content: t.content })),
      ])
      const intent = tryParseIntent(reply)
      if (intent && ['project_setup', 'kanban_setup', 'todo_setup', 'note_setup'].includes(intent.mode)) {
        // Wizard selesai → tampilkan kartu ringkasan + tombol "Buat jadi Project".
        setWizard((w) => ({ ...w, stage: 'done', setup: intent.setup, summary: intent.summary, resultMode: intent.mode }))
        setMessages((prev) => [...prev, {
          role: 'assistant',
          kind: intent.mode,
          content: intent.summary || 'Setup siap dibuat.',
          setup: intent.setup,
        }])
      } else {
        // Tahap pertanyaan berikutnya (teks biasa).
        setWizard((w) => ({ ...w, transcript: [...nextTranscript, { role: 'assistant', content: reply }] }))
        setMessages((prev) => [...prev, { role: 'assistant', wizardStage: true, content: reply }])
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  // Batal wizard: kembali ke mode chat normal.
  const cancelWizard = () => {
    setWizard(null)
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Wizard dibatalkan. Ketik **/** lagi kalau mau mulai dari awal.' }])
  }

  // =====================================================================
  // "Buat jadi ..." — eksekusi hasil wizard ke store (full agent setup).
  // mode: 'project_setup' | 'kanban_setup' | 'todo_setup' | 'note_setup'
  // =====================================================================
  const applyProjectSetup = async (mode, setup) => {
    if (!setup || setupBusy) return
    setSetupBusy(true)
    try {
      // Resolve project tujuan untuk kanban_setup / todo_setup.
      const resolveProject = (ref) => {
        const state = useStore.getState()
        if (ref) {
          const found = state.projects.find((p) => p.name.toLowerCase() === String(ref).toLowerCase())
          if (found) return found.id
        }
        return null
      }

      if (mode === 'note_setup') {
        const noteId = addPrivateNote({
          title: setup.title || 'Catatan',
          content: setup.content || '',
          theme: setup.theme || '',
        })
        addNotification({
          title: '🤖 AI Agent membuat catatan baru',
          body: `Catatan ${setup.title || ''} dibuat`,
          type: 'ai',
          page: 'private-note',
          params: {},
        })
        flash('Catatan berhasil dibuat!')
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `**✅ Catatan jadi!**\n\n- Catatan ${setup.title || ''} dibuat${setup.theme ? ` dengan label ${setup.theme}` : ''}\n\n🔔 Klik lonceng di kanan atas untuk membukanya.`,
        }])
        return
      }

      // project_setup: project baru lengkap.
      // kanban_setup / todo_setup: pakai project tujuan, atau buat baru bila tak ada.
      let projectId = null
      const done = []
      let lastBoardId = null

      if (mode === 'project_setup') {
        if (!setup.name) { flash('Nama project tidak diketahui'); return }
        projectId = addProject({
          name: setup.name,
          description: setup.description || '',
          // viewType hanya 'kanban'|'todo' — detail project menampilkan board
          // DAN todolist apa pun viewType-nya.
          viewType: setup.kanban ? 'kanban' : 'todo',
          priority: 'medium',
        })
        done.push(`Project "${setup.name}" dibuat`)
      } else {
        projectId = resolveProject(setup.projectRef)
        if (!projectId) {
          // Project belum ada → agent membuatkan langsung dari nama projectRef.
          const newName = setup.projectRef || 'Project Baru'
          projectId = addProject({
            name: newName,
            description: '',
            viewType: mode === 'kanban_setup' ? 'kanban' : 'todo',
            priority: 'medium',
          })
          done.push(`Project "${newName}" dibuat baru (belum ada di workspace)`)
        }
      }

      if (setup.kanban) {
        const columns = setup.kanban.columns.map((c) => ({
          name: c.name,
          todos: c.items, // addKanbanBoard mengonversi string → tasks kolom
        }))
        addKanbanBoard({
          projectId,
          name: setup.kanban.boardName || 'Kanban',
          boardType: setup.kanban.boardType || 'dynamic',
          columns,
        })
        const created = useStore.getState().kanbanBoards
          .filter((b) => b.projectId === projectId && b.name === (setup.kanban.boardName || 'Kanban'))
          .sort((a, b) => b.createdAt - a.createdAt)[0]
        lastBoardId = created ? created.id : null
        done.push(`Board kanban "${setup.kanban.boardName || 'Kanban'}" (${setup.kanban.boardType}, ${setup.kanban.columns.length} tahap) dibuat lengkap dengan item tiap tahap`)
      }

      if (setup.todos && setup.todos.length) {
        setup.todos.forEach((t) => addTask({
          projectId,
          title: t.title,
          description: t.description || '',
          priority: t.priority || 'medium',
          ...(mode === 'todo_setup' && setup.listName ? { listName: setup.listName } : {}),
        }))
        done.push(`${setup.todos.length} task todolist ditambahkan${mode === 'todo_setup' && setup.listName ? ` ke list ${setup.listName}` : ''}`)
      }

      // Notifikasi dengan navigasi langsung ke hasil.
      const navPage = mode === 'note_setup'
        ? 'private-note'
        : lastBoardId ? 'kanban' : 'project-detail'
      addNotification({
        title: '🛠️ AI Agent membuat data baru',
        body: done.join(', '),
        type: 'ai',
        page: navPage,
        params: lastBoardId ? { boardId: lastBoardId } : { projectId },
      })
      flash(mode === 'note_setup' ? 'Catatan berhasil dibuat!' : 'Project berhasil dibuat!')
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `**✅ Selesai!**\n\n${done.map((d) => `- ${d}`).join('\n')}\n\n🔔 Klik lonceng di kanan atas untuk langsung membukanya.`,
      }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ Gagal membuat: ${e.message}` }])
    } finally {
      setSetupBusy(false)
    }
  }

  // Titik tiga hasil generate agent → minta agent merancang project dari konteks.
  const generateProjectFromMessage = async (msgIndex) => {
    setMsgMenuIdx(null)
    if (!requireConfig() || setupBusy) return
    const msg = messages[msgIndex]
    if (!msg) return
    setSetupBusy(true)
    try {
      const sys = `Kamu adalah agent perancang project di aplikasi Luxio (Project Manager).
Tugasmu: membaca konteks percakapan/hasil kerja di bawah, lalu merancang setup project yang SIAP DIBUAT tanpa bertanya lagi.

Balas HANYA satu JSON valid:
{"mode":"project_setup","summary":"ringkasan singkat","projectSetup":{"name":"nama project singkat & relevan","description":"deskripsi 1-2 kalimat dari konteks","includeKanban":true,"includeTodo":true,"kanban":{"boardName":"...","boardType":"dynamic","columns":[{"name":"Nama Tahap","items":["item nyata dari konteks"]}]},"todos":[{"title":"...","description":"...","priority":"medium"}]}}
ATURAN:
- Nama project, jenis, jumlah & nama tahap, item tiap tahap, dan task todolist HARUS diturunkan dari konteks pembahasan (bukan "To Do/In Progress/Done" generik tanpa makna, bukan item bohong).
- Pilih boardType "dynamic" bila alur kerja fleksibel, "static" bila tahapan berurutan terkunci.
- includeKanban/includeTodo boleh salah satu saja bila konteksnya jelas memilih itu; default keduanya bila ragu.`

      const contextMsgs = messages
        .filter((m) => m.role !== 'system')
        .slice(Math.max(0, msgIndex - 6), msgIndex + 1)
        .map((m) => `${m.role === 'user' ? 'USER' : 'AGENT'}: ${String(m.content).slice(0, 1500)}`)
        .join('\n\n')

      const reply = await callAIChat(aiConfig, [
        { role: 'system', content: sys },
        { role: 'user', content: `KONTEKS WORKSPACE:\n${buildContext() || '(kosong)'}\n\nPEMBAHASAN TERAKHIR:\n${contextMsgs}\n\nRancang project lengkapnya sekarang.` },
      ])
      const intent = tryParseIntent(reply)
      if (intent && intent.mode === 'project_setup') {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          kind: 'project_setup',
          content: intent.summary || 'Setup project siap dibuat.',
          setup: intent.setup,
        }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Agent tidak menghasilkan rancangan yang valid. Coba lagi.' }])
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setSetupBusy(false)
    }
  }

  // ---- Chat / pencarian AI (4 mode: ask / plan / action / project_setup) ----
  const handleSendChat = async () => {
    const text = chatInput.trim()
    if ((!text && attachments.length === 0) || busy) return
    if (!requireConfig()) return

    // Wizard aktif: jawaban user dialirkan ke alur tanya-jawab terpandu.
    if (wizard && wizard.stage !== 'done') {
      await sendWizardAnswer(text)
      return
    }
    // Lampiran (file/gambar) → sisipkan isinya ke pesan user.
    let extra = ''
    if (attachments.length) {
      const filesPart = attachments.map((a) => {
        if (a.kind === 'file') return `\n\n--- LAMPIRAN FILE: ${a.name} ---\n${a.payload}`
        return `\n\n--- LAMPIRAN GAMBAR: ${a.name} (data URL tersedia jika model vision) ---`
      }).join('')
      extra = filesPart
    }

    setChatInput('')
    setShowSlashMenu(false)
    setAttachments([])
    const ctx = buildContext()
    const fullContent = `${ctx ? `KONTEKS WORKSPACE:\n${ctx}\n\n` : ''}${text}${extra}`
    const userMsg = { role: 'user', content: fullContent }
    setMessages((prev) => [...prev, { role: 'user', content: text + (attachments.length ? `\n[📎 ${attachments.length} lampiran]` : '') }])
    setBusy(true)
    try {
      const history = messages.filter((m) => m.kind !== 'plan' && m.role !== 'system').map((m) => ({ role: m.role, content: m.content }))
      const reply = await callAIChat(aiConfig, [{ role: 'system', content: PLAN_SYSTEM_PROMPT }, ...history, userMsg])
      const intent = tryParseIntent(reply)
      if (intent && intent.mode === 'ask') {
        setMessages((prev) => [...prev, { role: 'assistant', content: intent.answer || reply }])
      } else if (intent && intent.mode === 'plan') {
        setMessages((prev) => [...prev, { role: 'assistant', kind: 'plan', summary: intent.summary, tasks: intent.tasks }])
      } else if (intent && intent.mode === 'action') {
        const resultText = await executeActions(intent.actions)
        const head = intent.summary ? `**${intent.summary}**\n\n` : ''
        setMessages((prev) => [...prev, { role: 'assistant', content: `${head}${resultText}` }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  // Ketik "/" → tampilkan menu halaman yang bisa di-CRUD.
  const handleChatInputChange = (value) => {
    setChatInput(value)
    setShowSlashMenu(value.trim().startsWith('/') && value.trim().length <= 40)
  }

  const handleSlashSelect = (page) => {
    setShowSlashMenu(false)
    setChatInput('')
    // /vault → navigasi langsung (data sensitif, tanpa wizard).
    if (page.navigate) {
      setCurrentPage(page.navigate)
      return
    }
    // Perintah wizard → alur tanya-jawab terpandu (agent mengatur semuanya).
    if (page.wizard) {
      if (wizard) { flash('Wizard sedang berjalan — selesaikan atau batalkan dulu'); return }
      if (!requireConfig()) return
      startWizard(page.id)
      return
    }
    setChatInput(page.template || '')
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Percakapan dibersihkan. Mulai lagi kapan saja.' }])
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy, runningTaskId])

  const togglePlanTask = (msgIndex, taskId) => {
    setMessages((prev) => prev.map((m, i) => (i === msgIndex && m.kind === 'plan'
      ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t)) }
      : m)))
  }

  const runPlanTask = async (msgIndex, taskId) => {
    const msg = messages[msgIndex]
    if (!msg || msg.kind !== 'plan' || runningTaskId) return
    const task = msg.tasks.find((t) => t.id === taskId)
    if (!task) return
    if (!requireConfig()) return
    setRunningTaskId(taskId)
    const ctx = buildContext()
    try {
      const sys = `Kamu adalah satu agent dalam alur kerja ala KiloCode yang sedang menyelesaikan SATU tugas dari sebuah rencana.\n\nRingkasan rencana user:\n${msg.summary || '-'}\n\nTugas yang kamu kerjakan sekarang:\n- Judul: ${task.title}\n${task.detail ? `- Detail: ${task.detail}\n` : ''}\n\nKerjakan tugas ini sampai tuntas dan berikan hasil konkret yang siap dipakai (kode dalam blok \`\`\` dengan nama bahasa, teks, langkah, dsb).`
      const userContent = ctx ? `KONTEKS WORKSPACE:\n${ctx}\n\nKerjakan tugas di atas sekarang.` : 'Kerjakan tugas di atas sekarang.'
      const reply = await callAIChat(aiConfig, [{ role: 'system', content: sys }, { role: 'user', content: userContent }])
      const labeled = `**Hasil tugas: ${task.title}**\n\n${reply}`
      setMessages((prev) => {
        const next = prev.map((m, i) => (i === msgIndex && m.kind === 'plan'
          ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status: 'done' } : t)) }
          : m))
        next.splice(msgIndex + 1, 0, { role: 'assistant', content: labeled, taskResultOf: task.title })
        return next
      })
    } catch (e) {
      const labeled = `**Gagal mengerjakan: ${task.title}**\n\n⚠️ ${e.message}`
      setMessages((prev) => { const next = [...prev]; next.splice(msgIndex + 1, 0, { role: 'assistant', content: labeled, taskResultOf: task.title }); return next })
    } finally {
      setRunningTaskId(null)
    }
  }

  // ---- Orchestrator ----
  const analyzeGoal = async () => {
    const goal = orch.goal.trim()
    if (!goal) return
    if (!requireConfig()) return
    setOrchError('')
    setOrch((o) => ({ ...o, analyzing: true, todos: [], results: {} }))
    try {
      const sys = `You are an orchestration planner. Break the user's goal into 3-6 concrete, distinct, actionable tasks. Assign EACH task to a DIFFERENT specialist agent — invent clear role names (e.g. "Peneliti", "Penulis", "Desainer", "Developer", "Editor"). Agents will work independently, so each task must be self-contained. Respond with ONLY JSON: {"todos":[{"task":"...","agent":"..."}]}`
      const reply = await callAIChat(aiConfig, [{ role: 'system', content: sys }, { role: 'user', content: goal }])
      const data = extractJSON(reply)
      const todos = (data.todos || [])
        .map((t, i) => ({ id: i + 1, task: String(t.task || '').trim(), agent: String(t.agent || `Agent ${i + 1}`).trim() }))
        .filter((t) => t.task)
      if (!todos.length) { setOrchError('AI tidak menghasilkan daftar tugas. Coba lagi.'); return }
      setOrch((o) => ({ ...o, analyzing: false, todos }))
      flash(`${todos.length} tugas dibuat, masing-masing ditangani 1 agent.`)
    } catch (e) {
      setOrchError(e.message || 'Gagal menganalisis target.')
    } finally {
      setOrch((o) => ({ ...o, analyzing: false }))
    }
  }

  const runAll = async () => {
    if (!orch.todos.length || orch.running) return
    setOrchError('')
    setOrch((o) => ({ ...o, running: true, results: {} }))
    const results = {}
    let context = ''
    for (const todo of orch.todos) {
      results[todo.id] = { status: 'running', text: '' }
      setOrch((o) => ({ ...o, results: { ...results } }))
      try {
        const sys = `You are ${todo.agent} — one agent in an orchestrated team led by an orchestrator agent. ${context ? `You may use the results of agents who already worked:\n${context}` : ''}\nProject goal: ${orch.goal}. Work independently and deliver a concise, useful result for your task.`
        const reply = await callAIChat(aiConfig, [{ role: 'system', content: sys }, { role: 'user', content: `Tugas kamu: ${todo.task}. Kerjakan sekarang dan berikan hasil ringkas.` }])
        results[todo.id] = { status: 'done', text: reply }
        context += `\n[${todo.agent}] ${todo.task} → ${reply}`
      } catch (e) {
        results[todo.id] = { status: 'error', text: e.message }
      }
      setOrch((o) => ({ ...o, results: { ...results } }))
    }
    setOrch((o) => ({ ...o, running: false }))
  }

  const resetOrch = () => {
    setOrch({ goal: '', analyzing: false, todos: [], results: {}, running: false })
    setOrchError('')
  }

  return (
    <div className="agent-container-main">
      {/* Header + tabs + tombol konfigurasi */}
      <div className="agent-header-row">
        <div className="agent-header-left">
          <div className="agent-title-row">
            <h1>AI Agent</h1>
            <span className="agent-beta-badge">Beta</span>
            <span className={`metadata-provider-dot ${configReady ? 'active' : 'inactive'}`} style={{ marginLeft: 8 }} />
          </div>
          <p className="agent-desc-sub">
            {configReady
              ? `Model aktif: ${aiConfig.model} · ${normalizeBaseUrl(aiConfig.base_url)}`
              : 'Konfigurasikan model AI dulu agar bisa dipakai.'}
          </p>
        </div>
        <div className="agent-header-right" style={{ gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAiConfigOpen((v) => !v)}>
            <Settings size={13} /> Konfigurasi
          </button>
        </div>
      </div>

      {/* Panel konfigurasi — tersembunyi sampai tombol Konfigurasi diklik */}
      {aiConfigOpen && (
        <div className="metadata-ai-config-card" style={{ marginBottom: 12 }}>
          <div className="metadata-ai-config-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={18} style={{ color: 'var(--accent)' }} />
              <h3>Konfigurasi Model AI</h3>
              <span className="badge badge-muted">sama dengan halaman Metadata Creator</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setAiConfigOpen(false)} title="Tutup"><X size={13} /></button>
          </div>

          <div className="metadata-ai-config-form">
            <div className="input-group">
              <label className="input-label">Provider API</label>
              <select className="input" value={aiConfig.api_type} onChange={(e) => setAiConfig((c) => ({ ...c, api_type: e.target.value }))}>
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="openai-responses">OpenAI Responses (B.AI / Responses API)</option>
                <option value="anthropic-messages">Anthropic Messages</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Base URL</label>
              <input className="input" placeholder="mis. https://api.b.ai/v1" value={aiConfig.base_url} onChange={(e) => setAiConfig((c) => ({ ...c, base_url: e.target.value }))} />
              <p className="field-hint" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Model otomatis diambil dari {normalizeBaseUrl(aiConfig.base_url) ? `${normalizeBaseUrl(aiConfig.base_url)}/models` : 'GET {base_url}/models'} begitu Base URL &amp; API Key terisi.
              </p>
            </div>
            <div className="input-group">
              <label className="input-label">API Key</label>
              <input type="password" className="input" placeholder="sk-..." value={aiConfig.api_key} onChange={(e) => setAiConfig((c) => ({ ...c, api_key: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Model</label>
              <div className="ai-model-row" style={{ display: 'flex', gap: 6 }}>
                <select className="input" style={{ flex: 1 }} value={aiConfig.model} disabled={fetchingModels} onChange={(e) => setAiConfig((c) => ({ ...c, model: e.target.value }))}>
                  <option value="">{fetchingModels ? 'Mengambil daftar model…' : (aiModels.length ? '— pilih model —' : '— ketik Base URL + API Key —')}</option>
                  {aiModels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" title="Muat ulang daftar model" disabled={fetchingModels || !aiConfig.base_url.trim()} onClick={handleFetchModels}>
                  {fetchingModels ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
                </button>
              </div>
              {aiModels.length > 0 && (
                <p className="field-hint" style={{ fontSize: '0.6875rem', color: 'var(--success)', marginTop: 2 }}>
                  <Check size={11} /> {aiModels.length} model tersedia dari Base URL ini.
                </p>
              )}
            </div>
          </div>

          {aiMsg && <p className="metadata-ai-config-msg">{aiMsg}</p>}
          {aiErr && <p className="metadata-ai-config-err">{aiErr}</p>}

          <div className="metadata-ai-config-actions">
            {activeProvider && (
              <button className="btn btn-secondary btn-sm" onClick={fillFromActiveProvider}>
                <Bot size={13} /> Pakai provider aktif ({activeProvider.display_name || activeProvider.provider_id})
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => persistConfig(aiConfig)}>
              <Check size={13} /> Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="agent-tabs">
        {TABS.map((tab) => (
          <button key={tab.id} className={`agent-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB AGENT (chat / pencarian AI) ==================== */}
      {activeTab === 'chat' && (
        <div className="agent-chat-view">
          <div className="agent-chat-messages-container">
            {messages.map((msg, i) => {
              // Indeks pertanyaan wizard terakhir (untuk menempel tombol Skip).
              const lastWizardIdx = wizard && wizard.stage !== 'done'
                ? messages.reduce((acc, m, idx) => (m.wizardStage ? idx : acc), -1)
                : -1
              // Kartu hasil wizard (semua perintah) + "Buat jadi Project" dari titik tiga.
              if (['project_setup', 'kanban_setup', 'todo_setup', 'note_setup'].includes(msg.kind)) {
                const s = msg.setup || {}
                const SETUP_LABEL = {
                  project_setup: 'Rancangan Project',
                  kanban_setup: 'Rancangan Board Kanban',
                  todo_setup: 'Rancangan Todolist',
                  note_setup: 'Rancangan Catatan',
                }
                const noteMode = msg.kind === 'note_setup'
                return (
                  <div key={`setup-${i}`} className="agent-bubble-row agent agent-plan-row">
                    <div className="agent-bubble-avatar"><ClipboardList size={16} /></div>
                    <div className="agent-bubble-content">
                      <span className="agent-bubble-sender-name">{SETUP_LABEL[msg.kind]}</span>
                      <div className="agent-plan-card agent-setup-card">
                        {msg.content && <div className="agent-plan-summary">{renderRich(msg.content)}</div>}
                        {!noteMode && <div className="agent-setup-name">{s.name || s.boardName || s.listName || 'Project'}</div>}
                        {!noteMode && s.description && <div className="agent-setup-desc">{s.description}</div>}
                        {noteMode && <div className="agent-setup-name">{s.title || 'Catatan'}</div>}
                        {noteMode && s.theme && <div className="agent-setup-desc">Label: {s.theme}</div>}
                        {noteMode && s.content && (
                          <div className="agent-setup-section">
                            <div className="agent-setup-section-head"><StickyNote size={13} /> Isi catatan</div>
                            <div className="agent-setup-note-content">{s.content}</div>
                          </div>
                        )}
                        <div className="agent-setup-sections">
                          {s.kanban && (
                            <div className="agent-setup-section">
                              <div className="agent-setup-section-head">
                                <KanbanSquare size={13} /> Kanban · {s.kanban.boardType === 'static' ? 'Statis' : 'Dinamis'} · {s.kanban.columns.length} tahap
                                {s.projectRef && <span className="agent-setup-project-ref">untuk: {s.projectRef}</span>}
                              </div>
                              {s.kanban.columns.map((c, ci) => (
                                <div key={ci} className="agent-setup-column">
                                  <span className="agent-setup-column-name">{ci + 1}. {c.name}</span>
                                  {c.items.length > 0 && (
                                    <ul className="agent-setup-items">
                                      {c.items.map((it, ii) => <li key={ii}>{it}</li>)}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {s.todos && s.todos.length > 0 && (
                            <div className="agent-setup-section">
                              <div className="agent-setup-section-head"><ListTodo size={13} /> Todolist · {s.todos.length} task</div>
                              <ul className="agent-setup-items">
                                {s.todos.map((t, ti) => <li key={ti}><strong>{t.title}</strong>{t.description ? ` — ${t.description}` : ''}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm agent-setup-create"
                          disabled={setupBusy}
                          onClick={() => applyProjectSetup(msg.kind, s)}
                        >
                          {setupBusy ? <><Loader size={13} className="spin" /> Membuat…</> : <><ClipboardList size={13} /> Buat jadi {noteMode ? 'Catatan' : 'Project'}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
              if (msg.kind === 'plan') {
                const allDone = msg.tasks.length > 0 && msg.tasks.every((t) => t.status === 'done')
                return (
                  <div key={`plan-${i}`} className="agent-bubble-row agent agent-plan-row">
                    <div className="agent-bubble-avatar"><ListTodo size={16} /></div>
                    <div className="agent-bubble-content">
                      <span className="agent-bubble-sender-name">Rencana Kerja (Todolist)</span>
                      <div className="agent-plan-card">
                        {msg.summary && <div className="agent-plan-summary">{renderRich(msg.summary)}</div>}
                        <div className="agent-plan-tasks">
                          {msg.tasks.map((task) => {
                            const isRunning = runningTaskId === task.id
                            return (
                              <div key={task.id} className={`agent-plan-task ${task.status}`}>
                                <button type="button" className="agent-plan-toggle" title={task.status === 'done' ? 'Tandai belum selesai' : 'Tandai selesai'} onClick={() => togglePlanTask(i, task.id)}>
                                  {task.status === 'done' ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                                <div className="agent-plan-task-main">
                                  <span className="agent-plan-task-title">{task.title}</span>
                                  {task.detail && <span className="agent-plan-task-detail">{task.detail}</span>}
                                </div>
                                <button type="button" className="btn btn-secondary btn-sm agent-plan-run" disabled={Boolean(runningTaskId)} onClick={() => runPlanTask(i, task.id)}>
                                  {isRunning ? <><Loader size={12} className="spin" /> Mengerjakan…</> : task.status === 'done' ? <><Play size={12} /> Ulangi</> : <><Play size={12} /> Kerjakan</>}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        <div className="agent-plan-foot">
                          {allDone ? <span className="agent-plan-all-done"><Check size={12} /> Semua tugas selesai</span> : <span>{msg.tasks.filter((t) => t.status === 'done').length}/{msg.tasks.length} selesai</span>}
                          <span className="agent-plan-hint">centang untuk menandai, atau klik "Kerjakan" agar AI mengerjakan satu tugas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              const isLastTaskResult = Boolean(msg.taskResultOf)
              return (
                <div key={i} className={`agent-bubble-row ${msg.role === 'assistant' ? 'agent' : 'user'}`}>
                  <div className="agent-bubble-avatar">
                    {msg.role === 'assistant' ? <Bot size={16} /> : <Search size={16} />}
                  </div>
                  <div className="agent-bubble-content">
                    <span className="agent-bubble-sender-name agent-bubble-sender-row">
                      <span>{isLastTaskResult ? `Hasil tugas — ${msg.taskResultOf}` : (msg.role === 'assistant' ? 'AI Agent' : 'Anda')}</span>
                    </span>
                    <div className="agent-bubble-text">
                      {msg.role === 'assistant' && !msg.wizardStage && (
                        <span className="agent-msg-menu-wrap">
                          <button
                            type="button"
                            className="agent-msg-copy-btn agent-msg-more-btn"
                            title="Menu pesan"
                            onClick={(e) => { e.stopPropagation(); setMsgMenuIdx(msgMenuIdx === i ? null : i) }}
                          >
                            <MoreVertical size={12} />
                          </button>
                          {msgMenuIdx === i && (
                            <span className="agent-msg-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="agent-msg-menu-item"
                                disabled={setupBusy}
                                onClick={() => generateProjectFromMessage(i)}
                              >
                                {setupBusy ? <Loader size={12} className="spin" /> : <ClipboardList size={12} />}
                                Buat jadi Project
                              </button>
                            </span>
                          )}
                        </span>
                      )}
                      <button type="button" className="agent-msg-copy-btn" title="Salin pesan" onClick={() => handleCopyMessage(msg.content)}>
                        <Copy size={12} />
                      </button>
                      {msg.role === 'assistant' ? renderRich(msg.content) : msg.content.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}
                      {/* Tombol Skip pada pertanyaan wizard aktif (tahap terakhir) */}
                      {msg.role === 'assistant' && i === lastWizardIdx && msg.wizardStage && (
                        <div className="agent-wizard-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => sendWizardAnswer('skip')}
                          >
                            <FastForward size={12} /> Skip — tentukan sendiri untuk saya
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {busy && (
              <div className="agent-bubble-row agent">
                <div className="agent-bubble-avatar"><Bot size={16} /></div>
                <div className="agent-bubble-content">
                  <span className="agent-bubble-sender-name">AI Agent</span>
                  <div className="agent-bubble-text"><Loader size={12} className="spin" /> Mencari &amp; mengetik…</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="agent-chat-input-row">
            {/* Model switcher */}
            <div className="agent-model-switcher" ref={modelSwitcherRef}>
              <button
                type="button"
                className="agent-model-chip"
                onClick={() => setShowModelSwitcher((v) => !v)}
                title="Ganti model"
              >
                <Cpu size={12} />
                <span className="agent-model-chip-name">{aiConfig.model || 'Model'}</span>
                <span className="agent-model-chip-arrow">{showModelSwitcher ? '▼' : '▲'}</span>
              </button>
              {showModelSwitcher && (
                <div className="agent-model-dropdown">
                  <div className="agent-model-dropdown-title">{aiModels.length ? `Model tersedia (${aiModels.length})` : 'Model'}</div>
                  {aiModels.length > 0 ? (
                    aiModels.map((m) => (
                      <button key={m} type="button" className={`agent-model-opt ${m === aiConfig.model ? 'active' : ''}`} onClick={() => pickModel(m)}>
                        {m === aiConfig.model && <Check size={12} />}
                        {m}
                      </button>
                    ))
                  ) : (
                    <div className="agent-model-opt-empty" onClick={() => { setShowModelSwitcher(false); setAiConfigOpen(true) }}>
                      Belum ada model — buka Konfigurasi untuk fetch
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="agent-search-input-wrap">
              <Search size={15} className="agent-search-icon" />
              <textarea
                ref={chatFieldRef}
                className="agent-chat-field"
                rows={1}
                placeholder={wizard && wizard.stage !== 'done'
                  ? 'Jawab pertanyaan wizard… (ketik "skip" bila mau melewati)'
                  : 'Cari / tanya AI... ketik / untuk akses halaman CRUD'}
                value={chatInput}
                onChange={(e) => {
                  handleChatInputChange(e.target.value)
                  if (chatFieldRef.current) {
                    chatFieldRef.current.style.height = 'auto'
                    chatFieldRef.current.style.height = Math.min(chatFieldRef.current.scrollHeight, 150) + 'px'
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() }
                  if (e.key === 'Escape') { setShowSlashMenu(false); setShowInputMenu(false); setShowModelSwitcher(false) }
                }}
                disabled={busy}
              />
              {chatInput && !busy && (
                <button className="agent-search-clear" onClick={() => { setChatInput(''); setShowSlashMenu(false) }} title="Bersihkan"><X size={13} /></button>
              )}
              {showSlashMenu && (
                <div className="agent-slash-menu">
                  <div className="agent-slash-menu-title">Halaman yang bisa di-CRUD</div>
                  {SLASH_PAGES.map((p) => (
                    <button key={p.id} type="button" className="agent-slash-item" onClick={() => handleSlashSelect(p)}>
                      <span className="agent-slash-item-icon"><p.icon size={14} /></span>
                      <span className="agent-slash-item-main">
                        <span className="agent-slash-item-label">/{p.label}</span>
                        <span className="agent-slash-item-desc">{p.desc}</span>
                      </span>
                      <span className="agent-slash-item-enter"><ChevronRight size={13} /></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol titik tiga → menu lampiran ke atas */}
            <div className="agent-input-menu-btn-wrap" ref={inputMenuWrapRef}>
              <button
                type="button"
                className="agent-input-menu-btn"
                onClick={() => setShowInputMenu((v) => !v)}
                title="Lampirkan file / gambar"
                disabled={busy}
              >
                <span className="agent-input-menu-dots">⋯</span>
              </button>
              {showInputMenu && (
                <div className="agent-input-menu">
                  <label className="agent-input-menu-item" onClick={() => { fileInputRef.current?.click(); setShowInputMenu(false) }}>
                    <FileText size={14} /> Upload file
                    <span className="agent-input-menu-badge">{supportsFile ? '✓' : '—'}</span>
                  </label>
                  <label className="agent-input-menu-item" onClick={() => { imageInputRef.current?.click(); setShowInputMenu(false) }}>
                    <ImageIcon size={14} /> Upload gambar
                    <span className="agent-input-menu-badge">{supportsImage ? '✓' : (aiConfig.model ? '⚠️' : '—')}</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept=".txt,.js,.py,.json,.md,.csv,.html,.css,.ts,.tsx,.jsx,.sql,.yml,.yaml,.xml,.sh,.bat,.ps1,.env,.toml,.ini,.cfg" className="attendance-file-input" onChange={handleFilePick} />
                  <input ref={imageInputRef} type="file" accept="image/*" className="attendance-file-input" onChange={handleImagePick} />
                  <div className="agent-input-menu-hint">✓ = model mendukung jenis ini</div>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleSendChat} disabled={busy || (!chatInput.trim() && attachments.length === 0)} title="Kirim (Enter)">
              {busy ? <Loader size={15} className="spin" /> : <Send size={15} />}
            </button>
          </div>
          {/* Chip lampiran */}
          {wizard && (
            <div className="agent-attach-row">
              <button type="button" className="agent-wizard-cancel" onClick={cancelWizard} disabled={busy}>
                <X size={12} /> Batalkan wizard
              </button>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="agent-attach-row">
              {attachments.map((a) => (
                <span key={a.id} className="agent-attach-chip">
                  <span className="agent-attach-chip-icon">{a.kind === 'file' ? <FileText size={12} /> : <ImageIcon size={12} />}</span>
                  <span className="agent-attach-chip-name">{a.name}</span>
                  <button type="button" className="agent-attach-chip-remove" onClick={() => removeAttachment(a.id)} title="Hapus"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB ORCHESTRATOR ==================== */}
      {activeTab === 'orchestrator' && (
        <div className="agent-orchestrator">
          <div className="metadata-ai-config-card">
            <div className="metadata-ai-config-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Network size={18} style={{ color: 'var(--accent)' }} />
                <h3>Orchestrator — 1 agent utama mengatur beberapa agent</h3>
              </div>
              {orch.todos.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={resetOrch}><Trash2 size={13} /> Reset</button>
              )}
            </div>
            <p className="agent-orch-desc">
              Agent utama memahami keinginan kamu, lalu menyusun <strong>daftar tugas (todolist)</strong>. Setiap 1 tugas dikerjakan oleh 1 agent khusus, dan agent yang bekerja kemudian bisa melihat hasil agent sebelumnya.
            </p>
            <div className="agent-orch-goal-row">
              <div className="agent-search-input-wrap" style={{ flex: 1 }}>
                <Sparkles size={15} className="agent-search-icon" />
                <input
                  className="agent-chat-field"
                  placeholder="Tulis target/keinginanmu... mis. buat landing page produk kopi"
                  value={orch.goal}
                  onChange={(e) => setOrch((o) => ({ ...o, goal: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') analyzeGoal() }}
                  disabled={orch.analyzing || orch.running}
                />
              </div>
              <button className="btn btn-primary" onClick={analyzeGoal} disabled={!orch.goal.trim() || orch.analyzing || orch.running}>
                {orch.analyzing ? <><Loader size={13} className="spin" /> Menganalisis…</> : <><ListTodo size={13} /> Buat Todolist</>}
              </button>
            </div>
            {orchError && <p className="metadata-ai-config-err">{orchError}</p>}
          </div>

          {orch.todos.length > 0 && (
            <div className="agent-orch-flow">
              <div className="agent-orch-lead">
                <div className="agent-orch-lead-icon"><Network size={18} /></div>
                <div className="agent-orch-lead-info">
                  <span className="agent-orch-lead-name">Orchestrator Agent</span>
                  <span className="agent-orch-lead-sub">Membagi {orch.todos.length} tugas ke {new Set(orch.todos.map((t) => t.agent)).size} agent</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={runAll} disabled={orch.running || orch.analyzing}>
                  {orch.running ? <><Loader size={13} className="spin" /> Menjalankan…</> : <><Play size={13} /> Jalankan Semua</>}
                </button>
              </div>

              <div className="agent-orch-todos">
                {orch.todos.map((todo, idx) => {
                  const res = orch.results[todo.id]
                  const status = res ? res.status : (orch.running ? 'queued' : 'pending')
                  return (
                    <div key={todo.id} className={`agent-orch-todo ${status}`}>
                      <div className="agent-orch-todo-head">
                        <span className="agent-orch-todo-num">{idx + 1}</span>
                        <div className="agent-orch-todo-info">
                          <span className="agent-orch-todo-agent"><Bot size={13} /> {todo.agent}</span>
                          <span className="agent-orch-todo-task">{todo.task}</span>
                        </div>
                        <span className={`agent-orch-todo-status ${status}`}>
                          {status === 'done' ? <><Check size={12} /> Selesai</> : status === 'running' ? <><Loader size={12} className="spin" /> Berjalan</> : status === 'error' ? 'Gagal' : status === 'queued' ? 'Antre' : 'Menunggu'}
                        </span>
                      </div>
                      {res && res.text && (
                        <div className="agent-orch-todo-result">{renderRich(res.text)}</div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="agent-orch-note">
                <span className="agent-orch-note-mark">↳</span> Agent yang bekerja lebih dulu menyimpan hasilnya, dan agent berikutnya dapat membaca hasil tersebut (agent saling berhubungan melalui orchestrator).
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <div className="agent-toast"><Check size={14} /> {toast}</div>}
    </div>
  )
}