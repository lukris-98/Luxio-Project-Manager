# PDF Tools — Technical Specification

> Luxio Project & Business Management Platform
> Version: 1.0.0 | Status: Phase 1 Implementation
> Last updated: 2026-09-16

Legend: ✅ = Sudah dibuat & teruji | ❌ = Belum dibuat | 🔨 = Dalam progress

---

## 1. Architecture Overview ✅

```
UI (PdfToolsPage)
  ↓
Tool Registry (pdfToolRegistry.js)
  ↓
PDF Tool Service (pdfToolService.js)
  ↓
PDF Engine (pdf-lib / jspdf)
  ↓
Storage (IndexedDB + B2)
```

Agent path:
```
AI Agent → Tool Registry → PDF Tool → Result
```

---

## 2. Page Route ✅

- ✅ URL: `/tools/pdf` (mapped as `pdf-tools` in Zustand currentPage)
- ✅ Sidebar: Tools dropdown → "PDF Tools"
- ✅ Role: All authenticated users
- ✅ Routing: App.jsx switch case + lazy load + preload

---

## 3. Tool Categories ✅

### A. ORGANIZE ✅
| Tool | ID | Status | Tested |
|------|----|--------|--------|
| Merge PDF | `merge_pdf` | ✅ | ✅ 5 pages merged |
| Split PDF | `split_pdf` | ✅ | ✅ pages extracted |
| Organize PDF | `organize_pdf` | ✅ | ✅ reorder 3,1,2 |
| Rotate PDF | `rotate_pdf` | ✅ | ✅ 90°+180° fixed `degrees()` API |
| Extract Pages | `extract_pdf_pages` | ✅ | ✅ pages 1,3 extracted |
| Remove Pages | `remove_pdf_pages` | ✅ | ✅ page 2 removed |

### B. OPTIMIZE ✅
| Tool | ID | Status | Tested |
|------|----|--------|--------|
| Compress PDF | `compress_pdf` | ✅ | ✅ re-serialize with object streams |
| Repair PDF | `repair_pdf` | ❌ | — |
| Flatten PDF | `flatten_pdf` | ❌ | — |

### C. PAGE MANAGEMENT ❌
| Tool | ID | Status |
|------|----|--------|
| Crop PDF | `crop_pdf` | ❌ Phase 3 |
| Add Page Numbers | `add_page_numbers` | ❌ Phase 3 |
| Watermark PDF | `watermark_pdf` | ❌ Phase 3 |

### D. CONVERT — TO PDF ✅
| Tool | ID | Status | Tested |
|------|----|--------|--------|
| Word → PDF | `word_to_pdf` | ❌ | — |
| Excel → PDF | `excel_to_pdf` | ❌ | — |
| PowerPoint → PDF | `powerpoint_to_pdf` | ❌ | — |
| JPG → PDF | `jpg_to_pdf` | ✅ | ✅ embedJpg + addPage |
| PNG → PDF | `png_to_pdf` | ✅ | ✅ embedPng + addPage |
| HTML → PDF | `html_to_pdf` | ❌ | — |
| TXT → PDF | `txt_to_pdf` | ✅ | ✅ jsPDF splitTextToSize |
| Markdown → PDF | `markdown_to_pdf` | ❌ | — |

### E. CONVERT — FROM PDF ✅
| Tool | ID | Status | Tested |
|------|----|--------|--------|
| PDF → Word | `pdf_to_word` | ❌ | — |
| PDF → Excel | `pdf_to_excel` | ❌ | — |
| PDF → PowerPoint | `pdf_to_powerpoint` | ❌ | — |
| PDF → JPG | `pdf_to_jpg` | ❌ | — |
| PDF → PNG | `pdf_to_png` | ❌ | — |
| PDF → HTML | `pdf_to_html` | ❌ | — |
| PDF → TXT | `pdf_to_txt` | ✅ | ✅ basic text extraction |
| PDF → Markdown | `pdf_to_markdown` | ❌ | — |
| PDF/A | `pdf_to_pdfa` | ❌ | — |

### F. SECURITY ❌
| Tool | ID | Status |
|------|----|--------|
| Protect PDF | `protect_pdf` | ❌ Phase 4 |
| Unlock PDF | `unlock_pdf` | ❌ Phase 4 |
| Encrypt PDF | `encrypt_pdf` | ❌ Phase 4 |
| Sign PDF | `sign_pdf` | ❌ Phase 4 |
| Redact PDF | `redact_pdf` | ❌ Phase 4 |
| Remove Metadata | `remove_pdf_metadata` | ❌ Phase 4 |

### G. OCR & EXTRACTION ❌
| Tool | ID | Status |
|------|----|--------|
| OCR PDF | `ocr_pdf` | ❌ Phase 5 |
| Image to Text | `image_to_text` | ❌ Phase 5 |
| Table OCR | `table_ocr` | ❌ Phase 5 |
| Searchable PDF | `create_searchable_pdf` | ❌ Phase 5 |

---

## 4. Tool Registry Schema ✅

✅ Implemented in `pdfToolRegistry.js`:
- ✅ `listTools(opts)` — filter by category, search, agentOnly, phase
- ✅ `getTool(name)` — get single tool
- ✅ `getToolsByCategory()` — grouped by category
- ✅ `findToolsByCapability(query)` — for Agent tool discovery
- ✅ 13 tools registered (11 implemented, 2 coming soon)

---

## 5. Tool Execution Lifecycle ✅

```
✅ REQUEST → ✅ VALIDATE INPUT → ❌ CHECK PERMISSION → ✅ PROCESS → ✅ RETURN RESULT
```

- ✅ Job progress callback (0-100)
- ✅ Result object with file, fileName, pageCount, size
- ❌ Backend permission check (Phase 6)
- ❌ Job queue system (Phase 6)

---

## 6. Frontend Architecture ✅

```
✅ app/src/
├── ✅ pages/
│   └── ✅ PdfTools.jsx          # Main page (category grid, search, modal, progress, result)
│   └── ✅ PdfTools.css           # Enterprise workspace styling
├── ✅ services/
│   └── ✅ pdfToolRegistry.js     # 13 tool definitions with schema
│   └── ✅ pdfToolService.js      # 11 tool implementations
```

---

## 7. Backend Integration ❌

### API Endpoints
- ✅ `GET /api/tools` — existing (agent tools, not PDF tools yet)
- ❌ `POST /api/tools/:name/execute` — not wired for PDF tools yet
- ❌ `GET /api/jobs/:id` — job system not implemented

### Tool Registry (tools.rs)
- ❌ PDF tools not registered in backend tool registry yet

---

## 8. Implementation Phases

### Phase 1 — Core ✅
- ✅ Tool Registry (pdfToolRegistry.js)
- ✅ Merge PDF — tested: 3+2=5 pages
- ✅ Split PDF — tested: extract specific pages
- ✅ Compress PDF — tested: re-serialize with object streams
- ✅ Rotate PDF — tested: 90°+180° (fixed `degrees()` API)
- ✅ Extract Pages — tested: pages 1,3
- ✅ Remove Pages — tested: remove page 2
- ✅ Organize PDF — tested: reorder 3,1,2
- ✅ Client-side processing with pdf-lib
- ✅ Job progress UI (progress bar 0-100%)
- ✅ Result panel (info, download, use as input, run again)

### Phase 2 — Converters ✅ (partial)
- ✅ JPG → PDF (embedJpg + addPage)
- ✅ PNG → PDF (embedPng + addPage)
- ✅ TXT → PDF (jsPDF)
- ✅ PDF → TXT (basic extraction)
- ❌ Word → PDF, Excel → PDF, PowerPoint → PDF
- ❌ PDF → Word, PDF → Excel, PDF → PowerPoint
- ❌ HTML → PDF, Markdown → PDF
- ❌ PDF → JPG, PDF → PNG, PDF → HTML, PDF → Markdown, PDF/A

### Phase 3 — Editor ❌
- ❌ Text, Image, Shape, Annotation
- ❌ Watermark, Page Numbers, Crop

### Phase 4 — Security ❌
- ❌ Protect, Unlock, Encrypt, Decrypt
- ❌ Sign, Redact, Metadata

### Phase 5 — OCR ❌
- ❌ OCR, Table OCR, Searchable PDF, Image to Text

### Phase 6 — Agent ❌
- ❌ Backend tool registration
- ❌ Agent tool discovery/calling
- ❌ Tool chaining via Agent

### Phase 7 — Workflow ❌
- ❌ Tool nodes, input/output mapping
- ❌ Conditions, triggers, scheduled execution

---

## 9. UI Features ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Category grid layout | ✅ | 4 active categories |
| Search tools | ✅ | by name, description, category |
| Tool cards (icon, name, desc, format) | ✅ | |
| "Coming soon" badge | ✅ | for unimplemented tools |
| Drag & drop upload | ✅ | with accept filter |
| Multi-file support | ✅ | for merge, image-to-PDF |
| Dynamic form fields | ✅ | select, text input from schema |
| Progress bar | ✅ | 0-100% with spinner |
| Result panel | ✅ | info, size, pages |
| Download result | ✅ | via file-saver |
| Use as input (chaining) | ✅ | load result into next tool |
| Run again | ✅ | reset form |
| Recent operations | ✅ | last 20, with download |
| Error handling | ✅ | user-friendly messages |
| Responsive (mobile/tablet) | ✅ | grid adapts |

---

## 10. Testing Results ✅

```
1.  Create PDF (3 pages): 594 bytes OK
2.  Create PDF (2 pages): 588 bytes OK
3.  Merge: 5 pages OK
4.  Extract pages 1,3: 2 pages OK
5.  Rotate pages: 90 + 180 degrees OK
6.  Remove page 2: 2 pages OK
7.  Organize 3,1,2: 3 pages OK
8.  Compress: 0% reduction OK (empty pages = no compression gain)
9.  parseRanges 1-3,5: [0,1,2,4] OK
10. parseRanges 2,4,6-8: [1,3,5,6,7] OK
11. Registry listTools: 13 tools OK
12. Registry getTool merge_pdf: Merge PDF OK
13. Registry getToolsByCategory: 4 categories OK
14. Registry findToolsByCapability merge: 1 result OK
15. Implemented: 11, Coming soon: 2 OK

All 15 tests passed.
```

---

## 11. Libraries ✅

### Frontend
- ✅ `pdf-lib` — PDF manipulation (merge, split, rotate, compress, extract, remove)
- ✅ `jspdf` — PDF generation (TXT → PDF)
- ✅ `file-saver` — Download files
- ✅ `framer-motion` — Animations (already installed)

### Backend (Future)
- ❌ `lopdf` — Rust PDF library
- ❌ `printpdf` — Rust PDF generation

---

## 12. Bug Fixes Applied

| Bug | Fix |
|-----|-----|
| `setRotation({ angle: 90 })` crash | Changed to `setRotation(degrees(90))` using pdf-lib `degrees` helper |
| `fmtSize` not exported | Added `export` keyword to function |
| Parameter name collision (`degrees` function vs parameter) | Renamed parameter to `deg` |

---

## 13. Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `PDF-TOOLS-SPEC.md` | New | ~300 |
| `app/src/services/pdfToolRegistry.js` | New | 349 |
| `app/src/services/pdfToolService.js` | New | 418 |
| `app/src/pages/PdfTools.jsx` | New | ~350 |
| `app/src/pages/PdfTools.css` | New | ~400 |
| `app/src/App.jsx` | Modified | +4 lines (import, case, preload) |
| `app/src/components/Layout.jsx` | Modified | +8 lines (TOOL_LINKS, NAV_COLORS) |
| `app/src/pages/Apps.jsx` | Modified | +2 lines (INTERNAL_APPS, import) |
| `app/package.json` | Modified | +2 deps (pdf-lib, file-saver) |
