import express from 'express';
import { db } from '../utils/database';
import { hashPassword, comparePassword, generateToken, generateId, sanitizeEmail } from '../utils/helpers';
import { validateRegistration, validateLogin } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  const sanitizedEmail = sanitizeEmail(email);

  // Check if user already exists
  const existingUser = await new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE email = ?', [sanitizedEmail], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (existingUser) {
    throw createError('User with this email already exists', 400);
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const userId = generateId();

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [userId, sanitizedEmail, hashedPassword, name.trim()],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Generate JWT token
  const token = generateToken(userId, sanitizedEmail);

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: userId,
      email: sanitizedEmail,
      name: name.trim()
    }
  });
}));

// Login user
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = sanitizeEmail(email);

  // Find user
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [sanitizedEmail], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Check password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, email, name FROM users WHERE id = ?', [req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({ user });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { name } = req.body;

  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), req.user!.id],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.json({ message: 'Profile updated successfully' });
}));

export default router;


