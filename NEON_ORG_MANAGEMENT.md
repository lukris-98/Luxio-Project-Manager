# Neon Organization Management Feature

## Overview
Complete CRUD (Create, Read, Update, Delete) implementation for managing Neon Database Organization IDs directly from the Luxio Settings page. This feature allows owner/super_admin users to manage multiple organizations and set which one is active for the Storage Tab.

## Problem Solved
Previously, the organization ID was hardcoded in the frontend or required backend environment variable configuration. This made it difficult to:
- Switch between different organizations
- Manage multiple organizations for testing or production
- Update organization IDs without redeploying

## Solution Architecture

### Database Layer
**Table: `neon_organizations`**
```sql
CREATE TABLE neon_organizations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one active organization per user
CREATE UNIQUE INDEX idx_neon_orgs_one_active 
ON neon_organizations(user_id) WHERE is_active = TRUE;
```

### Backend Routes (Rust/Axum)
**File: `backend/src/owner.rs`**

#### 1. List Organizations
```rust
GET /api/owner/neon/organizations
```
Returns all organizations for the authenticated user.

**Response:**
```json
{
  "ok": true,
  "organizations": [
    {
      "id": "uuid-1234",
      "org_id": "org-curly-bonus-71722205",
      "name": "Production Org",
      "is_active": true,
      "created_at": 1736345678000
    }
  ]
}
```

#### 2. Create Organization
```rust
POST /api/owner/neon/organizations
```
Adds a new organization to the database.

**Request Body:**
```json
{
  "org_id": "org-curly-bonus-71722205",
  "name": "My Production Org"
}
```

**Response:**
```json
{
  "ok": true,
  "id": "uuid-1234"
}
```

#### 3. Delete Organization
```rust
DELETE /api/owner/neon/organizations/:id
```
Removes an organization from the database.

**Response:**
```json
{
  "ok": true
}
```

#### 4. Activate Organization
```rust
POST /api/owner/neon/organizations/:id/activate
```
Sets the specified organization as active (deactivates all others for the user).

**Response:**
```json
{
  "ok": true
}
```

### Frontend Components

#### 1. NeonOrgManagement Component
**File: `app/src/pages/Settings.jsx`**

UI component in the Settings page that provides:
- **Add Organization**: Form with org_id (required) and name (optional) fields
- **List Organizations**: Shows all organizations with active indicator
- **Set Active**: Button to make an organization active
- **Delete**: Button to remove an organization
- **Validation**: Checks org_id format (org-xxxxx-xxxxx-xxxxx)

#### 2. API Service Methods
**File: `app/src/services/api.js`**

```javascript
// Get list of organizations
async getNeonOrganizations()

// Add new organization
async addNeonOrganization({ org_id, name })

// Delete organization
async deleteNeonOrganization(id)

// Set organization as active
async setActiveNeonOrganization(id)

// Get active organization ID (with fallback priority)
async getNeonOrgId()
```

### Priority System for Organization ID

The system uses a **3-tier fallback priority** to determine which organization ID to use:

**Priority 1: Active Database Organization**
- Checks `neon_organizations` table for active org (is_active = TRUE)
- Used when user has set an active organization via Settings UI

**Priority 2: Backend Environment Variable**
- Falls back to `NEON_ORG_ID` from backend .env
- Used for backward compatibility and default configuration

**Priority 3: Hardcoded Fallback**
- Frontend has hardcoded org_id as last resort
- Only used if both database and env variable are empty

**Implementation in `backend/src/owner.rs`:**
```rust
pub async fn neon_org_id(/* ... */) -> Result<Json<Value>, StatusCode> {
    // Priority 1: Database
    let active_org = sqlx::query(
        "SELECT org_id FROM neon_organizations 
         WHERE user_id = $1 AND is_active = TRUE LIMIT 1"
    )
    .bind(&user_id)
    .fetch_optional(&state.db)
    .await;

    if let Ok(Some(row)) = active_org {
        return Ok(/* org_id from database */);
    }

    // Priority 2: Environment Variable
    let org_id = std::env::var("NEON_ORG_ID").unwrap_or_default();
    if !org_id.is_empty() {
        return Ok(/* org_id from env */);
    }

    // Priority 3: None available
    Ok(/* error message */)
}
```

## User Workflow

### Adding an Organization
1. Navigate to **Settings** page
2. Scroll to **Neon Organization** section
3. Click **"Tambah Organization"** button
4. Fill in:
   - Organization ID (required): `org-curly-bonus-71722205`
   - Organization Name (optional): `My Company`
5. Click **"Simpan"**
6. Organization appears in the list

### Setting Active Organization
1. In the organization list, find the desired organization
2. Click **"Aktifkan"** button next to it
3. The organization is marked as active
4. Storage Tab will now use this organization ID

### Deleting an Organization
1. Click the **trash icon** next to the organization
2. Confirm deletion in the popup
3. Organization is removed from the database

## Security & Authorization

### Access Control
- **Endpoint Protection**: All routes require authentication + owner/super_admin role
- **User Isolation**: Users can only manage their own organizations (enforced via `user_id`)
- **Database Constraints**: Unique index ensures only one active org per user

### Implementation
```rust
// Every endpoint checks authorization
let user_id = require_auth(&state, &headers).await?;
if !is_owner(&state.db, &user_id).await? {
    return Err(StatusCode::FORBIDDEN);
}

// All queries filter by user_id
sqlx::query("SELECT ... WHERE user_id = $1")
    .bind(&user_id)
    .execute(&state.db)
    .await
```

## Testing & Verification

### Manual Testing Steps

1. **Test Add Organization**
   ```bash
   # Frontend: Settings → Add Organization
   # Enter: org-curly-bonus-71722205
   # Verify: Shows in list
   ```

2. **Test Set Active**
   ```bash
   # Click "Aktifkan" button
   # Verify: Shows "aktif" badge
   # Navigate to Storage Tab
   # Verify: Uses correct org_id in API calls
   ```

3. **Test Delete**
   ```bash
   # Click trash icon → Confirm
   # Verify: Organization removed from list
   ```

4. **Test Priority Fallback**
   ```bash
   # With no active org in database:
   # - Should use NEON_ORG_ID from backend env
   # - If env empty, should show error in Storage Tab
   ```

### Database Verification
```sql
-- Check organizations for a user
SELECT * FROM neon_organizations WHERE user_id = 'user-id-here';

-- Verify only one active
SELECT user_id, COUNT(*) as active_count
FROM neon_organizations
WHERE is_active = TRUE
GROUP BY user_id;
-- Should return 0 or 1 for each user
```

## Deployment

### HF Space Setup
1. **Push code to GitHub**
   ```bash
   git add backend/src/owner.rs backend/src/lib.rs backend/src/db.rs
   git add app/src/pages/Settings.jsx app/src/services/api.js
   git commit -m "Implement Neon Organization Management CRUD"
   git push origin master
   ```

2. **Update HF Space Dockerfile**
   ```dockerfile
   # Increment CACHE_BUST value
   ARG CACHE_BUST=35
   ```
   Commit and push to HF Space repository to trigger rebuild.

3. **Environment Variables** (Optional)
   - `NEON_ORG_ID`: Can be set as default fallback
   - Not required if users set active organization via UI

### Migration Notes
- **Backward Compatible**: Existing deployments continue working with env variable
- **Database Migration**: Table `neon_organizations` auto-created via `db::migrate()`
- **No Breaking Changes**: Frontend handles missing backend endpoints gracefully

## Files Modified

### Backend
- `backend/src/owner.rs`: Added 4 new route handlers
- `backend/src/lib.rs`: Registered 4 new routes
- `backend/src/db.rs`: Added `neon_organizations` table migration

### Frontend
- `app/src/pages/Settings.jsx`: Added `NeonOrgManagement` component
- `app/src/services/api.js`: Added 4 API methods for org management
- `app/src/pages/StoragePage.jsx`: Updated to fetch active org from database

### Infrastructure
- `luxio-hf-3file/Dockerfile`: Updated CACHE_BUST=35

## Commit History
```
3889cc1 - Backend: Implement Neon Organization Management CRUD
b5a51d5 - Frontend: Add Neon Org Management UI in Settings
6d4d4ad - Backend: Fix Neon org_id endpoint to use database + env fallback
```

## Future Enhancements

### Potential Improvements
1. **Organization API Key Storage**: Store per-org API keys in database
2. **Bulk Operations**: Add/delete multiple organizations at once
3. **Organization Metadata**: Track usage stats, created projects, etc.
4. **Sharing**: Allow multiple users to access same organization
5. **Audit Log**: Track who changed active organization and when

### API Expansion
```rust
// Future endpoints
GET /api/owner/neon/organizations/:id/stats
POST /api/owner/neon/organizations/:id/test-connection
PUT /api/owner/neon/organizations/:id/api-key
```

## Troubleshooting

### Issue: "org_id is required" error
**Solution**: Add an organization via Settings and set it as active.

### Issue: Organization list empty after adding
**Solution**: 
- Check browser console for API errors
- Verify backend is running latest code (CACHE_BUST updated)
- Check database for INSERT errors in backend logs

### Issue: Storage Tab not using active organization
**Solution**:
- Reload the page after setting active organization
- Check `/api/owner/neon/org-id` response includes correct org_id
- Verify database has is_active=TRUE for the organization

### Issue: Cannot delete active organization
**Solution**: This is allowed - deleting active org will cause fallback to env variable or error state, prompting user to set another org active.

## API Documentation Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/owner/neon/organizations` | List all organizations | owner/super_admin |
| POST | `/api/owner/neon/organizations` | Add new organization | owner/super_admin |
| DELETE | `/api/owner/neon/organizations/:id` | Delete organization | owner/super_admin |
| POST | `/api/owner/neon/organizations/:id/activate` | Set as active | owner/super_admin |
| GET | `/api/owner/neon/org-id` | Get active org ID | owner/super_admin |

---

**Implementation Date**: September 10, 2026  
**Status**: ✅ Complete - Backend routes implemented, frontend UI ready, database migration done  
**Next Step**: Deploy to HF Space by updating Dockerfile CACHE_BUST value
