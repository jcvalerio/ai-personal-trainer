# Workout Plan API - Troubleshooting Guide

## Overview

The `/api/workouts/plans` POST endpoint **already exists and is fully functional**. If users are experiencing "network errors", this guide will help identify and resolve the issues.

## Current Implementation Status

✅ **Backend API Endpoint**: `/app/api/workouts/plans/route.ts` - Fully implemented
✅ **Database Schema**: `workout_plans` table exists with proper structure  
✅ **Service Layer**: `WorkoutService.createWorkoutPlan()` method implemented
✅ **Frontend API Client**: `/lib/api/workout-plans.ts` - Fully functional
✅ **Form Handling**: Complete form state management and validation
✅ **Database Connectivity**: Health checks pass

## Common Issues and Solutions

### 1. Authentication Issues

**Symptoms**: 401 Unauthorized errors
**Cause**: User not properly authenticated with Clerk

**Solution**: 
```typescript
// Ensure user is signed in before making API calls
import { useAuth } from '@clerk/nextjs';

const { isSignedIn, userId } = useAuth();

if (!isSignedIn) {
  // Redirect to sign-in page or show login prompt
  return;
}
```

### 2. User Profile Missing

**Symptoms**: 404 User profile not found
**Cause**: User authenticated with Clerk but no profile in database

**Solution**: Check `/app/api/auth/callback/route.ts` to ensure user profiles are created on first sign-in.

### 3. Data Validation Errors

**Symptoms**: 400 Validation Error responses
**Cause**: Frontend sending invalid data structure

**Test Data Structure**:
```typescript
const validFormData = {
  name: "Test Plan",
  description: "Description",
  durationWeeks: 4,
  sessionsPerWeek: 3, 
  fitnessGoals: ["strength"],
  targetFitnessLevel: "beginner",
  estimatedSessionDuration: 60,
  weeklySchedule: {},
  sessionTemplates: [
    {
      id: "template-1",
      name: "Upper Body",
      description: "Upper body workout",
      sessionType: "workout", 
      estimatedDuration: 60,
      targetMuscleGroups: ["chest"],
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
        }
      ],
      difficulty: "beginner",
      equipmentRequired: []
    }
  ],
  isTemplate: false,
  isPublic: false
};
```

### 4. Database Connection Issues

**Symptoms**: 500 Internal Server Error
**Cause**: Database connectivity problems

**Check**: Visit `/api/health` to verify database status
```bash
curl http://localhost:3000/api/health
```

### 5. CORS/Network Configuration

**Symptoms**: Network errors in development
**Cause**: Development server configuration issues

**Solution**: Ensure Next.js dev server is running on correct port:
```bash
npm run dev
# Should start on http://localhost:3000
```

## Testing the API Manually

### Browser Console Test
```javascript
// Run this in browser console (must be signed in)
fetch('/api/workouts/plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test Plan",
    durationWeeks: 4, 
    sessionsPerWeek: 3,
    fitnessGoals: ["strength"],
    targetFitnessLevel: "beginner",
    sessionTemplates: [{
      id: "1",
      name: "Test Session",
      description: "Test",
      sessionType: "workout",
      estimatedDuration: 60,
      targetMuscleGroups: ["chest"],
      exerciseStructure: [{
        id: "ex-1",
        exerciseName: "Push-ups", 
        exerciseType: "strength",
        phase: "main",
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSeconds: 90,
        alternatives: []
      }],
      difficulty: "beginner",
      equipmentRequired: []
    }]
  })
}).then(r => r.json()).then(console.log);
```

### cURL Test (requires auth token)
```bash
curl -X POST http://localhost:3000/api/workouts/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -d @scripts/test-workout-plan-api.json
```

## Data Flow

1. **Frontend Form** (`CustomPlanFormData`) 
2. **API Client** transforms via `transformFormDataToApi()`
3. **API Endpoint** validates with Zod schemas
4. **WorkoutService** processes and sanitizes
5. **Database** inserts into `workout_plans` table

## Validation Schema

The endpoint expects data matching this Zod schema:
```typescript
createWorkoutPlanSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).optional(),
  durationWeeks: z.number().int().min(1).max(104),
  sessionsPerWeek: z.number().int().min(1).max(14),
  fitnessGoals: z.array(z.string()).min(1).max(10),
  targetFitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  // ... other fields
});
```

## Debug Steps

1. **Check Authentication**: Verify user is signed in with Clerk
2. **Check User Profile**: Ensure user profile exists in database
3. **Test API Health**: Visit `/api/health` endpoint
4. **Check Browser Network Tab**: Look for specific error responses
5. **Check Server Logs**: Look for validation errors or database issues
6. **Test Data Structure**: Use provided test data structure

## Quick Fix Summary

The API endpoint is fully functional. Most "network errors" are caused by:
- **Authentication issues** (most common)
- **Invalid data structure**
- **Missing user profile in database**

To resolve, ensure:
1. User is properly authenticated
2. User profile exists in database
3. Data matches the expected schema structure
4. Development server is running correctly

## Files Modified/Created

- ✅ `/app/api/workouts/plans/route.ts` - Already exists
- ✅ `/lib/services/workout-service.ts` - Already exists  
- ✅ `/lib/api/workout-plans.ts` - Already exists
- ✅ Database schema - Already exists
- 📝 `/scripts/test-workout-plan-api.js` - Created for testing
- 📝 `WORKOUT_PLAN_API_TROUBLESHOOTING.md` - This troubleshooting guide