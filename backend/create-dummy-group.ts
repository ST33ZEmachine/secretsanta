import { db, initializeDatabase } from './src/utils/database';
import { generateId, hashPassword } from './src/utils/helpers';

const createDummyGroup = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // First, create or get charlotte user
    let charlotteUserId: string;
    const charlotteEmail = 'charlotte@example.com';
    
    const existingCharlotte = await new Promise<any>((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [charlotteEmail], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingCharlotte) {
      charlotteUserId = existingCharlotte.id;
      console.log('✓ Found existing charlotte user');
    } else {
      charlotteUserId = generateId();
      const hashedPassword = await hashPassword('password123');
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
          [charlotteUserId, charlotteEmail, hashedPassword, 'Charlotte'],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
      console.log('✓ Created charlotte user');
    }

    // Create users for all participants if they don't exist
    const participants = [
      { name: 'Mitch', email: 'mitch@example.com' },
      { name: 'Tamsin', email: 'tamsin@example.com' },
      { name: 'Chris', email: 'chris@example.com' },
      { name: 'Shannon', email: 'shannon@example.com' },
      { name: 'Natalie', email: 'natalie@example.com' },
      { name: 'Craig', email: 'craig@example.com' },
      { name: 'Paulette', email: 'paulette@example.com' },
      { name: 'Sean', email: 'sean@example.com' },
    ];

    const userIds: Record<string, string> = {};

    for (const participant of participants) {
      const existingUser = await new Promise<any>((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ?', [participant.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingUser) {
        userIds[participant.name.toLowerCase()] = existingUser.id;
        console.log(`✓ Found existing ${participant.name} user`);
      } else {
        const userId = generateId();
        const hashedPassword = await hashPassword('password123');
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
            [userId, participant.email, hashedPassword, participant.name],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });
        userIds[participant.name.toLowerCase()] = userId;
        console.log(`✓ Created ${participant.name} user`);
      }
    }

    // Create the group
    const groupId = generateId();
    const shareToken = generateId();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO groups (id, name, description, owner_id, max_participants, share_token) VALUES (?, ?, ?, ?, ?, ?)',
        [groupId, 'Christmas 2025', 'Secret Santa gift exchange', charlotteUserId, 50, shareToken],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    console.log('✓ Created group');

    // Add Charlotte as owner/participant
    const charlotteParticipantId = generateId();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO participants (id, group_id, user_id, email, name, status, joined_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [charlotteParticipantId, groupId, charlotteUserId, charlotteEmail, 'Charlotte', 'joined'],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    console.log('✓ Added Charlotte as participant');

    const participantIds: Record<string, string> = { charlotte: charlotteParticipantId };

    // Add all other participants
    for (const participant of participants) {
      const participantId = generateId();
      const userId = userIds[participant.name.toLowerCase()];
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO participants (id, group_id, user_id, email, name, status, joined_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [participantId, groupId, userId, participant.email, participant.name, 'joined'],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
      participantIds[participant.name.toLowerCase()] = participantId;
      console.log(`✓ Added ${participant.name} as participant`);
    }

    // Add wishlist items for each participant
    const wishlistItems = {
      charlotte: [
        { title: 'Wireless Earbuds', description: 'Apple AirPods or similar', link: 'https://example.com/airpods' },
        { title: 'Reading Lamp', description: 'Desk lamp with warm light', link: null },
        { title: 'Yoga Mat', description: 'Non-slip, eco-friendly', link: null },
      ],
      mitch: [
        { title: 'Gaming Headset', description: 'RGB lighting preferred', link: 'https://example.com/headset' },
        { title: 'Coffee Maker', description: 'Espresso machine', link: null },
        { title: 'Tool Set', description: 'Mechanical tools', link: null },
      ],
      tamsin: [
        { title: 'Art Supplies', description: 'Watercolor paints and brushes', link: null },
        { title: 'Cookbook', description: 'Italian cuisine', link: 'https://example.com/cookbook' },
        { title: 'Candle Set', description: 'Scented candles for home', link: null },
      ],
      chris: [
        { title: 'Smart Watch', description: 'Fitness tracking features', link: 'https://example.com/watch' },
        { title: 'Backpack', description: 'Travel backpack, waterproof', link: null },
        { title: 'Bluetooth Speaker', description: 'Portable, good battery', link: null },
      ],
      shannon: [
        { title: 'Perfume', description: 'Floral scent preferred', link: null },
        { title: 'Jewelry Box', description: 'Velvet lined', link: 'https://example.com/jewelry' },
        { title: 'Fuzzy Slippers', description: 'Warm and cozy', link: null },
      ],
      natalie: [
        { title: 'Camera Lens', description: 'Wide angle lens', link: 'https://example.com/lens' },
        { title: 'Photo Album', description: 'Leather bound', link: null },
        { title: 'Plant Pot', description: 'Ceramic, large size', link: null },
      ],
      craig: [
        { title: 'Board Games', description: 'Strategy games', link: null },
        { title: 'Beer Making Kit', description: 'Home brewing starter', link: 'https://example.com/beer' },
        { title: 'Fishing Rod', description: 'Lightweight, travel size', link: null },
      ],
      paulette: [
        { title: 'Spa Gift Set', description: 'Bath bombs and oils', link: null },
        { title: 'Silk Scarf', description: 'Patterned, colorful', link: 'https://example.com/scarf' },
        { title: 'Tea Collection', description: 'Organic teas', link: null },
      ],
      sean: [
        { title: 'Guitar Pick Set', description: 'Various thicknesses', link: null },
        { title: 'Vinyl Records', description: 'Jazz or blues albums', link: 'https://example.com/vinyl' },
        { title: 'Concert Tickets', description: 'Any live music event', link: null },
      ],
    };

    for (const [name, items] of Object.entries(wishlistItems)) {
      const participantId = participantIds[name];
      if (!participantId) {
        console.log(`⚠ Warning: No participant ID found for ${name}`);
        continue;
      }

      for (const item of items) {
        const itemId = generateId();
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO wishlist_items (id, participant_id, group_id, title, description, link, secondhand_ok) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [itemId, participantId, groupId, item.title, item.description || null, item.link || null, 0],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });
      }
      console.log(`✓ Added wishlist items for ${name}`);
    }

    console.log('\n✅ Dummy group created successfully!');
    console.log(`Group ID: ${groupId}`);
    console.log(`Share Token: ${shareToken}`);
    console.log(`\nAll users can login with email and password: password123`);

  } catch (error) {
    console.error('Error creating dummy group:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

createDummyGroup();

