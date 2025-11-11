import { db } from '../utils/database';
import { generateId } from '../utils/helpers';

export interface Participant {
  id: string;
  email: string;
  name: string;
}

export interface Assignment {
  giverId: string;
  receiverId: string;
  giftNumber: number;
}

export const generateSecretSantaAssignments = async (
  groupId: string
): Promise<Assignment[]> => {
  return new Promise((resolve, reject) => {
    // First get the group to check gifts_per_participant
    db.get(
      'SELECT gifts_per_participant FROM groups WHERE id = ?',
      [groupId],
      (err, group: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!group) {
          reject(new Error('Group not found'));
          return;
        }

        const giftsPerParticipant = group.gifts_per_participant || 1;

        // Get all participants for the group
        db.all(
          'SELECT id, email, name FROM participants WHERE group_id = ? AND status = "joined"',
          [groupId],
          (err, participants: Participant[]) => {
            if (err) {
              reject(err);
              return;
            }

            if (participants.length < 3) {
              reject(new Error('Need at least 3 participants to create assignments'));
              return;
            }

            try {
              const assignments = createAssignments(participants, giftsPerParticipant);
              
              // Save assignments to database
              saveAssignments(groupId, assignments)
                .then(() => resolve(assignments))
                .catch(reject);
            } catch (error) {
              reject(error);
            }
          }
        );
      }
    );
  });
};

const createAssignments = (participants: Participant[], giftsPerParticipant: number): Assignment[] => {
  const assignments: Assignment[] = [];
  
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants');
  }
  
  // Validate that balanced assignment is possible
  // Each person gives N gifts and receives N gifts
  // Total gifts = participants.length * giftsPerParticipant
  // For this to be balanced, we need enough participants
  if (participants.length < giftsPerParticipant + 1) {
    throw new Error(`Cannot create balanced assignments: need at least ${giftsPerParticipant + 1} participants for ${giftsPerParticipant} gifts per person`);
  }
  
  // Track how many times each participant has been assigned as a receiver
  const receiverCounts = new Map<string, number>();
  participants.forEach(p => receiverCounts.set(p.id, 0));
  
  // Track assignments per giver-receiver pair to avoid duplicates
  const giverReceiverPairs = new Map<string, Set<string>>();
  participants.forEach(p => giverReceiverPairs.set(p.id, new Set()));
  
  // Create a shuffled list of participants for round-robin assignment
  const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
  
  // For each participant, assign them the required number of receivers
  participants.forEach((giver) => {
    const giftsToAssign = giftsPerParticipant;
    let assigned = 0;
    
    // Try to assign receivers ensuring balance
    while (assigned < giftsToAssign) {
      let bestReceiver: Participant | null = null;
      let bestScore = -1;
      
      // Find the best receiver for this giver
      for (const receiver of shuffledParticipants) {
        // Skip self
        if (receiver.id === giver.id) continue;
        
        // Skip if already assigned this giver->receiver pair
        if (giverReceiverPairs.get(giver.id)?.has(receiver.id)) continue;
        
        // Calculate score: prefer receivers who need more gifts
        const receiverCount = receiverCounts.get(receiver.id) || 0;
        const score = giftsPerParticipant - receiverCount;
        
        // If this receiver still needs gifts and has a better score, choose them
        if (receiverCount < giftsPerParticipant && score > bestScore) {
          bestReceiver = receiver;
          bestScore = score;
        }
      }
      
      // If we found a good receiver, assign them
      if (bestReceiver) {
        const giftNumber = assigned + 1;
        assignments.push({
          giverId: giver.id,
          receiverId: bestReceiver.id,
          giftNumber: giftNumber
        });
        
        // Update tracking
        receiverCounts.set(bestReceiver.id, (receiverCounts.get(bestReceiver.id) || 0) + 1);
        giverReceiverPairs.get(giver.id)?.add(bestReceiver.id);
        assigned++;
      } else {
        // If no perfect match, find any available receiver (even if they already have enough)
        // This handles edge cases where perfect balance isn't possible
        let fallbackReceiver: Participant | null = null;
        for (const receiver of shuffledParticipants) {
          if (receiver.id === giver.id) continue;
          if (giverReceiverPairs.get(giver.id)?.has(receiver.id)) continue;
          fallbackReceiver = receiver;
          break;
        }
        
        if (fallbackReceiver) {
          const giftNumber = assigned + 1;
          assignments.push({
            giverId: giver.id,
            receiverId: fallbackReceiver.id,
            giftNumber: giftNumber
          });
          giverReceiverPairs.get(giver.id)?.add(fallbackReceiver.id);
          receiverCounts.set(fallbackReceiver.id, (receiverCounts.get(fallbackReceiver.id) || 0) + 1);
          assigned++;
        } else {
          throw new Error(`Unable to find valid receiver for ${giver.name || giver.email}. This may happen if there are too few participants for the requested number of gifts per person.`);
        }
      }
    }
  });
  
  // Validate assignments
  assignments.forEach(assignment => {
    if (assignment.giverId === assignment.receiverId) {
      throw new Error('Invalid assignment detected: someone was assigned to themselves');
    }
  });
  
  // Verify balance (each person should receive close to giftsPerParticipant)
  const receiverCountsArray = Array.from(receiverCounts.values());
  const minReceives = Math.min(...receiverCountsArray);
  const maxReceives = Math.max(...receiverCountsArray);
  
  // Allow some flexibility (within 1 gift difference) due to randomization
  if (maxReceives - minReceives > 1) {
    console.warn(`Assignment balance warning: receivers range from ${minReceives} to ${maxReceives} gifts (target: ${giftsPerParticipant})`);
  }
  
  return assignments;
};

const saveAssignments = async (groupId: string, assignments: Assignment[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Clear existing assignments for this group
      db.run('DELETE FROM assignments WHERE group_id = ?', [groupId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Insert new assignments
        const stmt = db.prepare(`
          INSERT INTO assignments (id, group_id, giver_id, receiver_id, gift_number)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        assignments.forEach(assignment => {
          stmt.run(
            generateId(),
            groupId,
            assignment.giverId,
            assignment.receiverId,
            assignment.giftNumber
          );
        });
        
        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
};

export const getAssignmentsForParticipant = async (
  participantId: string,
  groupId: string
): Promise<Array<{ receiverName: string; giftNumber: number }>> => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT COALESCE(u.name, p.name) as receiverName, a.gift_number as giftNumber
      FROM assignments a
      JOIN participants p ON a.receiver_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE a.giver_id = ? AND a.group_id = ?
      ORDER BY a.gift_number
    `, [participantId, groupId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as Array<{ receiverName: string; giftNumber: number }>);
      }
    });
  });
};

export const getAllAssignmentsForGroup = async (
  groupId: string
): Promise<Array<{
  giverName: string;
  giverEmail: string;
  receiverName: string;
  giftNumber: number;
}>> => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        giver.name as giverName,
        giver.email as giverEmail,
        receiver.name as receiverName,
        a.gift_number as giftNumber
      FROM assignments a
      JOIN participants giver ON a.giver_id = giver.id
      JOIN participants receiver ON a.receiver_id = receiver.id
      WHERE a.group_id = ?
      ORDER BY giver.name, a.gift_number
    `, [groupId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as Array<{
          giverName: string;
          giverEmail: string;
          receiverName: string;
          giftNumber: number;
        }>);
      }
    });
  });
};
