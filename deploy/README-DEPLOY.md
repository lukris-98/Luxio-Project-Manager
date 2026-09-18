# Tutorial Deploy Luxio via CLI

Alur deploy lengkap: **frontend -> EdgeOne/Firebase**, **backend/kode -> GitHub**, **HF Space rebuild**.
Semua perintah dijalankan dari root proyek: `E:\Software\aplikasiku\aistudio\Luxio Project Manager`

> Atau pakai panel GUI: double-click `deploy\Deploy-Luxio.bat`

---

## 1. Frontend (build + Firebase Hosting)

```bat
cd app
npm run build
npx firebase deploy --only hosting --config ../firebase.json
```

- Site: `luxio-id.web.app` (custom domain: `luxio.web.id`)
- Login Firebase sekali saja: `npx firebase login`
- Firebase config ada di root: `firebase.json` (public: `app/dist`)

## 2. Frontend ke EdgeOne Pages

```bat
cd app
npx edgeone pages login
npx edgeone pages link
npx edgeone pages deploy
```

- `login` cukup sekali (browser).
- `link` menghubungkan folder `app` ke project EdgeOne (jawab pertanyaan nama project, arahkan output `dist`).
- Kalau perlu deploy ke production, tambahkan flag sesuai versi CLI (mis. `--prod`). Cek `npx edgeone pages deploy --help`.

## 3. Backend / semua kode -> GitHub (master)

```bat
cd "E:\Software\aplikasiku\aistudio\Luxio Project Manager"
git add -A
git commit -m "deskripsi perubahan"
git push origin master
```

- Cek dulu: `git status` dan `git diff`
- Frontend juga ikut ke repo ini (source code, bukan hasil build).

## 4. Hugging Face Space (rebuild backend)

Space HF (`https://huggingface.co/spaces/lukris/n8n`) berisi 3 file saja
(`Dockerfile`, `README.md`, `.gitignore`). Dockerfile **git clone dari GitHub
master** — jadi push GitHub dulu (langkah 3), baru push Dockerfile dengan
`CACHE_BUST` naik supaya clone terbaru dipakai.

```bat
cd hf-hf-deploy
:: 1) naikkan CACHE_BUST di Dockerfile (edit manual, mis. 33 -> 34)
::    ARG CACHE_BUST=34

git add Dockerfile
git commit -m "Bump CACHE_BUST=34 - <alasan>"
git -c credential.helper= -c "http.extraheader=Authorization: Basic <BASE64>" push origin main
```

- `<BASE64>` = base64 dari `lukris:<HF_TOKEN_WRITE>`. Cara cepat di PowerShell:

```powershell
$tok = "hf_xxx"
[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("lukris:$tok"))
```

- HF token (write) juga tersimpan di `backend\.env` baris `HF_TOKEN=...`.
- Rebuild otomatis ±5-10 menit. Pantau:
  `https://huggingface.co/api/spaces/lukris/n8n` -> `runtime.stage`
- Env/secrets (DATABASE_URL, OWNER_EMAIL, OWNER_PASSWORD, NEON_API_KEY,
  B2_KEY_ID, B2_APP_KEY, SMTP/RESEND, dst.) diatur di
  **Settings -> Variables and secrets** pada Space.

---

## Ringkasan urutan deploy penuh

```
1. cd app && npm run build
2. npx firebase deploy --only hosting --config ../firebase.json
3. npx edgeone pages deploy                (opsional)
4. cd .. && git add -A && git commit -m "..." && git push origin master
5. cd hf-hf-deploy  ->  edit CACHE_BUST  ->  git add Dockerfile
   git commit -m "Bump CACHE_BUST=N"  ->  git push origin main (dengan token)
6. Tunggu Space RUNNING
```

## Catatan penting

- **OWNER_PASSWORD**: saat Space start, password akun owner otomatis
  disinkronkan ke env `OWNER_PASSWORD` (PIN ikut di-reset bila password
  berubah). Set secret ini di Space bila ingin mengubah password master.
- **api.neon.tech** sempat DNS-nya kosong (gangguan Neon); kode sudah punya
  fallback ke `console.neon.tech/api/v2` dan DoH (1.1.1.1 / 8.8.8.8).
- Jangan pernah commit token/password ke GitHub. Token hanya via
  `http.extraheader` sekali-pakai saat push ke HF.
