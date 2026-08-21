use axum::{
    extract::State,
    http::HeaderMap,
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Digest;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::AppState;

// =====================================================================
// TOOL / ACTION LAYER (AI Agent & Actions)
// =====================================================================
// Sesuai `ai-agent-security-architecture.md`: AI Agent TIDAK punya akses
// langsung ke database. Agent hanya boleh memanggil tools/actions resmi
// yang melewati Rust. UI manusia dan AI Agent memakai business logic yang
// sama.
//
// Alur tiap tool:
//   Auth (token) -> Risk check -> Validasi -> Authorization (ownership)
//   -> Business logic -> Audit log (+ idempotency untuk aksi yang terulang)
// =====================================================================

/// Tingkat risiko tool (S9). Tool medium/high wajib `confirm: true`.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

/// Schema satu tool (S4). Ini kontrak antara agent dan aplikasi.
pub struct ToolSchema {
    pub name: &'static str,
    pub description: &'static str,
    pub risk: RiskLevel,
    pub required: &'static [&'static str],
    pub optional: &'static [&'static str],
}

/// Registri tool resmi. Tambahkan tool baru di sini — tanpa menambah tool
/// di daftar ini, agent tidak bisa menjalankan operasi itu.
const TOOLS: &[ToolSchema] = &[
    // ---------- Company ----------
    ToolSchema {
        name: "create_company",
        description: "Membuat perusahaan/workspace baru milik user terautentikasi",
        risk: RiskLevel::Low,
        required: &["name", "industry", "size"],
        optional: &[],
    },
    // ---------- Division ----------
    ToolSchema {
        name: "create_division",
        description: "Membuat divisi baru dalam sebuah perusahaan",
        risk: RiskLevel::Low,
        required: &["company_id", "name"],
        optional: &["head_id"],
    },
    // ---------- Member ----------
    ToolSchema {
        name: "create_member",
        description: "Menambahkan anggota ke divisi sebuah perusahaan (form lengkap pendaftaran)",
        risk: RiskLevel::Low,
        required: &["company_id", "division_id", "name", "email", "role"],
        optional: &["position", "phone", "gender", "birth_date", "address",
                     "employment_status", "join_date", "salary", "skills", "education", "notes"],
    },
    ToolSchema {
        name: "list_members",
        description: "Daftar anggota sebuah perusahaan",
        risk: RiskLevel::Low,
        required: &["company_id"],
        optional: &[],
    },
    ToolSchema {
        name: "list_divisions",
        description: "Daftar divisi sebuah perusahaan",
        risk: RiskLevel::Low,
        required: &["company_id"],
        optional: &[],
    },
    // ---------- Target (mapping: tabel `projects`) ----------
    ToolSchema {
        name: "create_target",
        description: "Membuat target/project baru lengkap dengan tahapan (stages) dan to-do",
        risk: RiskLevel::Low,
        required: &["name", "company_id", "division_id"],
        optional: &["project_type", "due_date", "stages"],
    },
    ToolSchema {
        name: "get_target",
        description: "Mengambil detail satu target berikut tahapan & checklist-nya",
        risk: RiskLevel::Low,
        required: &["target_id"],
        optional: &[],
    },
    ToolSchema {
        name: "list_targets",
        description: "Daftar target/project aktif milik sebuah perusahaan",
        risk: RiskLevel::Low,
        required: &["company_id"],
        optional: &[],
    },
    ToolSchema {
        name: "update_target",
        description: "Memperbarui nama/status/progress/due_date sebuah target",
        risk: RiskLevel::Low,
        required: &["target_id"],
        optional: &["name", "status", "progress", "due_date"],
    },
    ToolSchema {
        name: "delete_target",
        description: "Menghapus target beserta tahapan & checklist-nya (permanen)",
        risk: RiskLevel::Medium,
        required: &["target_id"],
        optional: &[],
    },
    // ---------- Project (operasi umum) ----------
    ToolSchema {
        name: "create_project",
        description: "Alias create_target — membuat project/target baru",
        risk: RiskLevel::Low,
        required: &["name", "company_id", "division_id"],
        optional: &["project_type", "due_date", "stages"],
    },
    // ---------- Task / Checklist ----------
    ToolSchema {
        name: "create_task",
        description: "Menambahkan task/checklist ke sebuah tahapan (stage)",
        risk: RiskLevel::Low,
        required: &["stage_id", "text"],
        optional: &[],
    },
    ToolSchema {
        name: "complete_task",
        description: "Menandai task/checklist selesai",
        risk: RiskLevel::Low,
        required: &["task_id"],
        optional: &["completed"],
    },
    ToolSchema {
        name: "delete_task",
        description: "Menghapus task/checklist",
        risk: RiskLevel::Medium,
        required: &["task_id"],
        optional: &[],
    },
];

/// Body request POST /api/tools/execute.
#[derive(Debug, Deserialize)]
pub struct ExecuteRequest {
    /// Nama tool, contoh "create_target".
    pub tool: String,
    /// Argumen tool sesuai schema (required/optional).
    pub args: Value,
    /// Untuk tool berisiko medium/high, wajib `true`.
    #[serde(default)]
    pub confirm: bool,
    /// Kunci idempotensi (S17): request yang sama tidak dieksekusi dua kali.
    pub idempotency_key: Option<String>,
    /// Jenis pelaku: "user" (default) atau "ai_agent" (untuk audit log).
    pub actor_type: Option<String>,
}

/// Error tool dengan status HTTP + pesan.
pub struct ToolError {
    pub status: StatusCode,
    pub message: String,
}

impl ToolError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self { status, message: message.into() }
    }
}

// ---------------------------------------------------------------------
// Helper validasi argumen
// ---------------------------------------------------------------------

fn get_str(args: &Value, key: &str) -> Option<String> {
    args.get(key).and_then(|v| v.as_str()).map(|s| s.trim().to_string())
}

fn get_str_required(args: &Value, key: &str) -> Result<String, ToolError> {
    match get_str(args, key) {
        Some(s) if !s.is_empty() => Ok(s),
        _ => Err(ToolError::new(
            StatusCode::BAD_REQUEST,
            format!("Missing required field: {key}"),
        )),
    }
}

fn get_str_optional(args: &Value, key: &str) -> Option<String> {
    get_str(args, key).filter(|s| !s.is_empty())
}

fn get_i32_optional(args: &Value, key: &str) -> Result<Option<i32>, ToolError> {
    match args.get(key) {
        Some(v) => match v.as_i64() {
            Some(n) => Ok(Some(n as i32)),
            None => Err(ToolError::new(
                StatusCode::BAD_REQUEST,
                format!("Field {key} harus berupa angka"),
            )),
        },
        None => Ok(None),
    }
}

// ---------------------------------------------------------------------
// Authorization helpers (ownership)
// ---------------------------------------------------------------------

/// Cek apakah `user_id` adalah pemilik `company_id`.
async fn check_company_owned(
    db: &PgPool,
    user_id: &str,
    company_id: &str,
) -> Result<(), ToolError> {
    let row = sqlx::query("SELECT owner_id FROM companies WHERE id = $1")
        .bind(company_id)
        .fetch_optional(db)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
    match row {
        Some(r) => {
            let owner_id: String = r.get("owner_id");
            if owner_id == user_id {
                Ok(())
            } else {
                Err(ToolError::new(StatusCode::FORBIDDEN, "Akses ditolak: bukan perusahaan milik Anda"))
            }
        }
        None => Err(ToolError::new(StatusCode::NOT_FOUND, "Perusahaan tidak ditemukan")),
    }
}

/// Cek kepemilikan sebuah project/target lewat company-nya.
async fn check_project_owned(
    db: &PgPool,
    user_id: &str,
    project_id: &str,
) -> Result<(), ToolError> {
    let row = sqlx::query(
        "SELECT c.owner_id FROM projects p
         JOIN companies c ON c.id = p.company_id
         WHERE p.id = $1",
    )
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
    match row {
        Some(r) => {
            let owner_id: String = r.get("owner_id");
            if owner_id == user_id {
                Ok(())
            } else {
                Err(ToolError::new(StatusCode::FORBIDDEN, "Akses ditolak: bukan target milik Anda"))
            }
        }
        None => Err(ToolError::new(StatusCode::NOT_FOUND, "Target tidak ditemukan")),
    }
}

/// Cek kepemilikan stage lewat project -> company.
async fn check_stage_owned(
    db: &PgPool,
    user_id: &str,
    stage_id: &str,
) -> Result<(), ToolError> {
    let row = sqlx::query(
        "SELECT c.owner_id FROM stages s
         JOIN projects p ON p.id = s.project_id
         JOIN companies c ON c.id = p.company_id
         WHERE s.id = $1",
    )
    .bind(stage_id)
    .fetch_optional(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
    match row {
        Some(r) => {
            let owner_id: String = r.get("owner_id");
            if owner_id == user_id {
                Ok(())
            } else {
                Err(ToolError::new(StatusCode::FORBIDDEN, "Akses ditolak: bukan data milik Anda"))
            }
        }
        None => Err(ToolError::new(StatusCode::NOT_FOUND, "Tahapan tidak ditemukan")),
    }
}

/// Cek kepemilikan checklist item lewat stage -> project -> company.
async fn check_task_owned(
    db: &PgPool,
    user_id: &str,
    task_id: &str,
) -> Result<(), ToolError> {
    let row = sqlx::query(
        "SELECT c.owner_id FROM checklist_items ci
         JOIN stages s ON s.id = ci.stage_id
         JOIN projects p ON p.id = s.project_id
         JOIN companies c ON c.id = p.company_id
         WHERE ci.id = $1",
    )
    .bind(task_id)
    .fetch_optional(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
    match row {
        Some(r) => {
            let owner_id: String = r.get("owner_id");
            if owner_id == user_id {
                Ok(())
            } else {
                Err(ToolError::new(StatusCode::FORBIDDEN, "Akses ditolak: bukan task milik Anda"))
            }
        }
        None => Err(ToolError::new(StatusCode::NOT_FOUND, "Task tidak ditemukan")),
    }
}

// ---------------------------------------------------------------------
// Audit log (S16)
// ---------------------------------------------------------------------

/// Catat aksi penting ke tabel `audit_logs`.
#[allow(clippy::too_many_arguments)]
async fn record_audit(
    db: &PgPool,
    actor_type: &str,
    user_id: &str,
    tool_name: &str,
    action: &str,
    target_resource: Option<&str>,
    result: &str,
    detail: Option<&str>,
) {
    let _ = sqlx::query(
        "INSERT INTO audit_logs (id, actor_type, user_id, tool_name, action, target_resource, result, detail, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(actor_type)
    .bind(user_id)
    .bind(tool_name)
    .bind(action)
    .bind(target_resource)
    .bind(result)
    .bind(detail)
    .bind(Utc::now())
    .execute(db)
    .await
    .ok();
}

// ---------------------------------------------------------------------
// Idempotency (S17)
// ---------------------------------------------------------------------

/// Cari respons tersimpan untuk (user, idempotency_key).
async fn idem_get(
    db: &PgPool,
    user_id: &str,
    key: &str,
) -> Result<Option<Value>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT response FROM idempotency_keys WHERE user_id = $1 AND idempotency_key = $2",
    )
    .bind(user_id)
    .bind(key)
    .fetch_optional(db)
    .await?;
    match row {
        Some(r) => {
            let v: sqlx::types::Json<Value> = r.get("response");
            Ok(Some(v.0))
        }
        None => Ok(None),
    }
}

/// Simpan respons agar request duplikat dikembalikan sama tanpa eksekusi ulang.
async fn idem_put(
    db: &PgPool,
    user_id: &str,
    key: &str,
    tool_name: &str,
    response: &Value,
) -> Result<(), sqlx::Error> {
    let value = sqlx::types::Json(response.clone());
    sqlx::query(
        "INSERT INTO idempotency_keys (id, user_id, idempotency_key, tool_name, response, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(user_id)
    .bind(key)
    .bind(tool_name)
    .bind(value)
    .bind(Utc::now())
    .execute(db)
    .await?;
    Ok(())
}

// ---------------------------------------------------------------------
// Business logic per tool
// ---------------------------------------------------------------------

async fn tool_create_company(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let name = get_str_required(args, "name")?;
    let industry = get_str_required(args, "industry")?;
    let size = get_str_required(args, "size")?;
    if name.len() > 150 || industry.len() > 100 || size.len() > 50 {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Field terlalu panjang"));
    }

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO companies (id, name, industry, size, owner_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(&name)
    .bind(&industry)
    .bind(&size)
    .bind(user_id)
    .bind(Utc::now())
    .execute(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    // Tautkan user ke company barunya.
    let _ = sqlx::query("UPDATE users SET company_id = $1 WHERE id = $2")
        .bind(&id)
        .bind(user_id)
        .execute(db)
        .await;

    Ok(json!({ "company_id": id, "name": name, "industry": industry, "size": size }))
}

async fn tool_create_division(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let company_id = get_str_required(args, "company_id")?;
    let name = get_str_required(args, "name")?;
    let head_id = get_str_optional(args, "head_id");
    if name.len() > 120 {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Nama divisi terlalu panjang"));
    }
    check_company_owned(db, user_id, &company_id).await?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO divisions (id, company_id, name, head_id, member_count, created_at)
         VALUES ($1, $2, $3, $4, 0, $5)",
    )
    .bind(&id)
    .bind(&company_id)
    .bind(&name)
    .bind(&head_id)
    .bind(Utc::now())
    .execute(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "division_id": id, "company_id": company_id, "name": name, "head_id": head_id }))
}

async fn tool_create_member(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let company_id = get_str_required(args, "company_id")?;
    let division_id = get_str_required(args, "division_id")?;
    let name = get_str_required(args, "name")?;
    let email = get_str_required(args, "email")?;
    let role = get_str_required(args, "role")?;
    if name.len() > 100 || email.len() > 254 || role.len() > 30 {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Field terlalu panjang"));
    }
    check_company_owned(db, user_id, &company_id).await?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO members (id, company_id, division_id, name, email, role, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
    )
    .bind(&id)
    .bind(&company_id)
    .bind(&division_id)
    .bind(&name)
    .bind(&email)
    .bind(&role)
    .bind(get_str_optional(args, "position").unwrap_or_default())
    .bind(get_str_optional(args, "phone").unwrap_or_default())
    .bind(get_str_optional(args, "gender").unwrap_or_default())
    .bind(get_str_optional(args, "birth_date").unwrap_or_default())
    .bind(get_str_optional(args, "address").unwrap_or_default())
    .bind(get_str_optional(args, "employment_status").unwrap_or_default())
    .bind(get_str_optional(args, "join_date").unwrap_or_default())
    .bind(get_str_optional(args, "salary").unwrap_or_default())
    .bind(get_str_optional(args, "skills").unwrap_or_default())
    .bind(get_str_optional(args, "education").unwrap_or_default())
    .bind(get_str_optional(args, "notes").unwrap_or_default())
    .bind(Utc::now())
    .execute(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let _ = sqlx::query("UPDATE divisions SET member_count = member_count + 1 WHERE id = $1")
        .bind(&division_id)
        .execute(db)
        .await;

    Ok(json!({ "member_id": id, "name": name, "email": email, "role": role }))
}

/// Buat project/target + tahapan (stages) + to-do checklist dalam satu
/// transaction (S18) — tidak ada data setengah jadi.
async fn tool_create_target(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let name = get_str_required(args, "name")?;
    let company_id = get_str_required(args, "company_id")?;
    let division_id = get_str_required(args, "division_id")?;
    let project_type = get_str_optional(args, "project_type").unwrap_or_else(|| "target".to_string());
    let due_date = get_str_optional(args, "due_date");
    if name.len() > 150 {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Nama terlalu panjang"));
    }
    check_company_owned(db, user_id, &company_id).await?;

    let id = Uuid::new_v4().to_string();
    let mut tx = db
        .begin()
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    sqlx::query(
        "INSERT INTO projects (id, company_id, division_id, name, project_type, progress, status, created_at, due_date)
         VALUES ($1, $2, $3, $4, $5, 0, 'active', $6, $7)",
    )
    .bind(&id)
    .bind(&company_id)
    .bind(&division_id)
    .bind(&name)
    .bind(&project_type)
    .bind(Utc::now())
    .bind(due_date)
    .execute(&mut *tx)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    // Stages opsional: [{ "name": "...", "todos": ["...", ...] }]
    let mut stage_ids: Vec<String> = Vec::new();
    if let Some(stages) = args.get("stages").and_then(|v| v.as_array()) {
        let mut order = 0;
        for s in stages {
            let stage_name = s.get("name").and_then(|v| v.as_str()).unwrap_or("").trim();
            if stage_name.is_empty() {
                continue;
            }
            order += 1;
            let stage_id = Uuid::new_v4().to_string();
            let status = if order == 1 { "in_progress" } else { "locked" };
            sqlx::query(
                "INSERT INTO stages (id, project_id, name, order_num, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(&stage_id)
            .bind(&id)
            .bind(stage_name)
            .bind(order)
            .bind(status)
            .bind(Utc::now())
            .execute(&mut *tx)
            .await
            .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

            if let Some(todos) = s.get("todos").and_then(|v| v.as_array()) {
                for t in todos {
                    let text = t.as_str().unwrap_or("").trim();
                    if text.is_empty() {
                        continue;
                    }
                    sqlx::query(
                        "INSERT INTO checklist_items (id, stage_id, text, completed)
                         VALUES ($1, $2, $3, FALSE)",
                    )
                    .bind(Uuid::new_v4().to_string())
                    .bind(&stage_id)
                    .bind(text)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
                }
            }
            stage_ids.push(stage_id);
        }
    }

    tx.commit()
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "target_id": id, "name": name, "project_type": project_type, "stage_ids": stage_ids }))
}

async fn tool_get_target(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let target_id = get_str_required(args, "target_id")?;
    check_project_owned(db, user_id, &target_id).await?;

    let row = sqlx::query(
        "SELECT id, company_id, division_id, name, project_type, progress, status, created_at, due_date
         FROM projects WHERE id = $1",
    )
    .bind(&target_id)
    .fetch_optional(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let project = match row {
        Some(r) => json!({
            "id": r.get::<String, _>("id"),
            "company_id": r.get::<String, _>("company_id"),
            "division_id": r.get::<String, _>("division_id"),
            "name": r.get::<String, _>("name"),
            "project_type": r.get::<String, _>("project_type"),
            "progress": r.get::<i32, _>("progress"),
            "status": r.get::<String, _>("status"),
            "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            "due_date": r.get::<Option<chrono::DateTime<Utc>>, _>("due_date"),
        }),
        None => return Err(ToolError::new(StatusCode::NOT_FOUND, "Target tidak ditemukan")),
    };

    // Stages + checklist items.
    let stages = sqlx::query(
        "SELECT id, name, order_num, status FROM stages WHERE project_id = $1 ORDER BY order_num",
    )
    .bind(&target_id)
    .fetch_all(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let mut stage_list: Vec<Value> = Vec::new();
    for s in &stages {
        let stage_id: String = s.get("id");
        let items = sqlx::query(
            "SELECT id, text, completed FROM checklist_items WHERE stage_id = $1 ORDER BY created_at",
        )
        .bind(&stage_id)
        .fetch_all(db)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;
        let checklist: Vec<Value> = items
            .iter()
            .map(|i| {
                json!({
                    "id": i.get::<String, _>("id"),
                    "text": i.get::<String, _>("text"),
                    "completed": i.get::<bool, _>("completed"),
                })
            })
            .collect();
        stage_list.push(json!({
            "id": stage_id,
            "name": s.get::<String, _>("name"),
            "order_num": s.get::<i32, _>("order_num"),
            "status": s.get::<String, _>("status"),
            "checklist": checklist,
        }));
    }

    Ok(json!({ "target": project, "stages": stage_list }))
}

async fn tool_list_targets(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let company_id = get_str_required(args, "company_id")?;
    check_company_owned(db, user_id, &company_id).await?;

    let rows = sqlx::query(
        "SELECT id, name, project_type, progress, status, created_at, due_date
         FROM projects WHERE company_id = $1 AND status != 'archived'
         ORDER BY created_at DESC",
    )
    .bind(&company_id)
    .fetch_all(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let targets: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "name": r.get::<String, _>("name"),
                "project_type": r.get::<String, _>("project_type"),
                "progress": r.get::<i32, _>("progress"),
                "status": r.get::<String, _>("status"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
                "due_date": r.get::<Option<chrono::DateTime<Utc>>, _>("due_date"),
            })
        })
        .collect();

    Ok(json!({ "targets": targets, "count": targets.len() }))
}

async fn tool_update_target(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let target_id = get_str_required(args, "target_id")?;
    let name = get_str_optional(args, "name");
    let status = get_str_optional(args, "status");
    let due_date = get_str_optional(args, "due_date");
    let progress = get_i32_optional(args, "progress")?;

    // Validasi enum status (S6): hanya nilai resmi aplikasi.
    if let Some(s) = &status {
        let valid = matches!(s.as_str(), "active" | "completed" | "archived" | "paused");
        if !valid {
            return Err(ToolError::new(
                StatusCode::BAD_REQUEST,
                "status harus salah satu: active, completed, archived, paused",
            ));
        }
    }
    if let Some(p) = progress {
        if !(0..=100).contains(&p) {
            return Err(ToolError::new(StatusCode::BAD_REQUEST, "progress harus 0-100"));
        }
    }
    check_project_owned(db, user_id, &target_id).await?;

    // Bangun UPDATE dinamis — field hanya yang dikirim.
    let mut sets: Vec<String> = Vec::new();
    let mut binds: Vec<Value> = Vec::new();
    if let Some(n) = name {
        sets.push("name = $".to_string() + &(binds.len() + 1).to_string());
        binds.push(Value::String(n));
    }
    if let Some(s) = status {
        sets.push("status = $".to_string() + &(binds.len() + 1).to_string());
        binds.push(Value::String(s));
    }
    if let Some(d) = due_date {
        sets.push("due_date = $".to_string() + &(binds.len() + 1).to_string());
        binds.push(Value::String(d));
    }
    if let Some(p) = progress {
        sets.push("progress = $".to_string() + &(binds.len() + 1).to_string());
        binds.push(Value::from(p));
    }
    if sets.is_empty() {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Tidak ada field yang diperbarui"));
    }

    let sql = format!(
        "UPDATE projects SET {} WHERE id = ${}",
        sets.join(", "),
        binds.len() + 1
    );
    let mut q = sqlx::query(&sql);
    for b in &binds {
        if let Some(s) = b.as_str() {
            q = q.bind(s.to_string());
        } else if let Some(n) = b.as_i64() {
            q = q.bind(n as i32);
        }
    }
    q = q.bind(&target_id);
    q.execute(db)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "target_id": target_id, "updated": true }))
}

/// Hapus target + stages + checklist items dalam satu transaction.
async fn tool_delete_target(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let target_id = get_str_required(args, "target_id")?;
    check_project_owned(db, user_id, &target_id).await?;

    let mut tx = db
        .begin()
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    sqlx::query(
        "DELETE FROM checklist_items WHERE stage_id IN (SELECT id FROM stages WHERE project_id = $1)",
    )
    .bind(&target_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    sqlx::query("DELETE FROM stages WHERE project_id = $1")
        .bind(&target_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    sqlx::query("DELETE FROM projects WHERE id = $1")
        .bind(&target_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    tx.commit()
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "deleted_target_id": target_id }))
}

async fn tool_create_task(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let stage_id = get_str_required(args, "stage_id")?;
    let text = get_str_required(args, "text")?;
    if text.len() > 500 {
        return Err(ToolError::new(StatusCode::BAD_REQUEST, "Teks task terlalu panjang"));
    }
    check_stage_owned(db, user_id, &stage_id).await?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO checklist_items (id, stage_id, text, completed) VALUES ($1, $2, $3, FALSE)",
    )
    .bind(&id)
    .bind(&stage_id)
    .bind(&text)
    .execute(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "task_id": id, "stage_id": stage_id, "text": text, "completed": false }))
}

async fn tool_complete_task(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let task_id = get_str_required(args, "task_id")?;
    let completed = args
        .get("completed")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    check_task_owned(db, user_id, &task_id).await?;

    sqlx::query("UPDATE checklist_items SET completed = $1 WHERE id = $2")
        .bind(completed)
        .bind(&task_id)
        .execute(db)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "task_id": task_id, "completed": completed }))
}

async fn tool_delete_task(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let task_id = get_str_required(args, "task_id")?;
    check_task_owned(db, user_id, &task_id).await?;

    sqlx::query("DELETE FROM checklist_items WHERE id = $1")
        .bind(&task_id)
        .execute(db)
        .await
        .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    Ok(json!({ "deleted_task_id": task_id }))
}

async fn tool_list_members(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let company_id = get_str_required(args, "company_id")?;
    check_company_owned(db, user_id, &company_id).await?;

    let rows = sqlx::query(
        "SELECT id, division_id, name, email, role, position, phone, gender, employment_status, join_date, skills, created_at
         FROM members WHERE company_id = $1 ORDER BY created_at DESC",
    )
    .bind(&company_id)
    .fetch_all(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let members: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "division_id": r.get::<String, _>("division_id"),
                "name": r.get::<String, _>("name"),
                "email": r.get::<String, _>("email"),
                "role": r.get::<String, _>("role"),
                "position": r.get::<String, _>("position"),
                "phone": r.get::<String, _>("phone"),
                "gender": r.get::<String, _>("gender"),
                "employment_status": r.get::<String, _>("employment_status"),
                "join_date": r.get::<String, _>("join_date"),
                "skills": r.get::<String, _>("skills"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(json!({ "members": members, "count": members.len() }))
}

async fn tool_list_divisions(
    db: &PgPool,
    user_id: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    let company_id = get_str_required(args, "company_id")?;
    check_company_owned(db, user_id, &company_id).await?;

    let rows = sqlx::query(
        "SELECT id, company_id, name, head_id, member_count, created_at
         FROM divisions WHERE company_id = $1 ORDER BY created_at DESC",
    )
    .bind(&company_id)
    .fetch_all(db)
    .await
    .map_err(|e| ToolError::new(StatusCode::INTERNAL_SERVER_ERROR, format!("DB: {e}")))?;

    let divisions: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "company_id": r.get::<String, _>("company_id"),
                "name": r.get::<String, _>("name"),
                "head_id": r.get::<Option<String>, _>("head_id"),
                "member_count": r.get::<i32, _>("member_count"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(json!({ "divisions": divisions, "count": divisions.len() }))
}

// ---------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------

/// Jalankan tool dengan dispatch sesuai nama. Setiap tool melakukan
/// authorization sendiri (ownership) — model tidak bisa melewatinya (S8).
async fn dispatch(
    db: &PgPool,
    user_id: &str,
    name: &str,
    args: &Value,
) -> Result<Value, ToolError> {
    match name {
        "create_company" => tool_create_company(db, user_id, args).await,
        "create_division" => tool_create_division(db, user_id, args).await,
        "create_member" => tool_create_member(db, user_id, args).await,
        "list_members" => tool_list_members(db, user_id, args).await,
        "list_divisions" => tool_list_divisions(db, user_id, args).await,
        "create_target" | "create_project" => tool_create_target(db, user_id, args).await,
        "get_target" => tool_get_target(db, user_id, args).await,
        "list_targets" => tool_list_targets(db, user_id, args).await,
        "update_target" => tool_update_target(db, user_id, args).await,
        "delete_target" => tool_delete_target(db, user_id, args).await,
        "create_task" => tool_create_task(db, user_id, args).await,
        "complete_task" => tool_complete_task(db, user_id, args).await,
        "delete_task" => tool_delete_task(db, user_id, args).await,
        _ => Err(ToolError::new(StatusCode::NOT_FOUND, format!("Tool tidak dikenal: {name}"))),
    }
}

// ---------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------

/// Ambil identitas user dari header Authorization (sama seperti handlers).
async fn user_from_headers(db: &PgPool, headers: &HeaderMap) -> Result<Option<String>, sqlx::Error> {
    let token = match headers.get(axum::http::header::AUTHORIZATION) {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };
    let token = match token {
        Some(t) => t.strip_prefix("Bearer ").map(|t| t.to_string()),
        None => None,
    };
    let token = match token {
        Some(t) => t,
        None => return Ok(None),
    };
    let token_hash = format!("{:x}", sha2::Sha256::digest(token.as_bytes()));
    let row = sqlx::query("SELECT user_id, expires_at FROM sessions WHERE token_hash = $1")
        .bind(&token_hash)
        .fetch_optional(db)
        .await?;
    match row {
        Some(r) => {
            let expires_at: chrono::DateTime<Utc> = r.get("expires_at");
            if expires_at < Utc::now() {
                let _ = sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
                    .bind(&token_hash)
                    .execute(db)
                    .await;
                Ok(None)
            } else {
                Ok(Some(r.get::<String, _>("user_id")))
            }
        }
        None => Ok(None),
    }
}

/// GET /api/tools — daftar seluruh tool + schema (S4). Ini kontrak yang
/// bisa dipakai agent/LLM untuk tahu tool apa saja yang tersedia.
pub async fn list_tools() -> Json<Value> {
    let tools: Vec<Value> = TOOLS
        .iter()
        .map(|t| {
            json!({
                "name": t.name,
                "description": t.description,
                "risk": t.risk,
                "required": t.required,
                "optional": t.optional,
            })
        })
        .collect();
    Json(json!({ "tools": tools, "count": tools.len() }))
}

/// POST /api/tools/execute — jalankan satu tool. Alur:
/// Auth -> Risk/confirm -> Idempotency -> Dispatch (authz + validasi +
/// business logic) -> Audit log.
pub async fn execute_tool(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ExecuteRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = match user_from_headers(&state.db, &headers).await {
        Ok(Some(uid)) => uid,
        Ok(None) => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({ "ok": false, "error": "Unauthorized" })),
            ))
        }
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "ok": false, "error": "DB error" })),
            ))
        }
    };

    // Cari tool di registri.
    let schema = TOOLS.iter().find(|t| t.name == payload.tool);
    let schema = match schema {
        Some(s) => s,
        None => {
            record_audit(
                &state.db,
                "user",
                &user_id,
                &payload.tool,
                "execute",
                None,
                "error",
                Some("unknown tool"),
            )
            .await;
            return Err((
                StatusCode::NOT_FOUND,
                Json(json!({ "ok": false, "error": format!("Tool tidak dikenal: {}", payload.tool) })),
            ));
        }
    };

    let actor_type = match payload.actor_type.as_deref() {
        Some("ai_agent") => "ai_agent",
        Some("user") => "user",
        Some(_) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({ "ok": false, "error": "actor_type harus 'user' atau 'ai_agent'" })),
            ))
        }
        None => "user",
    };

    // Risk check (S9/S10): tool medium/high wajib konfirmasi.
    if schema.risk != RiskLevel::Low && !payload.confirm {
        return Err((
            StatusCode::PRECONDITION_REQUIRED,
            Json(json!({
                "ok": false,
                "confirmation_required": true,
                "risk": schema.risk,
                "message": "Tool ini berisiko dan memerlukan konfirmasi. Kirim ulang dengan confirm=true."
            })),
        ));
    }

    // Idempotency (S17): request yang sama tidak dijalankan dua kali.
    if let Some(key) = &payload.idempotency_key {
        if !key.is_empty() {
            if let Ok(Some(cached)) = idem_get(&state.db, &user_id, key).await {
                return Ok(Json(cached));
            }
        }
    }

    // Eksekusi.
    let result = dispatch(&state.db, &user_id, &payload.tool, &payload.args).await;

    let response = match result {
        Ok(value) => {
            record_audit(
                &state.db,
                actor_type,
                &user_id,
                &payload.tool,
                "execute",
                value.get("target_id").or_else(|| value.get("id")).and_then(|v| v.as_str()),
                "success",
                None,
            )
            .await;
            json!({ "ok": true, "tool": payload.tool, "result": value })
        }
        Err(err) => {
            record_audit(
                &state.db,
                actor_type,
                &user_id,
                &payload.tool,
                "execute",
                payload.args.get("target_id").or_else(|| payload.args.get("task_id")).and_then(|v| v.as_str()),
                if err.status.is_client_error() { "blocked" } else { "error" },
                Some(&err.message),
            )
            .await;
            json!({ "ok": false, "tool": payload.tool, "error": err.message })
        }
    };

    // Simpan idempotency bila diminta (hanya untuk hasil sukses).
    if let Some(key) = &payload.idempotency_key {
        if !key.is_empty() && response.get("ok").and_then(|v| v.as_bool()).unwrap_or(false) {
            let _ = idem_put(&state.db, &user_id, key, &payload.tool, &response).await;
        }
    }

    if response.get("ok").and_then(|v| v.as_bool()).unwrap_or(false) {
        Ok(Json(response))
    } else {
        Err((StatusCode::UNPROCESSABLE_ENTITY, Json(response)))
    }
}
