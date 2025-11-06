import express from 'express';
import { db } from '../utils/database';
import { generateId } from '../utils/helpers';
import { validateGroupCreation } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create a new Secret Santa group
router.post('/', authenticateToken, validateGroupCreation, asyncHandler(async (req: AuthRequest, res) => {
  const { name, description, maxParticipants, giftsPerParticipant } = req.body;
  const groupId = generateId();
  const shareToken = generateId(); // Generate a unique share token

  // Validate giftsPerParticipant (must be 1, 2, or 3)
  // Convert to number since form values come as strings
  const giftsPerParticipantNum = typeof giftsPerParticipant === 'string' 
    ? parseInt(giftsPerParticipant, 10) 
    : Number(giftsPerParticipant);
  const validGiftsPerParticipant = [1, 2, 3].includes(giftsPerParticipantNum) ? giftsPerParticipantNum : 1;

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO groups (id, name, description, owner_id, max_participants, gifts_per_participant, share_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [groupId, name.trim(), description?.trim() || null, req.user!.id, maxParticipants || 50, validGiftsPerParticipant, shareToken],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get user's name from database
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT name FROM users WHERE id = ?', [req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  // Add the owner as the first participant
  const participantId = generateId();
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO participants (id, group_id, user_id, email, name, status, joined_at)
       VALUES (?, ?, ?, ?, ?, 'joined', CURRENT_TIMESTAMP)`,
      [participantId, groupId, req.user!.id, req.user!.email, user?.name || 'Group Owner'],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.status(201).json({
    message: 'Group created successfully',
    group: {
      id: groupId,
      name: name.trim(),
      description: description?.trim(),
      maxParticipants: maxParticipants || 50,
      giftsPerParticipant: validGiftsPerParticipant,
      shareToken,
      status: 'active'
    }
  });
}));

// Get all groups for the current user (owned or participant)
router.get('/my-groups', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const groups = await new Promise((resolve, reject) => {
    db.all(`
      SELECT DISTINCT g.*, 
             COUNT(DISTINCT p.id) as participant_count,
             COUNT(DISTINCT CASE WHEN p.status = 'joined' THEN p.id END) as joined_count,
             CASE WHEN g.owner_id = ? THEN 1 ELSE 0 END as is_owner
      FROM groups g
      LEFT JOIN participants p ON g.id = p.group_id
      WHERE g.owner_id = ? 
         OR EXISTS (
           SELECT 1 FROM participants p2 
           WHERE p2.group_id = g.id 
           AND p2.user_id = ? 
           AND p2.status = 'joined'
         )
      GROUP BY g.id
      ORDER BY is_owner DESC, g.created_at DESC
    `, [req.user!.id, req.user!.id, req.user!.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({ groups });
}));

// Get a specific group by ID
router.get('/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  const group = await new Promise((resolve, reject) => {
    db.get(`
      SELECT g.id, g.name, g.description, g.owner_id, g.max_participants, 
             g.gifts_per_participant, g.share_token, g.status, g.created_at, g.updated_at,
             COUNT(p.id) as participant_count,
             COUNT(CASE WHEN p.status = 'joined' THEN 1 END) as joined_count
      FROM groups g
      LEFT JOIN participants p ON g.id = p.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `, [groupId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found', 404);
  }

  // Check if user is owner or participant
  const isOwner = group.owner_id === req.user!.id;
  
  let isParticipant = false;
  if (!isOwner) {
    const participant = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM participants WHERE group_id = ? AND user_id = ?',
        [groupId, req.user!.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    isParticipant = !!participant;
  }

  if (!isOwner && !isParticipant) {
    throw createError('Access denied', 403);
  }

  // Get participants
  const participants = await new Promise<any[]>((resolve, reject) => {
    db.all(`
      SELECT p.*, 
             COALESCE(u.name, p.name) as name,
             u.name as user_name
      FROM participants p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.group_id = ?
      ORDER BY p.created_at
    `, [groupId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows as any[]);
    });
  });

  // Update any participants with "Group Owner" to use their actual user name
  participants.forEach((participant: any) => {
    if (participant.name === 'Group Owner' && participant.user_name) {
      db.run(
        'UPDATE participants SET name = ? WHERE id = ?',
        [participant.user_name, participant.id],
        () => {} // Fire and forget
      );
      participant.name = participant.user_name;
    }
  });

  // Ensure gifts_per_participant is a number (SQLite may return it as string)
  const giftsPerParticipant = group.gifts_per_participant != null 
    ? Number(group.gifts_per_participant) 
    : 1;

  res.json({
    group: {
      ...group,
      gifts_per_participant: giftsPerParticipant,
      isOwner,
      isParticipant
    },
    participants
  });
}));

// Update group settings
router.put('/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;
  const { name, description, maxParticipants, giftsPerParticipant } = req.body;

  // Check if user is the owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT owner_id FROM groups WHERE id = ?', [groupId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found', 404);
  }

  if (group.owner_id !== req.user!.id) {
    throw createError('Only the group owner can update settings', 403);
  }

  // Validate giftsPerParticipant if provided
  let validGiftsPerParticipant = undefined;
  if (giftsPerParticipant !== undefined) {
    // Convert to number since form values come as strings
    const giftsPerParticipantNum = typeof giftsPerParticipant === 'string' 
      ? parseInt(giftsPerParticipant, 10) 
      : Number(giftsPerParticipant);
    if (![1, 2, 3].includes(giftsPerParticipantNum)) {
      throw createError('giftsPerParticipant must be 1, 2, or 3', 400);
    }
    validGiftsPerParticipant = giftsPerParticipantNum;
  }

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  
  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name.trim());
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description?.trim() || null);
  }
  if (maxParticipants !== undefined) {
    updateFields.push('max_participants = ?');
    updateValues.push(maxParticipants || 50);
  }
  if (validGiftsPerParticipant !== undefined) {
    updateFields.push('gifts_per_participant = ?');
    updateValues.push(validGiftsPerParticipant);
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(groupId);

  // Update group
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE groups 
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
      updateValues,
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.json({ message: 'Group updated successfully' });
}));

// Delete group
router.delete('/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is the owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT owner_id FROM groups WHERE id = ?', [groupId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found', 404);
  }

  if (group.owner_id !== req.user!.id) {
    throw createError('Only the group owner can delete the group', 403);
  }

  // Delete group (cascade will handle related records)
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM groups WHERE id = ?', [groupId], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Group deleted successfully' });
}));

// Get shareable link for a group
router.get('/:groupId/share-link', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Check if user is the owner
  const group = await new Promise((resolve, reject) => {
    db.get('SELECT owner_id, share_token FROM groups WHERE id = ?', [groupId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!group) {
    throw createError('Group not found', 404);
  }

  if (group.owner_id !== req.user!.id) {
    throw createError('Only the group owner can get the share link', 403);
  }

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${group.share_token}`;

  res.json({ 
    shareUrl,
    shareToken: group.share_token 
  });
}));

export default router;
