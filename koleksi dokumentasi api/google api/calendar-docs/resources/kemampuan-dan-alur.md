# Kemampuan & Alur — Resources (Model Data)

Fokus file ini: **field mana untuk apa**, dan bagaimana data mengalir antar resource.

- Base URL: `https://www.googleapis.com/calendar/v3`

---

## 1. Daftar Resource

| Resource | `kind` | Endpoint dasar | File |
|---|---|---|---|
| Event | `calendar#event` | `/calendars/{calendarId}/events` | [event.md](event.md) |
| Calendar | `calendar#calendar` | `/calendars` | [calendar.md](calendar.md) |
| CalendarListEntry | `calendar#calendarListEntry` | `/users/me/calendarList` | [calendar-list-entry.md](calendar-list-entry.md) |
| AclRule | `calendar#aclRule` | `/calendars/{calendarId}/acl` | [acl-rule.md](acl-rule.md) |
| Setting | `calendar#setting` | `/users/me/settings` | [setting.md](setting.md) |
| FreeBusy (respons) | `calendar#freeBusy` | `/freeBusy` | [free-busy.md](free-busy.md) |
| Colors | `calendar#colors` | `/colors` | [color.md](color.md) |
| Channel | `api#channel` | `/channels/stop` + `*/watch` | [../reference-api/channels.md](../reference-api/channels.md) |

Koleksi (respons `list`) punya `kind` sendiri: `calendar#events`, `calendar#calendarList`, `calendar#acl`, `calendar#settings`.

---

## 2. Relasi Antar Resource

```
                         ┌──────────────────┐
                         │     Calendar      │  id, summary, timeZone, description,
                         │  (global, 1 baris │  location, conferenceProperties,
                         │   per kalender)   │  labelProperties.eventLabels[]
                         └────┬────────┬─────┘
             ┌────────────────┘        └──────────────────┐
             ▼                                            ▼
   ┌──────────────────┐                        ┌────────────────────────┐
   │ CalendarListEntry │  1 baris PER USER      │        AclRule         │  1 baris per penerima izin
   │ colorId,          │                        │ id: "user:budi@..."    │
   │ backgroundColor,  │                        │ role, scope.type,      │
   │ summaryOverride,  │                        │ scope.value            │
   │ defaultReminders, │                        └────────────────────────┘
   │ hidden, selected, │                                  │
   │ accessRole        │◄─── accessRole diturunkan dari ───┘
   └──────────────────┘
             │
             ▼  defaultReminders dipakai bila event.reminders.useDefault = true
   ┌──────────────────────────────────────────────────────────────────┐
   │                              Event                                │
   │  id, iCalUID, status, summary, description, location              │
   │  start/end { date | dateTime + timeZone }                         │
   │  recurrence[] ──► instances (id sendiri, recurringEventId,         │
   │                    originalStartTime)                              │
   │  attendees[]  ──► email, responseStatus, optional, resource        │
   │  organizer / creator                                               │
   │  reminders { useDefault, overrides[] }                             │
   │  conferenceData ──► entryPoints[] (link Meet, nomor telepon)       │
   │  extendedProperties { private{}, shared{} }                        │
   │  colorId ──► Colors.event[colorId]                                 │
   │  eventLabelId ──► Calendar.labelProperties.eventLabels[].id        │
   │  attachments[] ──► file Google Drive                               │
   └──────────────────────────────────────────────────────────────────┘
             │
             ▼  transparency: "opaque" ikut dihitung
   ┌──────────────────┐
   │     FreeBusy      │  calendars.{id}.busy[] { start, end }
   │ (hasil komputasi, │  groups.{id}.calendars[]
   │  bukan tersimpan) │  errors[] { domain, reason }
   └──────────────────┘
```

---

## 3. Field Mana untuk Apa

### Identitas & pelacakan

| Kebutuhan | Field | Catatan |
|---|---|---|
| Id acara di dalam satu kalender | `Event.id` | Boleh ditentukan sendiri; base32hex, 5–1024 karakter |
| Id lintas sistem kalender | `Event.iCalUID` | Sama untuk semua occurrence satu seri; wajib saat `events.import` |
| Id seri untuk sebuah instance | `Event.recurringEventId` | Immutable, hanya ada pada instance |
| Waktu asli instance | `Event.originalStartTime` | Immutable; mengidentifikasi instance meski jadwalnya digeser |
| Deteksi konflik update | `Event.etag` | Dipakai di header `If-Match` |
| Kaitan ke id internal aplikasi | `Event.extendedProperties.private.<key>` | Bisa dicari lewat `privateExtendedProperty` |
| Nomor urut iCalendar | `Event.sequence` | Writable |

### Waktu

| Kebutuhan | Field |
|---|---|
| Acara sehari penuh | `start.date` + `end.date` (`end` eksklusif) |
| Acara berjadwal | `start.dateTime` + `end.dateTime` (+ `timeZone`) |
| Zona ekspansi pengulangan | `start.timeZone` / `end.timeZone` (**wajib** untuk acara berulang) |
| Waktu selesai tidak diketahui | `endTimeUnspecified` (read-only) |
| Kapan acara dibuat / terakhir diubah | `created` / `updated` (read-only, RFC 3339) |

### Orang

| Kebutuhan | Field |
|---|---|
| Daftar tamu | `attendees[]` dengan `email` wajib |
| Status RSVP | `attendees[].responseStatus`: `needsAction`, `declined`, `tentative`, `accepted` |
| Tamu opsional | `attendees[].optional: true` |
| Ruangan / resource | `attendees[].resource: true` (hanya bisa diset saat pertama ditambahkan) |
| Tamu yang mewakili kalender ini | `attendees[].self: true` (read-only) |
| Penyelenggara | `organizer` (read-only kecuali saat `import`; ubah lewat `events.move`) |
| Pembuat | `creator` (read-only) |
| Jumlah tamu tambahan | `attendees[].additionalGuests` |
| Komentar balasan tamu | `attendees[].comment` |

### Perilaku & tampilan

| Kebutuhan | Field | Nilai |
|---|---|---|
| Blokir waktu atau tidak | `transparency` | `opaque` (default, sibuk) / `transparent` (bebas) |
| Siapa boleh lihat detail | `visibility` | `default`, `public`, `private`, `confidential` |
| Status acara | `status` | `confirmed` (default), `tentative`, `cancelled` |
| Jenis acara | `eventType` | `default`, `birthday`, `focusTime`, `fromGmail`, `outOfOffice`, `workingLocation` |
| Tamu boleh mengubah acara | `guestsCanModify` | Default `false` |
| Tamu boleh mengundang orang lain | `guestsCanInviteOthers` | Default `true` |
| Tamu boleh melihat daftar tamu | `guestsCanSeeOtherGuests` | Default `true` |
| Warna acara | `colorId` | Merujuk `Colors.event` |
| Label acara (menggantikan colorId) | `eventLabelId` | Butuh `eventLabelVersion=1` |
| Pengingat | `reminders.useDefault` / `reminders.overrides[]` | Maks 5 override |
| Link konferensi | `conferenceData` | Butuh `conferenceDataVersion=1` |
| Lampiran Drive | `attachments[]` | Butuh `supportsAttachments=true`, maks 25 |
| Sumber asal acara | `source.url` / `source.title` | Hanya terlihat/ubah oleh pembuat |

---

## 4. Field Read-Only vs Writable

### Event — read-only

`kind`, `etag`, `htmlLink`, `created`, `updated`, `iCalUID`, `hangoutLink`, `endTimeUnspecified`, `locked`, `recurringEventId`, `privateCopy`, `creator.*`, `attendees[].organizer`, `attendees[].self`, `attendees[].id`, `attendees[].asyncOperation`, `attachments[].fileId`, `attachments[].mimeType`, `attachments[].title`, `birthdayProperties.contact`, `birthdayProperties.customTypeName`, `conferenceData.createRequest.status.statusCode`, `organizer.self`, `organizer.id`.

`originalStartTime` dan `recurringEventId` bersifat **immutable** (bisa dikirim saat membuat exception, tetapi tidak bisa diubah setelahnya).

### Event — writable

`id`, `status`, `summary`, `description`, `location`, `colorId`, `eventLabelId`, `start.*`, `end.*`, `recurrence[]`, `transparency`, `visibility`, `sequence`, `attendees[]` (kecuali field read-only di dalamnya), `attendeesOmitted`, `extendedProperties.private/shared`, `conferenceData`, `anyoneCanAddSelf` (deprecated), `guestsCanInviteOthers`, `guestsCanModify`, `guestsCanSeeOtherGuests`, `reminders.useDefault`, `reminders.overrides[]`, `source.*`, `attachments[].fileUrl`, `organizer.email` / `organizer.displayName` (hanya saat `import`), `eventType`, `birthdayProperties`, `focusTimeProperties`, `outOfOfficeProperties`, `workingLocationProperties`.

### Calendar

| Writable | Read-only |
|---|---|
| `summary`, `description`, `location`, `timeZone`, `labelProperties` | `kind`, `etag`, `id`, `dataOwner`, `conferenceProperties`, `autoAcceptInvitations` |

### CalendarListEntry

| Writable | Read-only |
|---|---|
| `summaryOverride`, `colorId`, `backgroundColor`, `foregroundColor`, `hidden`, `selected`, `defaultReminders[]`, `notificationSettings` | `kind`, `etag`, `id`, `summary`, `description`, `location`, `timeZone`, `dataOwner`, `accessRole`, `primary`, `deleted`, `conferenceProperties`, `autoAcceptInvitations` |

### AclRule

| Writable | Read-only |
|---|---|
| `role`, `scope.value` | `kind`, `etag`, `id`, `scope.type` (ditentukan saat pembuatan) |

### Setting & Colors

Seluruhnya read-only. `Setting` hanya punya method `get`, `list`, `watch`. `Colors` hanya punya `get`.

---

## 5. Aliran Data Praktis

### Menampilkan kalender di UI

```
calendarList.list
  └─► items[].id, .summary/.summaryOverride, .backgroundColor, .accessRole, .selected
        └─► untuk setiap kalender yang .selected:
              events.list(calendarId, timeMin, timeMax, singleEvents=true, orderBy=startTime)
                └─► items[].start.dateTime ?? items[].start.date   ← all-day tidak punya dateTime
                    items[].summary
                    items[].colorId ─► colors.get().event[colorId].background
                    items[].attendees[].responseStatus  ← untuk badge RSVP
```

### Sinkronisasi dua arah dengan database lokal

```
[Luxio → Google]
task lokal (id: task_9f2c41)
  └─► events.insert dengan
        id = base32hex(uuid lokal)                   ← idempoten, retry aman
        extendedProperties.private.luxioId = task_9f2c41
        extendedProperties.private.luxioKind = "task-deadline"

[Google → Luxio]
events.list(syncToken, showDeleted=true)
  └─► untuk setiap item:
        status == "cancelled"  ──► hapus baris lokal berdasar extendedProperties.private.luxioId
        selain itu             ──► upsert baris lokal
  └─► simpan nextSyncToken (hanya dari halaman terakhir)

[Cari ulang acara milik Luxio]
events.list?privateExtendedProperty=luxioId%3Dtask_9f2c41
```

> Prinsip: `extendedProperties.private` hanya terlihat pada salinan acara di kalender yang dipakai saat request. Pakai `shared` bila peserta lain juga perlu melihat metadata itu — tetapi jangan menaruh data sensitif di sana.

### Menjadwalkan rapat

```
freeBusy.query(items=[kalender semua peserta], timeMin, timeMax)
  └─► calendars.{id}.busy[] { start, end }     ← start inklusif, end eksklusif
  └─► calendars.{id}.errors[]                  ← izin kurang / grup terlalu besar
        └─► gabungkan semua busy[] → cari celah ≥ durasi yang dibutuhkan
              └─► events.insert(attendees[], sendUpdates=all, conferenceDataVersion=1)
                    └─► conferenceData.entryPoints[] ← link Meet (setelah statusCode "success")
```

---

## 6. Nilai Enum yang Perlu Dihafal

| Field | Nilai valid |
|---|---|
| `Event.status` | `confirmed`, `tentative`, `cancelled` |
| `Event.transparency` | `opaque`, `transparent` |
| `Event.visibility` | `default`, `public`, `private`, `confidential` |
| `Event.eventType` | `default`, `birthday`, `focusTime`, `fromGmail`, `outOfOffice`, `workingLocation` |
| `Event.attendees[].responseStatus` | `needsAction`, `declined`, `tentative`, `accepted` |
| `Event.reminders.overrides[].method` | `email`, `popup` |
| `Event.conferenceData.*.key.type` | `eventHangout` (deprecated), `eventNamedHangout` (deprecated), `hangoutsMeet`, `addOn` |
| `Event.conferenceData.entryPoints[].entryPointType` | `video`, `phone`, `sip`, `more` |
| `Event.conferenceData.createRequest.status.statusCode` | `pending`, `success`, `failure` |
| `AclRule.role` / `accessRole` | `none`, `freeBusyReader`, `reader`, `writerWithoutPrivateAccess`, `writer`, `owner` |
| `AclRule.scope.type` | `default`, `user`, `group`, `domain` |
| `CalendarListEntry.notificationSettings.notifications[].type` | `eventCreation`, `eventChange`, `eventCancellation`, `eventResponse`, `agenda` |
| `CalendarListEntry.notificationSettings.notifications[].method` | `email` |
| `conferenceProperties.allowedConferenceSolutionTypes[]` | `eventHangout`, `eventNamedHangout`, `hangoutsMeet` |
| `workingLocationProperties.type` | `homeOffice`, `officeLocation`, `customLocation` |
| `outOfOfficeProperties.autoDeclineMode` / `focusTimeProperties.autoDeclineMode` | `declineNone`, `declineAllConflictingInvitations`, `declineOnlyNewConflictingInvitations` |
| `focusTimeProperties.chatStatus` | `available`, `doNotDisturb` |
| `birthdayProperties.type` | `anniversary`, `birthday`, `custom`, `other`, `self` |
