/**
 * Simple script to complete a specific workout session
 */
const { neon } = require('@neondatabase/serverless');

async function completeSpecificSession() {
  const db = neon(process.env.DATABASE_URL);
  const sessionId = 'b5c2388e-a801-457e-bfa6-17532386f2d7';
  
  try {
    console.log(`Updating session ${sessionId} to completed...`);
    
    // Update the session to completed status
    const result = await db`
      UPDATE workout_sessions 
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        completion_percentage = 100,
        actual_duration = 5,
        effort_rating = 8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
      RETURNING *
    `;
    
    if (result.length === 0) {
      console.log('No session found with that ID');
      return;
    }
    
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
      FROM workout_sessions ws
      WHERE ws.status = 'completed'
    `;
    
    console.log('Total completed sessions:', stats[0].count);
    
  } catch (error) {
    console.error('Error completing session:', error);
  } finally {
    process.exit(0);
  }
}

completeSpecificSession();