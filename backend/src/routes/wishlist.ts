import express from 'express';
import { db } from '../utils/database';
import { generateId } from '../utils/helpers';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateWishlistItem = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('link')
    .optional()
    .isURL()
    .withMessage('Link must be a valid URL'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('secondhand_ok')
    .optional()
    .isBoolean()
    .withMessage('Secondhand OK must be a boolean value'),
];

const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get wishlist for a participant
router.get('/participant/:participantId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { participantId } = req.params;
  console.log('Fetching wishlist for participant:', participantId);

  // Get participant info and check if user is in the same group
  const participant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT p.*, g.owner_id 
      FROM participants p 
      JOIN groups g ON p.group_id = g.id 
      WHERE p.id = ?
    `, [participantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!participant) {
    console.log('Participant not found:', participantId);
    throw createError('Participant not found', 404);
  }
  
  console.log('Found participant:', participant.name, 'in group:', participant.group_id);

  // Check if user is a participant in the same group
  const userParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT id FROM participants 
      WHERE group_id = ? AND user_id = ? AND status = 'joined'
    `, [participant.group_id, req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!userParticipant) {
    console.log('User participant not found. User:', req.user!.id, 'Group:', participant.group_id);
    throw createError('You are not a participant in this group', 403);
  }
  
  console.log('User participant verified:', userParticipant.id, 'in group:', participant.group_id);

  // Check if user can purchase items (is Secret Santa for this participant)
  const canPurchase = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 1 FROM assignments a
      WHERE a.receiver_id = ? AND a.giver_id = ?
    `, [participantId, userParticipant.id], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });

  // Get wishlist items
  console.log('Querying wishlist items for participant:', participantId, 'by viewer:', userParticipant.id, 'in group:', participant.group_id);
  
  // First, let's check what items exist for this participant
  db.all(`SELECT id, title, participant_id, group_id FROM wishlist_items WHERE participant_id = ?`, [participantId], (debugErr, debugRows) => {
    if (!debugErr && debugRows) {
      console.log(`Direct query found ${debugRows.length} items for participant ${participantId}:`, debugRows);
      // Also check if items exist for this user in this group
      db.all(`SELECT wi.id, wi.title, wi.participant_id, p.id as p_id FROM wishlist_items wi JOIN participants p ON wi.participant_id = p.id WHERE p.user_id = (SELECT user_id FROM participants WHERE id = ?) AND wi.group_id = ?`, [participantId, participant.group_id], (debugErr2, debugRows2) => {
        if (!debugErr2 && debugRows2) {
          console.log(`Found ${debugRows2.length} items for this user in this group:`, debugRows2);
        }
      });
    } else if (debugErr) {
      console.error('Direct query error:', debugErr);
    } else {
      console.log(`No items found in direct query for participant ${participantId}`);
    }
  });
  
  // Get the target participant's user_id to find all their items in this group
  const targetParticipantUser = await new Promise((resolve, reject) => {
    db.get('SELECT user_id FROM participants WHERE id = ?', [participantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  console.log('Target participant user_id:', targetParticipantUser?.user_id, 'in group:', participant.group_id);

  const items = await new Promise((resolve, reject) => {
    // Query items by user_id and group_id to handle cases where same user has multiple participant records
    db.all(`
      SELECT 
        wi.*,
        CASE 
          WHEN EXISTS(SELECT 1 FROM purchases p WHERE p.wishlist_item_id = wi.id) 
          THEN 1 
          ELSE 0 
        END as is_purchased,
        CASE 
          WHEN EXISTS(SELECT 1 FROM purchases p WHERE p.wishlist_item_id = wi.id AND p.buyer_participant_id = ?) 
          THEN 1 
          ELSE 0 
        END as purchased_by_me,
        (SELECT COALESCE(buyer_p.name, buyer_p.email) 
         FROM purchases pur 
         JOIN participants buyer_p ON pur.buyer_participant_id = buyer_p.id 
         WHERE pur.wishlist_item_id = wi.id 
         LIMIT 1) as purchased_by_name
      FROM wishlist_items wi
      JOIN participants p ON wi.participant_id = p.id
      WHERE p.user_id = ? AND wi.group_id = ?
      ORDER BY wi.created_at ASC
    `, [userParticipant.id, targetParticipantUser?.user_id, participant.group_id], (err, rows) => {
      if (err) {
        console.error('Error fetching wishlist items:', err);
        reject(err);
      } else {
        console.log(`Main query fetched ${rows?.length || 0} items for user ${targetParticipantUser?.user_id} in group ${participant.group_id}`);
        if (rows && rows.length > 0) {
          console.log('Items found:', rows.map((r: any) => ({ id: r.id, title: r.title, participant_id: r.participant_id, group_id: r.group_id })));
        }
        resolve(rows || []);
      }
    });
  });

  res.json({ items, canPurchase });
}));

// Get wishlist for current user
router.get('/my-wishlist/:groupId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  // Get current user's participant ID
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

  // Get wishlist items
  const items = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        wi.*,
        0 as is_purchased,
        0 as purchased_by_me
      FROM wishlist_items wi
      WHERE wi.participant_id = ?
      ORDER BY wi.created_at ASC
    `, [participant.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({ items });
}));

// Add wishlist item
router.post('/items', authenticateToken, validateWishlistItem, validateRequest, asyncHandler(async (req: AuthRequest, res) => {
  const { groupId, title, description, link, image_url, secondhand_ok } = req.body;

  // Get current user's participant ID
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

  const itemId = generateId();
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO wishlist_items (id, participant_id, group_id, title, description, link, image_url, secondhand_ok)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [itemId, participant.id, groupId, title.trim(), description?.trim() || null, link || null, image_url || null, secondhand_ok ? 1 : 0], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.status(201).json({
    message: 'Wishlist item added successfully',
    item: {
      id: itemId,
      title: title.trim(),
      description: description?.trim(),
      link,
      image_url,
      secondhand_ok: secondhand_ok || false
    }
  });
}));

// Update wishlist item
router.put('/items/:itemId', authenticateToken, validateWishlistItem, validateRequest, asyncHandler(async (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const { title, description, link, image_url, secondhand_ok } = req.body;

  // Check if user owns this item
  const item = await new Promise((resolve, reject) => {
    db.get(`
      SELECT wi.*, p.user_id 
      FROM wishlist_items wi
      JOIN participants p ON wi.participant_id = p.id
      WHERE wi.id = ?
    `, [itemId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!item) {
    throw createError('Wishlist item not found', 404);
  }

  if (item.user_id !== req.user!.id) {
    throw createError('You can only edit your own wishlist items', 403);
  }

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE wishlist_items 
      SET title = ?, description = ?, link = ?, image_url = ?, secondhand_ok = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title.trim(), description?.trim() || null, link || null, image_url || null, secondhand_ok ? 1 : 0, itemId], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Wishlist item updated successfully' });
}));

// Delete wishlist item
router.delete('/items/:itemId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { itemId } = req.params;

  // Check if user owns this item
  const item = await new Promise((resolve, reject) => {
    db.get(`
      SELECT wi.*, p.user_id 
      FROM wishlist_items wi
      JOIN participants p ON wi.participant_id = p.id
      WHERE wi.id = ?
    `, [itemId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!item) {
    throw createError('Wishlist item not found', 404);
  }

  if (item.user_id !== req.user!.id) {
    throw createError('You can only delete your own wishlist items', 403);
  }

  // Delete purchases first (cascade)
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM purchases WHERE wishlist_item_id = ?', [itemId], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  // Delete the item
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM wishlist_items WHERE id = ?', [itemId], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Wishlist item deleted successfully' });
}));

// Mark item as purchased (for Santas)
router.post('/items/:itemId/purchase', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const { notes } = req.body;

  // Check if user has assignment for this item's owner
  const assignment = await new Promise((resolve, reject) => {
    db.get(`
      SELECT a.*, wi.participant_id as receiver_id
      FROM wishlist_items wi
      JOIN assignments a ON a.receiver_id = wi.participant_id
      JOIN participants buyer ON a.giver_id = buyer.id
      WHERE wi.id = ? AND buyer.user_id = ?
    `, [itemId, req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!assignment) {
    throw createError('You can only mark items as purchased for people you are assigned to give gifts to', 403);
  }

  // Check if already purchased
  const existingPurchase = await new Promise((resolve, reject) => {
    db.get(
      'SELECT 1 FROM purchases WHERE wishlist_item_id = ?',
      [itemId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existingPurchase) {
    throw createError('This item has already been marked as purchased', 400);
  }

  // Get buyer participant ID
  const buyerParticipant = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM participants WHERE user_id = ? AND group_id = ?',
      [req.user!.id, assignment.group_id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  }) as any;

  const purchaseId = generateId();
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO purchases (id, wishlist_item_id, buyer_participant_id, notes)
      VALUES (?, ?, ?, ?)
    `, [purchaseId, itemId, buyerParticipant.id, notes?.trim() || null], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Item marked as purchased successfully' });
}));

// Unmark item as purchased (for Santas)
router.delete('/items/:itemId/purchase', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { itemId } = req.params;

  // Check if user has assignment for this item's owner
  const assignment = await new Promise((resolve, reject) => {
    db.get(`
      SELECT a.*, wi.participant_id as receiver_id
      FROM wishlist_items wi
      JOIN assignments a ON a.receiver_id = wi.participant_id
      JOIN participants buyer ON a.giver_id = buyer.id
      WHERE wi.id = ? AND buyer.user_id = ?
    `, [itemId, req.user!.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!assignment) {
    throw createError('You can only unmark items for people you are assigned to give gifts to', 403);
  }

  // Get buyer participant ID
  const buyerParticipant = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM participants WHERE user_id = ? AND group_id = ?',
      [req.user!.id, assignment.group_id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  }) as any;

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM purchases WHERE wishlist_item_id = ? AND buyer_participant_id = ?',
      [itemId, buyerParticipant.id],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.json({ message: 'Item unmarked as purchased successfully' });
}));

export default router;
