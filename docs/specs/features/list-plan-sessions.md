# Feature: List Plan Sessions

## Overview

A coach can review the sessions generated for a workout plan after the plan has been started.

## Preconditions

- A user has access to a workout plan
- The plan detail page can load the plan and its sessions
- Sessions may or may not already exist for the plan

## Scenarios

### Scenario 1: Empty sessions state

**Given** the coach is viewing a plan that has not been started yet

**When** the plan detail page loads

**Then** the sessions section shows an empty-state message prompting the coach to start the plan

### Scenario 2: Generated sessions appear after starting a plan

**Given** the coach is viewing a draft plan with a valid schedule

**When** the coach starts the plan

**Then**:
- sessions are generated for the first scheduled week
- the sessions section refreshes without a full page reload
- each generated session appears in the sessions list
- generated sessions initially show status `draft`

### Scenario 3: Sessions are ordered chronologically

**Given** a plan has multiple generated sessions

**When** the coach views the sessions section

**Then** the sessions are listed in ascending scheduled-date order

### Scenario 4: Missing plan

**Given** the coach requests sessions for a plan that does not exist or does not belong to them

**When** the sessions endpoint is called

**Then** it returns `404`

## API Dependencies

- `GET /api/workouts/plans/:planId/sessions` — fetch generated sessions
- `POST /api/workouts/plans/:planId/start` — generate sessions by activating the plan

## UI Requirements

- The plan detail page includes a sessions section
- Each session row shows at least the session name, scheduled date, and status badge
- If no sessions exist, the section shows an empty-state message
- After the plan is started, the sessions list updates automatically
