# Kemampuan Compute & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan compute Neon dan **kode mana yang melakukan apa**, berdasarkan [computes.md](computes.md) dan [../reference-api/endpoints/](../reference-api/endpoints/).

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Efek |
|---|---|---|
| Buat compute (R/W atau read replica) | `POST /projects/{id}/endpoints` | Compute baru di branch target |
| Resize / autoscaling / scale-to-zero | `PATCH .../endpoints/{ep}` | Ubah `type`, `size`, `autoscaling_limit_*`, `suspend_timeout_seconds` |
| Start / Suspend / Restart | `POST .../endpoints/{ep}/start` / `suspend` / `restart` | Kontrol status aktif (hemat compute hours) |
| Hapus compute | `DELETE .../endpoints/{ep}` | Bebaskan limit; compute primary terakhir bisa dihapus |
| Read replica (read-only compute) | buat endpoint `type: read_only` | Bebankan query analitik ke replica |
| Lihat detail + status | `GET .../endpoints/{ep}` | `host`, `current_state`, `pending_state` |

## 2. Alur Compute

```
Buat project ──► compute R/W primary otomatis di branch main
        │
        ├── beban baca besar ──► tambah read replica (compute read_only)
        │
        ├── hemat biaya ──► scale-to-zero (suspend saat idle, wake otomatis saat koneksi)
        │
        └── langganan malas ──► POST /suspend ──► POST /start (atau biarkan auto-wake)
```

Connection string aplikasi selalu mengarah ke host compute (`ep-xxx.region.aws.neon.tech`) — compute down/idle tetap menerima koneksi: serverless driver membangunkannya otomatis.

## 3. Penjelasan Kode

### 3.1 Buat read replica (computes.md)

```bash
curl -X POST 'https://console.neon.tech/api/v2/projects/PROJECT_ID/endpoints' \
  -H 'Authorization: Bearer $NEON_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
  "endpoint": {
    "type": "read_only",           // (1) read replica: hanya SELECT
    "branch_id": "br-xxx"          // (2) branch yang direplikasi
  }
}'
```

- `type: read_only` → compute read-only; query berat (laporan/BI) dipindah ke sini sehingga compute primary tidak terganggu.
- `branch_id` wajib — replica selalu milik satu branch.
- Response `endpoint.host` = host koneksi replica; pakai connection string berbeda dari primary.

### 3.2 Resize + autoscaling + scale-to-zero (PATCH)

```bash
curl -X PATCH ".../endpoints/ep-xxx" \
  -d '{ "endpoint": {
    "autoscaling_limit_min_cu": 0.5,    // (1) minimum CU saat idle
    "autoscaling_limit_max_cu": 4,      // (2) maximum CU saat beban puncak
    "suspend_timeout_seconds": 300      // (3) suspend setelah idle 5 menit (0 = tidak pernah)
  } }'
```

| Field | Melakukan apa |
|---|---|
| `autoscaling_limit_min_cu` | Ukuran minimum; 0.5 CU ≈ 1 GB RAM |
| `autoscaling_limit_max_cu` | Batas atas — menentukan biaya compute hours puncak |
| `suspend_timeout_seconds` | Scale-to-zero: 0 = selalu aktif; 300 = suspend setelah 5 menit tanpa koneksi |

- Resize memicu operasi **async** — pantau via `GET /projects/{id}/operations` sampai `finished` (lihat [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md)).

### 3.3 Kontrol status

```bash
curl -X POST ".../endpoints/ep-xxx/suspend"    # matikan (hemat compute hours)
curl -X POST ".../endpoints/ep-xxx/start"      # nyalakan sebelum deploy besar
curl -X POST ".../endpoints/ep-xxx/restart"    # terapkan konfigurasi / pulihkan hang
```

- Suspend manual berguna untuk environment non-produksi di luar jam kerja.
- Restart diperlukan setelah perubahan tertentu (`PATCH` menandai `pending_restart`).

## 4. Sizing & Biaya

| Kebutuhan | Rekomendasi |
|---|---|
| Dev/test jarang dipakai | min 0.5 CU + suspend 300s |
| Produksi stabil | min = beban dasar, max = puncak; suspend 0 (jangan pernah down) |
| Query analitik | read replica terpisah; primary tetap kecil |
| Cek pemakaian | `GET /consumption_history/v2/...` (lihat [../reference-api/consumption/](../reference-api/consumption/)) |

Biaya ∝ compute hours (RAM aktif × waktu). Scale-to-zero membuat compute idle nyaris gratis; autoscaling menangani lonjakan tanpa over-provision.
