# Test: Verify Database Persistence on Render

## Quick Test (5 minutes)

### Step 1: Create Test Data
1. Go to your deployed app
2. **Register a new test account** (or use existing)
3. **Create a test group** with a memorable name like "Persistence Test - [Your Name]"
4. **Add at least 2-3 participants** (you can add yourself multiple times or use test emails)
5. **Note the group ID** from the URL (e.g., `/group/abc123-def456-...`)

### Step 2: Verify Data Exists
1. **Refresh the page** - the group should still be there
2. **Log out and log back in** - the group should still be there
3. **Check the group details** - participants should still be listed

### Step 3: Trigger a Redeploy (This is the real test!)
1. Go to your **Render dashboard**
2. Select your **backend service**
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
   - OR make a small change to trigger auto-deploy
4. **Wait for deployment to complete** (2-3 minutes)

### Step 4: Verify Data Survived
1. Go back to your app
2. **Log in** (if needed)
3. **Check your dashboard** - your test group should still be there!
4. **Open the group** - all participants should still be listed
5. ✅ **If the group is still there, persistence is working!**

---

## Extended Test (Wait for Spin-Down)

### Step 1: Create Test Data
- Same as above - create a test group with participants

### Step 2: Wait for Spin-Down
- **Don't access the app for 15+ minutes**
- The service will spin down (go to sleep)

### Step 3: Access After Spin-Down
1. Go to your app URL
2. **First request will be slow** (~30 seconds) - this is normal!
3. **Log in**
4. **Check your dashboard** - your test group should still be there!
5. ✅ **If the group is still there, persistence is working!**

---

## What to Look For

### ✅ Success Signs:
- Group still exists after redeploy
- Participants still listed
- Wishlist items still there
- Assignments still intact

### ❌ Failure Signs:
- Group is gone
- "No groups found" message
- Have to create everything again
- Database appears empty

---

## If It's Still Not Working

If data disappears after redeploy:

1. **Check Disk Configuration:**
   - Render Dashboard → Backend Service → Settings → Disks
   - Verify disk is mounted at `/opt/render/project/src/backend`
   - Check disk size (should be > 0 bytes used)

2. **Check Environment Variable:**
   - Render Dashboard → Backend Service → Environment
   - Verify `DATABASE_PATH=/opt/render/project/src/backend/database.sqlite`

3. **Check Logs:**
   - Render Dashboard → Backend Service → Logs
   - Look for database initialization messages
   - Check for any errors about database file

4. **Verify Database Location:**
   - The database should be at: `/opt/render/project/src/backend/database.sqlite`
   - This path is on the persistent disk

---

## Quick Verification Command (if you have SSH access)

If Render provides shell access, you can verify the database file exists:

```bash
ls -lh /opt/render/project/src/backend/database.sqlite
```

This should show the database file with a size > 0 bytes.

