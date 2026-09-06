# Kemampuan Backup & Alur Restore — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** untuk backup/restore Neon dan **kode mana yang melakukan apa**, berdasarkan [backups.md](backups.md), [backup-pg-dump.md](backup-pg-dump.md), [backup-pg-dump-automate.md](backup-pg-dump-automate.md), [backups-aws-s3-backup-part-1.md](backups-aws-s3-backup-part-1.md), dan [backups-aws-s3-backup-part-2.md](backups-aws-s3-backup-part-2.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Alat | Sumber |
|---|---|---|
| Dump database manual ke file lokal | `pg_dump` | [backup-pg-dump.md](backup-pg-dump.md) |
| Restore dump ke Neon (atau ke provider lain) | `psql` / `pg_restore` | [backup-pg-dump.md](backup-pg-dump.md) |
| Backup otomatis terjadwal (cron) | shell script + cron | [backup-pg-dump-automate.md](backup-pg-dump-automate.md) |
| Kirim backup ke AWS S3 + retensi | AWS CLI + lifecycle | part-1 & part-2 |
| Snapshot terkelola + jadwal + restore | Neon API | [../reference-api/snapshots/](../reference-api/snapshots/) |
| Point-in-time restore branch | Neon API | [../reference-api/branches/restore-project-branch.md](../reference-api/branches/restore-project-branch.md) |

## 2. Alur Backup-Restore

```
Neon (source) ──pg_dump──► file .dump/.sql ──aws s3 cp──► S3 bucket (retensi versi)
     ▲                                                          │
     └────────── psql/pg_restore ◄──────────────────────────────┘
          (restore ke Neon baru / ke branch lain)
```

Alternatif terkelola: `POST .../snapshot` (snapshot manual), `PUT .../backup_schedule` (jadwal), `POST .../snapshots/{id}/restore` (pulihkan) — detail endpoint di [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

## 3. Penjelasan Kode

### 3.1 Dump manual (backup-pg-dump.md)

```bash
pg_dump --dsn "$DATABASE_URL" --db="neondb" -F c -f backup.dump
```

- `--dsn "$DATABASE_URL"` = connection string Neon (ambil dari Console atau `GET .../connection_uri`).
- `-F c` = format custom (compressed) — wajib jika akan direstore dengan `pg_restore`; `-F p` = plain SQL.
- `-f backup.dump` = nama file keluaran.

Restore:

```bash
pg_restore --dsn "$NEON_CONNECTION_URI" --role=neondb_owner backup.dump
```

- `--role` = role yang menjadi pemilik objek hasil restore — pakai `neondb_owner`, bukan role lain, agar GRANT tidak kacau.

### 3.2 Backup otomatis (backup-pg-dump-automate.md)

Pola script yang dijadwalkan cron:

```bash
#!/bin/bash
DATE=$(date +%F)                       # (1) tanggal untuk penamaan file
FILE="neondb_$DATE.dump"               # (2) nama file unik per hari
pg_dump --dsn "$DATABASE_URL" --db="neondb" -F c -f "$FILE"   # (3) dump
aws s3 cp "$FILE" "s3://bucket-neon-backup/$FILE"             # (4) kirim ke S3
rm "$FILE"                             # (5) bersihkan lokal
```

Dijadwalkan dengan cron (jalankan harian jam 02:00):

```
0 2 * * * /opt/scripts/backup-neon.sh >> /var/log/neon-backup.log 2>&1
```

- `0 2 * * *` = menit 0, jam 2, setiap hari (`* * *`).
- `>> log 2>&1` = output + error dicatat untuk audit keberhasilan backup.

**Kode ini melakukan**: dump → arsip ke S3 → log. Retensi diatur di sisi S3 (bukan di script) — lihat 3.3.

### 3.3 Retensi di S3 (part-1 & part-2)

```
S3 lifecycle rule:
  - transisi ke Glacier setelah 30 hari   (hemat biaya, tetap bisa direstore)
  - expirasi setelah 365 hari             (batas retensi maksimum)
```

Part-2 menambahkan pemulihan: unduh file dump dari S3 (`aws s3 cp s3://... .`) lalu jalankan ulang `pg_restore` — alur sama dengan 3.1.

## 4. Kapan Pakai yang Mana

| Kebutuhan | Pilih |
|---|---|
| Backup jangka panjang murah + penuh kendali | `pg_dump` + S3 (alur ini) |
| Restore cepat ke titik waktu (menit lalu) | Branch point-in-time / `restore` API |
| Backup terkelola tanpa infra | Snapshot schedule API |
| Migrasi keluar dari Neon | `pg_dump -F p` → restore ke target mana pun |
