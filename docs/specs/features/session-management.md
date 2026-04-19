# Feature: Session Management

## Overview

A coach can view, start, track progress, and complete individual workout sessions. Sessions show planned exercises and allow logging actual performance.

## Preconditions

- A user has an active workout plan with generated sessions
- Sessions contain exercises organized by phase (warm-up, main, cool-down)

## Scenarios

### Scenario 1: View session detail

**Given** the coach has a session with exercises

**When** the coach navigates to the session detail page

**Then** the page displays:
  - Session name and status
  - Exercises grouped by phase (warm-up, main, cool-down)
  - For each exercise: planned sets, reps, weight, and rest period
  - A "Start workout" button (if session is in draft status)

### Scenario 2: Start a session

**Given** the coach is viewing a draft session

**When** the coach clicks "Start workout"

**Then**:
  - The session status changes to "active"
  - The UI updates to show the active state
  - Exercise logging controls become available

### Scenario 3: Log exercise progress

**Given** the coach has an active session

**When** the coach logs actual performance for an exercise:
  - Actual sets: 3
  - Actual reps: 10
  - Actual weight: 40 kg
  - Marks as completed

**Then**:
  - The exercise shows as completed
  - The completion percentage updates
  - The logged data is saved

### Scenario 4: Complete a session

**Given** the coach has an active session with some exercises logged

**When** the coach clicks "Complete workout"
**And** provides:
  - Effort rating: 7
  - Notes: "Good session"

**Then**:
  - The session status changes to "completed"
  - Completion metadata is recorded
  - A success message confirms completion

### Scenario 5: Session lifecycle enforcement

**Given** a session in draft status

**When** the coach tries to complete it (without starting first)

**Then** the complete action is not available (only "Start workout" is shown)

## API Dependencies

- `GET /api/workouts/sessions/:sessionId` — fetch session details
- `POST /api/workouts/sessions/:sessionId/start` — start session
- `PUT /api/workouts/sessions/:sessionId` — update exercise progress
- `POST /api/workouts/sessions/:sessionId/complete` — complete session

## UI Requirements

- Session header with name, status badge, and date
- Exercise list grouped by phase with visual separation
- Each exercise row shows: name, planned values, actual values (when logging), completion checkbox
- "Start workout" button for draft sessions
- "Complete workout" button/dialog for active sessions
- Completion dialog with effort rating (1-10), energy levels, and notes
- Mobile-responsive for gym use
- Status transitions reflected immediately in UI
