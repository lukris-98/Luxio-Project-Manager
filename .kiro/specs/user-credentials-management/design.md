# Design Document: User Credentials Management

## Overview

This feature enables secure database storage of API credentials (Neon, SMTP, Backblaze B2, OpenAI, Anthropic, custom) as a replacement for insecure `.env` file storage. The implementation follows established patterns from the existing Neon Organization Management feature in the Settings page.

**Key Design Principles:**
- **Security by default**: AES-256-GCM encryption at rest with authenticated encryption
- **Server-side masking**: Sensitive values never exposed in API responses without explicit reveal action
- **Audit trail**: All credential operations logged to existing `audit_logs` table
- **Backward compatibility**: Seamless fallback to `.env` during migration period
- **Role isolation**: Owner/super_admin only access with strict RBAC enforcement

**Architecture Philosophy:**
The system prioritizes security over convenience. Plaintext credentials exist only in three places: user input, encrypted database storage, and ephemeral decryption during use. All API responses return server-masked values by default. The reveal endpoint provides explicit, audited access to plaintext values when needed.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Settings.jsx → CredentialManagement Component        │  │
│  │  - Provider-specific forms (Neon, SMTP, B2, AI...)   │  │
│  │  - Masked display with reveal toggle                  │  │
│  │  - Test connection before save                        │  │
│  │  - Export/Import encrypted bundles                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓↑                                 │
│                    api.js (HTTP client)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + Bearer token
┌──────────────────────────┴──────────────────────────────────┐
│                Backend (Rust/Axum)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  credentials.rs (HTTP handlers)                       │  │
│  │  - RBAC enforcement (owner/super_admin only)          │  │
│  │  - Rate limiting (10 req/min per user)                │  │
│  │  - Input validation & sanitization                    │  │
│  │  - Audit trail to audit_logs table                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓↑                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  crypto.rs (Encryption Service)                       │  │
│  │  - AES-256-GCM with unique IV per operation           │  │
│  │  - Master key from CREDENTIAL_ENCRYPTION_KEY env      │  │
│  │  - Server-side masking (partial/full)                 │  │
│  │  - Constant-time comparison                           │  │
│  │  - Password-based export encryption (Argon2id)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓↑                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL via SQLx)                       │  │
│  │  - user_credentials table                             │  │
│  │  - audit_logs table (existing)                        │  │
│  │  - credential_rotation_reminders table                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓↑
┌──────────────────────────┴──────────────────────────────────┐
│              Application Usage Layer                         │
│  - get_active_credential(user_id, provider_type)            │
│  - Fallback chain: DB active → .env → owner_config          │
│  - Used by: mail.rs, owner.rs, neon/b2 proxy, etc.         │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

**Credential Creation Flow:**
1. User submits provider-specific form → frontend validates required fields
2. Frontend sends `POST /api/credentials` with plaintext `credential_data`
3. Backend: RBAC check → rate limit → input validation → sanitization
4. Backend: `crypto::encrypt_str()` → AES-256-GCM with unique IV
5. Backend: Database insert → audit log (without plaintext)
6. Backend: Return masked values + optional .env conflict warning
7. Frontend: Refresh list with server-masked display

**Credential Retrieval for Application Use:**
1. Application code calls `get_active_credential(user_id, "neon")`
2. Query: `SELECT credential_data FROM user_credentials WHERE user_id = ? AND provider_type = 'neon' AND is_active = TRUE`
3. If found: `crypto::decrypt_str()` → return plaintext JSON
4. If not found: fallback to `.env` NEON_API_KEY → log deprecation warning
5. If still not found: fallback to owner_config "neon" JSON blob
6. Cache decrypted value in request-scoped memory (never persistent)

**Reveal Flow (User Clicks Eye Icon):**
1. Frontend sends `POST /api/credentials/:id/reveal`
2. Backend: RBAC + rate limit → fetch row → verify ownership
3. Backend: `crypto::decrypt_str()` → audit log with action='credential_access'
4. Backend: Return plaintext JSON (no masking)
5. Frontend: Display plaintext in form fields
6. Frontend: Auto re-mask after 30 seconds of inactivity (mouse/keyboard)

## Components and Interfaces

### Backend Module Structure

**`backend/src/credentials.rs`** (HTTP handlers)
```rust
// Public endpoints (all require owner/super_admin role)
pub async fn list_credentials(State, HeaderMap) -> Result<Json<Value>, CredError>
pub async fn create_credential(State, HeaderMap, Json) -> Result<Json<Value>, CredError>
pub async fn update_credential(State, HeaderMap, Path, Json) -> Result<Json<Value>, CredError>
pub async fn delete_credential(State, HeaderMap, Path) -> Result<Json<Value>, CredError>
pub async fn activate_credential(State, HeaderMap, Path) -> Result<Json<Value>, CredError>
pub async fn reveal_credential(State, HeaderMap, Path) -> Result<Json<Value>, CredError>
pub async fn test_connection(State, HeaderMap, Json) -> Result<Json<Value>, CredError>
pub async fn rotation_due(State, HeaderMap) -> Result<Json<Value>, CredError>
pub async fn import_env_credentials(State, HeaderMap) -> Result<Json<Value>, CredError>
pub async fn export_credentials(State, HeaderMap, Json) -> Result<Json<Value>, CredError>
pub async fn import_credentials(State, HeaderMap, Json) -> Result<Json<Value>, CredError>

// Application accessor functions (used by other backend modules)
pub async fn get_active_credential(db: &PgPool, user_id: &str, provider: &str) -> Option<Value>
pub async fn owner_user_id(db: &PgPool) -> Option<String>
pub fn env_present_providers() -> Vec<&'static str>
pub fn warn_env_deprecated(provider: &str, env_var: &str)
pub fn spawn_rotation_reminders(db: PgPool)

// Internal helpers
async fn require_manager(state: &AppState, headers: &HeaderMap, provider_hint: Option<&str>) -> Result<Actor, CredError>
async fn audit(db: &PgPool, user_id: &str, action: &str, provider: &str, credential_id: Option<&str>, result: &str)
fn clean_and_validate(provider: &str, data: &mut Value) -> Result<(), CredError>
fn masked_data(provider: &str, data: &Value) -> Value
fn merge_update(provider: &str, old: &mut Value, incoming: &Value)
async fn fetch_owned(db: &PgPool, user_id: &str, id: &str) -> Result<PgRow, CredError>
```

**`backend/src/crypto.rs`** (Encryption Service)
```rust
// Core encryption/decryption
pub fn encrypt(plaintext: &[u8]) -> Result<String, EncError>
pub fn encrypt_str(plaintext: &str) -> Result<String, EncError>
pub fn decrypt(blob: &str) -> Result<Vec<u8>, EncError>
pub fn decrypt_str(blob: &str) -> Result<String, EncError>

// Masking
pub fn mask_field(key: &str, value: &str) -> String
pub fn mask_partial(value: &str) -> String
pub fn mask_dots() -> String
pub fn is_password_field(key: &str) -> bool
pub fn is_secret_field(key: &str) -> bool

// Password-based encryption (for export/import)
pub fn encrypt_with_password(plaintext: &[u8], password: &str) -> Result<String, EncError>
pub fn decrypt_with_password(bundle_blob: &str, password: &str) -> Result<Vec<u8>, EncError>
pub fn derive_password_key(password: &str, salt: &[u8]) -> Result<[u8; 32], EncError>

// Utilities
pub fn ct_eq(a: &str, b: &str) -> bool  // Constant-time comparison

// Error type
pub enum EncError { EncryptionFailed, DecryptionFailed }
```

### Frontend Component Structure

**`app/src/pages/Settings.jsx`** - CredentialManagement component
```javascript
// State management
const [creds, setCreds] = useState([])              // All credentials grouped by provider
const [envProviders, setEnvProviders] = useState([]) // Providers also in .env (warning)
const [form, setForm] = useState(null)              // Current add/edit form state
const [revealed, setRevealed] = useState({})        // Map of credential_id → plaintext data
const [deleteTarget, setDeleteTarget] = useState(null)
const [ioModal, setIoModal] = useState(null)       // Export/import modal state

// Main operations
const load = async () => { /* GET /api/credentials */ }
const openForm = (provider, cred) => { /* Open add/edit modal */ }
const submitForm = async () => { /* POST or PUT /api/credentials */ }
const testConnection = async () => { /* POST /api/credentials/test */ }
const activate = async (id) => { /* POST /api/credentials/:id/activate */ }
const confirmDelete = async () => { /* DELETE /api/credentials/:id */ }
const toggleReveal = async (c) => { /* POST /api/credentials/:id/reveal */ }
const doExport = async () => { /* POST /api/credentials/export */ }
const doImport = async () => { /* POST /api/credentials/import */ }
const importEnv = async () => { /* POST /api/credentials/import-env */ }

// Auto re-mask after 30 seconds of inactivity (Req 14.6)
useEffect(() => {
  const bump = () => { lastActivity.current = Date.now() }
  window.addEventListener('mousemove', bump)
  window.addEventListener('keydown', bump)
  const timer = setInterval(() => {
    if (Object.keys(revealedRef.current).length && Date.now() - lastActivity.current > 30000) {
      setRevealed({})  // Close all revealed credentials
    }
  }, 5000)
  return () => { /* cleanup */ }
}, [])
```

**`app/src/services/api.js`** - API client additions
```javascript
export const api = {
  // ... existing methods ...
  
  // User Credentials Management
  listCredentials: () => get('/api/credentials'),
  createCredential: (data) => post('/api/credentials', data),
  updateCredential: (id, data) => put(`/api/credentials/${id}`, data),
  deleteCredential: (id) => del(`/api/credentials/${id}`, {}),
  activateCredential: (id) => post(`/api/credentials/${id}/activate`, {}),
  revealCredential: (id) => post(`/api/credentials/${id}/reveal`, {}),
  testCredential: (data) => post('/api/credentials/test', data),
  getCredentialsRotationDue: () => get('/api/credentials/rotation-due'),
  importEnvCredentials: () => post('/api/credentials/import-env', {}),
  exportCredentials: (password) => post('/api/credentials/export', { password }),
  importCredentials: (password, bundle) => post('/api/credentials/import', { password, bundle }),
}
```

### API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/credentials` | owner/super_admin | List all credentials (server-masked) |
| POST | `/api/credentials` | owner/super_admin | Create new credential |
| PUT | `/api/credentials/:id` | owner/super_admin | Update credential |
| DELETE | `/api/credentials/:id` | owner/super_admin | Delete credential |
| POST | `/api/credentials/:id/activate` | owner/super_admin | Activate credential (deactivate others) |
| POST | `/api/credentials/:id/reveal` | owner/super_admin | Get plaintext values (audited) |
| POST | `/api/credentials/test` | owner/super_admin | Test connection (read-only) |
| GET | `/api/credentials/rotation-due` | owner/super_admin | List credentials > 90 days old |
| POST | `/api/credentials/import-env` | owner | Import from .env to database |
| POST | `/api/credentials/export` | owner/super_admin | Export encrypted bundle |
| POST | `/api/credentials/import` | owner/super_admin | Import encrypted bundle |

**Rate Limiting:** All credential endpoints share a single rate limit of 10 requests/minute per user (returns HTTP 429).

## Data Models

### Database Schema

**`user_credentials` table:**
```sql
CREATE TABLE user_credentials (
    id TEXT PRIMARY KEY,                      -- UUID
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL,              -- 'neon', 'smtp', 'backblaze_b2', 'openai', 'anthropic', 'custom'
    display_name TEXT NOT NULL,               -- User-friendly label
    credential_data TEXT NOT NULL,            -- Encrypted blob: "v1:base64(nonce||ct||tag)"
    is_active BOOLEAN NOT NULL DEFAULT FALSE, -- Only one active per (user_id, provider_type)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce single active credential per user per provider
CREATE UNIQUE INDEX idx_user_credentials_one_active 
    ON user_credentials(user_id, provider_type) 
    WHERE is_active = TRUE;

-- Fast lookup for active credentials
CREATE INDEX idx_user_credentials_lookup 
    ON user_credentials(user_id, provider_type, is_active);
```

**`credential_rotation_reminders` table:**
```sql
CREATE TABLE credential_rotation_reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL,                     -- "2024-01" (YYYY-MM)
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period)                   -- One reminder per user per month
);
```

**`audit_logs` table** (existing - reused for credential operations):
```sql
-- Already exists - columns used for credentials:
-- id, actor_type='user', user_id, tool_name='credentials', 
-- action='credential_create|update|delete|activate|access|access_denied',
-- target_resource='credentials/neon', result='success|forbidden', 
-- detail=JSON(provider_type, credential_id), created_at
```

### Credential Data Structures

**Encrypted Blob Format:**
```
"v1:" + base64(nonce_12_bytes || ciphertext || auth_tag_16_bytes)
```
- Version prefix `v1:` enables future format changes
- Nonce (12 bytes): Unique per encryption operation
- Ciphertext: Variable length encrypted JSON
- Auth tag (16 bytes): GCM authentication tag for tampering detection

**Plaintext JSON Schemas by Provider:**

**Neon:**
```json
{
  "api_key": "string (required)",
  "org_id": "string (optional, format: org-xxxxx-xxxxx-xxxxx)"
}
```

**SMTP:**
```json
{
  "host": "string (required, e.g. smtp.gmail.com)",
  "port": "number (required, 1-65535, e.g. 587)",
  "username": "string (required)",
  "password": "string (required)",
  "from_address": "string (required, valid email)"
}
```

**Backblaze B2:**
```json
{
  "application_key_id": "string (required)",
  "application_key": "string (required)",
  "bucket_name": "string (optional)"
}
```

**OpenAI:**
```json
{
  "api_key": "string (required, starts with 'sk-')",
  "organization_id": "string (optional)",
  "base_url": "string (optional, default: https://api.openai.com/v1)"
}
```

**Anthropic:**
```json
{
  "api_key": "string (required, starts with 'sk-ant-')"
}
```

**Custom:**
```json
{
  "any_key_1": "string or number",
  "any_key_2": "string or number",
  // ... up to 20 key-value pairs
  // Keys: alphanumeric + underscore, max 64 chars, start with letter
}
```

**API Response Structure:**

**List Response (GET `/api/credentials`):**
```json
{
  "ok": true,
  "credentials": [
    {
      "id": "uuid",
      "provider_type": "neon",
      "display_name": "Production Neon",
      "is_active": true,
      "created_at": 1704067200000,
      "updated_at": 1704067200000,
      "age_days": 45,
      "needs_rotation": false,
      "data": {
        "api_key": "nk-...xyz",  // Server-side masked
        "org_id": "org-curly-bonus-71722205"
      },
      "decrypt_error": false
    }
  ],
  "env_providers": ["neon", "smtp"]  // Providers also in .env (warning)
}
```

**Export Bundle Structure:**
```json
{
  "format": "luxio-credentials-export",
  "schema_version": 1,
  "exported_at": "2024-01-01T00:00:00Z",
  "user_id": "uuid",
  "encrypted_payload": "p1:base64(salt||nonce||ct||tag)"
}
```

Encrypted payload contains JSON array of credentials:
```json
[
  {
    "provider_type": "neon",
    "display_name": "Production Neon",
    "data": { "api_key": "plaintext-key", "org_id": "org-..." },
    "is_active": true
  }
]
```

## Error Handling

### Error Categories and Responses

**1. Authentication/Authorization Errors:**
```rust
StatusCode::UNAUTHORIZED (401)
{ "ok": false, "message": "Autentikasi diperlukan" }

StatusCode::FORBIDDEN (403)
{ "ok": false, "message": "Hanya owner/super_admin yang dapat mengelola kredensial" }
// Audit logged: action='credential_access_denied', result='forbidden'
```

**2. Rate Limiting:**
```rust
StatusCode::TOO_MANY_REQUESTS (429)
{ "ok": false, "message": "Terlalu banyak permintaan. Batas 10 permintaan per menit..." }
```

**3. Validation Errors:**
```rust
StatusCode::BAD_REQUEST (400)
{ "ok": false, "message": "Field 'api_key' wajib diisi" }
{ "ok": false, "message": "Port SMTP harus angka antara 1 dan 65535" }
{ "ok": false, "message": "API key OpenAI harus diawali 'sk-'" }
```

**4. Conflict Errors:**
```rust
StatusCode::CONFLICT (409)
{ "ok": false, "message": "Sudah ada kredensial aktif untuk provider ini" }
```

**5. Size Limit Errors:**
```rust
StatusCode::PAYLOAD_TOO_LARGE (413)
{ "ok": false, "message": "Ukuran kredensial melebihi batas 4KB" }
```

**6. Not Found Errors:**
```rust
StatusCode::NOT_FOUND (404)
{ "ok": false, "message": "Kredensial tidak ditemukan" }
// Never reveals whether credential exists for another user (security by obscurity)
```

**7. Encryption/Decryption Errors:**
```rust
StatusCode::INTERNAL_SERVER_ERROR (500)
{ "ok": false, "message": "Encryption failed" }  // Generic, no plaintext leaked
{ "ok": false, "message": "Decryption failed" }  // Generic, no ciphertext details
// Internal log: full technical error with context
```

**8. Database Errors:**
```rust
StatusCode::INTERNAL_SERVER_ERROR (500)
{ "ok": false, "message": "Terjadi kesalahan pada server" }
// Internal log: [DB ERROR] credentials::create: <sqlx error details>
```

### Error Handling Principles

1. **Never leak sensitive data in error messages** (Requirements 11.1-11.4)
   - Encryption errors: generic "Encryption failed" to client, technical details to internal log
   - Validation errors: descriptive but never echo back plaintext credential values
   - Database errors: generic "server error" to client, full SQLx error to internal log

2. **Security by obscurity for authorization**
   - Credential not found (404) vs forbidden (403): Use 403 + audit only after verifying row exists and ownership failed
   - Never reveal existence of other users' credentials through error messages

3. **Rate limiting prevents brute force** (Requirement 11.5-11.6)
   - Single shared limit across all credential endpoints per user
   - Helps prevent timing attacks through repeated authentication attempts

4. **Constant-time comparison** (Requirement 11.7)
   - Used when comparing masked values in update forms
   - Prevents timing attacks that could leak credential information

## Testing Strategy

### Unit Tests

**Crypto Module Tests** (`backend/src/crypto.rs`)
```rust
#[cfg(test)]
mod tests {
    // Core encryption properties
    #[test] fn round_trip_produces_equivalent_plaintext()
    #[test] fn unique_nonce_per_encryption()
    #[test] fn tampered_blob_rejected()
    #[test] fn error_message_hides_plaintext()
    
    // Masking
    #[test] fn masking_shapes()
    #[test] fn password_fields_fully_masked()
    #[test] fn api_keys_partially_masked()
    
    // Security
    #[test] fn constant_time_eq()
    #[test] fn password_export_round_trip()
}
```

**Credentials Module Tests** (`backend/src/credentials.rs`)
```rust
#[cfg(test)]
mod tests {
    // Validation
    #[test] fn rejects_invalid_provider_type()
    #[test] fn rejects_smtp_port_out_of_range()
    #[test] fn rejects_malformed_openai_key()
    #[test] fn sanitizes_html_in_display_name()
    #[test] fn enforces_4kb_size_limit()
    
    // Custom provider validation
    #[test] fn custom_accepts_valid_key_value_pairs()
    #[test] fn custom_rejects_invalid_key_names()
    #[test] fn custom_rejects_more_than_20_pairs()
    
    // Masking merge logic
    #[test] fn merge_update_preserves_unchanged_masked_fields()
    #[test] fn merge_update_applies_changed_values()
}
```

**Frontend Component Tests** (`app/src/pages/Settings.test.jsx`)
```javascript
describe('CredentialManagement', () => {
  test('displays credentials grouped by provider')
  test('shows masked values by default')
  test('reveals plaintext on eye icon click')
  test('auto re-masks after 30 seconds of inactivity')
  test('opens provider-specific form with correct fields')
  test('validates required fields before submit')
  test('shows warning when both DB and .env have same provider')
  test('confirms deletion for active credentials')
  test('does not confirm deletion for inactive credentials')
})
```

### Integration Tests

**RBAC Enforcement Tests**
```rust
#[tokio::test]
async fn non_owner_gets_forbidden() {
    // Create user with role='member'
    // Attempt GET /api/credentials
    // Assert 403 Forbidden
    // Verify audit_logs contains access_denied entry
}

#[tokio::test]
async fn owner_user_isolation() {
    // Create two owner users with separate credentials
    // User A attempts to access user B's credential by ID
    // Assert 403 Forbidden + audit log
}
```

**Active Credential Enforcement Tests**
```rust
#[tokio::test]
async fn only_one_active_per_provider() {
    // Create credential A for Neon (active=true)
    // Activate credential B for Neon
    // Assert A.is_active = false, B.is_active = true
    // Verify no duplicate active constraint violation
}

#[tokio::test]
async fn activation_is_atomic() {
    // Start two concurrent activation requests for different Neon credentials
    // Verify exactly one succeeds as active
    // Verify database consistency (no duplicate actives)
}
```

**Encryption Round-Trip Tests**
```rust
#[tokio::test]
async fn credential_survives_restart() {
    // Set CREDENTIAL_ENCRYPTION_KEY env
    // Create credential with plaintext data
    // Simulate app restart (clear in-memory cache)
    // Fetch credential
    // Assert plaintext matches original
}

#[tokio::test]
async fn wrong_key_fails_decryption() {
    // Create credential with key A
    // Change CREDENTIAL_ENCRYPTION_KEY to key B
    // Attempt to reveal credential
    // Assert decryption error + security warning logged
}
```

**Test Connection Tests**
```rust
#[tokio::test]
async fn test_neon_with_valid_key() {
    // Mock Neon API endpoint
    // Test credential with valid API key
    // Assert success response
}

#[tokio::test]
async fn test_smtp_with_invalid_password() {
    // Mock SMTP server rejecting auth
    // Test credential with wrong password
    // Assert error: "Authentication failed: username atau password SMTP salah"
}

#[tokio::test]
async fn test_connection_timeout() {
    // Mock endpoint that never responds
    // Test credential
    // Assert timeout error after 10 seconds
}
```

**Export/Import Tests**
```rust
#[tokio::test]
async fn export_import_round_trip() {
    // Create 3 credentials (Neon, SMTP, OpenAI)
    // Export with password "test-pw-123"
    // Delete all credentials
    // Import with same password
    // Assert all 3 credentials restored with correct data
}

#[tokio::test]
async fn import_with_wrong_password_fails() {
    // Export with password A
    // Import with password B
    // Assert decryption error (Argon2 auth tag mismatch)
}

#[tokio::test]
async fn import_skips_duplicates() {
    // Create credential "Prod Neon" for Neon
    // Export bundle containing same credential
    // Import bundle
    // Assert skipped count = 1, imported count = 0
}
```

**Migration & Fallback Tests**
```rust
#[tokio::test]
async fn fallback_to_env_when_no_db_credential() {
    // Set env NEON_API_KEY=test-key
    // Call get_active_credential(user, "neon")
    // Assert returns env value
    // Verify deprecation warning logged
}

#[tokio::test]
async fn db_credential_prioritized_over_env() {
    // Set env NEON_API_KEY=env-key
    // Create active DB credential with api_key=db-key
    // Call get_active_credential(user, "neon")
    // Assert returns db-key (not env-key)
}
```

### End-to-End Tests

**Full Credential Lifecycle**
```javascript
test('e2e: create → test → activate → reveal → update → delete', async () => {
  // Login as owner user
  // Navigate to Settings → Credentials Management
  // Click "Add Credential" for Neon
  // Fill form: display_name="Test Neon", api_key="test-key-123"
  // Click "Test Connection" → assert success
  // Click "Save" → assert credential appears in list (masked)
  // Verify is_active=true badge shown
  // Click eye icon → assert plaintext "test-key-123" visible
  // Wait 31 seconds → assert auto re-masked
  // Click "Edit" → update display_name → save
  // Click "Delete" → confirm → assert removed from list
})
```

**Rotation Reminder E2E**
```javascript
test('e2e: rotation warning and email reminder', async () => {
  // Create credential with created_at = 91 days ago (SQL injection)
  // Login as owner
  // Navigate to Settings → Credentials Management
  // Assert warning badge displayed on old credential
  // Hover badge → assert tooltip explains 91 days old
  // Trigger rotation check job manually (test endpoint)
  // Assert email sent to owner with rotation reminder
  // Verify email contains list of credentials > 90 days
})
```

**Export/Import E2E**
```javascript
test('e2e: export encrypted bundle and import on another machine', async () => {
  // Login as owner A on machine 1
  // Create 3 credentials (different providers)
  // Click "Export Credentials" → enter password "migrate-123"
  // Assert file download "luxio-credentials-export-<timestamp>.json"
  // Verify file structure matches export schema
  
  // Login as owner B on machine 2 (different user)
  // Click "Import Credentials" → upload exported file
  // Enter password "migrate-123"
  // Assert summary: "3 credentials imported, 0 skipped"
  // Verify all 3 credentials appear in list for owner B
})
```

## Security Considerations

### Encryption at Rest

**AES-256-GCM Implementation:**
- **Algorithm**: AES-256 in Galois/Counter Mode (authenticated encryption)
- **Key derivation**: Master key from `CREDENTIAL_ENCRYPTION_KEY` env (32 bytes)
  - Accepts base64-encoded 32 bytes, hex-encoded 32 bytes, or arbitrary string (SHA-256 hashed)
  - Random 32-byte key generated on startup if env not set (with loud warning)
- **Nonce/IV**: 12 bytes, cryptographically random via `OsRng` (unique per encryption)
- **Authentication tag**: 16 bytes (GCM mode prevents tampering)
- **Format**: `v1:` + base64(nonce || ciphertext || tag)

**Key Management:**
- Master key stored in memory only (never persisted to disk/database)
- Key rotation requires re-encrypting all credentials (manual process)
- If key lost/changed: existing credentials become undecryptable (data loss)
- Production: Store `CREDENTIAL_ENCRYPTION_KEY` in secure secrets manager (AWS Secrets Manager, HashiCorp Vault)

### Authentication and Authorization

**Role-Based Access Control (RBAC):**
```rust
async fn require_manager(state: &AppState, headers: &HeaderMap) -> Result<Actor, CredError> {
    // 1. Extract session token from Authorization header
    let user_id = require_auth(state, headers).await?;  // Validates session token
    
    // 2. Fetch user role from database
    let role = query!("SELECT role FROM users WHERE id = $1", user_id).fetch_one(&state.db).await?;
    
    // 3. Enforce owner/super_admin requirement
    if role != "owner" && role != "super_admin" {
        audit(&state.db, &user_id, "credential_access_denied", provider, None, "forbidden").await;
        return Err(StatusCode::FORBIDDEN);  // All non-owner/super_admin attempts audited
    }
    
    Ok(Actor { user_id, role })
}
```

**User Isolation:**
- All queries filtered by `user_id = ?` (prevents cross-user access)
- Ownership verification before modify operations: `fetch_owned()` checks row.user_id matches authenticated user
- 403 Forbidden + audit log if user attempts to access another user's credential

**Rate Limiting:**
- Shared limit: 10 requests/minute across ALL credential endpoints per user
- Prevents brute force attacks on reveal/test endpoints
- Implementation: In-memory counter with 60-second sliding window
- Returns HTTP 429 when exceeded

### Audit Trail

All credential operations logged to existing `audit_logs` table:

| Action | Trigger | Audit Fields |
|--------|---------|--------------|
| `credential_create` | POST /api/credentials | provider_type, credential_id, result='success' |
| `credential_update` | PUT /api/credentials/:id | provider_type, credential_id, result='success' |
| `credential_delete` | DELETE /api/credentials/:id | provider_type, credential_id, result='success' |
| `credential_activate` | POST /api/credentials/:id/activate | provider_type, credential_id, result='success' |
| `credential_access` | POST /api/credentials/:id/reveal | provider_type, credential_id, result='success' |
| `credential_access_denied` | Any endpoint (RBAC fail) | provider_type, credential_id?, result='forbidden' |

**Audit Guarantees:**
- Logged asynchronously (non-blocking)
- Never contains plaintext credential values (only metadata)
- Immutable (no UPDATE/DELETE operations on audit_logs)
- Retention: Permanent (for security investigations)

### Input Validation and Sanitization

**Provider-Specific Validation:**
```rust
fn clean_and_validate(provider: &str, data: &mut Value) -> Result<(), CredError> {
    match provider {
        "neon" => {
            let api_key = required_str(data, "api_key")?;
            // Requirement 10.3: Validate format
            if api_key.len() < 8 || api_key.contains(char::is_whitespace) {
                return Err(CredError::bad_request("API key Neon tidak valid"));
            }
        },
        "smtp" => {
            let port = required_num(data, "port")?;
            // Requirement 10.2: Port range validation
            if !(1..=65535).contains(&port) {
                return Err(CredError::bad_request("Port SMTP harus antara 1 dan 65535"));
            }
            let from = required_str(data, "from_address")?;
            if !from.contains('@') {
                return Err(CredError::bad_request("from_address harus email valid"));
            }
        },
        "openai" => {
            let api_key = required_str(data, "api_key")?;
            // Requirement 10.3: OpenAI key format
            if !api_key.starts_with("sk-") {
                return Err(CredError::bad_request("API key OpenAI harus diawali 'sk-'"));
            }
        },
        "custom" => {
            // Requirement 10.1: Key name validation
            for (key, _) in data.as_object().unwrap() {
                if !is_valid_identifier(key) {
                    return Err(CredError::bad_request("Key harus alphanumeric + underscore"));
                }
            }
        },
        _ => {}
    }
    
    // Requirement 10.7-10.8: Size limit 4KB
    if data.to_string().len() > 4096 {
        return Err(CredError::new(StatusCode::PAYLOAD_TOO_LARGE, "Melebihi 4KB"));
    }
    
    Ok(())
}
```

**Display Name Sanitization (XSS Prevention):**
```rust
fn sanitize_display_name(raw: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    // Strip HTML tags
    for ch in raw.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            c if !in_tag => out.push(c),
            _ => {}
        }
    }
    // Collapse whitespace and limit to 100 chars
    out.split_whitespace()
       .collect::<Vec<_>>()
       .join(" ")
       .chars()
       .take(100)
       .collect()
}
```

### Timing Attack Prevention

**Constant-Time String Comparison:**
```rust
pub fn ct_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() {
        return false;  // Length leak acceptable (not secret)
    }
    let mut diff = 0u8;
    for i in 0..a.len() {
        diff |= a[i] ^ b[i];  // Bitwise XOR, always executes
    }
    diff == 0  // Single comparison (constant time)
}
```

Used when comparing masked values during credential updates to prevent attackers from inferring plaintext through timing measurements.

### Server-Side Masking

Plaintext credential values **never** appear in API responses (except explicit reveal endpoint). Masking happens server-side before serialization:

**Masking Rules:**
1. **Password fields** (field name contains "password"): `"••••••••"` (8 dots, always)
2. **Secret fields** (field name contains "key", "secret", "token"): `"abc...xyz"` (first 3 + last 3 chars)
3. **Other fields**: Unmasked (e.g., port, host, organization_id)

**Implementation:**
```rust
fn masked_data(provider: &str, data: &Value) -> Value {
    let mut out = serde_json::Map::new();
    for (key, value) in data.as_object().unwrap() {
        let masked_value = if is_secret_key(provider, key) {
            json!(crypto::mask_field(key, value.as_str().unwrap()))
        } else {
            value.clone()
        };
        out.insert(key.clone(), masked_value);
    }
    Value::Object(out)
}
```

**Form Update Logic:**
When user edits credential, masked values echoed back are detected and original plaintext preserved:
```rust
fn merge_update(provider: &str, old: &mut Value, incoming: &Value) {
    for (key, new_val) in incoming.as_object().unwrap() {
        let old_val = old.get(key).unwrap();
        let is_echoed_mask = is_secret_key(provider, key) 
            && crypto::ct_eq(new_val.as_str(), &crypto::mask_field(key, old_val.as_str()));
        
        if !is_echoed_mask {
            old[key] = new_val.clone();  // User changed value
        }
        // else: User didn't change this field (sent back our mask) - keep original
    }
}
```

### Secure Credential Testing

Test connection endpoint is **read-only** (never saves credentials):
```rust
pub async fn test_connection(State(state): State<AppState>, ...) -> Result<Json<Value>, CredError> {
    // Option 1: Test unsaved credential (from form)
    let data = payload.get("data").cloned().unwrap_or_default();
    clean_and_validate(&provider, &mut data)?;
    
    // Option 2: Test saved credential by ID
    let row = fetch_owned(&state.db, &actor.user_id, &id).await?;
    let data = row_plain(&row)?;
    
    // Perform provider-specific connection test
    let result = match provider {
        "neon" => test_neon(&data).await,      // GET /projects with API key
        "smtp" => test_smtp(&data).await,      // SMTP connect + auth (no send)
        "backblaze_b2" => test_b2(&data).await, // b2_authorize_account
        "openai" => test_openai(&data).await,  // GET /models
        "anthropic" => test_anthropic(&data).await, // GET /models
        _ => Err("Provider không mendukung uji koneksi"),
    };
    
    // Timeout: 10 seconds (prevent hanging on unresponsive endpoints)
    // No credentials modified or stored during test
}
```

### Backward Compatibility and Migration

**Fallback Chain:**
```rust
pub async fn get_active_credential(db: &PgPool, user_id: &str, provider: &str) -> Option<Value> {
    // Priority 1: Active credential in database
    if let Some(row) = sqlx::query("SELECT credential_data FROM user_credentials 
                                     WHERE user_id = ? AND provider_type = ? AND is_active = TRUE")
        .bind(user_id).bind(provider).fetch_optional(db).await.ok()? {
        let blob: String = row.get("credential_data");
        if let Ok(plaintext) = crypto::decrypt_str(&blob) {
            return serde_json::from_str(&plaintext).ok();
        }
    }
    
    // Priority 2: Environment variable (backward compatibility)
    let env_val = match provider {
        "neon" => std::env::var("NEON_API_KEY").ok(),
        "smtp" => {
            let host = std::env::var("SMTP_HOST").ok()?;
            // Reconstruct JSON from multiple env vars
            Some(json!({
                "host": host,
                "port": std::env::var("SMTP_PORT").ok()?,
                "username": std::env::var("SMTP_USERNAME").ok()?,
                "password": std::env::var("SMTP_PASSWORD").ok()?,
                "from_address": std::env::var("SMTP_FROM").ok()?
            }).to_string())
        },
        // ... other providers ...
        _ => None,
    };
    if let Some(val) = env_val {
        warn_env_deprecated(provider, "ENV_VAR_NAME");  // Log once per provider
        return serde_json::from_str(&val).ok();
    }
    
    // Priority 3: owner_config JSON blob (legacy)
    if let Ok(Some(row)) = sqlx::query("SELECT value FROM owner_config WHERE key = ?")
        .bind(provider).fetch_optional(db).await {
        return row.get::<serde_json::Value, _>("value").as_object().cloned().map(Value::Object);
    }
    
    None
}
```

**Migration Endpoint (Owner Only):**
```rust
pub async fn import_env_credentials(State(state): State<AppState>, ...) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    if actor.role != "owner" {
        return Err(CredError::new(StatusCode::FORBIDDEN, "Hanya owner yang dapat mengimpor dari .env"));
    }
    
    let mut imported = vec![];
    let mut skipped = vec![];
    let mut errors = vec![];
    
    // Scan env for known credential patterns
    for provider in ["neon", "smtp", "backblaze_b2", "openai"] {
        if let Some(data) = extract_from_env(provider) {
            match create_credential_internal(&state.db, &actor.user_id, provider, data, true).await {
                Ok(id) => imported.push((provider, id)),
                Err(e) if is_duplicate_error(&e) => skipped.push(provider),
                Err(e) => errors.push((provider, e.to_string())),
            }
        }
    }
    
    Ok(Json(json!({
        "ok": true,
        "imported": imported.iter().map(|(p, id)| json!({"provider": p, "id": id})).collect::<Vec<_>>(),
        "skipped": skipped,
        "errors": errors,
        "note": "Kredensial .env TIDAK otomatis dihapus. Hapus manual setelah memverifikasi kredensial database bekerja."
    })))
}
```

## Deployment Considerations

### Environment Configuration

**Required Environment Variables:**
```bash
# Production
CREDENTIAL_ENCRYPTION_KEY=<base64-encoded-32-bytes>  # Generate: openssl rand -base64 32

# Example generation script:
# python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Optional Environment Variables (backward compatibility):**
```bash
# These will trigger deprecation warnings when used instead of database credentials
NEON_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=...
B2_KEY_ID=...
B2_APP_KEY=...
OPENAI_API_KEY=...
```

### Database Migration Script

```sql
-- Run during deployment
-- Table already created by db.rs migrate() function
-- This is for reference/documentation only

-- Add sample owner credential (manual - not in automated migration)
-- INSERT INTO user_credentials (id, user_id, provider_type, display_name, credential_data, is_active)
-- VALUES (
--   gen_random_uuid()::text,
--   (SELECT id FROM users WHERE role = 'owner' LIMIT 1),
--   'neon',
--   'Production Neon',
--   'v1:...',  -- Pre-encrypted using crypto::encrypt_str()
--   TRUE
-- );
```

### Key Rotation Procedure

**When to Rotate:**
- Security breach suspected (encryption key leaked)
- Compliance requirement (rotate every N months)
- Employee departure (if they had access to CREDENTIAL_ENCRYPTION_KEY)

**Rotation Steps:**
1. **Pre-rotation backup:**
   ```bash
   # Export all credentials with password
   curl -X POST http://localhost:3000/api/credentials/export \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"password":"backup-pw-strong-123"}' \
     > credentials-backup-$(date +%Y%m%d).json
   ```

2. **Generate new key:**
   ```bash
   NEW_KEY=$(openssl rand -base64 32)
   echo "CREDENTIAL_ENCRYPTION_KEY=$NEW_KEY" >> .env.new
   ```

3. **Re-encrypt all credentials (maintenance window required):**
   ```rust
   // Pseudo-code - implement as one-time admin script
   let old_key = std::env::var("CREDENTIAL_ENCRYPTION_KEY").unwrap();
   let new_key = std::env::var("CREDENTIAL_ENCRYPTION_KEY_NEW").unwrap();
   
   for row in sqlx::query("SELECT id, credential_data FROM user_credentials").fetch_all(&db).await? {
       let blob_old: String = row.get("credential_data");
       let plaintext = crypto::decrypt_str_with_key(&blob_old, &old_key)?;
       let blob_new = crypto::encrypt_str_with_key(&plaintext, &new_key)?;
       sqlx::query("UPDATE user_credentials SET credential_data = $1 WHERE id = $2")
           .bind(&blob_new).bind(&row.get::<String, _>("id"))
           .execute(&db).await?;
   }
   ```

4. **Deploy new key:**
   ```bash
   # Update secrets manager (AWS Secrets Manager, Vault, etc.)
   aws secretsmanager put-secret-value \
     --secret-id prod/credential-encryption-key \
     --secret-string "$NEW_KEY"
   
   # Restart application
   kubectl rollout restart deployment/luxio-backend
   ```

5. **Verify:**
   ```bash
   # Test reveal endpoint works
   curl -X POST http://localhost:3000/api/credentials/$CRED_ID/reveal \
     -H "Authorization: Bearer $TOKEN"
   ```

### Monitoring and Alerting

**Key Metrics to Monitor:**
```yaml
# Prometheus metrics (add to backend/src/lib.rs)
metrics:
  - name: credential_operations_total
    type: counter
    labels: [operation, provider_type, result]
    
  - name: credential_decryption_failures_total
    type: counter
    labels: [reason]  # invalid_key, tampered, corrupted
    
  - name: credential_access_denied_total
    type: counter
    labels: [user_role, provider_type]
    
  - name: credential_test_duration_seconds
    type: histogram
    labels: [provider_type, result]

# Alert rules
alerts:
  - name: HighDecryptionFailureRate
    expr: rate(credential_decryption_failures_total[5m]) > 0.1
    severity: critical
    description: Possible wrong encryption key or tampering attack
    
  - name: SuspiciousAccessDenied
    expr: rate(credential_access_denied_total{user_role="member"}[10m]) > 5
    severity: warning
    description: Non-owner user repeatedly attempting credential access
    
  - name: CredentialTestFailures
    expr: rate(credential_operations_total{operation="test", result="error"}[15m]) > 0.5
    severity: warning
    description: High rate of credential test failures (invalid credentials?)
```

**Log Patterns to Watch:**
```rust
// Security warnings in logs
tracing::warn!(event = "credential_auth_tag_failed", ...)  // Tampering detected
tracing::warn!(event = "credential_blob_invalid", ...)      // Corrupted data
tracing::warn!(event = "credential_encryption_key_missing", ...) // Key not set
tracing::warn!(event = "credential_env_deprecated", provider = "neon", ...) // Using .env instead of DB
```

### Disaster Recovery

**Scenario 1: Encryption key lost**
- **Impact**: All existing credentials become undecryptable (data loss)
- **Recovery**: Restore from export bundle OR re-enter credentials manually
- **Prevention**: Store `CREDENTIAL_ENCRYPTION_KEY` in multiple secure locations (primary secrets manager + encrypted backup)

**Scenario 2: Database corruption**
- **Impact**: Encrypted blobs corrupted in database
- **Recovery**: Restore from latest database backup
- **Mitigation**: Regular automated database backups (daily minimum)

**Scenario 3: Export bundle password forgotten**
- **Impact**: Cannot import credentials from backup file
- **Recovery**: No recovery possible (password-based encryption with Argon2id - no backdoor)
- **Prevention**: Store export password in secure password manager

**Backup Strategy:**
```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
PASSWORD=$(vault read -field=export_password secret/luxio/credentials/backup)

# Export all credentials
curl -X POST https://api.luxio.app/api/credentials/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$PASSWORD\"}" \
  > /backups/credentials-$DATE.json

# Encrypt backup file at rest (defense in depth)
gpg --encrypt --recipient backup@luxio.app /backups/credentials-$DATE.json

# Upload to S3 with versioning enabled
aws s3 cp /backups/credentials-$DATE.json.gpg \
  s3://luxio-backups/credentials/ \
  --server-side-encryption AES256

# Retain 30 days of backups
find /backups -name "credentials-*.json*" -mtime +30 -delete
```

---

**Design Completeness:** This design document covers the complete feature implementation following the requirements-first workflow. The architecture prioritizes security through encryption, audit logging, and server-side masking while maintaining backward compatibility with existing `.env` configuration.

