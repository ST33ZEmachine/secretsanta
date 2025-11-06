import express from 'express';
import { db } from '../utils/database';
import { generateId } from '../utils/helpers';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateSecretSantaAssignments, getAllAssignmentsForGroup } from '../services/assignmentService';

const router = express.Router();

// Join group via share token
router.post('/join/:shareToken', asyncHandler(async (req: AuthRequest, res) => {
  const { shareToken } = req.params;
  const { userId, name } = req.body;

  // Find group by share token
  const group = await new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM groups WHERE share_token = ?`,
      [shareToken],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  }) as any;

  if (!group) {
    throw createError('Invalid share link', 400);
  }

  // Check if user is already a participant
  const existingParticipant = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM participants WHERE group_id = ? AND user_id = ?',
      [group.id, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existingParticipant) {
    throw createError('You are already a participant in this group', 400);
  }

  // Check participant limit
  const participantCount = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM participants WHERE group_id = ?',
      [group.id],
      (err, row) => {
        if (err) reject(err);
        else resolve((row as any).count);
      }
    );
  });

  if (participantCount >= group.max_participants) {
    throw createError('Group has reached maximum participants', 400);
  }

  // Add participant
  const participantId = generateId();
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO participants (id, group_id, user_id, email, name, status, joined_at)
       VALUES (?, ?, ?, ?, ?, 'joined', CURRENT_TIMESTAMP)`,
      [participantId, group.id, userId, req.user?.email || '', name.trim()],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.json({
    message: 'Successfully joined the group',
    group: {
      id: group.id,
      name: group.name
    }
  });
}));

// Generate Secret Santa assignments
router.post('/generate-assignments/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is the group owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM groups WHERE id = ? AND owner_id = ?', [groupId, req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found or access denied', 404);
  }

  // Check if assignments already exist
    const existingAssignments = await new Promise<number>((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM assignments WHERE group_id = ?',
        [groupId],
        (err, row) => {
          if (err) reject(err);
          else resolve((row as any).count);
        }
      );
    });

  if (existingAssignments > 0) {
    throw createError('Assignments already generated for this group', 400);
  }

  // Generate assignments
  const assignments = await generateSecretSantaAssignments(groupId);

  res.json({
    message: 'Secret Santa assignments generated successfully',
    assignments: assignments.length
  });
}));

// Clear assignments for a group (for testing/reset)
router.delete('/clear-assignments/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is the group owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM groups WHERE id = ? AND owner_id = ?', [groupId, req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found or access denied', 404);
  }

  // Delete all assignments for this group
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM assignments WHERE group_id = ?', [groupId], (err) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });

  res.json({
    message: 'Assignments cleared successfully'
  });
}));

// Get assignments for current user
router.get('/my-assignments/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is a participant
  const participant = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM participants WHERE group_id = ? AND user_id = ? AND status = "joined"',
      [groupId, req.user!.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  }) as any;

  if (!participant) {
    throw createError('You are not a participant in this group', 403);
  }

  // Get assignments
  const assignments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT COALESCE(u.name, p.name) as receiverName, a.gift_number as giftNumber
      FROM assignments a
      JOIN participants p ON a.receiver_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE a.giver_id = ? AND a.group_id = ?
      ORDER BY a.gift_number
    `, [participant.id, groupId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({ assignments });
}));

// Get all assignments for group owner
router.get('/all-assignments/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is the group owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT owner_id FROM groups WHERE id = ?', [groupId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group || group.owner_id !== req.user!.id) {
    throw createError('Access denied', 403);
  }

  const assignments = await getAllAssignmentsForGroup(groupId);

  res.json({ assignments });
}));

export default router;
