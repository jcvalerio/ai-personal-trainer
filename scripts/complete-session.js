/**
 * Script to manually complete a workout session for testing stats
 */

const postgres = require('postgres');

async function completeSession() {
  const db = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Finding the most recent active session...');
    
    // Find the most recent session that's not completed
    const sessions = await db`
      SELECT id, status, created_at, scheduled_duration
      FROM workout_sessions 
      WHERE status != 'completed'
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('Found sessions:', sessions);
    
    if (sessions.length === 0) {
      console.log('No active sessions found to complete');
      return;
    }
    
    const sessionToComplete = sessions[0];
    console.log(`Completing session: ${sessionToComplete.id}`);
    
    // Update the session to completed status
    const result = await db`
      UPDATE workout_sessions 
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        completion_percentage = 100,
        actual_duration = ${sessionToComplete.scheduled_duration || 45},
        effort_rating = 8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionToComplete.id}
      RETURNING *
    `;
    
    console.log('Session completed successfully:', {
      id: result[0].id,
      status: result[0].status,
      completed_at: result[0].completed_at,
      actual_duration: result[0].actual_duration
    });
    
    // Verify the stats now work
    console.log('\nChecking updated stats...');
    const stats = await db`
      SELECT COUNT(*) as count 
      FROM workout_sessions
      WHERE status = 'completed'
    `;
    
    console.log('Total completed sessions:', stats[0].count);
    
  } catch (error) {
    console.error('Error completing session:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

completeSession();