# Feature: List Workout Plans

## Overview

A coach can view all their workout plans in a paginated list with filtering and search.

## Preconditions

- A user is authenticated

## Scenarios

### Scenario 1: View plans list

**Given** the coach has 2 workout plans

**When** the coach navigates to the plans page

**Then** the page displays:
  - Both plans with their names and status badges
  - A "New plan" button to create additional plans

### Scenario 2: Empty state

**Given** the coach has no workout plans

**When** the coach navigates to the plans page

**Then** the page shows an empty state message encouraging plan creation

### Scenario 3: Navigate to plan detail

**Given** the coach is viewing the plans list

**When** the coach clicks on a plan

**Then** the coach is navigated to the plan detail page

## API Dependencies

- `GET /api/workouts/plans` — list plans with pagination

## UI Requirements

- Plan cards or list items showing name, status, duration, sessions/week
- Status badges with color coding
- "New plan" button prominently placed
- Empty state with call to action
- Responsive grid/list layout
