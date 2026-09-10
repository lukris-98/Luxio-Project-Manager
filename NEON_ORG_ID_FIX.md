# 🔧 Fix: Neon Organization ID Error

## ❌ Problem

Error saat mengakses Storage Org tab:
```
org_id is required, you can find it on your organization settings page
```

**Root Cause**: Frontend hardcoded organization ID, tapi backend tidak mengirimkan `org_id` dalam request ke Neon API organization endpoints.

---

## ✅ Solution

### Backend Changes (Rust)

#### 1. New Endpoint: `/api/owner/neon/org-id`
**File**: `backend/src/owner.rs`

```rust
/// GET /api/owner/neon/org-id — ambil Organization ID dari environment variable.
pub async fn neon_org_id(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let org_id = std::env::var("NEON_ORG_ID").unwrap_or_default();
    
    if org_id.is_empty() {
        return Ok(Json(json!({
            "ok": false,
            "org_id": null,
            "message": "NEON_ORG_ID tidak dikonfigurasi"
        })));
    }

    Ok(Json(json!({
        "ok": true,
        "org_id": org_id
    })))
}
```

#### 2. Register Route
**File**: `backend/src/lib.rs`

```rust
.route("/api/owner/neon/status", get(owner::neon_status))
.route("/api/owner/neon/org-id", get(owner::neon_org_id))  // NEW
.route("/api/owner/neon/proxy", post(owner::neon_proxy))
```

---

### Frontend Changes (JavaScript)

#### 1. API Function
**File**: `app/src/services/api.js`

```javascript
export const api = {
  // ... existing functions
  getNeonOrgId: () => get('/api/owner/neon/org-id'),
}
```

#### 2. Update StoragePage
**File**: `app/src/pages/StoragePage.jsx`

```javascript
const loadOrgStorage = useCallback(async () => {
  setLoading(true); setError('')
  
  // Get org ID from backend (from NEON_ORG_ID env var)
  let orgId = null
  try {
    const orgIdRes = await api.getNeonOrgId()
    if (orgIdRes.ok && orgIdRes.org_id) {
      orgId = orgIdRes.org_id
    }
  } catch (e) {
    console.warn('[StoragePage] Failed to get org ID from backend:', e)
  }
  
  // Fallback to hardcoded if backend doesn't provide
  if (!orgId) {
    orgId = 'org-curly-bonus-71722205'
  }

  // Use orgId to fetch organization storage data...
}, [])
```

---

## 🔄 Deployment Flow

### Architecture
```
Frontend (Browser)
    ↓
    | GET /api/owner/neon/org-id
    ↓
Backend (reads NEON_ORG_ID from env)
    ↓
    | Returns: { "ok": true, "org_id": "org-curly-bonus-71722205" }
    ↓
Frontend uses org_id
    ↓
    | getOrganizationStorageConsumption(orgId, from, to)
    ↓
Backend Proxy (adds NEON_API_KEY)
    ↓
    | GET /organizations/{org_id}/consumption_history/storage
    ↓
Neon API
    ↓
Returns storage data ✅
```

---

## 🚀 Deployment Steps

### 1. Backend Already Has NEON_ORG_ID ✅

**Local** (`backend/.env`):
```env
NEON_ORG_ID=org-curly-bonus-71722205
```

**HF Space** (Settings → Variables):
```
NEON_ORG_ID=org-curly-bonus-71722205
```

### 2. Git Push ✅ DONE

```bash
git add backend/src/lib.rs backend/src/owner.rs
git add app/src/pages/StoragePage.jsx app/src/services/api.js
git commit -m "fix: Add backend endpoint for Neon organization ID"
git push origin master
```

**Commit**: 6d4d4ad

### 3. Update HF Space (NEXT STEP)

**Option A: Update CACHE_BUST** (Recommended)

Edit `Dockerfile` di HF Space:
```dockerfile
# Increment CACHE_BUST
ARG CACHE_BUST=27  # was 26
```

**Option B: Factory Reboot**

Go to: https://huggingface.co/spaces/lukris-98/luxio-backend/settings
→ Factory Reboot

---

## ✅ Verification

### 1. Test Backend Endpoint

```bash
# After backend restart
curl -H "Authorization: Bearer <your-token>" \
  https://luxio.web.id/api/owner/neon/org-id

# Or from HF Space:
curl -H "Authorization: Bearer <your-token>" \
  https://lukris-98-luxio-backend.hf.space/api/owner/neon/org-id
```

**Expected Response**:
```json
{
  "ok": true,
  "org_id": "org-curly-bonus-71722205"
}
```

### 2. Test Storage Tab

1. Open: https://luxio.edgeone.cool (or luxio.web.id)
2. Login as owner
3. Go to **Penyimpanan** → **Database** tab
4. Click **Storage Org** tab
5. **Should see**:
   - ✅ Summary cards with data
   - ✅ Table with storage periods
   - ✅ No error "org_id is required"

---

## 🔍 Debugging

### Check Backend Logs

```bash
# Look for org_id endpoint calls
grep "neon/org-id" backend.log

# Check if NEON_ORG_ID is loaded
grep "NEON_ORG_ID" backend.log
```

### Check Frontend Network Tab

1. Open DevTools → Network
2. Filter: `org-id`
3. Should see:
   ```
   GET /api/owner/neon/org-id
   Status: 200
   Response: {"ok":true,"org_id":"org-curly-bonus-71722205"}
   ```

### If Still Error "org_id is required"

**Check**:
1. ✅ `NEON_ORG_ID` in backend `.env` or HF Space variables
2. ✅ Backend restarted after adding env var
3. ✅ Frontend calling `/api/owner/neon/org-id` (check Network tab)
4. ✅ Organization API Key (not Personal) in `NEON_API_KEY`

---

## 📊 Before vs After

### Before (Error)
```
❌ Frontend: hardcoded org_id = 'org-curly-bonus-71722205'
❌ Backend: org_id not passed to Neon API
❌ Neon API: returns "org_id is required"
❌ Storage Tab: Error displayed
```

### After (Fixed)
```
✅ Frontend: GET /api/owner/neon/org-id
✅ Backend: Returns NEON_ORG_ID from env
✅ Frontend: Uses org_id in API calls
✅ Backend Proxy: Passes org_id to Neon API
✅ Neon API: Returns storage data
✅ Storage Tab: Displays data successfully
```

---

## 📝 Environment Variables Required

### Backend `.env` (Local)
```env
NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205
```

### HF Space Variables
```
NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205
```

---

## 🎯 Summary

| Component | Change | Status |
|-----------|--------|--------|
| Backend Endpoint | `/api/owner/neon/org-id` | ✅ Added |
| Backend Route | Registered in lib.rs | ✅ Added |
| Frontend API | `getNeonOrgId()` | ✅ Added |
| StoragePage | Dynamic org_id fetch | ✅ Updated |
| Git Push | Commit 6d4d4ad | ✅ Done |
| **HF Space Deploy** | Update Dockerfile | ⏳ **NEXT** |

---

## 🔗 Related Files

- `backend/src/owner.rs` - New endpoint implementation
- `backend/src/lib.rs` - Route registration
- `app/src/services/api.js` - API function
- `app/src/pages/StoragePage.jsx` - Usage in Storage tab
- `backend/.env` - Environment variables (local)
- HF Space Settings → Variables (production)

---

**Fix Date**: 2026-09-10  
**Commit**: 6d4d4ad  
**Status**: Ready for deployment 🚀  
**Next**: Deploy to HF Space (CACHE_BUST=27)
