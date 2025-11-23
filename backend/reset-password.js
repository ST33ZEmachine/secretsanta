#!/usr/bin/env node

/**
 * Admin script to reset a user's password
 * Usage: node reset-password.js <email> <new-password>
 * 
 * IMPORTANT: This script should only be used in emergency situations.
 * For production, consider implementing a proper password reset flow.
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Get database path from environment or use default
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'database.sqlite');

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node reset-password.js <email> <new-password>');
  console.error('Example: node reset-password.js user@example.com newpassword123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Error: Password must be at least 6 characters long');
  process.exit(1);
}

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Sanitize email (lowercase)
const sanitizedEmail = email.toLowerCase().trim();

// Find user
db.get('SELECT id, email, name FROM users WHERE email = ?', [sanitizedEmail], async (err, user) => {
  if (err) {
    console.error('Error finding user:', err.message);
    db.close();
    process.exit(1);
  }

  if (!user) {
    console.error(`Error: User with email "${email}" not found`);
    db.close();
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email})`);
  console.log('Resetting password...');

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  db.run(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hashedPassword, user.id],
    function(updateErr) {
      if (updateErr) {
        console.error('Error updating password:', updateErr.message);
        db.close();
        process.exit(1);
      }

      console.log('✅ Password reset successfully!');
      console.log(`User: ${user.name} (${user.email})`);
      console.log('New password has been set. The user can now log in with the new password.');
      db.close();
    }
  );
});

