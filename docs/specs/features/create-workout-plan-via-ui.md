# Feature: Create Workout Plan via UI

## Overview

A coach can create a new workout plan through a dialog form on the dashboard. The form collects minimal information and the server auto-generates the full plan structure.

## Preconditions

- A user is authenticated
- The user is on the workout plans list page

## Scenarios

### Scenario 1: Successfully create a plan

**Given** the coach is on the plans list page

**When** the coach clicks "New plan"
**And** fills in:
  - Plan name: "Beginner Full Body"
  - Duration: 4 weeks
  - Sessions per week: 3
**And** clicks "Create plan"

**Then**:
  - A success message appears containing "created successfully"
  - The new plan appears in the plans list
  - The plan has status "draft"

### Scenario 2: Validation — missing required fields

**Given** the coach opens the new plan dialog

**When** the coach clicks "Create plan" without filling in the plan name

**Then**:
  - The form shows a validation error for the name field
  - No API call is made
  - The dialog remains open

### Scenario 3: Validation — invalid duration

**Given** the coach opens the new plan dialog

**When** the coach enters a duration less than 4 or greater than 52

**Then**:
  - The form shows a validation error for the duration field

### Scenario 4: Server error handling

**Given** the coach fills in valid plan data

**When** the server returns an error

**Then**:
  - An error message is displayed
  - The form data is preserved (not cleared)
  - The dialog remains open for retry

## API Dependencies

- `POST /api/workouts/plans` — create plan from form data

## UI Requirements

- Modal dialog triggered by "New plan" button
- Form fields: Plan name (text), Duration in weeks (number), Sessions per week (number), Description (optional textarea)
- Client-side validation before submission
- Loading state on submit button
- Success toast/notification on creation
- Error display that preserves form state
