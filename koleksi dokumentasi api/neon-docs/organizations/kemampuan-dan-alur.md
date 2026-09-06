# Kemampuan Organisasi & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan organisasi Neon dan **kode mana yang melakukan apa**, berdasarkan [organizations.md](organizations.md), [orgs-manage.md](orgs-manage.md), [orgs-api.md](orgs-api.md), [orgs-add-members-by-domain.md](orgs-add-members-by-domain.md), [orgs-api-consumption.md](orgs-api-consumption.md), [orgs-project-transfer.md](orgs-project-transfer.md), dan [orgs-cli.md](orgs-cli.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Metode | Endpoint |
|---|---|---|
| Buat organisasi (free/paid) | Console org switcher | — |
| Invite / hapus member, ubah role | Console / API | `POST .../invitations`, `PATCH .../members/{mid}` |
| Auto-join via domain email | Console org settings | — |
| Paksa 2FA untuk semua member | Console org settings | — |
| Kelola API key organisasi | Console / API | `POST .../api_keys`, `DELETE .../api_keys/{id}` |
| Batas belanja (spending limit) | Console / API | `PUT .../billing/spending_limit` |
| Lihat konsumsi org | API | `GET .../consumption_history/...` |
| Transfer project antar org | API dua langkah | `POST .../projects/transfer` |
| Kelola VPC endpoint org | API | `POST/DELETE .../vpc/region/{rid}/vpc_endpoints/{id}` |
| Kelola org via CLI | `neon orgs ...` | [orgs-cli.md](orgs-cli.md) |

## 2. Alur Manajemen Tim

```
Buat org ──► invite member (email) ──► pilih role org (Admin/Editor/Viewer/Collaborator)
              │                                        │
              │ domain auto-join: email @perusahaan.com │
              │ otomatis jadi member                    │
              ▼                                        ▼
   butuh akses lebih di 1 project? ──► project permission (per-project role)
              │
              ▼
   keamanan: enforce 2FA + spending limit + API key scoped
```

Model hak berlapis: **role org** = baseline semua project; **project permission** = perkecil/perbesar di project tertentu. Rinciannya di [../permissions/user-permissions.md](../permissions/user-permissions.md).

## 3. Penjelasan Kode

### 3.1 Invite member (orgs-manage.md / create-organization-invitations.md)

```bash
curl -X POST "https://console.neon.tech/api/v2/organizations/ORG_ID/invitations" \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{ "invitations": [
        { "email": "dev@perusahaan.com", "role": "MEMBER" }   // (1) role org awal
      ] }'
```

- `email` = penerima undangan; `role` = role org saat bergabung (`ADMIN`, `MEMBER`, dst.).
- Undangan diterima lewat email / Console; setelah bergabung role bisa diubah `PATCH .../members/{member_id}`.

### 3.2 Spending limit (set-organization-spending-limit.md)

```bash
curl -X PUT ".../organizations/ORG_ID/billing/spending_limit" \
  -d '{ "monthly_limit_usd": 100 }'    // (1) batas belanja bulanan
```

- `monthly_limit_usd` = batas konsumsi; melampaui ini compute dibatasi/dihentikan sesuai kebijakan — proteksi tagihan membengkak dari loop automasi yang lupa dihapus.

### 3.3 Transfer project antar org (transfer-projects-from-org-to-org.md)

```bash
curl -X POST ".../organizations/SOURCE_ORG/projects/transfer" \
  -d '{ "project_ids": ["p1","p2"], "target_org_id": "org-target" }'
```

- `project_ids` = daftar project yang dipindah; `target_org_id` = tujuan.
- Satu call langsung (berbeda dari transfer personal→org yang dua langkah request/accept).

### 3.4 Konsumsi org (orgs-api-consumption.md)

```bash
curl ".../organizations/ORG_ID/consumption_history/...?from=2026-08-01&to=2026-09-01"
```

- Rentang `from`/`to` = periode laporan; response berisi pemakaian per project — dasar dashboard billing internal dan alokasi biaya per tim.

## 4. Peran Org vs Hak

| Role org | Bisa |
|---|---|
| Admin | Semua: billing, member, API key org, hapus org |
| Editor/Viewer/Collaborator | Sesuai matriks di [../permissions/user-permissions.md](../permissions/user-permissions.md); untuk akses spesifik pakai project permission |

Kapan pakai org key vs personal key: org key (dibuat Admin) berlaku untuk semua project org — cocok untuk CI; personal key mengikuti akses personal — lebih aman untuk tool individual.
