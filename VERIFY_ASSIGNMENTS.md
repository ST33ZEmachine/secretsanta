# How to Verify Secret Santa Assignments

## Option 1: Run Verification Script Locally (If you have database access)

If you can download the database file from Render:

1. **Download the database file** from Render (if you have SSH/shell access)
   - The database is at: `/opt/render/project/src/backend/data/database.sqlite`

2. **Run the verification script**:
   ```bash
   cd backend
   node verify-assignments.js
   ```

3. **Enter the information when prompted**:
   - Database path (or press Enter for local)
   - Group name: "Stewart Family Christmas"
   - Owner email: "costewart4@gmail.com"

## Option 2: Add Verification Endpoint (Recommended)

I can add a verification endpoint to your backend that you can call from the app. This would:
- Show assignment verification in the UI
- Be accessible without downloading the database
- Work directly from your deployed app

Would you like me to add this?

## Option 3: Check in Render Logs

You can also check the backend logs in Render to see if there were any errors during assignment generation.

## What the Verification Checks

✅ Each person gives exactly N gifts (where N = gifts_per_participant)  
✅ Each person receives exactly N gifts  
✅ No self-assignments  
✅ All participants have assignments  
✅ Total assignments = participants × gifts_per_participant

