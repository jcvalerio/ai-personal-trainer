/**
 * Test script for workout plan API endpoint
 * This script tests the complete flow of creating a workout plan
 */

// Sample test data that matches the frontend form structure
const testFormData = {
  name: "Test Workout Plan",
  description: "A comprehensive test workout plan",
  durationWeeks: 4,
  sessionsPerWeek: 3,
  fitnessGoals: ["strength", "muscle_building"],
  targetFitnessLevel: "beginner",
  estimatedSessionDuration: 60,
  weeklySchedule: {
    "1": [
      {
        day: "monday",
        sessionName: "Upper Body Strength",
        type: "workout",
        duration: 60,
        sessionId: "template-1"
      },
      {
        day: "tuesday",
        type: "rest",
        duration: 0,
        sessionName: "Rest Day"
      },
      {
        day: "wednesday", 
        sessionName: "Lower Body Strength",
        type: "workout",
        duration: 60,
        sessionId: "template-2"
      }
    ]
  },
  sessionTemplates: [
    {
      id: "template-1",
      name: "Upper Body Strength",
      description: "Focus on upper body strength exercises",
      sessionType: "workout",
      estimatedDuration: 60,
      targetMuscleGroups: ["chest", "back", "shoulders"],
      exerciseStructure: [
        {
          id: "ex-1",
          exerciseName: "Push-ups",
          exerciseType: "strength",
          phase: "main",
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
          alternatives: []
        },
        {
          id: "ex-2", 
          exerciseName: "Dumbbell Bench Press",
          exerciseType: "strength",
          phase: "main",
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 120,
          alternatives: []
        }
      ],
      difficulty: "beginner",
      equipmentRequired: []
    },
    {
      id: "template-2",
      name: "Lower Body Strength", 
      description: "Focus on lower body strength exercises",
      sessionType: "workout",
      estimatedDuration: 60,
      targetMuscleGroups: ["quadriceps", "hamstrings", "glutes"],
      exerciseStructure: [
        {
          id: "ex-3",
          exerciseName: "Squats",
          exerciseType: "strength", 
          phase: "main",
          sets: 3,
          repsMin: 10,
          repsMax: 15,
          restSeconds: 90,
          alternatives: []
        }
      ],
      difficulty: "beginner",
      equipmentRequired: []
    }
  ],
  isTemplate: false,
  isPublic: false
};

console.log('Test Data Structure:');
console.log(JSON.stringify(testFormData, null, 2));

console.log('\nThis data structure should be sent to POST /api/workouts/plans');
console.log('The endpoint will transform it using transformFormDataToApi() function');

console.log('\nTo test manually:');
console.log('1. Ensure you are authenticated in the browser');
console.log('2. Open browser dev tools');  
console.log('3. Run this in the console:');
console.log(`
fetch('/api/workouts/plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(testFormData)})
}).then(r => r.json()).then(console.log)
`);