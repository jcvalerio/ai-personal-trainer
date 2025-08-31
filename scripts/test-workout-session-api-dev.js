#!/usr/bin/env node

/**
 * Workout Session API Development Test Script
 * 
 * Tests the workout session workflow using development mode features:
 * 1. Uses mock session UUIDs for development
 * 2. Tests session retrieval, start, set recording, and completion
 * 3. Works without authentication in development mode
 * 
 * This script verifies the API endpoints work before frontend integration.
 */

const BASE_URL = 'http://localhost:3000';

// Development mode test session IDs (from the mock data in the API routes)
const TEST_SESSIONS = [
  {
    id: 'c8495f2b-4199-46c3-a06c-fa84f55be075',
    name: 'Full Body Functional Training',
    originalId: 'c8495f2b-4199-46c3-a06c-fa84f55be075'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Upper Body Power',
    originalId: '1'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 
    name: 'Lower Body Strength',
    originalId: '2'
  }
];

// Use the Full Body training session for our test
const TEST_SESSION = TEST_SESSIONS[0];

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
      'User-Agent': 'WorkoutSessionDevTestScript/1.0',
      ...options.headers
    },
    ...options
  };

  try {
    logInfo(`Making ${config.method || 'GET'} request to: ${endpoint}`);
    const response = await fetch(url, config);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Handle non-JSON responses (like HEAD requests)
      data = { status: response.status, ok: response.ok };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Request failed'}`);
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: error.status };
  }
}

function generateSetData(exerciseId, setIndex) {
  // Generate realistic set data
  const reps = 8 + Math.floor(Math.random() * 5); // 8-12 reps
  const weight = setIndex === 0 ? 20 : 20 + Math.random() * 10; // 20-30kg
  
  return {
    exerciseId,
    setIndex,
    reps,
    weight: Math.round(weight * 10) / 10, // Round to 1 decimal
    perceivedExertion: Math.floor(Math.random() * 3) + 7, // 7-9 RPE
    formRating: Math.floor(Math.random() * 2) + 4, // 4-5 form rating
    notes: setIndex === 0 ? `First set for exercise ${exerciseId}` : undefined,
    completedAt: new Date().toISOString()
  };
}

function generateCompletionData() {
  return {
    effortRating: 8,
    energyLevelAfter: 6,
    userNotes: 'Development test session completed successfully!',
    totalVolume: 1250.5, // Example total volume in kg
    exercisesCompleted: 5,
    setsCompleted: 15
  };
}

async function testSessionWorkflow() {
  console.log('🏋️  Starting Workout Session Development API Test');
  console.log('=================================================');

  const sessionId = TEST_SESSION.id;
  
  try {
    // Step 1: Get session details (using development mock data)
    logStep(1, `Retrieving session details for ${TEST_SESSION.name}`);
    const getResponse = await makeRequest(`/api/workouts/sessions/${sessionId}`);

    if (!getResponse.success) {
      logError(`Failed to retrieve session: ${getResponse.error}`);
      return false;
    }

    const session = getResponse.data.data;
    logSuccess(`Session retrieved: ${session.name}`);
    logInfo(`Status: ${session.status}`);
    logInfo(`Exercises: ${session.mainExercises?.length || 0}`);
    logInfo(`Estimated duration: ${session.estimatedDuration || 'N/A'} minutes`);

    // Extract exercise information
    const exercises = session.mainExercises || [];
    if (exercises.length === 0) {
      logError('No exercises found in session');
      return false;
    }

    logInfo(`Found ${exercises.length} exercises:`);
    exercises.forEach((ex, idx) => {
      logInfo(`  ${idx + 1}. ${ex.name} - ${ex.plannedSets} sets of ${ex.plannedReps} reps`);
    });

    // Step 2: Start the session
    logStep(2, 'Starting workout session');
    const startResponse = await makeRequest(`/api/workouts/sessions/${sessionId}/start`, {
      method: 'POST'
    });

    if (!startResponse.success) {
      logError(`Failed to start session: ${startResponse.error}`);
      return false;
    }

    logSuccess('Session started successfully');
    logInfo(`Started at: ${startResponse.data.data?.startedAt || 'Mock timestamp'}`);
    logInfo(`Status: ${startResponse.data.data?.status || 'in_progress'}`);

    await sleep(1000); // Simulate some time

    // Step 3: Record set data for each exercise
    logStep(3, 'Recording set performance data');
    let totalSetsRecorded = 0;

    for (let exerciseIndex = 0; exerciseIndex < exercises.length && exerciseIndex < 3; exerciseIndex++) {
      const exercise = exercises[exerciseIndex];
      logInfo(`Recording sets for ${exercise.name}...`);

      // Record 2-3 sets per exercise for testing
      const setsToRecord = Math.min(exercise.plannedSets || 3, 3);
      
      for (let setIndex = 0; setIndex < setsToRecord; setIndex++) {
        const setData = generateSetData(exercise.exerciseId, setIndex);
        
        const setResponse = await makeRequest(`/api/workouts/sessions/${sessionId}/sets`, {
          method: 'POST',
          body: JSON.stringify(setData)
        });

        if (!setResponse.success) {
          logError(`Failed to record set ${setIndex + 1} for ${exercise.name}: ${setResponse.error}`);
          // Continue with other sets even if one fails
          continue;
        }

        totalSetsRecorded++;
        logSuccess(`✓ Set ${setIndex + 1} recorded for ${exercise.name} - ${setData.reps} reps @ ${setData.weight}kg`);
        
        await sleep(200); // Small delay between sets
      }

      logSuccess(`Completed recording sets for ${exercise.name}`);
      await sleep(300); // Simulate rest between exercises
    }

    logSuccess(`Total sets recorded: ${totalSetsRecorded}`);

    // Step 4: Complete the session
    logStep(4, 'Completing workout session');
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
    logInfo(`Final data: ${JSON.stringify(completeResponse.data.data || {}, null, 2)}`);

    // Step 5: Final verification
    logStep(5, 'Final verification - retrieving completed session');
    const finalResponse = await makeRequest(`/api/workouts/sessions/${sessionId}`);

    if (!finalResponse.success) {
      logError(`Failed to retrieve final session: ${finalResponse.error}`);
      return false;
    }

    const completedSession = finalResponse.data.data;
    logSuccess('Session workflow completed successfully!');
    
    console.log('\n📊 FINAL SESSION SUMMARY:');
    console.log(`   Session ID: ${completedSession.id}`);
    console.log(`   Name: ${completedSession.name}`);
    console.log(`   Status: ${completedSession.status}`);
    console.log(`   Exercises: ${completedSession.mainExercises?.length || 0}`);
    console.log(`   Mode: Development (using mock data)`);

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

  // Test basic connectivity
  const healthResponse = await makeRequest('/api/health', {
    method: 'HEAD'
  });

  if (healthResponse.success) {
    logSuccess('API server is running and accessible');
    return true;
  } else {
    logError(`API health check failed: ${healthResponse.error}`);
    return false;
  }
}

async function testAllSessionEndpoints() {
  console.log('\n🧪 Testing All Session Endpoints');
  console.log('=================================');

  const sessionId = TEST_SESSION.id;
  let allPassed = true;

  // Test session retrieval
  logInfo('Testing GET /api/workouts/sessions/{id}...');
  const getResult = await makeRequest(`/api/workouts/sessions/${sessionId}`);
  if (getResult.success) {
    logSuccess('✓ Session retrieval works');
  } else {
    logError(`✗ Session retrieval failed: ${getResult.error}`);
    allPassed = false;
  }

  // Test session start
  logInfo('Testing POST /api/workouts/sessions/{id}/start...');
  const startResult = await makeRequest(`/api/workouts/sessions/${sessionId}/start`, {
    method: 'POST'
  });
  if (startResult.success) {
    logSuccess('✓ Session start works');
  } else {
    logError(`✗ Session start failed: ${startResult.error}`);
    allPassed = false;
  }

  // Test set recording (if we have exercises)
  const session = getResult.success ? getResult.data.data : null;
  if (session && session.mainExercises && session.mainExercises.length > 0) {
    const firstExercise = session.mainExercises[0];
    logInfo('Testing POST /api/workouts/sessions/{id}/sets...');
    
    const setData = generateSetData(firstExercise.exerciseId, 0);
    const setResult = await makeRequest(`/api/workouts/sessions/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(setData)
    });
    
    if (setResult.success) {
      logSuccess('✓ Set recording works');
    } else {
      logError(`✗ Set recording failed: ${setResult.error}`);
      allPassed = false;
    }
  }

  // Test session completion
  logInfo('Testing POST /api/workouts/sessions/{id}/complete...');
  const completeResult = await makeRequest(`/api/workouts/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(generateCompletionData())
  });
  if (completeResult.success) {
    logSuccess('✓ Session completion works');
  } else {
    logError(`✗ Session completion failed: ${completeResult.error}`);
    allPassed = false;
  }

  return allPassed;
}

// Main execution
async function main() {
  console.log('🚀 Workout Session API Development Test Suite');
  console.log('==============================================');
  console.log(`Target Session: ${TEST_SESSION.name} (${TEST_SESSION.id})`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Mode: Development (using mock data)`);
  
  const startTime = Date.now();

  try {
    // Health check first
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Health check failed. Make sure the development server is running: pnpm dev');
      process.exit(1);
    }

    // Test all endpoints individually
    const endpointsOk = await testAllSessionEndpoints();
    
    // Run the complete workflow test
    const workflowOk = await testSessionWorkflow();
    
    const duration = Date.now() - startTime;
    
    console.log('\n📋 TEST RESULTS:');
    console.log('================');
    console.log(`Endpoints Test: ${endpointsOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Workflow Test: ${workflowOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall Status: ${(endpointsOk && workflowOk) ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    if (endpointsOk && workflowOk) {
      console.log('\n🎉 All API endpoints working correctly in development mode!');
      console.log('The workout session workflow is ready for frontend integration.');
    } else {
      console.log('\n⚠️  Some API endpoints failed.');
      console.log('Please check the server logs and fix any issues before proceeding.');
    }
    
    process.exit((endpointsOk && workflowOk) ? 0 : 1);
    
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
  testAllSessionEndpoints,
  generateSetData,
  generateCompletionData
};