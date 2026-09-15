# PDF Tools — Technical Specification

> Luxio Project & Business Management Platform
> Version: 1.0.0 | Status: Phase 1 Implementation

---

## 1. Architecture Overview

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

## 2. Page Route

- URL: `/tools/pdf` (mapped as `pdf-tools` in Zustand currentPage)
- Sidebar: Tools dropdown → "PDF Tools"
- Role: All authenticated users

---

## 3. Tool Categories

### A. ORGANIZE
| Tool | ID | Description |
|------|----|-------------|
| Merge PDF | `merge_pdf` | Combine multiple PDFs into one |
| Split PDF | `split_pdf` | Split PDF by page ranges |
| Organize PDF | `organize_pdf` | Reorder pages via drag & drop |
| Rotate PDF | `rotate_pdf` | Rotate pages 90/180/270° |
| Extract Pages | `extract_pdf_pages` | Extract specific pages |
| Remove Pages | `remove_pdf_pages` | Delete specific pages |

### B. OPTIMIZE
| Tool | ID | Description |
|------|----|-------------|
| Compress PDF | `compress_pdf` | Reduce file size |
| Repair PDF | `repair_pdf` | Fix corrupted PDFs |
| Flatten PDF | `flatten_pdf` | Flatten form fields & annotations |

### C. PAGE MANAGEMENT
| Tool | ID | Description |
|------|----|-------------|
| Crop PDF | `crop_pdf` | Crop page dimensions |
| Add Page Numbers | `add_page_numbers` | Insert page numbers |
| Watermark PDF | `watermark_pdf` | Add text/image watermark |

### D. CONVERT — TO PDF
| Tool | ID |
|------|----|
| Word → PDF | `word_to_pdf` |
| Excel → PDF | `excel_to_pdf` |
| PowerPoint → PDF | `powerpoint_to_pdf` |
| JPG → PDF | `jpg_to_pdf` |
| PNG → PDF | `png_to_pdf` |
| HTML → PDF | `html_to_pdf` |
| TXT → PDF | `txt_to_pdf` |
| Markdown → PDF | `markdown_to_pdf` |

### E. CONVERT — FROM PDF
| Tool | ID |
|------|----|
| PDF → Word | `pdf_to_word` |
| PDF → Excel | `pdf_to_excel` |
| PDF → PowerPoint | `pdf_to_powerpoint` |
| PDF → JPG | `pdf_to_jpg` |
| PDF → PNG | `pdf_to_png` |
| PDF → HTML | `pdf_to_html` |
| PDF → TXT | `pdf_to_txt` |
| PDF → Markdown | `pdf_to_markdown` |
| PDF/A | `pdf_to_pdfa` |

### F. SECURITY
| Tool | ID | Description |
|------|----|-------------|
| Protect PDF | `protect_pdf` | Add password protection |
| Unlock PDF | `unlock_pdf` | Remove password |
| Encrypt PDF | `encrypt_pdf` | AES encryption |
| Sign PDF | `sign_pdf` | Digital signature |
| Redact PDF | `redact_pdf` | Permanently remove content |
| Remove Metadata | `remove_pdf_metadata` | Strip metadata |

### G. OCR & EXTRACTION
| Tool | ID | Description |
|------|----|-------------|
| OCR PDF | `ocr_pdf` | Extract text from scanned PDF |
| Image to Text | `image_to_text` | OCR on images |
| Table OCR | `table_ocr` | Extract tables |
| Searchable PDF | `create_searchable_pdf` | Add OCR text layer |

---

## 4. Tool Registry Schema

```json
{
  "name": "merge_pdf",
  "category": "pdf.organize",
  "icon": "Merge",
  "description": "Merge multiple PDF documents into one document.",
  "input_schema": {
    "files": { "type": "array", "required": true },
    "page_order": { "type": "array", "required": false }
  },
  "output_schema": {
    "file": { "type": "blob" },
    "page_count": { "type": "number" }
  },
  "permissions": ["pdf.create"],
  "supports_agent": true,
  "supports_workflow": true,
  "supports_ui": true,
  "phase": 1,
  "implemented": true
}
```

---

## 5. Tool Execution Lifecycle

```
REQUEST → VALIDATE → CHECK PERMISSION → CREATE JOB → PROCESS → STORE → RETURN RESULT
```

Job states: `queued | processing | completed | failed | cancelled`

---

## 6. Frontend Architecture

```
app/src/
├── pages/
│   └── PdfTools.jsx          # Main page
│   └── PdfTools.css           # Styles
├── services/
│   └── pdfToolRegistry.js     # Tool definitions & registry
│   └── pdfToolService.js      # PDF processing engine wrapper
├── store/
│   └── useStore.js            # pdfToolHistory state
```

---

## 7. Backend Integration

### API Endpoints
```
GET    /api/tools                    # List all tools (existing)
POST   /api/tools/:name/execute      # Execute tool (existing)
GET    /api/jobs/:id                 # Job status
```

### Tool Registry (tools.rs)
PDF tools registered as agent-callable tools with proper schemas.

---

## 8. Implementation Phases

### Phase 1 — Core (Current)
- Tool Registry
- Merge, Split, Compress, Rotate, Extract Pages, Remove Pages
- Client-side processing with pdf-lib
- Job progress UI
- Result panel (preview, download, save)

### Phase 2 — Converters
- TO PDF: Word, Excel, PPT, JPG, PNG, HTML, TXT, MD
- FROM PDF: Word, Excel, PPT, JPG, PNG, HTML, TXT, MD

### Phase 3 — Editor
- Text, Image, Shape, Annotation, Watermark, Page Numbers, Crop

### Phase 4 — Security
- Protect, Unlock, Encrypt, Decrypt, Sign, Redact, Metadata

### Phase 5 — OCR
- OCR, Table OCR, Searchable PDF, Image to Text

### Phase 6 — Agent Integration
- Tool discovery, calling, chaining, execution

### Phase 7 — Workflow
- Tool nodes, input/output mapping, conditions, triggers

---

## 9. Libraries

### Frontend
- `pdf-lib` — PDF manipulation (merge, split, rotate, compress)
- `jspdf` — PDF generation (already installed)
- `file-saver` — Download files

### Backend (Future)
- `lopdf` — Rust PDF library
- `printpdf` — Rust PDF generation
