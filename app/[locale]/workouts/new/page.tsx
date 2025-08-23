/**
 * Workout Creation Redirect
 * Redirects to the AI workout generation page
 */

import { redirect } from 'next/navigation';

export default function WorkoutNewPage() {
  // Redirect to the AI workout generation page
  redirect('/workouts/generate');
}
