import { z } from 'zod';

export const LocaleSchema = z.enum(['en', 'es']);
export const UnitSystemSchema = z.enum(['metric', 'imperial']);
export const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const WorkoutStatusSchema = z.enum(['draft', 'active', 'completed', 'paused', 'archived']);
export const SessionTypeSchema = z.enum(['workout', 'assessment', 'recovery']);

export const UUIDSchema = z.string().uuid();
export const ISODateStringSchema = z.string().datetime();

export type Locale = z.infer<typeof LocaleSchema>;
export type UnitSystem = z.infer<typeof UnitSystemSchema>;
export type FitnessLevel = z.infer<typeof FitnessLevelSchema>;
export type WorkoutStatus = z.infer<typeof WorkoutStatusSchema>;
export type SessionType = z.infer<typeof SessionTypeSchema>;
