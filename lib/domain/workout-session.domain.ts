import type { WorkoutSession, SessionData, SessionProgressData, SetPerformanceData } from '@/types/workouts';

// Session validation result interface
export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// State transition result interface
export interface StateTransitionResult {
  success: boolean;
  newStatus: 'scheduled' | 'in_progress' | 'completed';
  timestamp: Date;
  errors: string[];
}

// Exercise progress update interface
export interface ExerciseProgressUpdate {
  exerciseId: string;
  sets: SetPerformanceData[];
  completedAt?: Date;
  notes?: string;
}

// Session analytics interface
export interface SessionAnalytics {
  totalVolume: number;
  averageIntensity: number;
  muscleGroupsTargeted: string[];
  timeUnderTension: number;
  restTime: number;
  effortDistribution: Record<number, number>;
}

// Session result interface for completion
export interface SessionResult {
  sessionId: string;
  status: 'completed';
  completedAt: Date;
  actualDuration: number;
  totalVolume: number;
  exercisesCompleted: number;
  completionPercentage: number;
  effortRating?: number;
  summary: string;
}

/**
 * WorkoutSession Domain Model
 * Encapsulates business logic and domain-specific operations for workout sessions
 * Handles session lifecycle, state transitions, and exercise tracking
 */
export class WorkoutSessionDomain {
  constructor(private session: WorkoutSession) {}

  /**
   * Start the workout session
   */
  start(): void {
    if (!this.canStart()) {
      throw new Error(`Cannot start session in ${this.session.status} status`);
    }

    if (this.session.status !== 'scheduled') {
      throw new Error('Can only start scheduled sessions');
    }

    // Update session state
    (this.session as any).status = 'in_progress';
    (this.session as any).startedAt = new Date();
    (this.session as any).completionPercentage = 0;
    (this.session as any).updatedAt = new Date();

    // Initialize progress tracking
    if (this.session.sessionData.progress) {
      this.session.sessionData.progress.currentExerciseIndex = 0;
      this.session.sessionData.progress.currentSet = 1;
      this.session.sessionData.progress.elapsedTime = 0;
      this.session.sessionData.progress.exercisesCompleted = 0;
      this.session.sessionData.progress.setsCompleted = 0;
      this.session.sessionData.progress.totalVolume = 0;
      this.session.sessionData.progress.lastUpdated = new Date().toISOString();
    }
  }

  /**
   * Pause the workout session
   */
  pause(): void {
    if (!this.canPause()) {
      throw new Error(`Cannot pause session in ${this.session.status} status`);
    }

    // Note: 'paused' status would need to be added to SessionStatus type
    // For now, we maintain in_progress status but update progress timestamp
    if (this.session.sessionData.progress) {
      this.session.sessionData.progress.lastUpdated = new Date().toISOString();
    }

    (this.session as any).updatedAt = new Date();
  }

  /**
   * Resume a paused workout session
   */
  resume(): void {
    if (this.session.status !== 'in_progress') {
      throw new Error('Can only resume in-progress sessions');
    }

    // Update progress timestamp
    if (this.session.sessionData.progress) {
      this.session.sessionData.progress.lastUpdated = new Date().toISOString();
    }

    (this.session as any).updatedAt = new Date();
  }

  /**
   * Complete the workout session
   */
  complete(): SessionResult {
    if (!this.canComplete()) {
      throw new Error(`Cannot complete session in ${this.session.status} status`);
    }

    const completedAt = new Date();
    const actualDuration = this.calculateActualDuration(completedAt);
    const totalVolume = this.calculateTotalVolume();
    const exercisesCompleted = this.getExercisesCompleted();
    const completionPercentage = this.calculateCompletionPercentage();

    // Update session state
    (this.session as any).status = 'completed';
    (this.session as any).completedAt = completedAt;
    (this.session as any).actualDuration = actualDuration;
    (this.session as any).completionPercentage = completionPercentage;
    (this.session as any).updatedAt = completedAt;

    // Update progress data
    if (this.session.sessionData.progress) {
      this.session.sessionData.progress.exercisesCompleted = exercisesCompleted;
      this.session.sessionData.progress.totalVolume = totalVolume;
      this.session.sessionData.progress.lastUpdated = completedAt.toISOString();
    }

    return {
      sessionId: this.session.id,
      status: 'completed',
      completedAt,
      actualDuration,
      totalVolume,
      exercisesCompleted,
      completionPercentage,
      effortRating: this.session.effortRating,
      summary: this.generateSessionSummary()
    };
  }

  /**
   * Add exercise progress data
   */
  addExerciseProgress(exerciseId: string, sets: SetPerformanceData[]): void {
    if (!exerciseId || !sets || sets.length === 0) {
      throw new Error('Valid exercise ID and sets data required');
    }

    if (!this.validateExerciseData(exerciseId, sets)) {
      throw new Error('Invalid exercise data provided');
    }

    // Update session progress
    const progress = this.session.sessionData.progress;
    if (progress) {
      // Update volume calculation
      const setVolume = sets.reduce((total, set) => {
        return total + (set.reps * (set.weight || 0));
      }, 0);
      
      progress.totalVolume = (progress.totalVolume || 0) + setVolume;
      progress.setsCompleted = (progress.setsCompleted || 0) + sets.length;
      progress.lastUpdated = new Date().toISOString();

      // Check if exercise is completed
      const totalSetsForExercise = this.getTotalSetsForExercise(exerciseId);
      if (sets.length >= totalSetsForExercise) {
        progress.exercisesCompleted = (progress.exercisesCompleted || 0) + 1;
      }
    }

    // Update completion percentage
    (this.session as any).completionPercentage = this.calculateCompletionPercentage();
    (this.session as any).updatedAt = new Date();
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(): number {
    const totalExercises = this.session.sessionData.totalExercises || 1;
    const progress = this.session.sessionData.progress;
    
    if (!progress) return 0;

    const exercisesCompleted = progress.exercisesCompleted || 0;
    return Math.min(Math.round((exercisesCompleted / totalExercises) * 100), 100);
  }

  /**
   * Validate state transition
   */
  validateStateTransition(newStatus: 'scheduled' | 'in_progress' | 'completed'): boolean {
    const currentStatus = this.session.status;
    
    // Define valid state transitions
    const validTransitions: Record<string, string[]> = {
      scheduled: ['in_progress'],
      in_progress: ['completed'],
      completed: [] // Cannot transition from completed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Perform state transition with validation
   */
  transitionTo(newStatus: 'scheduled' | 'in_progress' | 'completed'): StateTransitionResult {
    const errors: string[] = [];
    const timestamp = new Date();

    if (!this.validateStateTransition(newStatus)) {
      errors.push(`Invalid transition from ${this.session.status} to ${newStatus}`);
      return {
        success: false,
        newStatus: this.session.status,
        timestamp,
        errors
      };
    }

    try {
      switch (newStatus) {
        case 'in_progress':
          this.start();
          break;
        case 'completed':
          this.complete();
          break;
        default:
          errors.push(`Unsupported status transition to ${newStatus}`);
      }

      return {
        success: errors.length === 0,
        newStatus: errors.length === 0 ? newStatus : this.session.status,
        timestamp,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        newStatus: this.session.status,
        timestamp,
        errors
      };
    }
  }

  /**
   * Validate session configuration
   */
  validateSession(): SessionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!this.session.name || this.session.name.trim() === '') {
      errors.push('Session name is required');
    }

    if (!this.session.userId || this.session.userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (!this.session.sessionData) {
      errors.push('Session data is required');
    } else {
      // Validate session data
      if (this.session.sessionData.totalExercises <= 0) {
        errors.push('Total exercises must be greater than 0');
      }

      if (this.session.sessionData.estimatedDuration <= 0) {
        warnings.push('Estimated duration should be greater than 0');
      }

      if (!this.session.sessionData.targetMuscleGroups || 
          this.session.sessionData.targetMuscleGroups.length === 0) {
        warnings.push('Target muscle groups should be specified');
      }
    }

    // Validate exercise arrays
    const totalExercises = (this.session.warmUpExercises?.length || 0) +
                          (this.session.mainExercises?.length || 0) +
                          (this.session.coolDownExercises?.length || 0);

    if (totalExercises === 0) {
      errors.push('Session must contain at least one exercise');
    }

    // Validate time constraints
    if (this.session.scheduledDuration && this.session.scheduledDuration > 300) {
      warnings.push('Session duration over 5 hours may be excessive');
    }

    if (this.session.scheduledDuration && this.session.scheduledDuration < 10) {
      warnings.push('Very short sessions may not be effective');
    }

    // Validate completion percentage bounds
    if (this.session.completionPercentage < 0 || this.session.completionPercentage > 100) {
      errors.push('Completion percentage must be between 0 and 100');
    }

    // Validate effort rating if provided
    if (this.session.effortRating && 
        (this.session.effortRating < 1 || this.session.effortRating > 10)) {
      errors.push('Effort rating must be between 1 and 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate session analytics
   */
  calculateAnalytics(): SessionAnalytics {
    const progress = this.session.sessionData.progress;
    const totalVolume = progress?.totalVolume || 0;
    
    // Calculate average intensity based on effort ratings
    let averageIntensity = 0;
    if (this.session.effortRating) {
      averageIntensity = this.session.effortRating;
    }

    // Get muscle groups from session data
    const muscleGroupsTargeted = this.session.sessionData.targetMuscleGroups || [];

    // Estimate time under tension (simplified calculation)
    const timeUnderTension = this.estimateTimeUnderTension();

    // Calculate total rest time
    const restTime = this.calculateTotalRestTime();

    // Create effort distribution
    const effortDistribution: Record<number, number> = {};
    if (this.session.effortRating) {
      effortDistribution[this.session.effortRating] = 1;
    }

    return {
      totalVolume,
      averageIntensity,
      muscleGroupsTargeted,
      timeUnderTension,
      restTime,
      effortDistribution
    };
  }

  /**
   * Check if session can be started
   */
  canStart(): boolean {
    if (this.session.status !== 'scheduled') return false;

    const validation = this.validateSession();
    if (!validation.isValid) return false;

    // Check if scheduled time has passed (if specified)
    if (this.session.scheduledTime) {
      const now = new Date();
      const scheduledDate = new Date(this.session.scheduledDate);
      
      // Parse scheduled time (HH:MM format)
      const [hours, minutes] = this.session.scheduledTime.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Allow starting 15 minutes before scheduled time
      const allowedStartTime = new Date(scheduledDate.getTime() - 15 * 60 * 1000);
      
      if (now < allowedStartTime) return false;
    }

    return true;
  }

  /**
   * Check if session can be paused
   */
  canPause(): boolean {
    return this.session.status === 'in_progress';
  }

  /**
   * Check if session can be completed
   */
  canComplete(): boolean {
    if (this.session.status !== 'in_progress') return false;

    // Require at least some progress to complete
    const progress = this.session.sessionData.progress;
    if (!progress || (progress.exercisesCompleted || 0) === 0) {
      return false;
    }

    return true;
  }

  /**
   * Get current exercise being performed
   */
  getCurrentExercise(): any | null {
    const progress = this.session.sessionData.progress;
    if (!progress) return null;

    const currentIndex = progress.currentExerciseIndex || 0;
    const allExercises = this.getAllExercises();

    return allExercises[currentIndex] || null;
  }

  /**
   * Move to next exercise
   */
  moveToNextExercise(): boolean {
    const progress = this.session.sessionData.progress;
    if (!progress) return false;

    const currentIndex = progress.currentExerciseIndex || 0;
    const allExercises = this.getAllExercises();

    if (currentIndex >= allExercises.length - 1) {
      return false; // No more exercises
    }

    progress.currentExerciseIndex = currentIndex + 1;
    progress.currentSet = 1;
    progress.lastUpdated = new Date().toISOString();

    return true;
  }

  /**
   * Calculate time remaining
   */
  getTimeRemaining(): number {
    if (!this.session.startedAt || this.session.status !== 'in_progress') {
      return this.session.scheduledDuration || 0;
    }

    const elapsed = Math.floor((new Date().getTime() - this.session.startedAt.getTime()) / 1000 / 60);
    const estimated = this.session.scheduledDuration || this.session.sessionData.estimatedDuration || 60;
    
    return Math.max(0, estimated - elapsed);
  }

  /**
   * Get progress summary
   */
  getProgressSummary(): SessionProgressData {
    return this.session.sessionData.progress || {
      currentExerciseIndex: 0,
      currentSet: 1,
      elapsedTime: 0,
      exercisesCompleted: 0,
      setsCompleted: 0,
      totalVolume: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Validate exercise data
   */
  validateExerciseData(exerciseId: string, sets: SetPerformanceData[]): boolean {
    if (!exerciseId || sets.length === 0) return false;

    return sets.every(set => {
      // Validate set number
      if (set.setNumber <= 0) return false;

      // Validate reps
      if (set.reps <= 0) return false;

      // Validate weight (if provided)
      if (set.weight !== undefined && set.weight < 0) return false;

      // Validate perceived exertion (if provided)
      if (set.perceivedExertion !== undefined && 
          (set.perceivedExertion < 1 || set.perceivedExertion > 10)) {
        return false;
      }

      // Validate form rating (if provided)
      if (set.formRating !== undefined && 
          (set.formRating < 1 || set.formRating > 10)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate rest time between sets
   */
  calculateRestTime(exerciseId: string, setNumber: number): number {
    // Default rest times based on exercise type and set number
    const defaultRestTime = 90; // seconds

    // Find exercise in session data
    const exercise = this.findExerciseById(exerciseId);
    
    if (exercise && exercise.restTime) {
      return exercise.restTime;
    }

    // Progressive rest times - longer rest for later sets
    return defaultRestTime + (setNumber - 1) * 15;
  }

  /**
   * Update session notes
   */
  updateNotes(notes: string, type: 'user' | 'trainer' | 'ai'): void {
    if (!notes || notes.trim() === '') {
      throw new Error('Notes cannot be empty');
    }

    const timestamp = new Date();
    
    switch (type) {
      case 'user':
        (this.session as any).userNotes = notes;
        break;
      case 'trainer':
        (this.session as any).trainerNotes = notes;
        break;
      case 'ai':
        (this.session as any).aiFeedback = notes;
        break;
      default:
        throw new Error('Invalid note type');
    }

    (this.session as any).updatedAt = timestamp;
  }

  /**
   * Get session recommendations
   */
  getSessionRecommendations(): string[] {
    const recommendations: string[] = [];
    const progress = this.session.sessionData.progress;

    // Intensity recommendations
    if (this.session.effortRating) {
      if (this.session.effortRating < 6) {
        recommendations.push('Consider increasing intensity for better results');
      } else if (this.session.effortRating > 8.5) {
        recommendations.push('High intensity detected - ensure adequate recovery');
      }
    }

    // Volume recommendations
    if (progress && progress.totalVolume) {
      const avgVolumePerExercise = progress.totalVolume / (progress.exercisesCompleted || 1);
      if (avgVolumePerExercise < 500) {
        recommendations.push('Consider increasing weight or reps for more volume');
      }
    }

    // Time management recommendations
    if (this.session.status === 'in_progress' && this.session.startedAt) {
      const elapsed = new Date().getTime() - this.session.startedAt.getTime();
      const elapsedMinutes = elapsed / (1000 * 60);
      const estimated = this.session.sessionData.estimatedDuration || 60;

      if (elapsedMinutes > estimated * 1.2) {
        recommendations.push('Session is running longer than estimated - consider time management');
      }
    }

    // Rest time recommendations
    const analytics = this.calculateAnalytics();
    if (analytics.restTime > analytics.timeUnderTension * 3) {
      recommendations.push('Consider reducing rest time between sets');
    }

    // Completion recommendations
    if (this.session.completionPercentage < 80 && this.session.status === 'completed') {
      recommendations.push('Try to complete more exercises in future sessions');
    }

    return recommendations;
  }

  // Private helper methods

  private calculateActualDuration(completedAt: Date): number {
    if (!this.session.startedAt) return 0;
    
    return Math.floor((completedAt.getTime() - this.session.startedAt.getTime()) / 1000 / 60);
  }

  private calculateTotalVolume(): number {
    return this.session.sessionData.progress?.totalVolume || 0;
  }

  private getExercisesCompleted(): number {
    return this.session.sessionData.progress?.exercisesCompleted || 0;
  }

  private generateSessionSummary(): string {
    const exercisesCompleted = this.getExercisesCompleted();
    const totalExercises = this.session.sessionData.totalExercises;
    const completionRate = Math.round((exercisesCompleted / totalExercises) * 100);
    const volume = this.calculateTotalVolume();
    
    return `Completed ${exercisesCompleted}/${totalExercises} exercises (${completionRate}%) with ${volume}kg total volume`;
  }

  private getTotalSetsForExercise(exerciseId: string): number {
    const exercise = this.findExerciseById(exerciseId);
    return exercise?.sets || 3; // Default to 3 sets
  }

  private getAllExercises(): any[] {
    return [
      ...this.session.warmUpExercises,
      ...this.session.mainExercises,
      ...this.session.coolDownExercises
    ];
  }

  private findExerciseById(exerciseId: string): any | null {
    const allExercises = this.getAllExercises();
    return allExercises.find(exercise => exercise.id === exerciseId) || null;
  }

  private estimateTimeUnderTension(): number {
    // Simplified calculation - 30 seconds per set on average
    const setsCompleted = this.session.sessionData.progress?.setsCompleted || 0;
    return setsCompleted * 30;
  }

  private calculateTotalRestTime(): number {
    // Simplified calculation - 90 seconds rest per set
    const setsCompleted = this.session.sessionData.progress?.setsCompleted || 0;
    return Math.max(0, (setsCompleted - 1) * 90);
  }
}