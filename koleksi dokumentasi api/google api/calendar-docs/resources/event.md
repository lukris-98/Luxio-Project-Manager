# Resource: `Event`

Satu acara pada sebuah kalender. Resource paling kompleks di Calendar API.

- `kind`: `calendar#event`
- Endpoint: `/calendars/{CALENDAR_ID}/events`
- Referensi resmi: https://developers.google.com/workspace/calendar/api/v3/reference/events

---

## 1. Field Tingkat Atas

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `kind` | string | Selalu `"calendar#event"` | read-only |
| `etag` | etag | ETag resource; dipakai di header `If-Match` | read-only |
| `id` | string | Identifier acara. Boleh ditentukan sendiri: hanya `a`–`v` dan `0`–`9` (base32hex), panjang 5–1024, unik per kalender. Bila tidak diisi, server yang membuat | writable |
| `status` | string | `confirmed` (default) / `tentative` / `cancelled` | writable |
| `htmlLink` | string | Tautan absolut ke acara di UI Google Calendar | read-only |
| `created` | datetime | Waktu pembuatan (RFC 3339) | read-only |
| `updated` | datetime | Waktu perubahan terakhir data utama. Mengubah `reminders` **tidak** mengubah nilai ini | read-only |
| `summary` | string | Judul acara | writable |
| `description` | string | Deskripsi; boleh berisi HTML | writable |
| `location` | string | Lokasi sebagai teks bebas. Alamat yang valid mengaktifkan fitur "waktu berangkat" dan peta | writable |
| `colorId` | string | Id warna acara, merujuk bagian `event` pada `/colors` | writable |
| `eventLabelId` | string | Id label acara; merujuk `labelProperties.eventLabels[].id` pada Calendar. Menggantikan `colorId`. Butuh `eventLabelVersion=1` pada insert/import/update/patch. String kosong atau tidak diisi = label dihapus | writable |
| `creator` | object | Pembuat acara | read-only |
| `organizer` | object | Penyelenggara acara. Read-only kecuali saat `events.import`. Untuk mengubahnya gunakan `events.move` | writable (terbatas) |
| `start` | object | Waktu mulai (inklusif). Untuk acara berulang: waktu mulai instance pertama | writable |
| `end` | object | Waktu selesai (**eksklusif**). Untuk acara berulang: waktu selesai instance pertama | writable |
| `endTimeUnspecified` | boolean | `true` bila waktu selesai sebenarnya tidak diketahui (nilai `end` tetap diisi untuk kompatibilitas). Default `false` | read-only |
| `recurrence` | list&lt;string&gt; | Baris `RRULE`, `EXRULE`, `RDATE`, `EXDATE` sesuai RFC 5545. `DTSTART`/`DTEND` **tidak boleh** ada di sini. Tidak muncul untuk acara tunggal maupun instance | writable |
| `recurringEventId` | string | Untuk instance: `id` seri induknya | immutable |
| `originalStartTime` | object | Untuk instance: waktu mulai menurut aturan pengulangan seri induk. Mengidentifikasi instance secara unik meski jadwalnya digeser | immutable |
| `transparency` | string | `opaque` (default, memblok waktu = Busy) / `transparent` (tidak memblok = Available) | writable |
| `visibility` | string | `default` / `public` / `private` / `confidential` | writable |
| `iCalUID` | string | Identifier unik lintas sistem kalender (RFC 5545). Semua occurrence satu seri berbagi `iCalUID` yang sama tetapi punya `id` berbeda. Wajib saat `events.import` | read-only |
| `sequence` | integer | Nomor urut sesuai iCalendar | writable |
| `attendees` | list&lt;object&gt; | Daftar tamu | writable |
| `attendeesOmitted` | boolean | `true` bila daftar tamu mungkin dipangkas (mis. karena `maxAttendees`). Saat update, dipakai untuk hanya memperbarui respons satu peserta. Default `false` | writable |
| `extendedProperties` | object | Properti kustom aplikasi: `private` dan `shared` | writable |
| `hangoutLink` | string | Tautan absolut ke Google Hangout terkait | read-only |
| `conferenceData` | object | Informasi konferensi (mis. Google Meet). Butuh `conferenceDataVersion=1` pada setiap request modifikasi | writable |
| `gadget` | object | Gadget acara. **Deprecated**; sekarang hanya dipakai untuk metadata kalender ulang tahun | writable (deprecated) |
| `anyoneCanAddSelf` | boolean | Siapa pun boleh mengundang dirinya. **Deprecated**. Default `false` | writable (deprecated) |
| `guestsCanInviteOthers` | boolean | Tamu selain organizer boleh mengundang orang lain. Default `true` | writable |
| `guestsCanModify` | boolean | Tamu selain organizer boleh mengubah acara. Default `false` | writable |
| `guestsCanSeeOtherGuests` | boolean | Tamu selain organizer boleh melihat daftar tamu. Default `true` | writable |
| `privateCopy` | boolean | Bila `true`, propagasi acara dimatikan. Immutable. Default `false` | immutable |
| `locked` | boolean | `true` bila ini salinan terkunci: `summary`, `description`, `location`, `start`, `end`, `recurrence` tidak bisa diubah. Default `false` | read-only |
| `reminders` | object | Pengingat untuk user terautentikasi | writable |
| `source` | object | Sumber asal acara (halaman web, email, dsb.). Hanya bisa dilihat/diubah oleh pembuat acara | writable |
| `attachments` | list&lt;object&gt; | Lampiran file. Butuh `supportsAttachments=true`. Maksimum 25 per acara | writable |
| `eventType` | string | `default` / `birthday` / `focusTime` / `fromGmail` / `outOfOffice` / `workingLocation`. **Tidak bisa diubah** setelah acara dibuat | writable (saat create) |
| `birthdayProperties` | object | Data ulang tahun / tanggal khusus; dipakai bila `eventType` = `birthday`. Immutable | writable (saat create) |
| `focusTimeProperties` | object | Data acara focus time; dipakai bila `eventType` = `focusTime` | writable |
| `outOfOfficeProperties` | object | Data acara out-of-office; dipakai bila `eventType` = `outOfOffice` | writable |
| `workingLocationProperties` | object | Data lokasi kerja; dipakai bila `eventType` = `workingLocation` | writable |

---

## 2. `start` dan `end`

| Field | Tipe | Arti |
|---|---|---|
| `date` | date | Tanggal `"yyyy-mm-dd"` untuk acara sehari penuh |
| `dateTime` | datetime | Nilai gabungan tanggal-waktu RFC 3339. Offset zona waktu wajib **kecuali** `timeZone` diisi eksplisit |
| `timeZone` | string | Nama IANA Time Zone Database, mis. `"Asia/Jakarta"`. **Wajib** untuk acara berulang (menentukan zona ekspansi pengulangan). Untuk acara tunggal: opsional, berarti zona waktu khusus acara ini |

```json
// All-day 14 September (satu hari). end.date EKSKLUSIF.
{ "start": { "date": "2026-09-14" }, "end": { "date": "2026-09-15" } }

// Berjadwal dengan offset eksplisit.
{
  "start": { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "end":   { "dateTime": "2026-09-07T11:00:00+07:00", "timeZone": "Asia/Jakarta" }
}

// Berjadwal tanpa offset — sah HANYA karena timeZone diisi.
{
  "start": { "dateTime": "2026-09-07T10:00:00", "timeZone": "Asia/Jakarta" },
  "end":   { "dateTime": "2026-09-07T11:00:00", "timeZone": "Asia/Jakarta" }
}
```

> Catatan: `start` dan `end` harus memakai jenis yang sama. Mencampur `date` dan `dateTime` menghasilkan `400`.

---

## 3. `creator` dan `organizer`

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `creator.id` | string | Profile ID pembuat, bila tersedia | read-only |
| `creator.email` | string | Email pembuat | read-only |
| `creator.displayName` | string | Nama pembuat | read-only |
| `creator.self` | boolean | `true` bila pembuat adalah pemilik kalender tempat salinan ini muncul. Default `false` | read-only |
| `organizer.id` | string | Profile ID organizer | read-only |
| `organizer.email` | string | Email organizer; harus alamat email valid (RFC 5322) | writable saat `import` |
| `organizer.displayName` | string | Nama organizer | writable saat `import` |
| `organizer.self` | boolean | `true` bila organizer adalah pemilik kalender tempat salinan ini muncul. Default `false` | read-only |

Bila organizer juga menjadi tamu, ia muncul lagi sebagai entri di `attendees[]` dengan `organizer: true`.

---

## 4. `attendees[]`

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `email` | string | Alamat email tamu. **Wajib** saat menambahkan tamu; harus valid per RFC 5322 | writable |
| `displayName` | string | Nama tamu | writable |
| `id` | string | Profile ID tamu, bila tersedia | read-only |
| `organizer` | boolean | `true` bila tamu ini adalah organizer. Default `false` | read-only |
| `self` | boolean | `true` bila entri ini mewakili kalender tempat salinan acara ini muncul. Default `false` | read-only |
| `resource` | boolean | `true` bila tamu adalah resource (ruangan/alat). Hanya bisa diset **saat pertama kali** ditambahkan; perubahan berikutnya diabaikan. Default `false` | writable (sekali) |
| `optional` | boolean | Tamu opsional. Default `false` | writable |
| `responseStatus` | string | `needsAction` (disarankan untuk acara baru) / `declined` / `tentative` / `accepted` | writable |
| `comment` | string | Komentar balasan tamu | writable |
| `additionalGuests` | integer | Jumlah tamu tambahan. Default `0` | writable |
| `asyncOperation` | string | Bila ada, menandakan operasi asinkron sedang berjalan untuk tamu ini (mis. ekspansi anggota grup besar). Nilai: `inProgress`, atau field tidak ada | read-only |

> Catatan: bila `responseStatus` diisi `declined`/`tentative`/`accepted` oleh pembuat acara, tamu dengan setelan "Add invitations to my calendar" = "When I respond to invitation in email" atau "Only if the sender is known" bisa direset ke `needsAction` dan tidak melihat acara di kalendernya sampai mereka membalas email undangan. Selain itu, bila tamu lebih dari 200, status respons tidak dipropagasikan ke tamu.

```json
{
  "attendees": [
    { "email": "budi@example.com", "responseStatus": "needsAction" },
    { "email": "sari@example.com", "optional": true, "displayName": "Sari (opsional)" },
    { "email": "ruang-3a@resource.calendar.google.com", "resource": true }
  ],
  "guestsCanModify": false,
  "guestsCanInviteOthers": true,
  "guestsCanSeeOtherGuests": true
}
```

Detail: [../guides/attendees-and-invitations.md](../guides/attendees-and-invitations.md).

---

## 5. `reminders`

| Field | Tipe | Arti |
|---|---|---|
| `useDefault` | boolean | `true` = pakai `defaultReminders` kalender (dari CalendarListEntry) |
| `overrides[]` | list | Pengingat khusus acara ini. Maksimum 5. Bila `useDefault: false` dan `overrides` tidak diisi, berarti **tidak ada pengingat** |
| `overrides[].method` | string | `email` atau `popup`. Wajib |
| `overrides[].minutes` | integer | Menit sebelum mulai. Valid 0–40320 (4 minggu). Wajib |

```json
// Pakai default kalender.
{ "reminders": { "useDefault": true } }

// Pengingat khusus: email 1 hari sebelum + popup 10 menit sebelum.
{ "reminders": { "useDefault": false, "overrides": [ { "method": "email", "minutes": 1440 }, { "method": "popup", "minutes": 10 } ] } }

// Tanpa pengingat sama sekali.
{ "reminders": { "useDefault": false, "overrides": [] } }
```

Detail: [../guides/reminders-and-notifications.md](../guides/reminders-and-notifications.md).

---

## 6. `conferenceData`

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `conferenceId` | string | Id konferensi. Untuk `hangoutsMeet`: kode rapat 10 huruf, mis. `aaa-bbbb-ccc`. Untuk `addOn`: ditentukan penyedia | read-only-ish |
| `signature` | string | Tanda tangan data konferensi; dibuat di sisi server. Tidak ada bila create request gagal | read-only |
| `notes` | string | Catatan tambahan (boleh HTML), maksimum 2048 karakter | — |
| `createRequest` | object | Permintaan membuat konferensi baru | writable |
| `createRequest.requestId` | string | Id unik buatan klien. **Harus dibuat baru** untuk setiap permintaan; id yang sama dengan sebelumnya membuat request diabaikan | writable |
| `createRequest.conferenceSolutionKey.type` | string | `hangoutsMeet` untuk Google Meet; `addOn` untuk penyedia pihak ketiga; `eventHangout` / `eventNamedHangout` deprecated | writable |
| `createRequest.status.statusCode` | string | `pending` / `success` / `failure` | read-only |
| `conferenceSolution` | object | Solusi konferensi yang terpakai. Tidak ada bila create request gagal | read-only |
| `conferenceSolution.key.type` | string | Sama nilainya dengan `createRequest.conferenceSolutionKey.type` | read-only |
| `conferenceSolution.name` | string | Nama solusi yang bisa ditampilkan ke user. Tidak dilokalkan | read-only |
| `conferenceSolution.iconUri` | string | Ikon solusi untuk ditampilkan ke user | read-only |
| `entryPoints[]` | list | Cara-cara bergabung ke konferensi | writable |
| `entryPoints[].entryPointType` | string | `video` (maks 1), `phone` (0+), `sip` (maks 1), `more` (maks 1) | — |
| `entryPoints[].uri` | string | URI titik masuk, maksimum 1300 karakter. `video`/`more`: skema `http:`/`https:`; `phone`: skema `tel:` termasuk seluruh urutan dial; `sip`: skema `sip:` | — |
| `entryPoints[].label` | string | Label untuk URI, terlihat user, maksimum 512 karakter. Tidak dilokalkan | — |
| `entryPoints[].pin` / `accessCode` / `meetingCode` / `passcode` / `password` | string | Kredensial masuk, masing-masing maksimum 128 karakter. Isi **hanya** yang sesuai terminologi penyedia | — |

```json
// Membuat konferensi Meet baru. WAJIB kirim query conferenceDataVersion=1.
{
  "conferenceData": {
    "createRequest": {
      "requestId": "luxio-rapat-2026-09-07",
      "conferenceSolutionKey": { "type": "hangoutsMeet" }
    }
  }
}
```

```json
// Respons setelah konferensi selesai dibuat.
{
  "conferenceData": {
    "conferenceId": "abc-defg-hij",
    "conferenceSolution": {
      "key": { "type": "hangoutsMeet" },
      "name": "Google Meet",
      "iconUri": "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png"
    },
    "createRequest": { "requestId": "luxio-rapat-2026-09-07", "status": { "statusCode": "success" } },
    "entryPoints": [
      { "entryPointType": "video", "uri": "https://meet.google.com/abc-defg-hij", "label": "meet.google.com/abc-defg-hij" },
      { "entryPointType": "phone", "uri": "tel:+62-21-1234-5678", "label": "+62 21 1234 5678", "pin": "123456789" },
      { "entryPointType": "more", "uri": "https://tel.meet/abc-defg-hij?pin=123456789" }
    ]
  }
}
```

> Catatan: menyalin `conferenceData` yang sama ke acara berbeda bisa menyebabkan masalah akses dan membocorkan detail rapat ke orang yang tidak dituju. Untuk setiap acara baru, buat konferensi baru lewat `createRequest`.

Detail: [../guides/conference-and-meet.md](../guides/conference-and-meet.md).

---

## 7. `extendedProperties`

| Field | Tipe | Arti |
|---|---|---|
| `private` | object | Pasangan key-value yang hanya ada pada salinan acara di kalender ini |
| `shared` | object | Pasangan key-value yang dibagikan ke semua salinan acara di kalender peserta lain |

Batas: kunci maksimum 44 karakter (lebih panjang dibuang tanpa peringatan), nilai maksimum 1024 karakter (lebih panjang dipotong), total 300 properti dan 32 KB per acara (private + shared, seluruh salinan).

```json
{
  "extendedProperties": {
    "private": { "luxioId": "task_9f2c41", "luxioKind": "task-deadline" },
    "shared":  { "createdBy": "luxio" }
  }
}
```

```bash
# Mencari acara berdasarkan properti privat. Format: propertyName=value (URL-encoded).
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "privateExtendedProperty=luxioId=task_9f2c41" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# Beberapa privateExtendedProperty → digabung dengan OR.
# private + shared bersamaan → digabung dengan AND.
```

```json
// Menghapus satu properti: PATCH dengan nilai null (bukan menghilangkan key-nya).
{ "extendedProperties": { "private": { "luxioKind": null } } }
```

---

## 8. `attachments[]`

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `fileUrl` | string | Tautan ke lampiran. Untuk file Google Drive gunakan format `alternateLink` dari resource `Files` Drive API. **Wajib** saat menambah lampiran | writable |
| `fileId` | string | Id file. Untuk file Drive: id entri `Files` di Drive API | read-only |
| `title` | string | Judul lampiran | read-only |
| `mimeType` | string | MIME type lampiran | read-only |
| `iconLink` | string | Tautan ikon lampiran. Hanya bisa diubah untuk lampiran pihak ketiga kustom | terbatas |

Untuk mengubah `attachments`, parameter request `supportsAttachments` harus `true`. Maksimum 25 lampiran per acara.

> Catatan: bila aplikasi menyimpan acara secara lokal dan baru menambahkan dukungan lampiran, lakukan **full sync** seluruh acara sebelum mengaktifkan `supportsAttachments`. Tanpa itu, lampiran yang sudah ada pada acara user bisa terhapus tanpa disengaja.

---

## 9. `eventType` Khusus

### `workingLocationProperties` (`eventType: "workingLocation"`)

| Field | Tipe | Arti |
|---|---|---|
| `type` | string | `homeOffice` / `officeLocation` / `customLocation`. Wajib saat menambah properti lokasi kerja |
| `homeOffice` | any | Bila ada: user bekerja dari rumah |
| `customLocation.label` | string | Label tambahan untuk lokasi kustom |
| `officeLocation.buildingId` | string | Id bangunan; sebaiknya merujuk Resources database organisasi |
| `officeLocation.floorId` | string | Id lantai |
| `officeLocation.floorSectionId` | string | Id bagian lantai |
| `officeLocation.deskId` | string | Id meja |
| `officeLocation.label` | string | Nama kantor yang ditampilkan di klien Calendar |

### `outOfOfficeProperties` (`eventType: "outOfOffice"`)

| Field | Tipe | Arti |
|---|---|---|
| `autoDeclineMode` | string | `declineNone` / `declineAllConflictingInvitations` / `declineOnlyNewConflictingInvitations` |
| `declineMessage` | string | Pesan balasan saat undangan ditolak otomatis |

### `focusTimeProperties` (`eventType: "focusTime"`)

| Field | Tipe | Arti |
|---|---|---|
| `autoDeclineMode` | string | Sama dengan `outOfOfficeProperties.autoDeclineMode` |
| `declineMessage` | string | Pesan balasan saat undangan ditolak otomatis |
| `chatStatus` | string | `available` / `doNotDisturb` — status yang ditampilkan di Chat dan produk terkait |

### `birthdayProperties` (`eventType: "birthday"`)

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `contact` | string | Resource name kontak terkait, format `"people/c12345"`; bisa dipakai untuk mengambil detail lewat People API | read-only |
| `type` | string | `anniversary` / `birthday` (default) / `custom` / `other` / `self`. API hanya mendukung membuat acara dengan type `birthday`, dan type tidak bisa diubah setelah dibuat | writable (saat create) |
| `customTypeName` | string | Label kustom; terisi bila `type` = `custom` | read-only |

---

## 10. Perilaku `status: "cancelled"`

`status: "cancelled"` punya dua arti berbeda tergantung jenis acara:

| Kasus | Arti | Field yang dijamin terisi | Tindakan klien |
|---|---|---|---|
| Exception yang dibatalkan pada seri yang masih aktif | Instance ini tidak boleh ditampilkan lagi | `id`, `recurringEventId`, `originalStartTime` | **Simpan** selama seri induk masih hidup |
| Acara terhapus lainnya | Acara sudah dihapus | `id` | **Hapus** salinan lokal |

`events.list` hanya mengembalikan acara `cancelled` pada incremental sync (`syncToken` atau `updatedMin` diisi) atau bila `showDeleted=true`. `events.get` selalu mengembalikannya.

Pada kalender organizer, acara `cancelled` tetap memaparkan detail (summary, location, dsb.) agar bisa dipulihkan. Namun request incremental sync dengan `showDeleted=false` tidak mengembalikan detail itu.

Bila organizer acara berubah (mis. lewat `events.move`) dan organizer lama tidak ada di daftar tamu, tertinggal acara `cancelled` yang hanya dijamin punya `id`.

---

## 11. Contoh JSON Lengkap

```json
{
  "kind": "calendar#event",
  "etag": "\"3412345678901000\"",
  "id": "luxio7rapattim2026q3aa",
  "status": "confirmed",
  "htmlLink": "https://www.google.com/calendar/event?eid=bHV4aW83...",
  "created": "2026-09-01T02:14:11.000Z",
  "updated": "2026-09-01T02:14:11.512Z",
  "summary": "Rapat tim mingguan",
  "description": "Agenda: progres sprint, blocker, rencana minggu depan.",
  "location": "Ruang 3A, Kantor Jakarta",
  "colorId": "9",
  "creator": { "email": "saya@example.com", "displayName": "Saya", "self": true },
  "organizer": { "email": "saya@example.com", "displayName": "Saya", "self": true },
  "start": { "dateTime": "2026-09-07T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "end":   { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "recurrence": [ "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12" ],
  "transparency": "opaque",
  "visibility": "default",
  "iCalUID": "luxio7rapattim2026q3aa@google.com",
  "sequence": 0,
  "attendees": [
    { "email": "saya@example.com", "displayName": "Saya", "organizer": true, "self": true, "responseStatus": "accepted" },
    { "email": "budi@example.com", "responseStatus": "needsAction" },
    { "email": "sari@example.com", "optional": true, "responseStatus": "tentative", "comment": "Mungkin telat 10 menit." }
  ],
  "extendedProperties": {
    "private": { "luxioId": "meeting_weekly_01", "luxioKind": "team-sync" }
  },
  "hangoutLink": "https://meet.google.com/abc-defg-hij",
  "conferenceData": {
    "conferenceId": "abc-defg-hij",
    "conferenceSolution": { "key": { "type": "hangoutsMeet" }, "name": "Google Meet", "iconUri": "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png" },
    "createRequest": { "requestId": "luxio-rapat-2026-09-07", "status": { "statusCode": "success" } },
    "entryPoints": [
      { "entryPointType": "video", "uri": "https://meet.google.com/abc-defg-hij", "label": "meet.google.com/abc-defg-hij" }
    ]
  },
  "guestsCanInviteOthers": true,
  "guestsCanModify": false,
  "guestsCanSeeOtherGuests": true,
  "reminders": {
    "useDefault": false,
    "overrides": [ { "method": "popup", "minutes": 10 } ]
  },
  "attachments": [
    { "fileUrl": "https://docs.google.com/document/d/1AbCdEf/edit", "title": "Notulen", "mimeType": "application/vnd.google-apps.document", "fileId": "1AbCdEf" }
  ],
  "eventType": "default"
}
```

Contoh instance dari seri di atas:

```json
{
  "kind": "calendar#event",
  "id": "luxio7rapattim2026q3aa_20260914T020000Z",
  "status": "confirmed",
  "summary": "Rapat tim mingguan",
  "recurringEventId": "luxio7rapattim2026q3aa",
  "originalStartTime": { "dateTime": "2026-09-14T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "start": { "dateTime": "2026-09-14T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "end":   { "dateTime": "2026-09-14T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "iCalUID": "luxio7rapattim2026q3aa@google.com",
  "sequence": 0,
  "eventType": "default"
}
```

Perhatikan: instance **tidak** punya field `recurrence`.

---

## 12. Field Read-Only vs Writable — Ringkas

| Kelompok | Field |
|---|---|
| **Read-only** | `kind`, `etag`, `htmlLink`, `created`, `updated`, `iCalUID`, `hangoutLink`, `endTimeUnspecified`, `locked`, `creator.*`, `organizer.self`, `organizer.id`, `attendees[].id`, `attendees[].organizer`, `attendees[].self`, `attendees[].asyncOperation`, `attachments[].fileId`, `attachments[].title`, `attachments[].mimeType`, `conferenceData.createRequest.status.statusCode`, `conferenceData.signature`, `conferenceData.conferenceSolution.*`, `birthdayProperties.contact`, `birthdayProperties.customTypeName` |
| **Immutable** (bisa diset saat create, tidak bisa diubah) | `recurringEventId`, `originalStartTime`, `privateCopy`, `eventType`, `birthdayProperties` |
| **Writable** | `id`, `status`, `summary`, `description`, `location`, `colorId`, `eventLabelId`, `start.*`, `end.*`, `recurrence[]`, `transparency`, `visibility`, `sequence`, `attendees[]` (email/displayName/optional/resource/responseStatus/comment/additionalGuests), `attendeesOmitted`, `extendedProperties.private/shared`, `conferenceData.createRequest`, `conferenceData.entryPoints[]`, `guestsCanInviteOthers`, `guestsCanModify`, `guestsCanSeeOtherGuests`, `anyoneCanAddSelf` (deprecated), `reminders.useDefault`, `reminders.overrides[]`, `source.url`, `source.title`, `attachments[].fileUrl`, `focusTimeProperties`, `outOfOfficeProperties`, `workingLocationProperties`, `gadget.*` (deprecated) |
| **Writable hanya saat `events.import`** | `organizer.email`, `organizer.displayName` |

Endpoint & parameter: [../reference-api/events.md](../reference-api/events.md).
