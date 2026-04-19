# Feature: Filter Workout Plans

## Overview

A coach can narrow the workout plans list by status and search text so they can quickly find the right plan once the dashboard contains more than a handful of items.

## Preconditions

- A user is authenticated
- The workout plans dashboard is available
- `GET /api/workouts/plans` supports the existing `status` and `search` query parameters from `docs/specs/api-contracts.md`

## Scenarios

### Scenario 1: Filter plans by status

**Given** the coach has workout plans in multiple statuses

**When** the coach selects the `active` status filter

**Then**:
- only active plans are shown in the list
- plans in other statuses are hidden
- the page updates without a full reload

### Scenario 2: Search plans by name or description

**Given** the coach has a plan named "Beginner Full Body"
**And** another plan whose description contains "mobility"

**When** the coach searches for "body"

**Then** only matching plans remain visible

**When** the coach searches for "mobility"

**Then** plans matching by description are shown

### Scenario 3: Combine status and search

**Given** the coach has multiple plans that partially match the same search text

**When** the coach applies a search term and a status filter together

**Then** the list shows only plans matching both filters

### Scenario 4: No matching plans

**Given** the coach has workout plans

**When** the applied search and status filters match no plans

**Then** the page shows a filtered empty state
**And** the empty state explains that no plans match the current filters
**And** the coach can clear the filters

## API Dependencies

- `GET /api/workouts/plans` — list plans with optional `status` and `search` query parameters

## UI Requirements

- The plans page exposes a search input for plan name/description
- The plans page exposes a status filter control
- Applying either control refreshes the list without a full page reload
- When filters are active, the page provides a clear/reset action
- The empty state for "no plans exist" remains distinct from the empty state for "no plans match the current filters"
