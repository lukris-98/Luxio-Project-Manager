/* ============================================================
   SCRIPT.JS — Logika utama halaman perbandingan stack
   Isi:
   1. RENDER — fungsi menampilkan tabel, chart, kartu pemenang
   2. TOOLTIP — sistem tooltip (i) untuk semua tabel
   3. INTERAKSI — tab, sorting, pencarian glossary
   4. INISIALISASI — menjalankan semua saat halaman dimuat

   Catatan: data ada di data.js (dipisah agar mudah dipelajari).
   ============================================================ */

"use strict";

/* ============================================================
   1. RENDER
   ============================================================ */

const main = document.querySelector("main");

/* ---------- RENDER SATU SECTION PERBANDINGAN ---------- */
function renderSection(key, config, isStorage) {
  // Hitung total poin setiap item (v = nilai, why = alasan)
  const totals = config.items.map((item, i) => ({
    ...item,
    index: i,
    total: item.scores.reduce((a, s) => a + s.v, 0)
  }));

  // Cari skor tertinggi untuk menandai pemenang
  const maxTotal = Math.max(...totals.map(t => t.total));

  // Buat elemen section
  const section = document.createElement("section");
  section.className = "comparison-section";
  section.id = `section-${key}`;
  section.dataset.tab = key;

  section.innerHTML = `
    <h2 class="section-title">${config.title}</h2>
    <p class="section-subtitle">${config.subtitle}</p>

    <!-- Kartu pemenang -->
    <div class="winner-card">
      <span class="winner-trophy">🏆</span>
      <div>
        <strong>Pemenang: ${config.winner}</strong>
        <p>${config.note}</p>
      </div>
    </div>

    <!-- Tombol sortir -->
    <button class="sort-toggle" data-sort="${key}" data-dir="desc">
      ⬇️ Urutkan berdasarkan total poin (tertinggi)
    </button>

    <!-- Tabel -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${isStorage ? "Penyedia" : "Kriteria"}
              <span class="info-icon" data-tip="${isStorage ? 'Daftar penyedia yang dibandingkan. Arahkan kursor ke nama penyedia untuk info lengkap.' : 'Klik ikon (i) untuk penjelasan setiap kriteria.'}">i</span>
            </th>
            ${totals.map(t => `
              <th>${t.name}
                <span class="info-icon" data-tip="<b>${t.name}</b><br>${t.about}">i</span>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody id="body-${key}">
          <!-- Isi di-render oleh renderBody() -->
        </tbody>
        <tfoot>
          <tr>
            <td>🏆 Total Poin</td>
            ${totals.map(t => `
              <td class="${t.total === maxTotal ? "score best" : "score"}">${t.total}</td>
            `).join("")}
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Bar chart -->
    <div class="chart-wrap">
      <h3>📊 Visualisasi total poin</h3>
      <div id="chart-${key}">
        ${totals.map(t => `
          <div class="chart-row">
            <div class="chart-label">${t.name}</div>
            <div class="chart-bar-track">
              <div class="chart-bar ${t.total === maxTotal ? "winner" : ""}"
                   data-width="${(t.total / maxTotal) * 100}"></div>
            </div>
            <div class="chart-score">${t.total}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  main.appendChild(section);

  // Render isi tabel
  if (isStorage) {
    renderStorageBody(key, config, totals);
  } else {
    renderBody(key, config, totals);
  }
}

/* ---------- RENDER BARIS TABEL BIASA (kriteria sebagai baris) ---------- */
function renderBody(key, config, totals) {
  const tbody = document.getElementById(`body-${key}`);
  const rows = config.items[0].scores.map((_, idx) => {
    // Ambil skor per kriteria dari semua item
    const cells = totals.map(t => {
      const best = Math.max(...config.items.map(i => i.scores[idx].v));
      const val = t.scores[idx].v;
      const why = t.scores[idx].why;
      const tip = `<b>${t.name} — ${KRITERIA[key][idx].label}</b><br>${why}`;
      return `<td><span class="score ${val === best ? "best" : ""}">${val}</span>
        <span class="info-icon" data-tip="${tip}">i</span></td>`;
    });
    return `
      <tr>
        <td>${KRITERIA[key][idx].label}
          <span class="info-icon" data-tip="<b>Kriteria: ${KRITERIA[key][idx].label}</b><br>${KRITERIA[key][idx].desc}">i</span>
        </td>
        ${cells.join("")}
      </tr>
    `;
  });
  tbody.innerHTML = rows.join("");
}

/* ---------- RENDER BARIS TABEL STORAGE (penyedia sebagai baris) ---------- */
function renderStorageBody(key, config, totals) {
  const tbody = document.getElementById(`body-${key}`);
  const rows = config.items.map(item => {
    const cells = item.scores.map((s, idx) => {
      const best = Math.max(...config.items.map(i => i.scores[idx].v));
      const tip = `<b>${item.name} — ${KRITERIA.storage[idx].label}</b><br>${s.why}`;
      return `<td><span class="score ${s.v === best ? "best" : ""}">${s.v}</span>
        <span class="info-icon" data-tip="${tip}">i</span></td>`;
    });
    return `
      <tr>
        <td>${item.name}
          <span class="info-icon" data-tip="<b>${item.name}</b><br>${item.about}">i</span>
        </td>
        ${cells.join("")}
      </tr>
    `;
  });
  tbody.innerHTML = rows.join("");
}

/* ---------- RENDER GLOSARIUM ---------- */
function renderGlossary() {
  const section = document.createElement("section");
  section.className = "comparison-section";
  section.id = "section-glossary";
  section.dataset.tab = "glossary";

  section.innerHTML = `
    <h2 class="section-title">📖 Glosarium Lengkap</h2>
    <p class="section-subtitle">
      Ketik untuk mencari istilah. Klik kartu untuk membuka penjelasan lengkap.
      Jumlah istilah: <strong>${GLOSARIUM.length}</strong>
    </p>
    <input type="text" class="glossary-search" id="glossarySearch"
           placeholder="🔍 Cari istilah... (mis. 'Neon', 'Rust', 'Bucket')" />
    <div id="glossaryList"></div>
  `;

  main.appendChild(section);
  renderGlossaryList("");
}

/* ---------- RENDER DAFTAR ISTILAH GLOSARIUM ---------- */
function renderGlossaryList(query) {
  const list = document.getElementById("glossaryList");
  const q = query.toLowerCase().trim();

  const filtered = GLOSARIUM.filter(term =>
    !q || term.name.toLowerCase().includes(q) ||
    (term.apa + term.fungsi + term.cara).toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">Tidak ada istilah ditemukan untuk "${query}".</div>`;
    return;
  }

  list.innerHTML = filtered.map(term => `
    <div class="term-card">
      <button class="term-header">
        <span>${term.name}</span>
        <span class="arrow" data-lucide="chevron-down"></span>
      </button>
      <div class="term-body">
        <table>
          <tr><td>Apa itu</td><td>${term.apa}</td></tr>
          <tr><td>Fungsinya</td><td>${term.fungsi}</td></tr>
          <tr><td>Cara pakai</td><td>${term.cara}</td></tr>
        </table>
      </div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

/* ============================================================
   2. TOOLTIP — ikon (i) yang menampilkan info saat di-hover
   ============================================================ */
function setupTooltip() {
  // Buat elemen tooltip sekali saja
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".info-icon");
    if (!target) return;

    const tip = target.dataset.tip;
    if (!tip) return;

    tooltip.innerHTML = tip;
    tooltip.style.display = "block";
  });

  document.addEventListener("mousemove", (e) => {
    if (tooltip.style.display !== "block") return;

    // Posisi tooltip mengikuti kursor, dengan offset
    const pad = 16;
    let x = e.clientX + pad;
    let y = e.clientY + pad;

    // Cegah tooltip keluar dari layar
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    if (x + tw > window.innerWidth) x = e.clientX - tw - pad;
    if (y + th > window.innerHeight) y = e.clientY - th - pad;

    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(".info-icon")) {
      tooltip.style.display = "none";
    }
  });
}

/* ============================================================
   3. INTERAKSI
   ============================================================ */

/* ---------- SORTIR TABEL ---------- */
function setupSorting() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".sort-toggle");
    if (!btn) return;

    const key = btn.dataset.sort;
    const dir = btn.dataset.dir;
    const config = key === "storage" ? STORAGE : DATA[key];

    const totals = config.items.map((item, i) => ({
      ...item, index: i, total: item.scores.reduce((a, s) => a + s.v, 0)
    }));
    totals.sort((a, b) => dir === "desc" ? b.total - a.total : a.total - b.total);

    // Saat ini hanya merender ulang seluruh tabel dengan urutan baru
    const section = document.getElementById(`section-${key}`);
    const table = section.querySelector("table");
    const theadTr = table.querySelector("thead tr");

    // Urutkan header
    const thList = [...theadTr.children];
    const firstTh = thList.shift();
    thList.sort((a, b) =>
      totals.findIndex(t => t.name === a.textContent.replace("(i)", "").trim()) -
      totals.findIndex(t => t.name === b.textContent.replace("(i)", "").trim())
    );
    theadTr.innerHTML = "";
    theadTr.appendChild(firstTh);
    thList.forEach(th => theadTr.appendChild(th));

    // Urutkan tbody
    const tbody = table.querySelector("tbody");
    const rows = [...tbody.children];
    rows.forEach(row => {
      const cells = [...row.children];
      const firstCell = cells.shift();
      const sorted = cells.sort((a, b) =>
        totals.findIndex(t => t.name === a.textContent.replace("(i)", "").trim().split(" ")[0]) -
        totals.findIndex(t => t.name === b.textContent.replace("(i)", "").trim().split(" ")[0])
      );
      row.innerHTML = "";
      row.appendChild(firstCell);
      sorted.forEach(td => row.appendChild(td));
    });

    // Urutkan tfoot
    const tfoot = table.querySelector("tfoot tr");
    const tds = [...tfoot.children];
    const firstTd = tds.shift();
    const sortedTds = tds.sort((a, b) =>
      totals.findIndex(t => `${t.total}` === a.textContent.trim()) -
      totals.findIndex(t => `${t.total}` === b.textContent.trim())
    );
    tfoot.innerHTML = "";
    tfoot.appendChild(firstTd);
    sortedTds.forEach(td => tfoot.appendChild(td));

    const maxTotal = totals[0].total;
    [...tfoot.children].forEach((td, i) => {
      td.className = "score";
      if (i > 0 && parseInt(td.textContent) === maxTotal) td.className = "score best";
    });

    btn.dataset.dir = dir === "desc" ? "asc" : "desc";
    btn.textContent = dir === "desc"
      ? "⬆️ Urutkan berdasarkan total poin (terendah)"
      : "⬇️ Urutkan berdasarkan total poin (tertinggi)";
  });
}

/* ---------- NAVIGASI TAB ---------- */
function setupTabs() {
  const nav = document.getElementById("tabNav");
  const sections = () => document.querySelectorAll(".comparison-section");

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.tab;
    sections().forEach(section => {
      section.classList.toggle("active", section.dataset.tab === target);
    });
  });
}

/* ---------- BUKA/TUTUP KARTU GLOSARIUM ---------- */
function setupGlossaryToggle() {
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".term-header");
    if (!header) return;
    const card = header.closest(".term-card");
    card.classList.toggle("open");
  });
}

/* ---------- PENCARIAN GLOSARIUM ---------- */
function setupGlossarySearch() {
  const input = document.getElementById("glossarySearch");
  if (!input) return;
  input.addEventListener("input", (e) => renderGlossaryList(e.target.value));
}

/* ============================================================
   4. INISIALISASI
   ============================================================ */
function init() {
  // 1. Render semua section perbandingan (termasuk storage)
  Object.entries(DATA).forEach(([key, config]) => renderSection(key, config, false));
  renderSection("storage", STORAGE, true);

  // 2. Render glosarium
  renderGlossary();

  // 3. Siapkan semua interaksi
  setupTabs();
  setupSorting();
  setupTooltip();
  setupGlossaryToggle();
  setupGlossarySearch();

  // 4. Tampilkan tab pertama (frontend)
  document.querySelector(".comparison-section").classList.add("active");

  // 5. Animasi bar chart
  requestAnimationFrame(() => {
    document.querySelectorAll(".chart-bar").forEach(bar => {
      bar.style.width = bar.dataset.width + "%";
    });
  });

  // 6. Muat ikon lucide
  if (window.lucide) lucide.createIcons();
}

// Jalankan setelah DOM selesai dibaca
document.addEventListener("DOMContentLoaded", init);
