use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng, rand_core::RngCore},
    Aes256Gcm,
};
use argon2::Argon2;
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use sha2::{Digest, Sha256};
use std::sync::Mutex;

// =====================================================================
// ENCRYPTION SERVICE (Requirements Document: User Credentials — Req 1, 9, 14)
// =====================================================================
// AES-256-GCM (authenticated encryption) untuk kredensial API di database.
//
// - Master key dibaca dari env `CREDENTIAL_ENCRYPTION_KEY` (base64/hex 32
//   byte, atau string apa pun yang di-hash SHA-256 menjadi 32 byte).
// - Bila env tidak diset -> key acak 32 byte dibuat saat startup + warning
//   (data lama tidak bisa didekripsi sampai env diset — sesuai Req 9.2).
// - Format blob: "v1:" + base64( nonce(12B) || ciphertext||tag ).
//   IV/nonce unik per operasi (Req 9.3) dan disimpan bersama data (Req 9.4).
// - Gagal verifikasi tag GCM -> error generik + security warning (Req 9.6).
// - Key TIDAK PERNAH di-log / dikirim ke respons (Req 9.7).
// =====================================================================

const BLOB_PREFIX: &str = "v1:";
const KEY_LEN: usize = 32;

static MASTER_KEY: Mutex<Option<[u8; KEY_LEN]>> = Mutex::new(None);

/// Error generik — pesan tidak memuat plaintext maupun materi kunci (Req 1.7, 11.1-11.2).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EncError {
    EncryptionFailed,
    DecryptionFailed,
}

impl EncError {
    pub fn message(&self) -> &'static str {
        match self {
            EncError::EncryptionFailed => "Encryption failed",
            EncError::DecryptionFailed => "Decryption failed",
        }
    }
}

/// Ambil (atau inisialisasi sekali) master key 32 byte.
fn master_key() -> [u8; KEY_LEN] {
    let mut guard = MASTER_KEY.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(k) = *guard {
        return k;
    }
    let key = match std::env::var("CREDENTIAL_ENCRYPTION_KEY") {
        Ok(raw) if !raw.trim().is_empty() => derive_key_from_env(raw.trim()),
        _ => {
            // Req 9.2: tanpa env, buat key acak + warning keras.
            let mut k = [0u8; KEY_LEN];
            OsRng.fill_bytes(&mut k);
            tracing::warn!(
                event = "credential_encryption_key_missing",
                "CREDENTIAL_ENCRYPTION_KEY tidak diset — key acak dibuat untuk sesi ini. \
                 Set env tersebut AGAR TETAP agar kredensial tersimpan dapat didekripsi ulang \
                 setelah restart."
            );
            eprintln!(
                "⚠️  WARNING: CREDENTIAL_ENCRYPTION_KEY tidak diset. Key acak dibuat (data lama \
                 tidak akan bisa didekripsi setelah restart)."
            );
            k
        }
    };
    *guard = Some(key);
    key
}

/// Interpretasi nilai env: base64 32B > hex 32B > hash SHA-256 dari string.
fn derive_key_from_env(raw: &str) -> [u8; KEY_LEN] {
    if let Ok(bytes) = B64.decode(raw) {
        if bytes.len() == KEY_LEN {
            return bytes.try_into().unwrap();
        }
    }
    if raw.len() == KEY_LEN * 2 && raw.chars().all(|c| c.is_ascii_hexdigit()) {
        if let Ok(bytes) = hex_to_bytes(raw) {
            return bytes;
        }
    }
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    hasher.finalize().into()
}

fn hex_to_bytes(s: &str) -> Result<[u8; KEY_LEN], ()> {
    let mut out = [0u8; KEY_LEN];
    for (i, byte) in out.iter_mut().enumerate() {
        let hi = s.as_bytes()[i * 2];
        let lo = s.as_bytes()[i * 2 + 1];
        let nib = |c: u8| match c {
            b'0'..=b'9' => Ok(c - b'0'),
            b'a'..=b'f' => Ok(c - b'a' + 10),
            b'A'..=b'F' => Ok(c - b'A' + 10),
            _ => Err(()),
        };
        *byte = (nib(hi)? << 4) | nib(lo)?;
    }
    Ok(out)
}

/// Enkripsi plaintext -> blob terautentikasi (Req 1.2, 9.3-9.5).
pub fn encrypt(plaintext: &[u8]) -> Result<String, EncError> {
    let cipher = Aes256Gcm::new_from_slice(&master_key())
        .map_err(|_| EncError::EncryptionFailed)?;
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ct = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|_| EncError::EncryptionFailed)?;
    let mut blob = Vec::with_capacity(nonce.len() + ct.len());
    blob.extend_from_slice(&nonce);
    blob.extend_from_slice(&ct);
    Ok(format!("{}{}", BLOB_PREFIX, B64.encode(blob)))
}

pub fn encrypt_str(plaintext: &str) -> Result<String, EncError> {
    encrypt(plaintext.as_bytes())
}

/// Dekripsi blob -> plaintext. Kegagalan tag -> ditolak + security warning (Req 9.6).
pub fn decrypt(blob: &str) -> Result<Vec<u8>, EncError> {
    let payload = blob.strip_prefix(BLOB_PREFIX).ok_or(EncError::DecryptionFailed)?;
    let raw = B64.decode(payload).map_err(|_| EncError::DecryptionFailed)?;
    if raw.len() < 12 + 16 {
        tracing::warn!(
            event = "credential_blob_invalid",
            "Security warning: blob kredensial terlalu pendek / korup"
        );
        return Err(EncError::DecryptionFailed);
    }
    let (nonce_bytes, ct) = raw.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(&master_key())
        .map_err(|_| EncError::DecryptionFailed)?;
    let nonce = aes_gcm::aead::generic_array::GenericArray::from_slice(nonce_bytes);
    cipher.decrypt(nonce, ct).map_err(|_| {
        tracing::warn!(
            event = "credential_auth_tag_failed",
            "Security warning: verifikasi tag AES-256-GCM gagal — data koredensial mungkin diubah (tampering)"
        );
        EncError::DecryptionFailed
    })
}

pub fn decrypt_str(blob: &str) -> Result<String, EncError> {
    decrypt(blob).map(|v| String::from_utf8_lossy(&v).into_owned())
}

// =====================================================================
// MASKING (Req 14.7 — masking selalu terjadi di server)
// =====================================================================

/// Nilai rahasia yang boleh sebagian dibuka: 3 karakter pertama + "..." + 3 terakhir.
pub fn mask_partial(value: &str) -> String {
    let v: Vec<char> = value.chars().collect();
    if v.len() <= 8 {
        return "••••••••".to_string();
    }
    let head: String = v[..3].iter().collect();
    let tail: String = v[v.len() - 3..].iter().collect();
    format!("{}...{}", head, tail)
}

/// Password selalu 8 titik, berapa pun panjang aslinya (Req 14.2).
pub fn mask_dots() -> String {
    "••••••••".to_string()
}

/// Apakah nama field dianggap sebagai kata sandi (mask penuh)?
pub fn is_password_field(key: &str) -> bool {
    key.to_ascii_lowercase().contains("password")
}

/// Apakah nama field dianggap kunci/secret api (mask parsial)?
pub fn is_secret_field(key: &str) -> bool {
    let k = key.to_ascii_lowercase();
    k.contains("key") || k.contains("secret") || k.contains("token")
}

pub fn mask_field(key: &str, value: &str) -> String {
    if value.is_empty() {
        return String::new();
    }
    if is_password_field(key) {
        mask_dots()
    } else if is_secret_field(key) {
        mask_partial(value)
    } else {
        value.to_string()
    }
}

/// Bandingkan dua string secara constant-time (Req 11.7 — mencegah timing attack).
pub fn ct_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for i in 0..a.len() {
        diff |= a[i] ^ b[i];
    }
    diff == 0
}

// =====================================================================
// PASSWORD-BASED ENCRYPTION untuk export/import (Req 17.2)
// =====================================================================

/// Derivasi kunci 32 byte dari password + salt memakai Argon2id.
pub fn derive_password_key(password: &str, salt: &[u8]) -> Result<[u8; KEY_LEN], EncError> {
    let mut out = [0u8; KEY_LEN];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut out)
        .map_err(|_| EncError::EncryptionFailed)?;
    Ok(out)
}

/// Enkripsi dengan password: hasil { salt_b64, iv_b64, ct_b64 } tersirat di blob
/// "p1:" + base64( salt(16B) || nonce(12B) || ciphertext||tag ).
pub fn encrypt_with_password(plaintext: &[u8], password: &str) -> Result<String, EncError> {
    let mut material = [0u8; 16 + 12];
    OsRng.fill_bytes(&mut material);
    let (salt, nonce_bytes) = material.split_at(16);
    let key = derive_password_key(password, salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| EncError::EncryptionFailed)?;
    let nonce = aes_gcm::aead::generic_array::GenericArray::from_slice(nonce_bytes);
    let ct = cipher.encrypt(nonce, plaintext).map_err(|_| EncError::EncryptionFailed)?;
    let mut blob = Vec::with_capacity(material.len() + ct.len());
    blob.extend_from_slice(&material);
    blob.extend_from_slice(&ct);
    Ok(format!("p1:{}", B64.encode(blob)))
}

pub fn decrypt_with_password(bundle_blob: &str, password: &str) -> Result<Vec<u8>, EncError> {
    let payload = bundle_blob.strip_prefix("p1:").ok_or(EncError::DecryptionFailed)?;
    let raw = B64.decode(payload).map_err(|_| EncError::DecryptionFailed)?;
    if raw.len() < 16 + 12 + 16 {
        return Err(EncError::DecryptionFailed);
    }
    let (material, ct) = raw.split_at(16 + 12);
    let (salt, nonce_bytes) = material.split_at(16);
    let key = derive_password_key(password, salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| EncError::DecryptionFailed)?;
    let nonce = aes_gcm::aead::generic_array::GenericArray::from_slice(nonce_bytes);
    cipher.decrypt(nonce, ct).map_err(|_| {
        tracing::warn!(
            event = "credential_export_auth_tag_failed",
            "Security warning: dekripsi file export gagal — password salah atau berkas rusak"
        );
        EncError::DecryptionFailed
    })
}

// =====================================================================
// TES BULAT-BALIK (Req 1.5)
// =====================================================================
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_produces_equivalent_plaintext() {
        // Req 1.5: encrypt -> decrypt == plaintext awal.
        let samples = [
            "",
            "sk-abcdef123456",
            &"x".repeat(4096),
            "{\"api_key\":\"secret-123\",\"host\":\"smtp.example.com\"}",
        ];
        for s in samples {
            let blob = encrypt_str(s).expect("gagal enkripsi");
            assert!(blob.starts_with(BLOB_PREFIX));
            let back = decrypt_str(&blob).expect("gagal dekripsi");
            assert_eq!(back, s);
        }
    }

    #[test]
    fn unique_nonce_per_encryption() {
        // Req 9.3: IV unik setiap operasi.
        let a = encrypt_str("kredensial-sama").unwrap();
        let b = encrypt_str("kredensial-sama").unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn tampered_blob_rejected() {
        // Req 9.5/9.6: tamper terdeteksi, dekripsi ditolak.
        let blob = encrypt_str("rahasia-penting").unwrap();
        let mut raw = B64.decode(blob.strip_prefix(BLOB_PREFIX).unwrap()).unwrap();
        let last = raw.len() - 1;
        raw[last] ^= 0xFF;
        let tampered = format!("{}{}", BLOB_PREFIX, B64.encode(&raw));
        assert_eq!(decrypt_str(&tampered).err().unwrap(), EncError::DecryptionFailed);
    }

    #[test]
    fn error_message_hides_plaintext() {
        // Req 1.7/11.1: pesan error generik, tanpa plaintext.
        let e = decrypt("v1:xxxx").unwrap_err();
        assert_eq!(e.message(), "Decryption failed");
    }

    #[test]
    fn masking_shapes() {
        // Req 14.1-14.2
        assert_eq!(mask_partial("sk-proj-abcdefghij123"), "sk-...123");
        assert_eq!(mask_field("password", "apapun"), mask_dots());
        assert_eq!(mask_dots().chars().count(), 8);
    }

    #[test]
    fn constant_time_eq() {
        // Req 11.7
        assert!(ct_eq("sk-...123", "sk-...123"));
        assert!(!ct_eq("sk-...123", "sk-...124"));
        assert!(!ct_eq("aaa", "aaaa"));
    }

    #[test]
    fn password_export_round_trip() {
        // Req 17.2/17.5: salah password harus gagal.
        let blob = encrypt_with_password(b"{\"data\":1}", "password-kuat-123").unwrap();
        let ok = decrypt_with_password(&blob, "password-kuat-123").unwrap();
        assert_eq!(ok, b"{\"data\":1}");
        assert!(decrypt_with_password(&blob, "password-salah").is_err());
    }
}
