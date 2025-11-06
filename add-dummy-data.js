const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./database.sqlite');

// Your group ID from the logs
const groupId = 'aa8af597-65f9-4a7b-bbaa-8b260121771d';

// Dummy participants data
const dummyParticipants = [
  { name: 'Alice Johnson', email: 'alice@example.com' },
  { name: 'Bob Smith', email: 'bob@example.com' },
  { name: 'Carol Davis', email: 'carol@example.com' },
  { name: 'David Wilson', email: 'david@example.com' },
  { name: 'Emma Brown', email: 'emma@example.com' },
  { name: 'Frank Miller', email: 'frank@example.com' },
  { name: 'Grace Taylor', email: 'grace@example.com' }
];

async function addDummyParticipants() {
  console.log('Adding dummy participants to group:', groupId);
  
  for (const participant of dummyParticipants) {
    const participantId = uuidv4();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO participants (id, group_id, user_id, email, name, status, joined_at)
         VALUES (?, ?, ?, ?, ?, 'joined', CURRENT_TIMESTAMP)`,
        [participantId, groupId, null, participant.email, participant.name],
        function(err) {
          if (err) {
            console.error('Error adding participant:', participant.name, err.message);
            reject(err);
          } else {
            console.log('Added participant:', participant.name);
            resolve(this);
          }
        }
      );
    });
  }
  
  console.log('All dummy participants added successfully!');
  db.close();
}

addDummyParticipants().catch(console.error);
