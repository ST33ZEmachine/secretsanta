const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function verifyAssignments() {
  console.log('\n🎄 Secret Santa Assignment Verifier 🎄\n');
  
  // Get database path
  const dbPath = await question('Enter database path (or press Enter for local: backend/database.sqlite): ');
  const finalDbPath = dbPath.trim() || path.join(__dirname, 'database.sqlite');
  
  console.log(`\nConnecting to database: ${finalDbPath}\n`);
  
  const db = new sqlite3.Database(finalDbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      process.exit(1);
    }
  });

  try {
    // Get group info
    const groupName = await question('Enter group name to check (e.g., "Stewart Family Christmas"): ');
    const userEmail = await question('Enter owner email (e.g., "costewart4@gmail.com"): ');
    
    console.log('\n📋 Verifying assignments...\n');
    
    // Find the group
    const group = await new Promise((resolve, reject) => {
      db.get(`
        SELECT g.id, g.name, g.gifts_per_participant, u.email as owner_email
        FROM groups g
        JOIN users u ON g.owner_id = u.id
        WHERE g.name = ? AND u.email = ?
      `, [groupName.trim(), userEmail.trim()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!group) {
      console.log('❌ Group not found!');
      console.log('   Make sure the group name and owner email are correct.');
      db.close();
      process.exit(1);
    }

    console.log(`✅ Found group: "${group.name}"`);
    console.log(`   Owner: ${group.owner_email}`);
    console.log(`   Expected gifts per person: ${group.gifts_per_participant}\n`);

    // Get all participants
    const participants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, COALESCE(u.name, p.name) as name, p.email
        FROM participants p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.group_id = ? AND p.status = 'joined'
        ORDER BY COALESCE(u.name, p.name)
      `, [group.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📊 Participants (${participants.length}):`);
    participants.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.email || 'no email'})`);
    });
    console.log('');

    // Get all assignments
    const assignments = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          giver.id as giver_id,
          COALESCE(giver_u.name, giver.name) as giver_name,
          receiver.id as receiver_id,
          COALESCE(receiver_u.name, receiver.name) as receiver_name,
          a.gift_number
        FROM assignments a
        JOIN participants giver ON a.giver_id = giver.id
        JOIN participants receiver ON a.receiver_id = receiver.id
        LEFT JOIN users giver_u ON giver.user_id = giver_u.id
        LEFT JOIN users receiver_u ON receiver.user_id = receiver_u.id
        WHERE a.group_id = ?
        ORDER BY giver_name, a.gift_number
      `, [group.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found!');
      console.log('   Assignments may not have been generated yet.');
      db.close();
      process.exit(1);
    }

    console.log(`📦 Total assignments: ${assignments.length}\n`);

    // Track giving and receiving
    const givesCount = new Map();
    const receivesCount = new Map();
    const selfAssignments = [];
    const assignmentDetails = new Map();

    participants.forEach(p => {
      givesCount.set(p.id, 0);
      receivesCount.set(p.id, 0);
      assignmentDetails.set(p.id, []);
    });

    assignments.forEach(assignment => {
      // Check for self-assignment
      if (assignment.giver_id === assignment.receiver_id) {
        selfAssignments.push({
          person: assignment.giver_name,
          giftNumber: assignment.gift_number
        });
      }

      // Count gives
      givesCount.set(assignment.giver_id, (givesCount.get(assignment.giver_id) || 0) + 1);
      
      // Count receives
      receivesCount.set(assignment.receiver_id, (receivesCount.get(assignment.receiver_id) || 0) + 1);
      
      // Store details
      const details = assignmentDetails.get(assignment.giver_id) || [];
      details.push({
        receiver: assignment.receiver_name,
        giftNumber: assignment.gift_number
      });
      assignmentDetails.set(assignment.giver_id, details);
    });

    // Display results
    console.log('='.repeat(80));
    console.log('ASSIGNMENT VERIFICATION RESULTS\n');
    
    let allGood = true;
    const issues = [];

    // Check each participant
    participants.forEach(participant => {
      const gives = givesCount.get(participant.id) || 0;
      const receives = receivesCount.get(participant.id) || 0;
      const details = assignmentDetails.get(participant.id) || [];
      
      console.log(`${participant.name.toUpperCase()}:`);
      console.log(`  Gives ${gives} gift(s): ${details.map(d => `${d.receiver} (gift ${d.giftNumber})`).join(', ') || 'NONE'}`);
      console.log(`  Receives ${receives} gift(s)`);
      
      if (gives !== group.gifts_per_participant) {
        console.log(`  ⚠️  WARNING: Should give ${group.gifts_per_participant} gifts, but gives ${gives}`);
        allGood = false;
        issues.push(`${participant.name} gives ${gives} instead of ${group.gifts_per_participant}`);
      }
      if (receives !== group.gifts_per_participant) {
        console.log(`  ⚠️  WARNING: Should receive ${group.gifts_per_participant} gifts, but receives ${receives}`);
        allGood = false;
        issues.push(`${participant.name} receives ${receives} instead of ${group.gifts_per_participant}`);
      }
      console.log('');
    });

    // Check for self-assignments
    if (selfAssignments.length > 0) {
      console.log('❌ SELF-ASSIGNMENTS DETECTED:');
      selfAssignments.forEach(self => {
        console.log(`   ${self.person} was assigned to themselves (gift ${self.giftNumber})`);
      });
      allGood = false;
      issues.push(`${selfAssignments.length} self-assignment(s) found`);
    } else {
      console.log('✅ No self-assignments found\n');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY:\n');
    console.log(`Total participants: ${participants.length}`);
    console.log(`Total assignments: ${assignments.length}`);
    console.log(`Expected assignments: ${participants.length * group.gifts_per_participant}`);
    console.log(`Expected gifts per person: ${group.gifts_per_participant}`);
    
    const allGivesCorrect = Array.from(givesCount.values()).every(count => count === group.gifts_per_participant);
    const allReceivesCorrect = Array.from(receivesCount.values()).every(count => count === group.gifts_per_participant);
    
    console.log(`\nAll give ${group.gifts_per_participant} gifts: ${allGivesCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`All receive ${group.gifts_per_participant} gifts: ${allReceivesCorrect ? '✅ YES' : '❌ NO'}`);

    if (allGood && allGivesCorrect && allReceivesCorrect) {
      console.log('\n🎉 SUCCESS! All assignments are correct! 🎉');
      console.log('   ✅ Everyone gives the correct number of gifts');
      console.log('   ✅ Everyone receives the correct number of gifts');
      console.log('   ✅ No self-assignments');
      console.log('\n🎄 Christmas is saved! 🎄\n');
    } else {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n❌ Please review the issues above.\n');
    }

    db.close();
    rl.close();

  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
    rl.close();
    process.exit(1);
  }
}

verifyAssignments();

