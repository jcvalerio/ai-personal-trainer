/**
 * Test Video Enhancement API
 * Tests the new video enhancement functionality
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data
const testExercises = [
  {
    name: 'Push-ups',
    description: 'Classic bodyweight chest exercise',
    instructions: 'Start in plank position, lower body to ground, push back up',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name: 'Squats',
    description: 'Fundamental lower body movement',
    instructions: 'Stand with feet shoulder-width apart, lower as if sitting back, return to standing',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
  },
];

const testUserContext = {
  fitnessLevel: 'intermediate',
  language: 'en',
  region: 'US',
  preferences: ['strength', 'muscle_gain'],
};

async function testVideoEnhancement() {
  console.log('🚀 Testing Video Enhancement API...\n');

  try {
    // Test GET endpoint first
    console.log('📋 Testing GET /api/ai/enhance-videos...');
    const getResponse = await fetch(`${API_BASE_URL}/api/ai/enhance-videos`);
    const getResult = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET endpoint working');
      console.log('   Features:', getResult.data?.features?.join(', '));
      console.log('   Supported platforms:', getResult.data?.supportedPlatforms?.join(', '));
      console.log('   Max exercises:', getResult.data?.maxExercises);
    } else {
      console.log('❌ GET endpoint failed:', getResult.error);
    }

    // Test POST endpoint with mock data (won't work without API keys but will test validation)
    console.log('\n🔍 Testing POST /api/ai/enhance-videos (validation)...');
    const postResponse = await fetch(`${API_BASE_URL}/api/ai/enhance-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exercises: testExercises,
        userContext: testUserContext,
      }),
    });

    const postResult = await postResponse.json();
    
    if (postResponse.ok) {
      console.log('✅ POST endpoint working');
      console.log('   Enhanced exercises:', postResult.data?.enhancedCount || 0);
      console.log('   Total exercises processed:', postResult.data?.totalExercises || 0);
      
      if (postResult.data?.exercises?.length > 0) {
        const firstExercise = postResult.data.exercises[0];
        console.log('   Sample enhanced exercise:', firstExercise.name);
        console.log('   Video count:', firstExercise.videoCount || 0);
        
        if (firstExercise.videoUrls?.length > 0) {
          console.log('   Sample video:', {
            platform: firstExercise.videoUrls[0].platform,
            title: firstExercise.videoUrls[0].title,
            score: firstExercise.videoUrls[0].relevanceScore,
          });
        }
      }
    } else {
      if (postResponse.status === 401) {
        console.log('⚠️  POST endpoint requires authentication (expected in production)');
      } else if (postResponse.status === 500 && postResult.error?.includes('AI service not configured')) {
        console.log('⚠️  API keys not configured (expected in development)');
      } else if (postResponse.status === 400) {
        console.log('❌ Request validation failed:', postResult.error);
        if (postResult.details) {
          console.log('   Validation errors:', postResult.details);
        }
      } else {
        console.log('❌ POST endpoint failed:', postResult.error);
      }
    }

    // Test input validation
    console.log('\n🔍 Testing input validation...');
    const invalidResponse = await fetch(`${API_BASE_URL}/api/ai/enhance-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exercises: [], // Empty array should fail
        userContext: testUserContext,
      }),
    });

    const invalidResult = await invalidResponse.json();
    
    if (invalidResponse.status === 400) {
      console.log('✅ Input validation working correctly');
    } else {
      console.log('❌ Input validation not working as expected');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test the workout generation flow
async function testWorkoutGeneration() {
  console.log('\n🏋️  Testing Workout Generation with Video Enhancement...\n');

  try {
    const workoutResponse = await fetch(`${API_BASE_URL}/api/ai/generate-workout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fitnessLevel: 'intermediate',
        goals: ['strength', 'muscle_gain'],
        duration: 45,
        daysPerWeek: 3,
        equipment: ['dumbbells', 'bodyweight'],
        limitations: [],
        preferences: [],
      }),
    });

    const workoutResult = await workoutResponse.json();
    
    if (workoutResponse.ok) {
      console.log('✅ Workout generation working');
      console.log('   Workout name:', workoutResult.data?.name);
      console.log('   Exercises:');
      
      const allExercises = [
        ...(workoutResult.data?.warmUpExercises || []),
        ...(workoutResult.data?.mainExercises || []),
        ...(workoutResult.data?.coolDownExercises || []),
      ];
      
      allExercises.slice(0, 3).forEach((exercise, index) => {
        console.log(`     ${index + 1}. ${exercise.name} - ${exercise.videoUrls?.length || 0} videos`);
      });
      
      // Check if videos are empty (expected now)
      const hasVideos = allExercises.some(ex => ex.videoUrls?.length > 0);
      if (!hasVideos) {
        console.log('✅ Video URLs properly removed from workout generation');
        console.log('   (Videos will be enhanced separately via /api/ai/enhance-videos)');
      }
      
    } else {
      if (workoutResponse.status === 401) {
        console.log('⚠️  Workout generation requires authentication');
      } else {
        console.log('❌ Workout generation failed:', workoutResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Workout generation test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Video Enhancement Implementation Test Suite\n');
  console.log('='.repeat(50));
  
  await testVideoEnhancement();
  await testWorkoutGeneration();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test suite completed!');
  console.log('\nNext steps:');
  console.log('1. Add YOUTUBE_DATA_API_KEY to .env.local for full functionality');
  console.log('2. Test with authentication in browser');
  console.log('3. Verify video enhancement in workout generation flow');
  console.log('4. Run database migration: scripts/add-video-caching-schema.sql');
}

// Run the tests
runAllTests().catch(console.error);