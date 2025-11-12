# Fix: Database Persistence on Render

## The Problem
If your groups and data are disappearing, it's likely because the database file is not stored on a persistent disk. On Render's free tier, files in the regular filesystem are lost when:
- The service redeploys
- The container is recreated
- The service restarts

## The Solution: Configure Persistent Disk

### Step 1: Check if Persistent Disk is Configured

1. Go to your Render dashboard
2. Select your **backend service** (`secret-santa-api`)
3. Go to **Settings** → Scroll down to **"Disks"** section
4. Check if you have a disk named `database-disk` mounted at `/opt/render/project/src/backend/data`

### Step 2: Add Persistent Disk (if missing)

1. In your backend service settings
2. Scroll to **"Disks"** section
3. Click **"Add Disk"**
4. Configure:
   - **Name**: `database-disk`
   - **Mount Path**: `/opt/render/project/src/backend/data` ⚠️ **IMPORTANT: Use `/data` subdirectory, not the root!**
   - **Size**: 1 GB (minimum)
5. Click **"Save"**

### Step 3: Verify Environment Variable

1. Go to **Environment** tab
2. Make sure `DATABASE_PATH` is set to:
   ```
   DATABASE_PATH=/opt/render/project/src/backend/data/database.sqlite
   ```
3. If it's not set, add it
4. Save and redeploy

### Step 4: Verify Database Location

After redeploying, the database should be created at:
```
/opt/render/project/src/backend/data/database.sqlite
```

This location is on the persistent disk and will survive redeploys.

## ⚠️ IMPORTANT: Mount Path Issue

**DO NOT mount the disk at `/opt/render/project/src/backend`** - this will overwrite your code directory and break the build!

**CORRECT mount path**: `/opt/render/project/src/backend/data`

This creates a subdirectory for the database while keeping your code intact.

## Important Notes

- **Spinning Down**: The free tier spins down after 15 minutes of inactivity. This does NOT delete data - it just makes the first request slow (~30 seconds).
- **Data Loss**: Data is only lost if the database file is NOT on a persistent disk.
- **Redeploys**: With a persistent disk, your data will survive redeploys.

## Testing

After configuring the persistent disk:
1. Create a test group
2. Add some participants
3. Wait a few hours or trigger a redeploy
4. Check if the data is still there

If data persists, the fix worked!
