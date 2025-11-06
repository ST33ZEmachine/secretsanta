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
  
  // For each participant, assign them the required number of receivers
  participants.forEach((giver, giverIndex) => {
    // Create a list of possible receivers (excluding self)
    let availableReceivers = participants.filter(p => p.id !== giver.id);
    
    // For each gift this person needs to give
    for (let giftNum = 1; giftNum <= giftsPerParticipant; giftNum++) {
      // Shuffle available receivers
      availableReceivers = availableReceivers.sort(() => Math.random() - 0.5);
      
      // Find a valid receiver (not self, and preferably not already assigned by this giver)
      let receiver = null;
      let attempts = 0;
      const maxAttempts = availableReceivers.length * 10; // Prevent infinite loop
      
      while (!receiver && attempts < maxAttempts && availableReceivers.length > 0) {
        const candidate = availableReceivers[0];
        
        // Check if this candidate is valid (not self - this should never happen, but double-check)
        if (candidate.id !== giver.id) {
          // Check if we've already assigned this giver -> receiver combination
          const alreadyAssigned = assignments.some(a => 
            a.giverId === giver.id && a.receiverId === candidate.id
          );
          
          if (!alreadyAssigned) {
            receiver = candidate;
          } else {
            // Move this candidate to the end and try the next one
            availableReceivers.push(availableReceivers.shift()!);
          }
        }
        
        attempts++;
        
        // If we've tried all receivers and none work, we need to check if it's possible
        if (attempts % availableReceivers.length === 0 && !receiver) {
          // If there are fewer available receivers than we need, we might have a problem
          // But actually, if we need to give N gifts and there are N+ people (excluding self),
          // it should be possible. The issue might be that we've already assigned this giver
          // to all available people. In that case, we need to allow duplicates or handle differently.
          // For now, let's just take the first available (even if already assigned)
          if (availableReceivers.length > 0) {
            const candidate = availableReceivers[0];
            if (candidate.id !== giver.id) {
              receiver = candidate;
            }
          }
        }
      }
      
      // If we still don't have a receiver, something went wrong
      if (!receiver) {
        throw new Error(`Unable to find valid receiver for ${giver.name || giver.email}. This may happen if there are too few participants for the requested number of gifts per person.`);
      }
      
      // Double-check: ensure no self-assignment (should never happen, but safety check)
      if (receiver.id === giver.id) {
        throw new Error(`Invalid assignment: ${giver.name || giver.email} cannot be assigned to themselves`);
      }
      
      // Create the assignment
      assignments.push({
        giverId: giver.id,
        receiverId: receiver.id,
        giftNumber: giftNum
      });
    }
  });
  
  // Final validation: ensure no self-assignments
  assignments.forEach(assignment => {
    if (assignment.giverId === assignment.receiverId) {
      throw new Error('Invalid assignment detected: someone was assigned to themselves');
    }
  });
  
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
