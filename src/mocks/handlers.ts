/**
 * MSW API Handlers
 * Mock implementations for all Phase 3 API endpoints
 */

import { http, HttpResponse } from 'msw';
import { db } from './data';

/**
 * API Handlers for Phase 3 Endpoints
 */
export const handlers = [
  // ==========================================
  // WORKOUT SESSION ANALYTICS
  // ==========================================
  http.get('/api/workouts/sessions/:sessionId/analytics', ({ params, request }) => {
    const { sessionId } = params;
    const url = new URL(request.url);
    
    // Parse query parameters
    const includePerformanceMetrics = url.searchParams.get('includePerformanceMetrics') !== 'false';
    const includeProgressComparison = url.searchParams.get('includeProgressComparison') !== 'false';
    const includeMuscleGroupAnalysis = url.searchParams.get('includeMuscleGroupAnalysis') === 'true';
    const includeCalorieEstimation = url.searchParams.get('includeCalorieEstimation') !== 'false';
    
    const session = db.workoutSession.findFirst({
      where: { id: { equals: sessionId as string } }
    });

    if (!session) {
      return HttpResponse.json({
        success: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      }, { status: 404 });
    }

    const analytics = {
      sessionId: sessionId as string,
      completionStats: {
        exercisesCompleted: 6,
        totalExercises: 8,
        completionPercentage: 75
      },
      ...(includePerformanceMetrics && {
        performanceMetrics: {
          strengthGain: 12,
          enduranceImprovement: 8,
          consistency: 85,
          intensityScore: 75
        }
      }),
      effortAnalysis: {
        averagePerceivedExertion: 7.2,
        averageFormRating: 4.1,
        effortDistribution: {
          'low': 10,
          'medium': 60,
          'high': 30
        }
      },
      timeAnalysis: {
        totalDuration: 2700, // 45 minutes in seconds
        actualRestTime: 900,
        exerciseTime: 1800,
        efficiencyScore: 88
      },
      ...(includeCalorieEstimation && {
        calorieEstimation: {
          estimated: 320,
          method: 'METs calculation',
          factors: ['body_weight', 'exercise_intensity', 'duration']
        }
      }),
      ...(includeProgressComparison && {
        progressComparison: {
          previousSessionId: 'prev-session-id',
          improvements: ['increased_weight_bench_press', 'better_form_rating'],
          regressions: [],
          overallTrend: 'improving' as const
        }
      })
    };

    return HttpResponse.json({
      success: true,
      data: analytics,
      meta: {
        responseTime: 150,
        timestamp: new Date().toISOString(),
        sessionId
      }
    });
  }),

  // ==========================================
  // AI RECOMMENDATIONS
  // ==========================================
  http.post('/api/workouts/sessions/:sessionId/recommendations', async ({ params, request }) => {
    const { sessionId } = params;
    const body = await request.json() as any;
    
    const session = db.workoutSession.findFirst({
      where: { id: { equals: sessionId as string } }
    });

    if (!session) {
      return HttpResponse.json({
        success: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      }, { status: 404 });
    }

    // Generate recommendations based on type
    const generateRecommendations = (type: string, context: any) => {
      switch (type) {
        case 'rest_time':
          return [
            {
              title: 'Optimal Rest Period',
              description: 'Based on your effort level, take 90 seconds rest.',
              priority: 'medium' as const,
              actionable: true,
              action: {
                type: 'set_rest_time',
                seconds: 90
              },
              reason: `Perceived exertion: ${context.perceivedExertion}/10`
            }
          ];
        
        case 'intensity_adjustment':
          return [
            {
              title: 'Increase Weight',
              description: 'You can handle more weight on this exercise.',
              priority: 'medium' as const,
              actionable: true,
              action: {
                type: 'increase_intensity',
                adjustment: 10
              },
              reason: 'Low perceived exertion indicates room for growth'
            }
          ];
        
        case 'form_improvement':
          return [
            {
              title: 'Focus on Form',
              description: 'Slow down the movement and focus on proper form.',
              priority: 'high' as const,
              actionable: true,
              action: {
                type: 'form_review',
                exerciseId: context.currentExerciseId
              },
              reason: `Form rating below optimal (${context.formRating}/5)`
            }
          ];
        
        case 'exercise_substitute':
          return [
            {
              title: 'Alternative Exercise',
              description: 'Try push-ups instead of bench press.',
              priority: 'medium' as const,
              actionable: true,
              action: {
                type: 'substitute_exercise',
                exerciseId: 'alt-exercise-id',
                exerciseName: 'Push-ups'
              },
              reason: 'Equipment not available'
            }
          ];
        
        default:
          return [
            {
              title: 'Keep Going!',
              description: 'You are doing great, maintain this pace.',
              priority: 'low' as const,
              actionable: false,
              reason: 'General encouragement'
            }
          ];
      }
    };

    const recommendations = generateRecommendations(body.type, body.context);

    return HttpResponse.json({
      success: true,
      data: {
        type: body.type,
        sessionId: sessionId as string,
        recommendations,
        context: body.context,
        generatedAt: new Date().toISOString()
      },
      meta: {
        responseTime: 200,
        timestamp: new Date().toISOString(),
        confidence: 85
      }
    });
  }),

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  http.get('/api/dashboard/stats', ({ request }) => {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'month';
    const includeGoalProgress = url.searchParams.get('includeGoalProgress') !== 'false';
    const includeStreakInfo = url.searchParams.get('includeStreakInfo') !== 'false';

    const stats = {
      workoutsThisWeek: 3,
      totalCompletedWorkouts: 45,
      activeWorkoutPlans: 2,
      totalWorkoutHours: 67.5,
      currentStreak: 5,
      ...(includeStreakInfo && {
        longestStreak: 12
      }),
      ...(includeGoalProgress && {
        goalProgress: {
          weeklyGoal: 4,
          monthlyGoal: 16,
          weeklyProgress: 75,
          monthlyProgress: 68
        },
        recentAchievements: [
          {
            id: 'achievement-1',
            name: 'Consistency Champion',
            description: '5 workouts in a row!',
            achievedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            category: 'streak'
          }
        ]
      })
    };

    return HttpResponse.json({
      success: true,
      data: stats,
      meta: {
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  }),

  // ==========================================
  // PROGRESS STATS
  // ==========================================
  http.get('/api/progress/stats', ({ request }) => {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'month';
    const includeGoalTracking = url.searchParams.get('includeGoalTracking') === 'true';
    const includeProjections = url.searchParams.get('includeProjections') === 'true';

    const stats = {
      measurementSummary: {
        weight: {
          current: 75.2,
          previous: 76.8,
          change: -1.6,
          changePercentage: -2.1,
          trend: 'down' as const,
          unit: 'kg'
        },
        body_fat: {
          current: 15.8,
          previous: 17.2,
          change: -1.4,
          changePercentage: -8.1,
          trend: 'down' as const,
          unit: '%'
        }
      },
      ...(includeGoalTracking && {
        goalTracking: {
          activeGoals: 3,
          goalsAchieved: 1,
          goalsInProgress: 2,
          averageProgress: 67
        }
      }),
      trends: {
        weightTrend: 'losing' as const,
        bodyCompositionTrend: 'improving' as const,
        performanceTrend: 'improving' as const
      },
      ...(includeProjections && {
        projections: {
          nextMilestone: {
            type: 'weight_loss',
            value: 73.0,
            estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: 78
          }
        }
      })
    };

    return HttpResponse.json({
      success: true,
      data: stats,
      meta: {
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  }),

  // ==========================================
  // WORKOUT STATS
  // ==========================================
  http.get('/api/workouts/stats', ({ request }) => {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'month';
    const groupBy = url.searchParams.get('groupBy') || 'week';
    const includeExerciseBreakdown = url.searchParams.get('includeExerciseBreakdown') === 'true';
    const includeMuscleGroupAnalysis = url.searchParams.get('includeMuscleGroupAnalysis') === 'true';

    const stats = {
      totalWorkouts: 16,
      totalDuration: 960, // minutes
      averageDuration: 60,
      completionRate: 87.5,
      frequencyData: [
        { period: '2024-W1', count: 3, duration: 180 },
        { period: '2024-W2', count: 4, duration: 240 },
        { period: '2024-W3', count: 4, duration: 240 },
        { period: '2024-W4', count: 5, duration: 300 }
      ],
      ...(includeExerciseBreakdown && {
        exerciseBreakdown: {
          mostPerformed: [
            { exerciseName: 'Push-ups', count: 12, totalVolume: 480 },
            { exerciseName: 'Squats', count: 10, totalVolume: 600 },
            { exerciseName: 'Planks', count: 8, totalVolume: 240 }
          ],
          muscleGroupDistribution: {
            chest: 25.5,
            legs: 30.2,
            back: 20.8,
            arms: 15.3,
            core: 8.2
          },
          equipmentUsage: {
            'bodyweight': 8,
            'dumbbells': 5,
            'barbell': 3
          }
        }
      }),
      performanceMetrics: {
        averageIntensity: 7.2,
        progressionRate: 12.5,
        consistencyScore: 85
      }
    };

    return HttpResponse.json({
      success: true,
      data: stats,
      meta: {
        timeframe,
        groupBy,
        timestamp: new Date().toISOString()
      }
    });
  }),

  // ==========================================
  // RECENT ACTIVITY
  // ==========================================
  http.get('/api/dashboard/recent-activity', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const includeWorkouts = url.searchParams.get('includeWorkouts') !== 'false';
    const includeMeasurements = url.searchParams.get('includeMeasurements') !== 'false';
    const includeAchievements = url.searchParams.get('includeAchievements') !== 'false';

    const activities = [
      ...(includeWorkouts ? [
        {
          id: 'workout-1',
          type: 'workout' as const,
          title: 'Upper Body Strength',
          description: 'Completed 45-minute upper body workout',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { duration: 45, exercises: 8 }
        },
        {
          id: 'workout-2',
          type: 'workout' as const,
          title: 'Cardio Session',
          description: '30-minute HIIT workout',
          date: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          metadata: { duration: 30, caloriesBurned: 280 }
        }
      ] : []),
      ...(includeMeasurements ? [
        {
          id: 'measurement-1',
          type: 'measurement' as const,
          title: 'Weight Measurement',
          description: 'Recorded weight: 75.2 kg',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metadata: { type: 'weight', value: 75.2, unit: 'kg' }
        }
      ] : []),
      ...(includeAchievements ? [
        {
          id: 'achievement-1',
          type: 'achievement' as const,
          title: 'Consistency Champion',
          description: '5 workouts in a row!',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: { streak: 5, category: 'consistency' }
        }
      ] : [])
    ].slice(0, limit);

    return HttpResponse.json({
      success: true,
      data: {
        activities,
        totalCount: activities.length,
        hasMore: activities.length >= limit
      },
      meta: {
        limit,
        timestamp: new Date().toISOString()
      }
    });
  }),

  // ==========================================
  // ERROR HANDLERS (for testing error scenarios)
  // ==========================================
  http.get('/api/test/error/404', () => {
    return HttpResponse.json({
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND'
    }, { status: 404 });
  }),

  http.get('/api/test/error/500', () => {
    return HttpResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }),

  http.get('/api/test/error/network', () => {
    return HttpResponse.error();
  }),

  // ==========================================
  // DELAY HANDLERS (for testing loading states)
  // ==========================================
  http.get('/api/test/delay/:ms', async ({ params }) => {
    const delay = parseInt(params.ms as string) || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return HttpResponse.json({
      success: true,
      data: { message: `Delayed response after ${delay}ms` },
      meta: { delay }
    });
  })
];