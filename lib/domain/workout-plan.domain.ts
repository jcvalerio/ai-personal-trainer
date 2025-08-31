import type { WorkoutPlan, SessionData } from '@/types/workouts';
import type { FitnessLevel } from '@/types/index';

// Progress metrics interface for domain calculations
export interface ProgressMetrics {
  completedSessions: number;
  totalSessions: number;
  completionPercentage: number;
  currentWeek: number;
  streakDays: number;
  averageSessionDuration: number;
  totalVolumeLifted: number;
  isOnTrack: boolean;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Weekly schedule interface
export interface WeeklySchedule {
  [day: string]: {
    sessionName: string;
    duration: number;
    exercises: any[];
    restDay: boolean;
  };
}

// Session result interface
export interface SessionResult {
  sessionId: string;
  completedAt: Date;
  duration: number;
  exercises: number;
  volume: number;
  effortRating: number;
}

/**
 * WorkoutPlan Domain Model
 * Encapsulates business logic and domain-specific operations for workout plans
 * Follows Domain-Driven Design principles with rich domain behavior
 */
export class WorkoutPlanDomain {
  constructor(private plan: WorkoutPlan) {}

  /**
   * Calculate comprehensive progress metrics
   */
  calculateProgress(completedSessions: SessionResult[] = []): ProgressMetrics {
    const totalSessions = this.plan.durationWeeks * this.plan.sessionsPerWeek;
    const completedSessionsCount = completedSessions.length;
    const completionPercentage = totalSessions > 0 ? Math.round((completedSessionsCount / totalSessions) * 100) : 0;
    
    // Calculate current week based on start date and completed sessions
    const currentWeek = this.calculateCurrentWeek(completedSessions);
    
    // Calculate streak days (consecutive training days)
    const streakDays = this.calculateStreakDays(completedSessions);
    
    // Calculate average session duration
    const totalDuration = completedSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionDuration = completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0;
    
    // Calculate total volume lifted
    const totalVolumeLifted = completedSessions.reduce((sum, session) => sum + session.volume, 0);
    
    // Determine if plan is on track
    const isOnTrack = this.isProgressOnTrack(completedSessions, currentWeek);

    return {
      completedSessions: completedSessionsCount,
      totalSessions,
      completionPercentage,
      currentWeek,
      streakDays,
      averageSessionDuration,
      totalVolumeLifted,
      isOnTrack
    };
  }

  /**
   * Validate workout plan schedule and configuration
   */
  validateSchedule(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate minimum sessions per week
    if (this.plan.sessionsPerWeek < 1) {
      errors.push('Plan must have at least 1 session per week');
    }

    // Validate maximum sessions per week
    if (this.plan.sessionsPerWeek > 7) {
      errors.push('Plan cannot have more than 7 sessions per week');
    }

    // Validate session distribution and rest days
    if (this.plan.sessionsPerWeek > 5) {
      warnings.push('High training frequency (>5 sessions/week) may require careful recovery management');
    }

    // Validate session duration limits
    if (this.plan.estimatedSessionDuration && this.plan.estimatedSessionDuration > 180) {
      warnings.push('Sessions longer than 3 hours may lead to fatigue and reduced performance');
    }

    if (this.plan.estimatedSessionDuration && this.plan.estimatedSessionDuration < 15) {
      warnings.push('Sessions shorter than 15 minutes may not provide adequate stimulus');
    }

    // Validate rest day distribution
    const restDayFrequency = this.getRestDayFrequency();
    if (restDayFrequency < 1 && this.plan.sessionsPerWeek > 3) {
      warnings.push('Consider including at least 1 rest day per week for recovery');
    }

    // Validate fitness level compatibility
    if (!this.isCompatibleWithFitnessLevel(this.plan.targetFitnessLevel)) {
      errors.push(`Plan configuration not suitable for ${this.plan.targetFitnessLevel} fitness level`);
    }

    // Validate plan duration
    if (this.plan.durationWeeks > 52) {
      warnings.push('Plans longer than 1 year may benefit from periodic review and adjustment');
    }

    if (this.plan.durationWeeks < 2) {
      warnings.push('Very short plans may not allow sufficient progression');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if workout plan can be started
   */
  canStart(): boolean {
    // Only active plans can be started
    if (this.plan.status !== 'active') {
      return false;
    }

    // Plan must be properly configured
    const validation = this.validateSchedule();
    if (!validation.isValid) {
      return false;
    }

    // Plan must not be already started (unless resuming)
    if (this.plan.startedAt && this.plan.completedAt) {
      return false; // Already completed
    }

    // Check if plan has required data
    if (!this.plan.planData || !this.plan.weeklySchedule) {
      return false;
    }

    return true;
  }

  /**
   * Get the next scheduled session
   */
  getNextSession(completedSessions: SessionResult[] = []): any | null {
    const currentWeek = this.calculateCurrentWeek(completedSessions);
    const sessionsThisWeek = this.getSessionsForWeek(completedSessions, currentWeek);
    
    // If all sessions for current week are completed, move to next week
    if (sessionsThisWeek >= this.plan.sessionsPerWeek) {
      // Check if plan is complete
      if (currentWeek >= this.plan.durationWeeks) {
        return null; // Plan completed
      }
      
      // Return first session of next week
      return this.getSessionForWeekAndDay(currentWeek + 1, 1);
    }

    // Return next session for current week
    const nextSessionIndex = sessionsThisWeek + 1;
    return this.getSessionForWeekAndDay(currentWeek, nextSessionIndex);
  }

  /**
   * Update session completion status
   */
  updateSessionCompletion(sessionId: string, result: SessionResult): void {
    // This would typically update the plan's internal state or trigger events
    // For now, we'll validate the completion
    if (!sessionId || !result) {
      throw new Error('Invalid session completion data');
    }

    if (result.duration <= 0) {
      throw new Error('Session duration must be positive');
    }

    if (result.effortRating < 1 || result.effortRating > 10) {
      throw new Error('Effort rating must be between 1 and 10');
    }

    // In a real implementation, this might update plan statistics or trigger progression
    console.log(`Session ${sessionId} completed successfully`);
  }

  /**
   * Generate weekly schedule based on plan configuration
   */
  generateWeeklySchedule(): WeeklySchedule {
    const schedule: WeeklySchedule = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Use existing schedule if available
    if (this.plan.weeklySchedule && typeof this.plan.weeklySchedule === 'object') {
      return this.plan.weeklySchedule as WeeklySchedule;
    }

    // Generate schedule based on sessions per week
    const trainingDays = this.getOptimalTrainingDays(this.plan.sessionsPerWeek);
    
    days.forEach((day, index) => {
      const isTrainingDay = trainingDays.includes(index);
      
      if (isTrainingDay) {
        const sessionIndex = trainingDays.indexOf(index) + 1;
        schedule[day] = {
          sessionName: `Training Session ${sessionIndex}`,
          duration: this.plan.estimatedSessionDuration || 60,
          exercises: [], // Would be populated from plan data
          restDay: false
        };
      } else {
        schedule[day] = {
          sessionName: 'Rest Day',
          duration: 0,
          exercises: [],
          restDay: true
        };
      }
    });

    return schedule;
  }

  /**
   * Calculate estimated completion date
   */
  getEstimatedCompletionDate(startDate: Date = new Date()): Date {
    const completionDate = new Date(startDate);
    completionDate.setDate(completionDate.getDate() + (this.plan.durationWeeks * 7));
    return completionDate;
  }

  /**
   * Check if plan needs progression adjustment
   */
  needsProgressionAdjustment(sessionResults: SessionResult[]): boolean {
    if (sessionResults.length < 3) {
      return false; // Need at least 3 sessions to assess progression
    }

    // Check recent performance trends
    const recentSessions = sessionResults.slice(-3);
    const averageEffort = recentSessions.reduce((sum, s) => sum + s.effortRating, 0) / recentSessions.length;
    
    // If effort is consistently low, might need progression
    if (averageEffort < 6) {
      return true;
    }

    // Check volume progression
    const volumeTrend = this.calculateVolumeTrend(recentSessions);
    if (volumeTrend === 'declining') {
      return true;
    }

    return false;
  }

  /**
   * Get recommended progression changes
   */
  getProgressionRecommendations(sessionResults: SessionResult[]): string[] {
    const recommendations: string[] = [];

    if (sessionResults.length < 2) {
      recommendations.push('Complete more sessions to generate progression recommendations');
      return recommendations;
    }

    const recentSessions = sessionResults.slice(-5);
    const averageEffort = recentSessions.reduce((sum, s) => sum + s.effortRating, 0) / recentSessions.length;

    if (averageEffort < 6) {
      recommendations.push('Consider increasing intensity or weight to maintain challenge');
    } else if (averageEffort > 8.5) {
      recommendations.push('Consider reducing intensity or adding more rest between sets');
    }

    // Volume recommendations
    const volumeTrend = this.calculateVolumeTrend(recentSessions);
    if (volumeTrend === 'declining') {
      recommendations.push('Focus on maintaining or increasing training volume');
    } else if (volumeTrend === 'increasing') {
      recommendations.push('Good volume progression - maintain current trajectory');
    }

    // Session duration recommendations
    const avgDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;
    if (avgDuration < (this.plan.estimatedSessionDuration || 60) * 0.8) {
      recommendations.push('Consider extending session duration to meet plan targets');
    }

    return recommendations;
  }

  /**
   * Validate state transition (draft -> active -> completed/paused -> archived)
   */
  canTransitionTo(newStatus: WorkoutPlan['status']): boolean {
    const currentStatus = this.plan.status;
    
    // Valid transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['completed', 'paused', 'archived'],
      completed: ['archived'],
      paused: ['active', 'archived'],
      archived: [] // Cannot transition from archived
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get plan difficulty score (1-10)
   */
  getDifficultyScore(): number {
    let score = 5; // Base score

    // Adjust for sessions per week
    if (this.plan.sessionsPerWeek >= 6) score += 2;
    else if (this.plan.sessionsPerWeek >= 4) score += 1;
    else if (this.plan.sessionsPerWeek <= 2) score -= 1;

    // Adjust for session duration
    const duration = this.plan.estimatedSessionDuration || 60;
    if (duration >= 120) score += 2;
    else if (duration >= 90) score += 1;
    else if (duration <= 30) score -= 1;

    // Adjust for fitness level target
    switch (this.plan.targetFitnessLevel) {
      case 'beginner':
        score -= 2;
        break;
      case 'advanced':
        score += 2;
        break;
      // intermediate stays at base
    }

    // Adjust for plan duration
    if (this.plan.durationWeeks >= 24) score += 1;
    else if (this.plan.durationWeeks <= 4) score -= 1;

    // Ensure score is within bounds
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  /**
   * Check compatibility with user fitness level
   */
  isCompatibleWithFitnessLevel(userLevel: FitnessLevel): boolean {
    const planLevel = this.plan.targetFitnessLevel;
    const difficultyScore = this.getDifficultyScore();

    // Basic compatibility check
    if (planLevel === userLevel) return true;

    // Allow some flexibility
    if (userLevel === 'beginner' && planLevel === 'intermediate' && difficultyScore <= 6) {
      return true;
    }

    if (userLevel === 'intermediate' && planLevel === 'beginner' && difficultyScore >= 4) {
      return true;
    }

    if (userLevel === 'intermediate' && planLevel === 'advanced' && difficultyScore <= 7) {
      return true;
    }

    if (userLevel === 'advanced' && planLevel === 'intermediate' && difficultyScore >= 6) {
      return true;
    }

    return false;
  }

  /**
   * Calculate total estimated hours for completion
   */
  getTotalEstimatedHours(): number {
    const sessionDuration = this.plan.estimatedSessionDuration || 60;
    const totalMinutes = this.plan.durationWeeks * this.plan.sessionsPerWeek * sessionDuration;
    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get required equipment list
   */
  getRequiredEquipment(): string[] {
    const equipment: Set<string> = new Set();

    // Extract from plan data if available
    if (this.plan.planData && typeof this.plan.planData === 'object') {
      // Look for equipment in plan data structure
      const planData = this.plan.planData as any;
      
      // Check phases for equipment
      if (planData.phases && Array.isArray(planData.phases)) {
        planData.phases.forEach((phase: any) => {
          if (phase.equipment && Array.isArray(phase.equipment)) {
            phase.equipment.forEach((item: string) => equipment.add(item));
          }
        });
      }

      // Check exercises for equipment
      if (planData.exercises && Array.isArray(planData.exercises)) {
        planData.exercises.forEach((exercise: any) => {
          if (exercise.equipment) {
            if (Array.isArray(exercise.equipment)) {
              exercise.equipment.forEach((item: string) => equipment.add(item));
            } else if (typeof exercise.equipment === 'string') {
              equipment.add(exercise.equipment);
            }
          }
        });
      }
    }

    // Default equipment based on fitness goals
    if (equipment.size === 0) {
      this.plan.fitnessGoals.forEach(goal => {
        switch (goal.toLowerCase()) {
          case 'strength':
          case 'muscle_building':
            equipment.add('barbell');
            equipment.add('dumbbells');
            equipment.add('bench');
            break;
          case 'cardio':
          case 'endurance':
            equipment.add('treadmill');
            equipment.add('stationary_bike');
            break;
          case 'flexibility':
            equipment.add('yoga_mat');
            equipment.add('resistance_bands');
            break;
          default:
            equipment.add('bodyweight');
        }
      });
    }

    return Array.from(equipment).sort();
  }

  /**
   * Calculate rest day frequency
   */
  getRestDayFrequency(): number {
    return Math.max(0, 7 - this.plan.sessionsPerWeek);
  }

  // Private helper methods

  private calculateCurrentWeek(completedSessions: SessionResult[]): number {
    if (!this.plan.startedAt || completedSessions.length === 0) {
      return 1;
    }

    // Calculate based on most recent session date
    const latestSession = completedSessions.reduce((latest, session) => 
      session.completedAt > latest.completedAt ? session : latest
    );

    const weeksSinceStart = Math.floor(
      (latestSession.completedAt.getTime() - this.plan.startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return Math.min(weeksSinceStart + 1, this.plan.durationWeeks);
  }

  private calculateStreakDays(completedSessions: SessionResult[]): number {
    if (completedSessions.length === 0) return 0;

    // Sort sessions by date
    const sortedSessions = completedSessions.sort((a, b) => 
      b.completedAt.getTime() - a.completedAt.getTime()
    );

    let streak = 1;
    let currentDate = sortedSessions[0].completedAt;

    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = sortedSessions[i].completedAt;
      const daysDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysDiff === 1 || (daysDiff <= 2 && this.isRestDayAllowed())) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private isProgressOnTrack(completedSessions: SessionResult[], currentWeek: number): boolean {
    const expectedSessions = (currentWeek - 1) * this.plan.sessionsPerWeek;
    const actualSessions = completedSessions.length;
    
    // Allow 10% variance
    return actualSessions >= expectedSessions * 0.9;
  }

  private getSessionsForWeek(completedSessions: SessionResult[], week: number): number {
    // This is simplified - in practice would need more sophisticated week calculation
    const sessionsPerWeek = this.plan.sessionsPerWeek;
    const startIndex = (week - 1) * sessionsPerWeek;
    const endIndex = startIndex + sessionsPerWeek;
    
    return Math.min(
      completedSessions.slice(startIndex, endIndex).length,
      sessionsPerWeek
    );
  }

  private getSessionForWeekAndDay(week: number, sessionIndex: number): any {
    return {
      week,
      sessionIndex,
      name: `Week ${week} Session ${sessionIndex}`,
      estimated_duration: this.plan.estimatedSessionDuration || 60
    };
  }

  private getOptimalTrainingDays(sessionsPerWeek: number): number[] {
    // Return optimal day indices (0=Monday, 6=Sunday)
    const patterns: Record<number, number[]> = {
      1: [0], // Monday
      2: [0, 3], // Monday, Thursday
      3: [0, 2, 4], // Monday, Wednesday, Friday
      4: [0, 1, 3, 4], // Monday, Tuesday, Thursday, Friday
      5: [0, 1, 2, 4, 5], // Monday-Wednesday, Friday-Saturday
      6: [0, 1, 2, 3, 4, 5], // Monday-Saturday
      7: [0, 1, 2, 3, 4, 5, 6] // All days
    };

    return patterns[sessionsPerWeek] || patterns[3];
  }

  private calculateVolumeTrend(sessions: SessionResult[]): 'increasing' | 'stable' | 'declining' {
    if (sessions.length < 2) return 'stable';

    const volumes = sessions.map(s => s.volume);
    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < volumes.length; i++) {
      if (volumes[i] > volumes[i - 1]) increasing++;
      else if (volumes[i] < volumes[i - 1]) decreasing++;
    }

    if (increasing > decreasing) return 'increasing';
    if (decreasing > increasing) return 'declining';
    return 'stable';
  }

  private isRestDayAllowed(): boolean {
    // Allow 1 rest day in streak calculation for recovery
    return this.plan.sessionsPerWeek <= 5;
  }
}