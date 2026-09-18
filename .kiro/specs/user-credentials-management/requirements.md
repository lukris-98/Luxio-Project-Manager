# Requirements Document: User Credentials Management

## Introduction

This feature enables secure database storage of API credentials (Neon, SMTP, Backblaze B2, OpenAI, etc.) replacing the current `.env` file approach. Each owner/super_admin user can manage multiple credentials per provider with encryption at rest, preventing accidental Git commits (GitGuardian detected exposed secrets in `.env` files). The implementation follows the existing Neon Organization Management pattern in the Settings page.

## Glossary

- **Credential_Store**: The database table and backend service that stores encrypted API credentials
- **User**: An authenticated owner or super_admin role user who can manage credentials
- **Provider**: An external service requiring API authentication (Neon, SMTP, Backblaze_B2, OpenAI, etc.)
- **Credential**: A set of authentication values for a Provider (API key, base URL, username/password, etc.)
- **Active_Credential**: The one credential per Provider currently used by the application
- **Encryption_Service**: AES-256-GCM encryption/decryption service for protecting credential values
- **Settings_UI**: The Settings page interface where credentials are managed
- **Audit_Logger**: Service that records credential access and modification events

## Requirements

### Requirement 1: Database Storage of Encrypted Credentials

**User Story:** As an owner/super_admin, I want to store API credentials in the database instead of `.env` files, so that credentials are not accidentally committed to Git.

#### Acceptance Criteria

1. THE Credential_Store SHALL store credential records with fields: id, user_id, provider_type, display_name, credential_data (encrypted JSON), is_active, created_at, updated_at
2. WHEN a credential is saved, THE Encryption_Service SHALL encrypt the credential_data field using AES-256-GCM before database insertion
3. WHEN a credential is retrieved, THE Encryption_Service SHALL decrypt the credential_data field after database fetch
4. THE Credential_Store SHALL support provider_type values: 'neon', 'smtp', 'backblaze_b2', 'openai', 'anthropic', 'custom'
5. FOR ALL valid credential objects, encrypting then decrypting SHALL produce equivalent plaintext (round-trip property)
6. THE Credential_Store SHALL enforce unique constraint on (user_id, provider_type) WHERE is_active = TRUE
7. WHEN credential_data encryption fails, THE Encryption_Service SHALL return a descriptive error without exposing plaintext values

### Requirement 2: Multi-Provider Credential Support

**User Story:** As an owner/super_admin, I want to manage credentials for multiple service providers, so that I can configure all external integrations from one place.

#### Acceptance Criteria

1. THE Credential_Store SHALL support storing multiple credentials per Provider per User
2. WHERE provider_type = 'neon', THE credential_data SHALL contain fields: api_key, org_id (optional)
3. WHERE provider_type = 'smtp', THE credential_data SHALL contain fields: host, port, username, password, from_address
4. WHERE provider_type = 'backblaze_b2', THE credential_data SHALL contain fields: application_key_id, application_key, bucket_name (optional)
5. WHERE provider_type = 'openai', THE credential_data SHALL contain fields: api_key, organization_id (optional), base_url (optional)
6. WHERE provider_type = 'anthropic', THE credential_data SHALL contain fields: api_key
7. WHERE provider_type = 'custom', THE credential_data SHALL contain user-defined key-value pairs
8. WHEN a Provider has multiple credentials, THE User SHALL designate exactly one as Active_Credential
9. THE Credential_Store SHALL reject activation requests when credential_data fails validation for the provider_type

### Requirement 3: Settings UI for Credential Management

**User Story:** As an owner/super_admin, I want a UI in the Settings page to manage my credentials, so that I can add, edit, delete, and activate credentials without touching code.

#### Acceptance Criteria

1. THE Settings_UI SHALL display a "Credentials Management" section after the Neon Organization section
2. WHEN the Settings page loads, THE Settings_UI SHALL fetch and display all credentials grouped by provider_type
3. THE Settings_UI SHALL show a "+ Add Credential" button for each provider_type
4. WHEN the User clicks "+ Add Credential", THE Settings_UI SHALL display a form with provider-specific fields (based on Requirement 2)
5. WHEN the User submits a new credential, THE Settings_UI SHALL send encrypted data to the backend and refresh the credential list
6. THE Settings_UI SHALL display each credential with: display_name, provider_type, masked credential values (e.g., "sk-...xyz"), is_active status
7. WHEN the User clicks "Activate" on a non-active credential, THE Settings_UI SHALL deactivate other credentials for that provider and activate the selected one
8. WHEN the User clicks "Delete" on a credential, THE Settings_UI SHALL show a confirmation dialog before deletion
9. THE Settings_UI SHALL show an "Edit" button that allows updating credential fields
10. WHEN a credential operation fails, THE Settings_UI SHALL display an error message without exposing plaintext credential values
11. THE Settings_UI SHALL restrict access to owner and super_admin roles only

### Requirement 4: Role-Based Access Control

**User Story:** As a system, I want to restrict credential management to owner/super_admin roles, so that regular users cannot access sensitive API credentials.

#### Acceptance Criteria

1. THE Backend SHALL verify user role before processing any credential management request
2. WHEN a non-owner/non-super_admin user attempts credential access, THE Backend SHALL return HTTP 403 Forbidden
3. THE Credential_Store SHALL enforce user_id isolation - users SHALL only access their own credentials
4. WHEN a User queries credentials, THE Backend SHALL filter results by the authenticated user_id
5. WHEN a User attempts to modify another user's credential, THE Backend SHALL reject the request with HTTP 403

### Requirement 5: Active Credential Enforcement

**User Story:** As a system, I want to ensure only one credential per provider is active per user, so that the application knows which credential to use.

#### Acceptance Criteria

1. THE Credential_Store SHALL maintain a unique index on (user_id, provider_type, is_active) WHERE is_active = TRUE
2. WHEN a User activates a credential, THE Backend SHALL set is_active = FALSE for all other credentials of the same provider_type and user_id
3. WHEN a User activates a credential, THE Backend SHALL set is_active = TRUE for the selected credential
4. THE Backend SHALL execute the deactivation and activation operations within a single database transaction
5. WHEN the transaction fails, THE Backend SHALL roll back all changes and return an error
6. WHEN a User deletes the Active_Credential, THE Backend SHALL allow deletion and leave no active credential for that provider

### Requirement 6: Credential Retrieval for Application Use

**User Story:** As the application backend, I want to retrieve active credentials programmatically, so that I can use them to authenticate with external services.

#### Acceptance Criteria

1. THE Backend SHALL provide a function `get_active_credential(user_id, provider_type)` that returns the active credential
2. WHEN an active credential exists, THE function SHALL return decrypted credential_data
3. WHEN no active credential exists, THE function SHALL return None/null
4. THE Backend SHALL fallback to `.env` variables when no active credential is found in the database
5. WHEN both database credential and `.env` variable exist, THE Backend SHALL prioritize the database credential
6. THE Backend SHALL cache decrypted credentials in memory for the request lifecycle only (no persistent caching)
7. WHEN decryption fails, THE function SHALL log an error and return None/null

### Requirement 7: Audit Trail for Credential Operations

**User Story:** As a security administrator, I want an audit log of credential changes, so that I can track who accessed or modified credentials.

#### Acceptance Criteria

1. WHEN a credential is created, THE Audit_Logger SHALL record: user_id, action='credential_create', provider_type, timestamp
2. WHEN a credential is updated, THE Audit_Logger SHALL record: user_id, action='credential_update', provider_type, credential_id, timestamp
3. WHEN a credential is deleted, THE Audit_Logger SHALL record: user_id, action='credential_delete', provider_type, credential_id, timestamp
4. WHEN a credential is activated, THE Audit_Logger SHALL record: user_id, action='credential_activate', provider_type, credential_id, timestamp
5. WHEN an active credential is retrieved for use, THE Audit_Logger SHALL record: user_id, action='credential_access', provider_type, timestamp
6. THE Audit_Logger SHALL NOT log plaintext credential values
7. THE Audit_Logger SHALL use the existing `audit_logs` table structure
8. WHEN an unauthorized access attempt occurs, THE Audit_Logger SHALL record: user_id, action='credential_access_denied', provider_type, result='forbidden', timestamp

### Requirement 8: Migration from .env to Database

**User Story:** As a developer, I want a migration path from `.env` credentials to database storage, so that I can transition existing deployments smoothly.

#### Acceptance Criteria

1. THE Backend SHALL continue to read from `.env` variables when no database credentials exist (backward compatibility)
2. THE Backend SHALL provide an admin CLI command or API endpoint to import `.env` credentials to the database
3. WHEN importing from `.env`, THE Backend SHALL create credential records with is_active = TRUE for each detected provider
4. THE Backend SHALL support importing: NEON_API_KEY, SMTP_* variables, B2 credentials, OPENAI_API_KEY
5. WHEN an import encounters an error, THE Backend SHALL log the error and continue importing remaining credentials
6. THE Backend SHALL NOT automatically delete `.env` variables after import (manual cleanup required)
7. THE Backend SHALL warn when both `.env` and database credentials exist for the same provider

### Requirement 9: Encryption Key Management

**User Story:** As a system administrator, I want encryption keys stored securely, so that credential data cannot be decrypted without proper authorization.

#### Acceptance Criteria

1. THE Backend SHALL read the encryption key from environment variable `CREDENTIAL_ENCRYPTION_KEY`
2. WHEN `CREDENTIAL_ENCRYPTION_KEY` is not set, THE Backend SHALL generate a random 32-byte key on first startup and log a warning
3. THE Backend SHALL use a unique initialization vector (IV) for each encryption operation
4. THE Backend SHALL store the IV alongside the encrypted data in the credential_data field
5. THE Backend SHALL use authenticated encryption (AES-256-GCM) to prevent tampering
6. WHEN authentication tag verification fails during decryption, THE Backend SHALL reject the data and log a security warning
7. THE Backend SHALL NOT log or expose the encryption key in any API response or log message

### Requirement 10: Input Validation and Sanitization

**User Story:** As a system, I want to validate credential inputs, so that invalid or malicious data cannot be stored.

#### Acceptance Criteria

1. WHEN a User submits a credential, THE Backend SHALL validate that provider_type is one of the allowed values
2. WHERE provider_type = 'smtp', THE Backend SHALL validate that port is a number between 1 and 65535
3. WHERE provider_type = 'neon' OR 'openai' OR 'anthropic', THE Backend SHALL validate that api_key is non-empty and matches expected format patterns
4. WHERE provider_type = 'backblaze_b2', THE Backend SHALL validate that application_key_id and application_key are non-empty
5. WHEN validation fails, THE Backend SHALL return HTTP 400 Bad Request with a descriptive error message
6. THE Backend SHALL sanitize display_name to prevent XSS attacks (strip HTML tags, limit length to 100 characters)
7. THE Backend SHALL limit credential_data size to 4KB to prevent abuse
8. WHEN credential_data exceeds size limit, THE Backend SHALL reject the request with HTTP 413 Payload Too Large

### Requirement 11: Error Handling and Security

**User Story:** As a security-conscious system, I want graceful error handling that doesn't leak sensitive information, so that attackers cannot extract credentials from error messages.

#### Acceptance Criteria

1. WHEN an encryption error occurs, THE Backend SHALL return a generic error message "Encryption failed" without exposing plaintext or technical details
2. WHEN a decryption error occurs, THE Backend SHALL return a generic error message "Decryption failed" without exposing ciphertext or keys
3. WHEN a database error occurs during credential operations, THE Backend SHALL log the full error internally and return a generic message to the client
4. WHEN an API request fails due to invalid credentials, THE Backend SHALL NOT indicate whether the credential exists or is simply incorrect
5. THE Backend SHALL rate-limit credential access attempts to prevent brute force attacks (max 10 requests per minute per user)
6. WHEN rate limit is exceeded, THE Backend SHALL return HTTP 429 Too Many Requests
7. THE Backend SHALL use constant-time comparison for credential validation to prevent timing attacks

### Requirement 12: Credential Testing and Validation

**User Story:** As an owner/super_admin, I want to test credentials before saving them, so that I know they work before making them active.

#### Acceptance Criteria

1. THE Settings_UI SHALL provide a "Test Connection" button in the credential form
2. WHEN the User clicks "Test Connection", THE Backend SHALL attempt to authenticate with the provider using the supplied credentials
3. WHERE provider_type = 'neon', THE Backend SHALL test by calling the Neon API `/projects` endpoint
4. WHERE provider_type = 'smtp', THE Backend SHALL test by establishing an SMTP connection and authenticating
5. WHERE provider_type = 'backblaze_b2', THE Backend SHALL test by calling the B2 authorization endpoint
6. WHERE provider_type = 'openai' OR 'anthropic', THE Backend SHALL test by calling the models list endpoint
7. WHEN the test succeeds, THE Backend SHALL return HTTP 200 with message "Connection successful"
8. WHEN the test fails, THE Backend SHALL return HTTP 400 with a descriptive error (e.g., "Authentication failed: Invalid API key")
9. THE Backend SHALL NOT save credentials during testing - this is a read-only validation operation
10. THE Backend SHALL timeout test requests after 10 seconds to prevent hanging

### Requirement 13: Backward Compatibility with Existing Systems

**User Story:** As a developer, I want the new credential system to work with existing code, so that I don't have to refactor all API integrations immediately.

#### Acceptance Criteria

1. THE Backend SHALL maintain existing function signatures for credential retrieval (e.g., `get_neon_api_key()`)
2. WHEN existing functions are called, THE Backend SHALL first check the database for active credentials
3. WHEN no database credential exists, THE Backend SHALL fallback to `.env` variables
4. THE Backend SHALL return credentials in the same format expected by existing code
5. WHEN migrating a specific provider to database storage, THE Backend SHALL continue to support `.env` fallback for other providers
6. THE Backend SHALL log a deprecation warning when `.env` credentials are used instead of database credentials

### Requirement 14: UI/UX for Credential Masking

**User Story:** As an owner/super_admin viewing the Settings page, I want sensitive credential values masked by default, so that credentials are not exposed to shoulder surfing.

#### Acceptance Criteria

1. THE Settings_UI SHALL display API keys in masked format by default (e.g., "sk-...xyz" showing first 3 and last 3 characters)
2. THE Settings_UI SHALL display passwords as "••••••••" (8 dots regardless of actual length)
3. THE Settings_UI SHALL provide an "eye" icon button to toggle visibility for each credential field
4. WHEN the User clicks the eye icon, THE Settings_UI SHALL reveal the full plaintext value
5. WHEN the User clicks the eye icon again, THE Settings_UI SHALL re-mask the value
6. THE Settings_UI SHALL auto-mask credentials after 30 seconds of inactivity on the Settings page
7. THE Settings_UI SHALL never send unmasked credential values in API responses (masking happens server-side)

### Requirement 15: Deletion Safety and Confirmation

**User Story:** As an owner/super_admin, I want to confirm before deleting credentials, so that I don't accidentally remove active integrations.

#### Acceptance Criteria

1. WHEN the User clicks "Delete" on a credential, THE Settings_UI SHALL display a confirmation modal
2. THE confirmation modal SHALL show the credential display_name and provider_type
3. WHERE is_active = TRUE, THE confirmation modal SHALL display a warning: "This is your active credential for [provider]. Deleting it will disable [provider] integration."
4. THE confirmation modal SHALL require typing the display_name to confirm deletion (for active credentials only)
5. WHEN the User confirms deletion, THE Settings_UI SHALL send the delete request to the Backend
6. WHEN the User cancels, THE Settings_UI SHALL close the modal without deleting
7. WHEN deletion succeeds, THE Settings_UI SHALL show a success message and refresh the credential list
8. WHEN deletion fails, THE Settings_UI SHALL show an error message with the reason

### Requirement 16: Credential Expiration and Rotation Reminders

**User Story:** As an owner/super_admin, I want reminders to rotate old credentials, so that I maintain good security hygiene.

#### Acceptance Criteria

1. THE Credential_Store SHALL track created_at and updated_at timestamps for each credential
2. THE Settings_UI SHALL display a warning badge on credentials older than 90 days
3. THE warning badge SHALL show text: "Consider rotating this credential"
4. WHEN the User hovers over the warning badge, THE Settings_UI SHALL display a tooltip: "This credential is [N] days old. Rotate credentials regularly for better security."
5. THE Backend SHALL provide an API endpoint to list credentials due for rotation (older than 90 days)
6. THE Backend SHALL send a monthly email reminder to owner/super_admin users with credentials due for rotation
7. THE Backend SHALL NOT automatically expire or disable credentials based on age

### Requirement 17: Bulk Operations and Import/Export

**User Story:** As an owner/super_admin, I want to export and import credentials, so that I can migrate between environments or back up my configuration.

#### Acceptance Criteria

1. THE Settings_UI SHALL provide an "Export Credentials" button that downloads credentials as an encrypted JSON file
2. WHEN exporting, THE Backend SHALL encrypt the export file with a user-provided password using AES-256-GCM
3. THE export file SHALL contain: all credential records (including encrypted credential_data), metadata, schema version
4. THE Settings_UI SHALL provide an "Import Credentials" button that accepts an encrypted JSON file
5. WHEN importing, THE Settings_UI SHALL prompt the User for the decryption password
6. WHEN importing, THE Backend SHALL decrypt the file, validate the schema version, and insert credentials
7. WHERE a credential with the same provider_type and display_name already exists, THE Backend SHALL skip importing that credential and log a warning
8. WHEN import completes, THE Settings_UI SHALL display a summary: "[N] credentials imported, [M] skipped"
9. THE Backend SHALL validate the import file structure before processing to prevent malformed data
10. THE export file SHALL include a timestamp and user_id for audit purposes
