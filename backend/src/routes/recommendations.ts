import express from 'express';
import { db } from '../utils/database';
import { generateId } from '../utils/helpers';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateRecommendation = [
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

// Get recommendations for a participant (visible to everyone EXCEPT the owner)
router.get('/participant/:participantId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { participantId } = req.params;
  const userId = req.user!.id;

  // Get the target participant first to know which group we're in
  const targetParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT id, group_id, user_id
      FROM participants
      WHERE id = ?
    `, [participantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!targetParticipant) {
    throw createError('Participant not found', 404);
  }

  // Get the viewer's participant info in the SAME group as the target
  const viewerParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT p.id, p.group_id, p.user_id
      FROM participants p
      WHERE p.user_id = ? AND p.group_id = ? AND p.status = 'joined'
    `, [userId, targetParticipant.group_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!viewerParticipant) {
    throw createError('You are not a participant in this group', 403);
  }

  // Prevent the owner from viewing their own recommendations
  if (targetParticipant.user_id === userId) {
    throw createError('You cannot view recommendations for your own wishlist', 403);
  }

  // Get ALL recommendations for this participant (visible to all Secret Santas)
  // Query by user_id and group_id to handle cases where same user has multiple participant records
  console.log('Fetching recommendations for user:', targetParticipant.user_id, 'in group:', targetParticipant.group_id);
  
  const recommendations = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.link,
        r.image_url,
        r.created_at,
        r.recommender_participant_id,
        p.name as recommender_name
      FROM recommendations r
      JOIN participants p ON r.recommender_participant_id = p.id
      JOIN participants target_p ON r.participant_id = target_p.id
      WHERE target_p.user_id = ? AND r.group_id = ?
      ORDER BY r.created_at DESC
    `, [targetParticipant.user_id, targetParticipant.group_id], (err, rows) => {
      if (err) {
        console.error('Error fetching recommendations:', err);
        reject(err);
      } else {
        console.log(`Found ${rows?.length || 0} recommendations for user ${targetParticipant.user_id} in group ${targetParticipant.group_id}`);
        if (rows && rows.length > 0) {
          console.log('Recommendations:', rows.map((r: any) => ({ id: r.id, title: r.title, recommender: r.recommender_name })));
        } else {
          // Debug: check if recommendations exist for this user in this group
          db.all(`SELECT r.id, r.title, r.participant_id, r.group_id, p.user_id FROM recommendations r JOIN participants p ON r.participant_id = p.id WHERE p.user_id = ? AND r.group_id = ?`, [targetParticipant.user_id, targetParticipant.group_id], (debugErr, debugRows) => {
            if (!debugErr && debugRows) {
              console.log('Direct query found recommendations:', debugRows);
            } else {
              console.log('No recommendations found in direct query');
            }
          });
        }
        resolve(rows || []);
      }
    });
  }) as any[];

  res.json({ recommendations });
}));

// Add a recommendation
router.post('/participant/:participantId', authenticateToken, validateRecommendation, validateRequest, asyncHandler(async (req: AuthRequest, res) => {
  const { participantId } = req.params;
  const { title, description, link, image_url } = req.body;
  const userId = req.user!.id;

  // Get the recommender's participant info
  const recommenderParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT p.id, p.group_id
      FROM participants p
      WHERE p.user_id = ?
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!recommenderParticipant) {
    throw createError('You are not a participant in any group', 403);
  }

  // Verify target participant is in the same group
  const targetParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT id, group_id
      FROM participants
      WHERE id = ?
    `, [participantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!targetParticipant) {
    throw createError('Participant not found', 404);
  }

  if (targetParticipant.group_id !== recommenderParticipant.group_id) {
    throw createError('Participants must be in the same group', 403);
  }

  // Prevent recommending for yourself
  if (targetParticipant.id === recommenderParticipant.id) {
    throw createError('Cannot add recommendations for yourself', 400);
  }

  const recommendationId = generateId();
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO recommendations (id, group_id, participant_id, recommender_participant_id, title, description, link, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recommendationId,
      recommenderParticipant.group_id,
      participantId,
      recommenderParticipant.id,
      title.trim(),
      description?.trim() || null,
      link || null,
      image_url || null
    ], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.status(201).json({
    message: 'Recommendation added successfully',
    recommendation: {
      id: recommendationId,
      title: title.trim(),
      description: description?.trim(),
      link,
      image_url,
      created_at: new Date().toISOString()
    }
  });
}));

// Delete a recommendation (only the creator can delete)
router.delete('/:recommendationId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { recommendationId } = req.params;
  const userId = req.user!.id;

  // Get the viewer's participant info
  const viewerParticipant = await new Promise((resolve, reject) => {
    db.get(`
      SELECT p.id
      FROM participants p
      WHERE p.user_id = ?
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!viewerParticipant) {
    throw createError('You are not a participant in any group', 403);
  }

  // Check if the recommendation exists and was created by this user
  const recommendation = await new Promise((resolve, reject) => {
    db.get(`
      SELECT id, recommender_participant_id
      FROM recommendations
      WHERE id = ?
    `, [recommendationId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }) as any;

  if (!recommendation) {
    throw createError('Recommendation not found', 404);
  }

  // Only the creator can delete their own recommendation
  if (recommendation.recommender_participant_id !== viewerParticipant.id) {
    throw createError('You can only delete your own recommendations', 403);
  }

  await new Promise((resolve, reject) => {
    db.run(`
      DELETE FROM recommendations
      WHERE id = ?
    `, [recommendationId], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Recommendation deleted successfully' });
}));

export default router;

