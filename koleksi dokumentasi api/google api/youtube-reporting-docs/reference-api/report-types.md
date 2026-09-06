# `reportTypes.list`

Mengembalikan daftar tipe laporan yang bisa diambil channel atau content owner.

| Aspek | Nilai |
|---|---|
| Method ID | `youtubereporting.reportTypes.list` |
| HTTP | `GET` |
| Path | `/v1/reportTypes` |
| URL lengkap | `https://youtubereporting.googleapis.com/v1/reportTypes` |
| Request body | Tidak ada |
| Response | `ListReportTypesResponse` |
| Scope | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |

Deskripsi resmi: *"Lists report types."* / *"Returns a list of report types that the channel or content owner can retrieve."*

---

## 1. Parameter Query

| Parameter | Tipe | Wajib | Deskripsi resmi |
|---|---|---|---|
| `includeSystemManaged` | `boolean` | Tidak | *"If set to true, also system-managed report types will be returned; otherwise only the report types that can be used to create new reporting jobs will be returned."* |
| `pageSize` | `integer` (int32) | Tidak | *"Requested page size. Server may return fewer report types than requested. If unspecified, server will pick an appropriate default."* |
| `pageToken` | `string` | Tidak | *"A token identifying a page of results the server should return. Typically, this is the value of `ListReportTypesResponse.next_page_token` returned in response to the previous call to the `ListReportTypes` method."* |
| `onBehalfOfContentOwner` | `string` | Tidak | *"The content owner's external ID on which behalf the user is acting on. If not set, the user is acting for himself (his own channel)."* |

Plus parameter standar: `alt`, `fields`, `prettyPrint`, `quotaUser`, `key`, `access_token`, `oauth_token`, `callback`, `$.xgafv`.

---

## 2. Response

```json
{
  "reportTypes": [
    {
      "id": "channel_basic_a3",
      "name": "User activity"
    },
    {
      "id": "channel_playback_location_a3",
      "name": "Playback locations"
    }
  ],
  "nextPageToken": "CigKJmNoYW5uZWxfdHJhZmZpY19zb3VyY2VfYTM"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `reportTypes[]` | array `ReportType` | Daftar tipe laporan. **Bisa tidak ada** bila hasilnya nihil |
| `reportTypes[].id` | `string` | Maks. 100 karakter. Nilai untuk `jobs.create` |
| `reportTypes[].name` | `string` | Maks. 100 karakter. Label deskriptif |
| `reportTypes[].deprecateTime` | `timestamp` | Ada bila tipe akan/sudah di-deprecate |
| `reportTypes[].systemManaged` | `boolean` | `true` = tidak bisa dipakai di `jobs.create` |
| `nextPageToken` | `string` | Token halaman berikutnya. Tidak ada = halaman terakhir |

Detail field: [../resources/report-type.md](../resources/report-type.md).

---

## 3. Contoh Pemakaian

### 3.1 Dasar

```bash
# Tanpa parameter: tipe laporan untuk channel milik user terautentikasi,
# HANYA yang bisa dipakai membuat job baru.
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 3.2 Konteks content owner

```bash
# Menghasilkan daftar yang BERBEDA: laporan content_owner_*, asset, dan playlist content owner.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 3.3 Termasuk tipe yang dikelola sistem

```bash
# includeSystemManaged=true menambahkan tipe system-managed ke daftar.
# Gunakan untuk INVENTARIS. Tipe ini TIDAK bisa dipakai di jobs.create.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?includeSystemManaged=true&onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 3.4 Paginasi penuh

```bash
# Halaman pertama.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?pageSize=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Halaman berikutnya: pertahankan pageSize dan semua filter, tambahkan pageToken.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?pageSize=50&includeSystemManaged=true&pageToken=NEXT_PAGE_TOKEN" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 3.5 Partial response

```bash
# Hanya ambil id (kalau name tidak dipakai) — payload lebih kecil.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?fields=reportTypes(id,systemManaged,deprecateTime),nextPageToken" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 4. Kode: Sinkronisasi Katalog

```js
// Ambil seluruh katalog dengan paginasi, lalu pisahkan yang bisa dipakai untuk jobs.create.
async function syncReportTypes({ accessToken, contentOwnerId = null }) {
  const all = [];
  let pageToken;

  do {
    const url = new URL('https://youtubereporting.googleapis.com/v1/reportTypes');
    url.searchParams.set('pageSize', '100');
    // includeSystemManaged=true agar katalog lengkap; kita filter sendiri di bawah.
    url.searchParams.set('includeSystemManaged', 'true');
    if (contentOwnerId) url.searchParams.set('onBehalfOfContentOwner', contentOwnerId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`reportTypes.list ${res.status}: ${await res.text()}`);

    const body = await res.json();
    all.push(...(body.reportTypes ?? []));   // array bisa TIDAK ADA
    pageToken = body.nextPageToken;
  } while (pageToken);

  return {
    // Hanya tipe ini yang boleh masuk jobs.create.
    creatable: all.filter(rt => rt.systemManaged !== true),
    // Tipe ini dijadwalkan berhenti — cari penggantinya sebelum tanggal tersebut.
    systemManaged: all.filter(rt => rt.systemManaged === true),
    deprecating: all.filter(rt => rt.deprecateTime),
  };
}
```

```python
def sync_report_types(reporting, content_owner_id: str | None = None) -> list[dict]:
    """Ambil seluruh katalog reportTypes dengan paginasi."""
    out, page_token = [], None
    while True:
        kwargs = {
            "pageSize": 100,
            "includeSystemManaged": True,   # katalog lengkap, filter dilakukan pemanggil
        }
        if content_owner_id:
            kwargs["onBehalfOfContentOwner"] = content_owner_id
        if page_token:
            kwargs["pageToken"] = page_token

        resp = reporting.reportTypes().list(**kwargs).execute()
        # .get dengan default: kunci "reportTypes" bisa tidak ada bila hasilnya nihil.
        out.extend(resp.get("reportTypes", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            return out
```

---

## 5. Validasi Sebelum `jobs.create`

```js
// Guard sederhana yang mencegah dua error paling umum pada jobs.create:
// (1) reportTypeId salah tulis, (2) reportTypeId milik tipe system-managed.
function assertCreatable(reportTypes, reportTypeId) {
  const rt = reportTypes.find(x => x.id === reportTypeId);

  if (!rt) {
    throw new Error(
      `reportTypeId "${reportTypeId}" tidak tersedia untuk akun ini. ` +
      `Tersedia: ${reportTypes.map(x => x.id).join(', ')}`
    );
  }
  if (rt.systemManaged === true) {
    throw new Error(
      `"${reportTypeId}" adalah tipe system-managed. ` +
      `Job-nya dibuat otomatis YouTube — temukan lewat jobs.list?includeSystemManaged=true`
    );
  }
  if (rt.deprecateTime) {
    // Bukan error: masih bisa dipakai, tapi harus dijadwalkan migrasi.
    console.warn(`"${reportTypeId}" akan di-deprecate pada ${rt.deprecateTime}`);
  }
  return rt;
}
```

---

## 6. Error

| HTTP | `error.status` | Penyebab | Perbaikan |
|---|---|---|---|
| `200` + `{}` | — | Akun tidak berhak atas tipe laporan apa pun | Consent dengan akun pemilik channel/content owner |
| `400` | `INVALID_ARGUMENT` | `pageToken` rusak atau `pageSize` tidak valid | Mulai paginasi dari awal |
| `401` | `UNAUTHENTICATED` | Token tidak ada/kedaluwarsa | Segarkan token |
| `403` | `PERMISSION_DENIED` | API belum di-enable, atau scope tidak disetujui | [../getting-started/enable-api.md](../getting-started/enable-api.md) |
| `403` | `PERMISSION_DENIED` | `onBehalfOfContentOwner` bukan content owner yang berhak | Verifikasi `CONTENT_OWNER_ID` |
| `429` / `5xx` | `RESOURCE_EXHAUSTED` / `INTERNAL` / `UNAVAILABLE` | Batas atau gangguan server | Retry dengan exponential backoff |

Detail: [../getting-started/errors.md](../getting-started/errors.md).

---

## 7. Praktik yang Disarankan

| Praktik | Alasan |
|---|---|
| Panggil sebelum setiap `jobs.create` | Memvalidasi `reportTypeId` tanpa risiko membuat job salah |
| Sinkronkan katalog berkala (mis. mingguan) | Mendeteksi `deprecateTime` sebelum pipeline berhenti |
| Simpan snapshot katalog di database | Bisa diff antar sinkronisasi |
| Jangan hardcode `id` di kode | Daftar tergantung hak akses akun dan bisa berubah versi |
| Pisahkan katalog channel dan content owner | Hasilnya berbeda tergantung `onBehalfOfContentOwner` |

Katalog `reportTypeId` yang terverifikasi dari dokumentasi resmi: [../guides/report-types-catalog.md](../guides/report-types-catalog.md).
