const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateSecretSantaAssignments, getAllAssignmentsForGroup } = require('./dist/services/assignmentService');

// Test participants
const participants = [
  'mom',
  'dad',
  'chris',
  'char',
  'mitch',
  'tamsin',
  'sean',
  'paulette',
  'shannon'
];

async function testAssignments() {
  const dbPath = path.join(__dirname, 'test-assignments.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // Create test database schema
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create groups table
        db.run(`
          CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            owner_id TEXT NOT NULL,
            max_participants INTEGER DEFAULT 50,
            gifts_per_participant INTEGER DEFAULT 1,
            share_token TEXT UNIQUE,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create participants table
        db.run(`
          CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            user_id TEXT,
            email TEXT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'joined',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (id)
          )
        `);

        // Create assignments table
        db.run(`
          CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            giver_id TEXT NOT NULL,
            receiver_id TEXT NOT NULL,
            gift_number INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (id),
            FOREIGN KEY (giver_id) REFERENCES participants (id),
            FOREIGN KEY (receiver_id) REFERENCES participants (id)
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    // Create test group
    const groupId = 'test-group-' + Date.now();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO groups (id, name, owner_id, gifts_per_participant) VALUES (?, ?, ?, ?)`,
        [groupId, 'Test Secret Santa', 'test-owner', 2],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create participants
    const participantIds = [];
    for (const name of participants) {
      const participantId = 'participant-' + name.toLowerCase().replace(/\s+/g, '-');
      participantIds.push(participantId);
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO participants (id, group_id, name, status) VALUES (?, ?, ?, 'joined')`,
          [participantId, groupId, name],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    console.log('\n🎄 Testing Balanced Assignment Algorithm 🎄\n');
    console.log(`Participants (${participants.length}): ${participants.join(', ')}`);
    console.log(`Gifts per participant: 2\n`);

    // Mock the database for the assignment service
    const originalDb = require('./dist/utils/database').db;
    require('./dist/utils/database').db = db;

    // Generate assignments
    console.log('Generating assignments...\n');
    const assignments = await generateSecretSantaAssignments(groupId);

    // Get all assignments with names
    const allAssignments = await getAllAssignmentsForGroup(groupId);

    // Analyze results
    const givesCount = new Map();
    const receivesCount = new Map();

    participants.forEach(name => {
      givesCount.set(name, 0);
      receivesCount.set(name, 0);
    });

    allAssignments.forEach(assignment => {
      givesCount.set(assignment.giverName, (givesCount.get(assignment.giverName) || 0) + 1);
      receivesCount.set(assignment.receiverName, (receivesCount.get(assignment.receiverName) || 0) + 1);
    });

    // Display results
    console.log('📋 ASSIGNMENT RESULTS:\n');
    console.log('='.repeat(80));
    
    participants.forEach(name => {
      const gives = givesCount.get(name) || 0;
      const receives = receivesCount.get(name) || 0;
      const givesList = allAssignments
        .filter(a => a.giverName === name)
        .map(a => `${a.receiverName} (gift ${a.giftNumber})`)
        .join(', ');
      
      console.log(`\n${name.toUpperCase()}:`);
      console.log(`  Gives ${gives} gift(s): ${givesList || 'NONE'}`);
      console.log(`  Receives ${receives} gift(s)`);
      
      if (gives !== 2) {
        console.log(`  ⚠️  WARNING: Should give 2 gifts, but gives ${gives}`);
      }
      if (receives !== 2) {
        console.log(`  ⚠️  WARNING: Should receive 2 gifts, but receives ${receives}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY:\n');

    const allGivesCorrect = Array.from(givesCount.values()).every(count => count === 2);
    const allReceivesCorrect = Array.from(receivesCount.values()).every(count => count === 2);
    const totalGifts = allAssignments.length;

    console.log(`Total assignments: ${totalGifts} (expected: ${participants.length * 2})`);
    console.log(`All give 2 gifts: ${allGivesCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`All receive 2 gifts: ${allReceivesCorrect ? '✅ YES' : '❌ NO'}`);

    if (allGivesCorrect && allReceivesCorrect) {
      console.log('\n🎉 SUCCESS! The algorithm is working perfectly! 🎉\n');
    } else {
      console.log('\n⚠️  There are some imbalances. Check the details above.\n');
    }

    // Clean up
    db.close();
    require('fs').unlinkSync(dbPath);

  } catch (error) {
    console.error('Error:', error);
    db.close();
    if (require('fs').existsSync(dbPath)) {
      require('fs').unlinkSync(dbPath);
    }
    process.exit(1);
  }
}

testAssignments();

