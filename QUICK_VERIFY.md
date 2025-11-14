# Quick Way to Verify Assignments

## Option 1: Use Browser Console (Fastest!)

1. **Go to your deployed app** and log in as the group owner (costewart4@gmail.com)
2. **Open your browser's Developer Console** (F12 or Right-click → Inspect → Console)
3. **Navigate to the group page** ("Stewart Family Christmas")
4. **Get the group ID** from the URL (e.g., `/group/abc123-def456-...`)
5. **Run this in the console**:

```javascript
fetch('/api/participants/verify-assignments/YOUR_GROUP_ID_HERE', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Verification Results:', data);
  console.log('\n📊 Summary:');
  console.log('Status:', data.summary.status);
  console.log('Message:', data.summary.message);
  console.log('\n👥 Participants:');
  data.participants.forEach(p => {
    console.log(`${p.name}:`);
    console.log(`  Gives ${p.gives} (expected ${p.expectedGives}): ${p.givesCorrect ? '✅' : '❌'}`);
    console.log(`  Receives ${p.receives} (expected ${p.expectedReceives}): ${p.receivesCorrect ? '✅' : '❌'}`);
    console.log(`  Assignments: ${p.assignments.map(a => a.receiver).join(', ')}`);
  });
  if (data.hasSelfAssignments) {
    console.log('\n❌ Self-assignments found:', data.selfAssignments);
  }
});
```

Replace `YOUR_GROUP_ID_HERE` with your actual group ID from the URL.

## Option 2: Use curl (if you have the token)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-backend-url.onrender.com/api/participants/verify-assignments/YOUR_GROUP_ID
```

## What It Checks

✅ Each person gives exactly 2 gifts  
✅ Each person receives exactly 2 gifts  
✅ No self-assignments  
✅ Total assignments = participants × 2

## Expected Output

If everything is correct, you'll see:
- `isValid: true`
- `allGivesCorrect: true`
- `allReceivesCorrect: true`
- `hasSelfAssignments: false`
- Each participant shows `givesCorrect: true` and `receivesCorrect: true`

