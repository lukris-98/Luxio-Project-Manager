# HF Space Deployment - Neon Organization Management

## 🚀 Quick Deploy Steps

### Step 1: Push Dockerfile to HF Space
You need to update the Dockerfile in your HF Space repository to trigger a rebuild.

**Option A: Via HF Web Interface**
1. Go to: https://huggingface.co/spaces/[your-username]/luxio-backend/tree/main
2. Click on `Dockerfile`
3. Click **"Edit"** button
4. Find the line: `ARG CACHE_BUST=27` (or current number)
5. Change to: `ARG CACHE_BUST=35`
6. Update comment: `# Update terakhir: 2026-09-10 - Neon Organization Management CRUD`
7. Scroll down and click **"Commit changes to main"**
8. HF Space will automatically detect the change and start rebuilding

**Option B: Via Git Command Line**
```bash
# Clone your HF Space repo (if not already cloned)
git clone https://huggingface.co/spaces/[your-username]/luxio-backend
cd luxio-backend

# Copy the updated Dockerfile from your main repo
cp /path/to/Luxio-Project-Manager/luxio-hf-3file/Dockerfile ./Dockerfile

# Commit and push
git add Dockerfile
git commit -m "Update CACHE_BUST=35 - Deploy Neon Organization Management"
git push

# HF Space will auto-rebuild
```

### Step 2: Monitor Build Progress
1. Go to your HF Space: https://huggingface.co/spaces/[your-username]/luxio-backend
2. Click **"Logs"** tab at the top
3. Watch the build process:
   - Should see: `git clone https://github.com/lukris-98/Luxio-Project-Manager.git`
   - Should see: `cargo build --release`
   - Wait for: `Container started successfully`

**Build Time**: Approximately 5-10 minutes

### Step 3: Verify Deployment
Once the build completes and container starts:

1. **Test Backend Endpoint**
   ```bash
   curl https://[your-space-url]/health
   # Should return: {"status":"ok"}
   ```

2. **Test New Organization Endpoints**
   ```bash
   # Get active org ID (requires auth token)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://[your-space-url]/api/owner/neon/org-id
   
   # Should return:
   # {"ok":true,"org_id":"org-curly-bonus-71722205","source":"env"}
   # or {"ok":true,"org_id":"org-xxx","source":"database"}
   ```

3. **Test Frontend UI**
   - Open: https://luxio.web.id
   - Login with master account (Tylerlukriss98@gmail.com)
   - Navigate to: **Settings** page
   - Scroll to: **Neon Organization** section
   - Should see:
     - "Kelola Organization ID" heading
     - "Tambah Organization" button
     - Organization list (empty if none added yet)

### Step 4: Add Your First Organization

1. In Settings → Neon Organization section
2. Click **"Tambah Organization"**
3. Fill in:
   - **Organization ID**: `org-curly-bonus-71722205`
   - **Nama Organization**: `Production Org` (optional)
4. Click **"Simpan"**
5. You should see success message: "✅ Organization berhasil ditambahkan"
6. Organization appears in the list
7. Click **"Aktifkan"** button to make it active

### Step 5: Test Storage Tab
1. Navigate to **Storage** page
2. Click **Storage Org** tab
3. Should now load without "org_id is required" error
4. Should show storage consumption data for your organization

## 📋 Deployment Checklist

- [ ] GitHub repo updated with latest code (commit: cd9f931)
- [ ] Dockerfile CACHE_BUST incremented to 35
- [ ] Dockerfile pushed to HF Space repo
- [ ] HF Space rebuild triggered
- [ ] Build completed successfully (check Logs tab)
- [ ] Container running (status shows "Running")
- [ ] Backend health endpoint responding
- [ ] Frontend can access Settings page
- [ ] Can add new organization via UI
- [ ] Can set organization as active
- [ ] Storage Tab loads without errors
- [ ] Organization management working end-to-end

## 🔧 Troubleshooting

### Build Fails at Git Clone
**Error**: `fatal: could not read Username for 'https://github.com'`
**Solution**: GitHub repo must be public. Check repo visibility settings.

### Build Fails at Cargo Build
**Error**: Compilation errors in Rust code
**Solution**: 
- Check that latest code is in GitHub master branch
- Verify commit cd9f931 is pushed
- Check backend/src/owner.rs syntax

### Container Starts but Endpoints Return 500
**Error**: Internal server errors
**Solution**:
- Check HF Space Logs for Rust panic messages
- Verify DATABASE_URL is set in Space Settings
- Check that database migrations ran successfully

### Frontend Shows "Gagal memuat daftar organization"
**Error**: API call failing
**Solution**:
- Verify backend deployed with new routes
- Check browser DevTools Network tab for specific error
- Verify authentication token is valid

### Storage Tab Still Shows "org_id is required"
**Solution**:
1. Add an organization via Settings UI
2. Set it as active (click "Aktifkan" button)
3. Reload the page
4. If still fails, check `/api/owner/neon/org-id` endpoint directly

## 📊 What's New in This Deployment

### Backend Changes
- ✅ 4 new route handlers in `backend/src/owner.rs`:
  - `neon_organizations_list` (GET)
  - `neon_organizations_create` (POST)
  - `neon_organizations_delete` (DELETE)
  - `neon_organizations_activate` (POST)
- ✅ Routes registered in `backend/src/lib.rs`
- ✅ Database table `neon_organizations` with unique constraint

### Frontend Changes
- ✅ NeonOrgManagement component in Settings page
- ✅ API methods in `app/src/services/api.js`
- ✅ StoragePage updated to use database org priority
- ✅ Full CRUD UI with validation and error handling

### Features Available After Deployment
1. **Add Multiple Organizations**: Store unlimited org IDs in database
2. **Switch Active Organization**: Change which org Storage Tab uses
3. **Delete Organizations**: Remove unused organizations
4. **Priority System**: Database → Env Variable → Hardcoded fallback
5. **User Isolation**: Each owner manages their own organizations
6. **No Restart Required**: Changes take effect immediately

## 🎯 Success Criteria

Deployment is successful when:
1. ✅ HF Space shows "Running" status
2. ✅ No errors in HF Space Logs
3. ✅ Backend health endpoint returns 200 OK
4. ✅ Settings page shows Neon Organization section
5. ✅ Can add organization and see it in list
6. ✅ Can set organization as active
7. ✅ Storage Tab loads data using active organization
8. ✅ No "org_id is required" errors

## 📞 Support

If deployment fails or you encounter issues:
1. Check the full documentation: `NEON_ORG_MANAGEMENT.md`
2. Review HF Space Logs for specific error messages
3. Verify all environment variables are set in HF Space Settings
4. Confirm GitHub repo has latest commits (cd9f931)

---

**Deployment Date**: September 10, 2026  
**CACHE_BUST Value**: 35  
**GitHub Commit**: cd9f931  
**Expected Build Time**: 5-10 minutes  
**Backend Framework**: Rust/Axum  
**Database**: Neon PostgreSQL
