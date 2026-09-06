# Kemampuan Akun & Alur Recovery — Penjelasan

File ini merangkum **apa yang bisa dilakukan** dengan akun Neon dan **alur** masing-masing, berdasarkan [accounts.md](accounts.md) dan [account-recovery.md](account-recovery.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Metode | Catatan penting |
|---|---|---|
| Ubah nama / email profil | Console → Account settings | Ganti email → verifikasi via email; social login (Google/GitHub) ter-unlink otomatis |
| Ganti / set password | Console → Account settings | Wajib bila pindah dari social login ke email login |
| Aktifkan 2FA (TOTP) | Console → Account settings | Scan QR dengan app authenticator |
| Tambah / hapus passkey | Console → Account settings | Passkey = login tanpa password |
| Hapus akun permanen | Console → Account settings | Ada security delay 24 jam untuk 2FA/passkey removal |
| Pulihkan akun terhapus | Email link recovery | Window **30 hari** sebelum data hilang permanen |
| Kelola personal API key | Console → Account settings → API keys | Dipakai untuk autentikasi Neon API |

## 2. Alur Recovery Akun (account-recovery.md)

```
Akun dihapus (permanen-keluar dari login)
        │
   ≤ 30 hari? ──tidak──► data hilang permanen (tidak bisa dipulihkan)
        │ ya
        ▼
Email recovery dikirim ke alamat akun ──► klik link ──► akun & project aktif kembali
```

Karena tidak ada kode programatik untuk recovery (murni email + console), tindakan pencegahan yang bisa diotomasi adalah backup data sebelum penghapusan: gunakan alur di [../backups/kemampuan-dan-alur.md](../backups/kemampuan-dan-alur.md) (`pg_dump` otomatis + S3).

## 3. Alur Keamanan Akun

```
Login dasar (email+password)
   │
   ├── + 2FA TOTP: setiap login minta kode dari authenticator app
   │       │
   │       └── hapus 2FA → delay 24 jam (proteksi akun dibajak)
   │
   └── + Passkey: kunci biometrik per perangkat
           │
           └── hapus passkey → delay 24 jam
```

## 4. Kaitan ke Kemampuan Lain

- **API key personal** dibuat dari Account settings — penjelasan kode `POST /api_keys` ada di [../permissions/kemampuan-dan-alur.md](../permissions/kemampuan-dan-alur.md).
- Akun bisa jadi anggota banyak organisasi — peran yang bisa dimiliki dijelaskan di [../organizations/kemampuan-dan-alur.md](../organizations/kemampuan-dan-alur.md) dan [../permissions/user-permissions.md](../permissions/user-permissions.md).
- Data project milik akun tetap bisa diakses selama API key belum direvoke — revoke semua key saat meninggalkan org untuk keamanan.
