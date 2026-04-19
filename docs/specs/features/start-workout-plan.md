# Feature: Start Workout Plan

## Overview

A coach can activate a draft plan, which generates workout sessions from the plan's schedule and transitions the plan to active status.

## Preconditions

- A user has a workout plan in `draft` status
- The plan has a valid schedule with at least one workout day

## Scenarios

### Scenario 1: Start a plan

**Given** the coach is viewing a draft plan

**When** the coach clicks the "Start plan" button

**Then**:
  - The plan status changes to "active"
  - Workout sessions are generated from the plan schedule
  - The sessions appear in the plan detail view
  - A success message confirms the plan was started

### Scenario 2: Sessions generated match schedule

**Given** a draft plan with Mon/Wed/Fri workout schedule

**When** the coach starts the plan

**Then**:
  - 3 sessions are generated (one for each workout day in the first week)
  - Each session has the workout name from the schedule
  - Each session has status "draft"
  - Each session has a scheduled date matching the corresponding day

### Scenario 3: Start button not shown for active plans

**Given** the coach is viewing an active plan

**When** the page loads

**Then** no "Start plan" button is visible

## API Dependencies

- `POST /api/workouts/plans/:planId/start` — activate plan and generate sessions
- `GET /api/workouts/plans/:planId/sessions` — fetch generated sessions

## UI Requirements

- "Start plan" button visible only for draft plans
- Confirmation before starting (plan activation is significant)
- Loading state during API call
- Success notification after plan is started
- Sessions list refreshes to show newly generated sessions
