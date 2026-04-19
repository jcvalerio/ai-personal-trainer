# Feature: View Workout Plan

## Overview

A coach can view the full details of a workout plan, including its structure, schedule, templates, and associated sessions.

## Preconditions

- A user exists with at least one workout plan
- The plan has a name, duration, sessions per week, and at least one workout template

## Scenarios

### Scenario 1: View plan details

**Given** a coach has a workout plan named "Sedentary Strength Builder" with:
  - Duration: 4 weeks
  - Sessions per week: 3
  - Status: draft
  - Primary goal: strength
  - Difficulty: beginner

**When** the coach navigates to the plan detail page

**Then** the page displays:
  - The plan name "Sedentary Strength Builder"
  - Duration "4 weeks"
  - Sessions per week "3"
  - Status badge showing "draft"
  - The primary goal
  - The difficulty level

### Scenario 2: View plan schedule

**Given** a coach is viewing a plan with a weekly schedule of Mon/Wed/Fri workouts

**When** the coach looks at the schedule section

**Then** the schedule shows:
  - Monday, Wednesday, Friday as workout days with workout names
  - Tuesday, Thursday, Saturday, Sunday as rest days

### Scenario 3: View plan with sessions (active plan)

**Given** a coach has an active plan with 3 generated sessions

**When** the coach views the plan detail page

**Then** the sessions section shows:
  - Each session with its name, scheduled date, and status
  - Status badges for each session (draft, active, or completed)

### Scenario 4: Plan not found

**Given** a coach navigates to a plan that does not exist

**When** the page loads

**Then** a "not found" or error state is displayed

## API Dependencies

- `GET /api/workouts/plans/:planId` — fetch plan details
- `GET /api/workouts/plans/:planId/sessions` — fetch associated sessions

## UI Requirements

- Plan header with name and status badge
- Summary section with duration, sessions/week, goals, difficulty
- Schedule grid showing weekly layout
- Sessions list (when plan is active and has sessions)
- Responsive layout for mobile use
