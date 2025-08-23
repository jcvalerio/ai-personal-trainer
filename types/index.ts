/**
 * Core type definitions for the AI Personal Trainer application
 */

// User and Authentication Types
export type UserRole =
  | 'user'
  | 'family_admin'
  | 'gym_member'
  | 'gym_admin'
  | 'gym_owner';
export type OrganizationType = 'family' | 'gym';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;

  // Fitness profile
  fitnessLevel: FitnessLevel;
  heightCm?: number;
  weightKg?: number;
  birthDate?: Date;
  primaryGoals: string[];

  // Organization relationship
  organizationId?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;

  // Preferences
  preferences: UserPreferences;
  notificationSettings: NotificationSettings;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  workoutReminders: boolean;
  shareProgress: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface NotificationSettings {
  workoutReminders: boolean;
  progressUpdates: boolean;
  socialInteractions: boolean;
  systemUpdates: boolean;
  email: boolean;
  push: boolean;
}

// Organization Types
export interface Organization {
  id: string;
  clerkOrgId: string;
  name: string;
  description?: string;
  type: OrganizationType;
  maxMembers: number;
  subscriptionTier: SubscriptionTier;

  // Gym-specific fields
  address?: Address;
  contactInfo?: ContactInfo;
  operatingHours?: OperatingHours;

  // Branding
  brandingConfig: BrandingConfig;
  settings: OrganizationSettings;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface BrandingConfig {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: 'light' | 'dark';
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  requireApprovalForJoining: boolean;
  shareEquipmentDatabase: boolean;
  enableLeaderboards: boolean;
}

// Exercise and Equipment Types
export interface Exercise {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;

  // Classification
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  exerciseType: 'strength' | 'cardio' | 'flexibility' | 'sports';
  difficultyLevel: FitnessLevel;

  // Equipment
  equipmentRequired: string[];
  equipmentOptional: string[];

  // Media
  demoVideoUrl?: string;
  demoImageUrl?: string;
  instructionImages: string[];

  // Metadata
  createdBy: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  model?: string;

  // Physical properties
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };

  // Media
  imageUrl?: string;
  instructionManualUrl?: string;

  // Usage
  maxUsersSimultaneously: number;
  maintenanceIntervalDays: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Workout and Session Types
export interface WorkoutPlan {
  id: string;
  userId: string;
  organizationId?: string;

  name: string;
  description: string;
  durationWeeks: number;
  sessionsPerWeek: number;

  // Goals and targeting
  fitnessGoals: string[];
  targetFitnessLevel: FitnessLevel;
  estimatedSessionDuration: number; // minutes

  // AI generation metadata
  aiPromptUsed?: string;
  aiModelVersion?: string;
  generationParameters?: Record<string, any>;

  // Plan structure
  planData: WorkoutPlanData;
  weeklySchedule: WeeklySchedule;

  // Status
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived';
  startedAt?: Date;
  completedAt?: Date;

  // Versioning
  version: number;
  parentPlanId?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface WorkoutPlanData {
  summary: string;
  phases: WorkoutPhase[];
  progressionStrategy: string;
  notes?: string;
}

export interface WorkoutPhase {
  name: string;
  description: string;
  durationWeeks: number;
  sessions: WorkoutSession[];
}

export interface WeeklySchedule {
  [week: string]: DaySchedule[];
}

export interface DaySchedule {
  day: string;
  sessionId?: string;
  sessionName: string;
  type: 'workout' | 'rest' | 'active_recovery';
  duration: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  organizationId?: string;
  workoutPlanId?: string;

  name: string;
  sessionType: 'workout' | 'assessment' | 'recovery';
  scheduledDate: Date;
  scheduledTime?: string;

  // Execution
  startedAt?: Date;
  completedAt?: Date;
  durationMinutes?: number;

  // Session structure
  sessionData: SessionData;
  warmUpExercises: SessionExercise[];
  mainExercises: SessionExercise[];
  coolDownExercises: SessionExercise[];

  // Progress
  completionPercentage: number;
  effortRating?: number;
  energyLevelBefore?: number;
  energyLevelAfter?: number;

  // Status and location
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  equipmentUsed: string[];
  gymLocation?: string;

  // Notes
  userNotes?: string;
  aiFeedback?: string;
  trainerNotes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  totalExercises: number;
  estimatedDuration: number;
  targetMuscleGroups: string[];
  equipmentNeeded: string[];
  difficultyLevel: FitnessLevel;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;

  orderIndex: number;
  supersetGroup?: number;
  exercisePhase: 'warm_up' | 'main' | 'cool_down';

  // Planned performance
  plannedSets?: number;
  plannedReps?: number;
  plannedWeightKg?: number;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  plannedRestSeconds?: number;

  // Actual performance
  actualSets?: number;
  actualReps?: number;
  actualWeightKg?: number;
  actualDurationSeconds?: number;
  actualDistanceMeters?: number;
  actualRestSeconds?: number;

  // Equipment and feedback
  equipmentUsed?: string;
  equipmentAlternatives: string[];
  perceivedExertion?: number; // 1-10 scale
  formRating?: number; // 1-5 scale

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  notes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Progress and Analytics Types
export interface ProgressMeasurement {
  id: string;
  userId: string;
  organizationId?: string;

  measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  measurementLocation?: string; // for circumference measurements
  value: number;
  unit: string;

  measuredAt: Date;
  measurementMethod?: string;
  notes?: string;
  photoUrl?: string;

  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  organizationId?: string;

  achievementType: 'streak' | 'milestone' | 'pr' | 'consistency';
  achievementName: string;
  description: string;

  value?: number;
  unit?: string;
  category?: string;

  achievedAt: Date;
  previousBest?: number;
  improvementPercentage?: number;

  badgeIcon?: string;
  isMilestone: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface CreateUserProfileForm {
  displayName: string;
  fitnessLevel: FitnessLevel;
  heightCm?: number;
  weightKg?: number;
  birthDate?: Date;
  primaryGoals: string[];
  preferences: Partial<UserPreferences>;
}

export interface CreateOrganizationForm {
  name: string;
  description?: string;
  type: OrganizationType;
  maxMembers?: number;
  address?: Partial<Address>;
  contactInfo?: Partial<ContactInfo>;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Keys>>;
  }[Keys];
