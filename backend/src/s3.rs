// =====================================================================
// NEON OBJECT STORAGE (S3-COMPATIBLE)
// =====================================================================
// Modul untuk mengakses Neon Object Storage lewat protokol S3
// (SigV4). Kredensial dibaca dari env:
//   AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
//
// Semua file disimpan dalam bucket `luxio` dengan prefix folder `luxio/`.
// Pemisahan kategori diterapkan dengan sub-prefix:
//   luxio/{category}/{user_id}/{timestamp}_{nama-file}
//
// Implementasi memakai SigV4 signing manual (tanpa SDK) karena backend
// Rust ini hanya bergantung pada `reqwest` + `sha2` + `hmac` (tidak ada
// crate AWS SDK). Endpoint Neon hanya menerima *path-style* (bucket pada
// path, host tetap sama).
// =====================================================================

use crate::AppState;

// ---- Konfigurasi dari env (kredensial Neon S3 di backend/.env) ----

/// Kredensial S3 aktif: dibaca dari env (seperti diinstruksikan user).
pub fn s3_credentials() -> (String, String, String, String) {
    (
        std::env::var("AWS_ENDPOINT_URL_S3").unwrap_or_default(),
        std::env::var("AWS_ACCESS_KEY_ID").unwrap_or_default(),
        std::env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_default(),
        std::env::var("AWS_REGION").unwrap_or_default(),
    )
}

pub fn is_configured() -> bool {
    let (ep, ak, sk, _) = s3_credentials();
    !ep.is_empty() && !ak.is_empty() && !sk.is_empty()
}

// ---- SigV4 signing ----

fn hmac_sha256(key: &[u8], data: &str) -> Vec<u8> {
    use hmac::{Hmac, Mac};
    type HmacSha256 = Hmac<sha2::Sha256>;
    let mut mac = HmacSha256::new_from_slice(key).expect("hmac key");
    mac.update(data.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

fn sha256_hex(data: &[u8]) -> String {
    use sha2::Digest as _;
    let mut h = sha2::Sha256::new();
    h.update(data);
    hex::encode(h.finalize())
}

fn sha256_hex_str(data: &str) -> String {
    sha256_hex(data.as_bytes())
}

fn uri_escape(s: &str) -> String {
    // EncodeURIComponent + AWS SigV4 extra-escape untuk !'()*
    let mut out = String::new();
    for b in s.bytes() {
        let c = b as char;
        if c.is_ascii_alphanumeric()
            || matches!(c, '-' | '_' | '.' | '~')
        {
            out.push(c);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}

/// Bangun `Authorization` header SigV4 untuk satu request S3.
fn build_sigv4(
    method: &str,
    path: &str,
    canonical_query: &str,
    payload: &[u8],
    host: &str,
    access_key: &str,
    secret_key: &str,
    region: &str,
    service: &str,
    amz_date: &str,
) -> (String, String) {
    let date_stamp = &amz_date[0..8];

    let canonical_headers = format!("host:{}\n", host);
    let signed_headers = "host";

    let canonical_request = format!(
        "{}\n{}\n{}\n{}\n{}\n{}",
        method,
        path,
        canonical_query,
        canonical_headers,
        signed_headers,
        sha256_hex(payload)
    );

    let credential_scope = format!("{}/{}/{}/aws4_request", date_stamp, region, service);
    let string_to_sign = format!(
        "AWS4-HMAC-SHA256\n{}\n{}\n{}",
        amz_date,
        credential_scope,
        sha256_hex_str(&canonical_request)
    );

    let k_date = hmac_sha256(format!("AWS4{}", secret_key).as_bytes(), date_stamp);
    let k_region = hmac_sha256(&k_date, region);
    let k_service = hmac_sha256(&k_region, service);
    let k_signing = hmac_sha256(&k_service, "aws4_request");
    let signature = hmac_sha256(&k_signing, &string_to_sign)
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>();

    let authorization = format!(
        "AWS4-HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        access_key, credential_scope, signed_headers, signature
    );

    (authorization, canonical_headers)
}

/// Jalankan satu request S3 (path-style) dengan SigV4. Mengembalikan
/// (bytes, status, content_type).
pub async fn s3_request(
    method: &str,
    path: &str,
    query_params: &[(&str, &str)],
    body: &[u8],
    content_type: Option<&str>,
) -> Result<(Vec<u8>, u16, String), String> {
    let (endpoint, ak, sk, region) = s3_credentials();

    let endpoint = endpoint.trim_end_matches('/');
    let amz_date = chrono::Utc::now()
        .format("%Y%m%dT%H%M%SZ")
        .to_string();

    // Canonical query (sorted, escaped)
    let mut sorted: Vec<(&str, &str)> = query_params.to_vec();
    sorted.sort_by(|a, b| a.0.cmp(b.0));
    let canonical_query = sorted
        .iter()
        .map(|(k, v)| format!("{}={}", uri_escape(k), uri_escape(v)))
        .collect::<Vec<_>>()
        .join("&");

    let parsed = reqwest::Url::parse(&format!("{}{}", endpoint, path))
        .map_err(|e| format!("URL S3 tidak valid: {}", e))?;
    let host = parsed
        .host_str()
        .unwrap_or("")
        .to_string();

    let (authorization, _canonical_headers) = build_sigv4(
        method,
        path,
        &canonical_query,
        body,
        &host,
        &ak,
        &sk,
        &region,
        "s3",
        &amz_date,
    );

    let client = reqwest::Client::new();
    let query_suffix = if canonical_query.is_empty() { String::new() } else { format!("?{}", canonical_query) };
    let mut req = client
        .request(
            reqwest::Method::from_bytes(method.as_bytes()).map_err(|_| "method invalid")?,
            &format!("{}{}{}", endpoint, path, query_suffix),
        )
        .header("X-Amz-Date", &amz_date)
        .header("X-Amz-Content-Sha256", sha256_hex(body))
        .header("Authorization", &authorization);

    if let Some(ct) = content_type {
        req = req.header("Content-Type", ct);
    }

    if !matches!(method, "GET" | "HEAD" | "DELETE") {
        req = req.body(body.to_vec());
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Request S3 gagal: {}", e))?;
    let status = resp.status().as_u16();
    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let bytes = resp.bytes().await.map_err(|e| format!("Baca respon S3 gagal: {}", e))?.to_vec();
    Ok((bytes, status, content_type))
}

// ---- Operasi tingkat tinggi ----

/// Daftar objek di folder `luxio/`.
pub async fn list_files(
    state: &AppState,
    prefix: &str,
) -> Result<serde_json::Value, String> {
    let _ = state;
    let p = format!("/luxio");
    let (bytes, status, _ct) = s3_request(
        "GET",
        &p,
        &[
            ("list-type", "2"),
            ("prefix", prefix),
            ("max-keys", "1000"),
        ],
        b"",
        None,
    )
    .await?;
    if status >= 300 {
        return Err(format!("Gagal list S3 (status {}): {}", status, String::from_utf8_lossy(&bytes)));
    }
    let text = String::from_utf8_lossy(&bytes);
    parse_list_xml(&text)
}

/// Upload file ke S3 di prefix `luxio/{category}/{user}/{timestamp}_{name}`.
/// Mengembalikan key + URL publik.
pub async fn upload_file(
    state: &AppState,
    category: &str,
    user_id: &str,
    file_name: &str,
    content_type: &str,
    data: &[u8],
) -> Result<serde_json::Value, String> {
    let _ = state;
    let stamp = chrono::Utc::now().format("%Y%m%d%H%M%S").to_string();
    let safe_name = file_name
        .replace('/', "_")
        .replace('\\', "_")
        .replace("..", "_");
    let key = format!("luxio/{}/{}/{}_{}", category, user_id, stamp, safe_name);

    let clean_key = key.trim_start_matches('/');
    let (bytes, status, _ct) = s3_request(
        "PUT",
        &format!("/luxio/{}", clean_key),
        &[],
        data,
        Some(content_type),
    )
    .await?;
    if status >= 300 {
        return Err(format!("Upload S3 gagal (status {}): {}", status, String::from_utf8_lossy(&bytes)));
    }

    Ok(serde_json::json!({
        "ok": true,
        "key": format!("luxio/{}", clean_key),
        "url": public_url(&format!("luxio/{}", clean_key)),
        "size": data.len(),
        "content_type": content_type,
    }))
}

/// Download objek dari S3. Mengembalikan (bytes, content_type).
pub async fn download_file(key: &str) -> Result<(Vec<u8>, String), String> {
    let clean_key = key.trim_start_matches('/');
    let (bytes, status, ct) = s3_request(
        "GET",
        &format!("/luxio/{}", clean_key),
        &[],
        b"",
        None,
    )
    .await?;
    if status >= 300 {
        return Err(format!("Download S3 gagal (status {}): {}", status, String::from_utf8_lossy(&bytes)));
    }
    Ok((bytes, ct))
}

/// Hapus objek dari S3.
pub async fn delete_file(key: &str) -> Result<(), String> {
    let clean_key = key.trim_start_matches('/');
    let (bytes, status, _ct) = s3_request(
        "DELETE",
        &format!("/luxio/{}", clean_key),
        &[],
        b"",
        None,
    )
    .await?;
    if status >= 300 {
        return Err(format!("Hapus S3 gagal (status {}): {}", status, String::from_utf8_lossy(&bytes)));
    }
    let _ = bytes;
    Ok(())
}

/// Buat "folder" (marker objek key berakhiran `/`). S3 tidak punya folder
/// sejati; marker kosong cukup agar tampil sebagai folder di listing.
pub async fn create_folder(prefix: &str) -> Result<String, String> {
    let clean = prefix.trim_matches('/');
    if clean.is_empty() {
        return Err("Nama folder kosong".to_string());
    }
    let key = format!("{}/", clean.trim_start_matches('/'));
    let (bytes, status, _ct) = s3_request(
        "PUT",
        &format!("/luxio/{}", uri_escape(&key)),
        &[],
        b"",
        Some("application/x-directory"),
    )
    .await?;
    let _ = bytes;
    if status >= 300 {
        return Err(format!("Buat folder S3 gagal (status {})", status));
    }
    Ok(key)
}

/// Pindah (rename path) satu objek: GET source → PUT dest → DELETE source.
/// Untuk marker folder cukup salin marker-nya saja.
pub async fn move_object(src: &str, dest: &str) -> Result<(), String> {
    let src_clean = src.trim_start_matches('/');
    let dest_clean = dest.trim_start_matches('/');
    if src_clean == dest_clean || src_clean.is_empty() || dest_clean.is_empty() {
        return Err("Key sumber/tujuan tidak valid".to_string());
    }
    if src_clean.ends_with('/') {
        // Marker folder: buat marker tujuan, hapus marker lama.
        create_folder(dest_clean).await?;
        let (bytes, status, _ct) = s3_request(
            "DELETE",
            &format!("/luxio/{}", uri_escape(src_clean)),
            &[],
            b"",
            None,
        )
        .await?;
        let _ = bytes;
        if status >= 300 {
            return Err(format!("Hapus marker folder lama gagal (status {})", status));
        }
        return Ok(());
    }
    let (data, ct) = download_file(src_clean).await?;
    let (bytes, status, _ct) = s3_request(
        "PUT",
        &format!("/luxio/{}", uri_escape(dest_clean)),
        &[],
        &data,
        Some(&ct),
    )
    .await?;
    let _ = bytes;
    if status >= 300 {
        return Err(format!("Upload tujuan move gagal (status {})", status));
    }
    delete_file(src_clean).await?;
    Ok(())
}

/// URL publik objek (endpoint + path).
pub fn public_url(key: &str) -> String {
    let (endpoint, _, _, _) = s3_credentials();
    format!("{}/luxio/{}", endpoint.trim_end_matches('/'), key.trim_start_matches('/'))
}

/// Parse XML `<ListBucketResult>` menjadi array objek (Best-effort, tanpa
/// crate XML: memakai potongan string sederhana yang cukup untuk daftar.
/// Catatan: Neon S3 mengembalikan XML standar S3).
fn parse_list_xml(xml: &str) -> Result<serde_json::Value, String> {
    let mut items = Vec::new();
    let mut pos = 0;
    while let Some(start) = xml[pos..].find("<Contents>") {
        let seg_start = pos + start;
        let Some(end) = xml[seg_start..].find("</Contents>") else {
            break;
        };
        let seg = &xml[seg_start + "<Contents>".len()..seg_start + end];
        pos = seg_start + end + "</Contents>".len();

        let get = |tag: &str| -> String {
            let open = format!("<{}>", tag);
            let close = format!("</{}>", tag);
            if let Some(s) = seg.find(&open) {
                let vstart = s + open.len();
                if let Some(e) = seg[vstart..].find(&close) {
                    return seg[vstart..vstart + e].to_string();
                }
            }
            String::new()
        };

        let key = get("Key");
        let size: i64 = get("Size").parse().unwrap_or(0);
        let modified = get("LastModified");
        let etag = get("ETag");
        let is_placeholder = key.ends_with(".emptyFolderPlaceholder") || key.ends_with('/');
        if key.is_empty() || is_placeholder {
            continue;
        }

        items.push(serde_json::json!({
            "key": key,
            "size": size,
            "last_modified": modified,
            "etag": etag,
        }));
    }
    Ok(serde_json::json!({ "ok": true, "count": items.len(), "items": items }))
}
