import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          owner_id TEXT NOT NULL,
          max_participants INTEGER DEFAULT 50,
          gifts_per_participant INTEGER DEFAULT 1,
          share_token TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users (id)
        )
      `);

      // Migration: Add gifts_per_participant column if it doesn't exist
      db.run(`
        ALTER TABLE groups ADD COLUMN gifts_per_participant INTEGER DEFAULT 1
      `, (err) => {
        // Ignore error if column already exists
      });

      // Participants table
      db.run(`
        CREATE TABLE IF NOT EXISTS participants (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          user_id TEXT,
          email TEXT NOT NULL,
          name TEXT,
          status TEXT DEFAULT 'invited',
          joined_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Assignments table
      db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          giver_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          gift_number INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id),
          FOREIGN KEY (giver_id) REFERENCES participants (id),
          FOREIGN KEY (receiver_id) REFERENCES participants (id),
          UNIQUE(group_id, giver_id, gift_number)
        )
      `);

      // Invitations table
      db.run(`
        CREATE TABLE IF NOT EXISTS invitations (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          email TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id)
        )
      `);

    // Wishlist items table
    db.run(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        link TEXT,
        image_url TEXT,
        secondhand_ok BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES participants (id),
        FOREIGN KEY (group_id) REFERENCES groups (id)
      )
    `);

      // Purchase tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          wishlist_item_id TEXT NOT NULL,
          buyer_participant_id TEXT NOT NULL,
          purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (wishlist_item_id) REFERENCES wishlist_items (id),
          FOREIGN KEY (buyer_participant_id) REFERENCES participants (id)
        )
      `);

      // Recommendations table - private suggestions from Secret Santas
      db.run(`
        CREATE TABLE IF NOT EXISTS recommendations (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          participant_id TEXT NOT NULL,
          recommender_participant_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          link TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id),
          FOREIGN KEY (participant_id) REFERENCES participants (id),
          FOREIGN KEY (recommender_participant_id) REFERENCES participants (id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_groups_share_token ON groups(share_token)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_participants_group ON participants(group_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_wishlist_items_participant ON wishlist_items(participant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_wishlist_items_group ON wishlist_items(group_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_purchases_item ON purchases(wishlist_item_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_participant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_recommendations_participant ON recommendations(participant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_recommendations_recommender ON recommendations(recommender_participant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_recommendations_group ON recommendations(group_id)`);

      console.log('Database tables created successfully');
      resolve();
    });
  });
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};
