#!/usr/bin/env node

/**
 * Workout Session API Test Script
 * 
 * Tests the complete workout session workflow:
 * 1. Create a new workout session for the "Full Body Strength Training" plan
 * 2. Start the session
 * 3. Record set data for all exercises
 * 4. Complete the session
 * 
 * This script verifies all API endpoints work correctly before frontend integration.
 */

const BASE_URL = 'http://localhost:3000';
const WORKOUT_PLAN_ID = '2180ff54-2a72-4788-bf0d-987e003d1e82';

// Test user credentials from .env.local
const TEST_CREDENTIALS = {
  email: 'appttitude@gmail.com',
  password: 'JuanK@1979'
};

// Full Body Strength Training Template Exercises
const FULL_BODY_EXERCISES = [
  {
    name: 'Barbell Squat',
    sets: 4,
    reps: 10,
    weight: 135, // lbs converted to kg: ~61kg
    restSeconds: 120
  },
  {
    name: 'Deadlift', 
    sets: 3,
    reps: 8,
    weight: 185, // lbs converted to kg: ~84kg
    restSeconds: 150
  },
  {
    name: 'Dumbbell Bench Press',
    sets: 3,
    reps: 12,
    weight: 50, // lbs per dumbbell converted to kg: ~23kg
    restSeconds: 90
  },
  {
    name: 'Pull-ups',
    sets: 3,
    reps: 8,
    weight: 0, // bodyweight
    restSeconds: 90
  }
];

// Utility functions
function logStep(step, message) {
  console.log(`\n🔄 ${step}: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ SUCCESS: ${message}`);
}

function logError(message) {
  console.log(`❌ ERROR: ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  INFO: ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'WorkoutSessionTestScript/1.0',
      ...options.headers
    },
    ...options
  };

  try {
    logInfo(`Making ${config.method || 'GET'} request to: ${endpoint}`);
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Request failed'}`);
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: error.status };
  }
}

// Generate test data
function generateSessionData() {
  const now = new Date();
  return {
    name: `Test Session - Full Body Strength Training - ${now.toISOString().split('T')[0]}`,
    workoutPlanId: WORKOUT_PLAN_ID,
    sessionType: 'workout',
    scheduledDate: now.toISOString(),
    scheduledTime: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
    scheduledDuration: 75, // 75 minutes
    sessionData: {
      totalExercises: FULL_BODY_EXERCISES.length,
      estimatedDuration: 75,
      targetMuscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'chest', 'back', 'shoulders'],
      equipmentNeeded: ['barbell', 'dumbbells', 'pull-up-bar'],
      difficultyLevel: 'intermediate'
    },
    mainExercises: FULL_BODY_EXERCISES.map((exercise, index) => ({
      exerciseId: `exercise-${index + 1}-uuid-placeholder`, // Will be replaced with real UUIDs
      orderIndex: index,
      exercisePhase: 'main',
      plannedSets: exercise.sets,
      plannedReps: exercise.reps,
      plannedWeightKg: exercise.weight * 0.453592, // Convert lbs to kg
      plannedRestSeconds: exercise.restSeconds
    }))
  };
}

function generateSetData(exerciseId, setIndex, exerciseTemplate) {
  const baseWeight = exerciseTemplate.weight * 0.453592; // Convert to kg
  const variation = Math.random() * 0.1 - 0.05; // ±5% variation
  const actualWeight = exerciseTemplate.weight > 0 ? baseWeight * (1 + variation) : 0;
  
  return {
    exerciseId,
    setIndex,
    reps: exerciseTemplate.reps + Math.floor(Math.random() * 3 - 1), // ±1-2 reps variation
    weight: actualWeight > 0 ? Math.round(actualWeight * 10) / 10 : undefined, // Round to 1 decimal
    perceivedExertion: Math.floor(Math.random() * 3) + 7, // 7-9 RPE
    formRating: Math.floor(Math.random() * 2) + 4, // 4-5 form rating
    notes: setIndex === 0 ? `First set of ${exerciseTemplate.name}` : undefined,
    completedAt: new Date().toISOString()
  };
}

function generateCompletionData() {
  return {
    effortRating: 8, // Out of 10
    energyLevelAfter: 6, // Out of 10
    userNotes: 'Great workout! Felt strong on all exercises. Pull-ups were challenging.',
    totalVolume: FULL_BODY_EXERCISES.reduce((total, ex) => {
      const weight = ex.weight * 0.453592; // Convert to kg
      return total + (ex.sets * ex.reps * weight);
    }, 0),
    exercisesCompleted: FULL_BODY_EXERCISES.length,
    setsCompleted: FULL_BODY_EXERCISES.reduce((total, ex) => total + ex.sets, 0)
  };
}

async function testSessionWorkflow() {
  console.log('🏋️  Starting Workout Session API Test');
  console.log('==========================================');

  let sessionId = null;
  let exerciseIds = [];

  try {
    // Step 1: Create a new workout session
    logStep(1, 'Creating workout session');
    const sessionData = generateSessionData();
    
    const createResponse = await makeRequest('/api/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    if (!createResponse.success) {
      logError(`Failed to create session: ${createResponse.error}`);
      return false;
    }

    sessionId = createResponse.data.data?.id;
    if (!sessionId) {
      logError('No session ID returned from creation');
      return false;
    }

    logSuccess(`Session created with ID: ${sessionId}`);
    logInfo(`Session name: ${createResponse.data.data.name}`);
    
    // Wait a moment for the session to be fully created
    await sleep(1000);

    // Step 2: Get the created session to verify and get exercise IDs
    logStep(2, 'Retrieving created session details');
    const getResponse = await makeRequest(`/api/workouts/sessions/${sessionId}`);

    if (!getResponse.success) {
      logError(`Failed to retrieve session: ${getResponse.error}`);
      return false;
    }

    const session = getResponse.data.data;
    logSuccess(`Session retrieved: ${session.name}`);
    logInfo(`Status: ${session.status}`);
    logInfo(`Main exercises: ${session.mainExercises?.length || 0}`);

    // Extract exercise IDs from the session
    if (session.mainExercises && session.mainExercises.length > 0) {
      exerciseIds = session.mainExercises.map(ex => ({
        id: ex.exerciseId,
        name: ex.name,
        sets: ex.plannedSets
      }));
      logInfo(`Exercise IDs: ${exerciseIds.map(ex => `${ex.name} (${ex.id})`).join(', ')}`);
    } else {
      logError('No exercises found in session');
      return false;
    }

    // Step 3: Start the session
    logStep(3, 'Starting workout session');
    const startResponse = await makeRequest(`/api/workouts/sessions/${sessionId}/start`, {
      method: 'POST'
    });

    if (!startResponse.success) {
      logError(`Failed to start session: ${startResponse.error}`);
      return false;
    }

    logSuccess('Session started successfully');
    logInfo(`Started at: ${startResponse.data.data?.startedAt || 'unknown'}`);

    // Wait a moment for the session start to be processed
    await sleep(1000);

    // Step 4: Record set data for each exercise
    logStep(4, 'Recording set performance data');
    let totalSetsRecorded = 0;

    for (let exerciseIndex = 0; exerciseIndex < FULL_BODY_EXERCISES.length; exerciseIndex++) {
      const exerciseTemplate = FULL_BODY_EXERCISES[exerciseIndex];
      const exerciseId = exerciseIds[exerciseIndex]?.id;

      if (!exerciseId) {
        logError(`No exercise ID found for ${exerciseTemplate.name}`);
        continue;
      }

      logInfo(`Recording sets for ${exerciseTemplate.name}...`);

      // Record each set for this exercise
      for (let setIndex = 0; setIndex < exerciseTemplate.sets; setIndex++) {
        const setData = generateSetData(exerciseId, setIndex, exerciseTemplate);
        
        const setResponse = await makeRequest(`/api/workouts/sessions/${sessionId}/sets`, {
          method: 'POST',
          body: JSON.stringify(setData)
        });

        if (!setResponse.success) {
          logError(`Failed to record set ${setIndex + 1} for ${exerciseTemplate.name}: ${setResponse.error}`);
          continue;
        }

        totalSetsRecorded++;
        logInfo(`✓ Set ${setIndex + 1}/${exerciseTemplate.sets} recorded for ${exerciseTemplate.name} - ${setData.reps} reps${setData.weight ? ` @ ${setData.weight}kg` : ''}`);
        
        // Small delay between sets to simulate real workout timing
        await sleep(200);
      }

      logSuccess(`All sets recorded for ${exerciseTemplate.name}`);
      
      // Simulate rest time between exercises
      if (exerciseIndex < FULL_BODY_EXERCISES.length - 1) {
        await sleep(500);
      }
    }

    logSuccess(`Total sets recorded: ${totalSetsRecorded}`);

    // Step 5: Complete the session
    logStep(5, 'Completing workout session');
    const completionData = generateCompletionData();
    
    const completeResponse = await makeRequest(`/api/workouts/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData)
    });

    if (!completeResponse.success) {
      logError(`Failed to complete session: ${completeResponse.error}`);
      return false;
    }

    logSuccess('Session completed successfully!');
    logInfo(`Final status: ${completeResponse.data.data?.status || 'completed'}`);
    logInfo(`Effort rating: ${completionData.effortRating}/10`);
    logInfo(`Energy level after: ${completionData.energyLevelAfter}/10`);

    // Step 6: Final verification - Get the completed session
    logStep(6, 'Final verification');
    const finalResponse = await makeRequest(`/api/workouts/sessions/${sessionId}`);

    if (!finalResponse.success) {
      logError(`Failed to retrieve completed session: ${finalResponse.error}`);
      return false;
    }

    const completedSession = finalResponse.data.data;
    logSuccess('Session workflow completed successfully!');
    console.log('\n📊 FINAL SESSION SUMMARY:');
    console.log(`   Session ID: ${completedSession.id}`);
    console.log(`   Name: ${completedSession.name}`);
    console.log(`   Status: ${completedSession.status}`);
    console.log(`   Started: ${completedSession.startedAt || 'N/A'}`);
    console.log(`   Completed: ${completedSession.completedAt || 'N/A'}`);
    console.log(`   Duration: ${completedSession.actualDuration || 'N/A'} minutes`);
    console.log(`   Completion: ${completedSession.completionPercentage || 0}%`);
    console.log(`   Effort Rating: ${completedSession.effortRating || 'N/A'}/10`);
    console.log(`   Energy After: ${completedSession.energyLevelAfter || 'N/A'}/10`);

    return true;

  } catch (error) {
    logError(`Unexpected error during workflow: ${error.message}`);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🔍 Testing API Health Check');
  console.log('============================');

  // Test basic API connectivity with health endpoint
  const healthResponse = await makeRequest('/api/health', {
    method: 'HEAD'
  });

  if (healthResponse.success || healthResponse.status === 200) {
    logSuccess('API is accessible');
    return true;
  } else {
    logError(`API health check failed: ${healthResponse.error}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Workout Session API Test Suite');
  console.log('==================================');
  console.log(`Target Plan ID: ${WORKOUT_PLAN_ID}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_CREDENTIALS.email}`);
  
  const startTime = Date.now();

  try {
    // Health check first
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Health check failed. Make sure the development server is running: pnpm dev');
      process.exit(1);
    }

    // Run the main test
    const testPassed = await testSessionWorkflow();
    
    const duration = Date.now() - startTime;
    
    console.log('\n📋 TEST RESULTS:');
    console.log('================');
    console.log(`Status: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    if (testPassed) {
      console.log('\n🎉 All API endpoints working correctly!');
      console.log('The workout session workflow is ready for frontend integration.');
    } else {
      console.log('\n⚠️  Some API endpoints failed.');
      console.log('Please check the server logs and fix any issues before proceeding.');
    }
    
    process.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error during test execution:');
    console.error(error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  testSessionWorkflow,
  testHealthCheck,
  generateSessionData,
  generateSetData,
  generateCompletionData
};