# AI Personal Trainer - Development Guide

## Code Quality Validation Commands

### Primary Development Commands

**Recommended for active development:**

```bash
# Start development with comprehensive validation
pnpm dev:watch
```

**Quick development without overhead:**

```bash
# Standard development server
pnpm dev
```

### Code Quality Validation Steps

**Complete validation sequence:**

```bash
# Run all validation steps
pnpm validate

# Auto-fix issues and format code
pnpm validate:fix

# Continuous validation during development
pnpm validate:watch

# Validation with system notifications (macOS)
pnpm validate:notify
```

**Individual validation steps:**

```bash
# 1. TypeScript type checking
pnpm type-check

# 2. ESLint code analysis
pnpm lint

# 3. Prettier code formatting
pnpm format

# Watch modes for continuous feedback
pnpm type-check:watch
pnpm lint:watch
pnpm format:watch
```

### Development Workflow Commands

**Developer Experience utilities:**

```bash
# Initialize development environment
pnpm dx:setup

# Quick code quality check
pnpm dx:check

# Auto-fix code issues
pnpm dx:fix

# Remove unused imports
pnpm dx:clean-imports
```

## Pre-commit Validation

The following validation steps are automatically run on every commit:

1. **Environment Validation** - Check Node.js and dependencies
2. **TypeScript Checking** - `pnpm type-check`
3. **ESLint Analysis** - `pnpm lint:fix` (with auto-fix)
4. **Prettier Formatting** - `pnpm format`
5. **Security Scan** - Check for sensitive data
6. **Build Verification** - Validate configuration changes

## Sound Notifications

**macOS System Notifications:**

- ✅ Success: "Validation passed!" notification
- ❌ Failure: "Validation failed!" notification

**Command for feedback:**

```bash
pnpm validate:notify
```

## VS Code Integration

**Available tasks (Cmd+Shift+P → "Tasks: Run Task"):**

- **👀 Development Watch Mode** - Full development with validation
- **🔍 Validation Watch Mode** - Continuous code quality checking
- **✅ Code Quality Check** - One-time validation with notifications
- **🧹 Lint & Format** - Fix code issues and formatting
- **🚀 DX Setup** - Initialize development environment

## Quality Standards

- **TypeScript**: 100% type safety with strict mode enabled
- **ESLint**: Zero warnings/errors with auto-fix capabilities
- **Prettier**: Consistent code formatting across all files
- **Accessibility**: WCAG compliance checks enabled
- **Performance**: Optimized development workflow with fast feedback loops

## Troubleshooting

**Common fixes:**

```bash
# Fix TypeScript/import issues
pnpm dx:clean-imports

# Restart development with validation
pnpm dev:watch

# Force validation and formatting
pnpm validate:fix
```

**VS Code issues:**

- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Clear Next.js cache: `pnpm clean`

## Deployment Readiness

Before deployment, ensure all validation passes:

```bash
# Complete validation check
pnpm validate

# Build verification
pnpm build

# Type safety confirmation
pnpm type-check
```

# Frontend Development Best Practices

## Mobile-First Design Principles

### Touch-Friendly Interface Design

- **Minimum Touch Targets**: 44px × 44px (WCAG AA compliant)
- **Touch Manipulation**: Use `touch-manipulation` CSS class for responsive touch interactions
- **Finger-Friendly Controls**: Large buttons, generous spacing, intuitive gestures
- **Visual Feedback**: Clear hover/active states, loading indicators, haptic feedback integration

### Progressive Enhancement Strategy

- **Core Functionality**: Works on all devices, enhanced on capable devices
- **Responsive Design**: Mobile-first breakpoints with desktop enhancements
- **Performance Budget**: <3s load time on 3G, <1s on WiFi, <500KB initial bundle
- **Accessibility First**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

## Component Architecture Standards

### SOLID Principles for Frontend

- **Single Responsibility**: Each component has one clear purpose
- **Open/Closed**: Components extendable via props, closed for internal modification
- **Interface Segregation**: Props interfaces specific to component needs
- **Dependency Inversion**: Depend on abstractions (hooks, contexts) not concretions

### Component Design Patterns

- **Composition over Inheritance**: Build complex UIs from simple, composable components
- **Container/Presentational**: Separate data logic from presentation logic
- **Compound Components**: Related components that work together (e.g., Modal.Trigger, Modal.Content)
- **Render Props/Custom Hooks**: Share stateful logic across components

### Component Size Guidelines

- **Small Components**: <100 lines, single responsibility
- **Medium Components**: 100-300 lines, specific feature area
- **Large Components**: >300 lines require refactoring into smaller pieces
- **File Organization**: One component per file, group related components in folders

## DRY and Reusability Standards

### Reusable UI Patterns

- **Design System Integration**: Use consistent tokens, colors, spacing, typography
- **Generic Components**: Button, Input, Modal, Card with configurable variants
- **Specialized Components**: Feature-specific components built from generic ones

# Use Playwright MCP server to run the app, use the email/password from .env.local to log in with Clerk, remember mobile first so use the browser as a iPhone 14 Pro Max

- ui-ux-designer agent to evaluate and iterate into app state of the art user experience.

## ⚡ Component Organization & Reusability Principles

### Implemented Reusable Components Architecture

**Problem Solved**: Eliminated repetitive code across each page by creating a unified component system.

#### Core Reusable Components (`/components/ui/`)

### Component Reusability Guidelines

1. **Single Responsibility Principle**
   - Each component handles one specific UI pattern
   - LoadingState: Only loading UIs
   - ErrorState: Only error handling
   - StatCard: Only statistic displays

2. **Configurable Variants**
   - Use variant props for different layouts
   - Support size variations for different contexts
   - Provide sensible defaults

3. **Consistent API Design**

   ```tsx
   interface BaseComponentProps {
     variant?: 'variant1' | 'variant2';
     size?: 'sm' | 'md' | 'lg';
     className?: string;
     // Component-specific props...
   }
   ```

4. **Error Handling Integration**
   - All data components support loading/error states
   - Consistent retry functionality
   - Graceful degradation

### Session Execution System

**Complete workout session execution implemented** with:

#### Mobile-First Session Interface

- **Touch-friendly controls**: 44px minimum touch targets
- **Session progress tracking**: Real-time exercise and set completion
- **Timer integration**: Rest periods and workout duration
- **Pause/Resume functionality**: Session state persistence

#### Session Components (`/components/workouts/ui/`)

- `SessionProgressHeader`: Session overview and controls
- `ExerciseProgressCard`: Individual exercise tracking
- `SessionTimer`: Countdown timers with accessibility
- `SessionNavigation`: Exercise progression controls
- `SessionLoadingStates`: Comprehensive loading/error states

#### Session Execution Flow

1. **Navigation**: `/en/workouts/sessions/[sessionId]`
2. **Loading**: SessionLoading component while fetching data
3. **Error Handling**: SessionErrorState for API failures
4. **Session Start**: EnhancedSessionInterface for workout execution
5. **Data Recording**: Real-time set/rep/weight tracking
6. **Completion**: Session results and statistics updates

### Development Workflow Benefits

1. **Consistency**: All loading states look and behave the same
2. **Maintainability**: Update one component, fix everywhere
3. **Developer Experience**: Simple, predictable APIs
4. **Performance**: Smaller bundle size through code reuse
5. **Accessibility**: Consistent ARIA labels and keyboard navigation

### Usage Examples in Codebase

```tsx
// Before: Repetitive loading code
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    <span className="ml-2 text-gray-500">Loading...</span>
  </div>
) : error ? (
  <div className="py-8 text-center">
    <p className="text-red-600">Error: {error}</p>
  </div>
) : (
  // Content
)}

// After: Clean, reusable components
{isLoading ? (
  <LoadingState message="Loading..." variant="centered" />
) : error ? (
  <ErrorState message="Load failed" description={error} />
) : (
  // Content
)}
```

- **Utility Components**: Layout, typography, spacing utilities

### State Management Strategy

- **Local State**: useState for component-specific state
- **Shared State**: Context for feature-level state, external stores for app-level state
- **Server State**: React Query/SWR for API data, optimistic updates
- **Form State**: React Hook Form for complex forms, native state for simple forms

## Test-Driven Development (TDD) Integration

### TDD Workflow Recovery Plan

- **Red-Green-Refactor**: Write failing test → Make it pass → Clean up code
- **Component Testing**: Test component behavior, not implementation details
- **Integration Testing**: Test component interactions and data flow
- **E2E Testing**: Test complete user workflows and critical paths

### Testing Strategy

- **Unit Tests**: Component logic, utility functions, custom hooks
- **Integration Tests**: Component interactions, form submissions, data fetching
- **Visual Tests**: Storybook stories, screenshot testing, responsive design
- **Accessibility Tests**: Screen reader compatibility, keyboard navigation

### Test File Organization

```
components/
  ui/
    button/
      button.tsx
      button.test.tsx
      button.stories.tsx
    modal/
      modal.tsx
      modal.test.tsx
      modal.stories.tsx
```

## Performance Optimization Guidelines

### Bundle Optimization

- **Code Splitting**: Dynamic imports for routes and heavy components
- **Tree Shaking**: ES modules, selective imports, dead code elimination
- **Image Optimization**: Next.js Image component, WebP format, lazy loading
- **CSS Optimization**: CSS Modules, utility-first CSS (Tailwind), critical CSS

### Runtime Performance

- **Memoization**: React.memo, useMemo, useCallback for expensive operations
- **Virtualization**: For long lists and tables (react-window, react-virtualized)
- **Lazy Loading**: Intersection Observer, React.lazy, Next.js dynamic imports
- **State Updates**: Batch updates, avoid unnecessary re-renders

## Mobile UX Enhancement Patterns

### Input Method Optimization

- **Sliders**: Enhanced with ±buttons, large touch targets, visual feedback
- **Forms**: Auto-focus, input validation, progress indicators
- **Navigation**: Bottom tabs, swipe gestures, breadcrumbs
- **Feedback**: Loading states, success/error messages, haptic feedback

### Device-Specific Features

- **Responsive Images**: Different resolutions for different screen densities
- **Touch Gestures**: Swipe, pinch, long press for contextual actions
- **Device APIs**: Camera, location, notifications (with user permission)
- **Offline Support**: Service workers, cache strategies, offline indicators

## Component Consistency Framework

### Design Token Usage

- **Colors**: Use semantic tokens (primary, secondary, success, error)
- **Spacing**: Consistent scale (4px, 8px, 16px, 24px, 32px, 48px)
- **Typography**: Font scales, line heights, letter spacing
- **Animations**: Consistent timing functions and durations

### API Design Consistency

- **Props Naming**: Clear, consistent naming conventions
- **Event Handlers**: onAction pattern (onClick, onChange, onSubmit)
- **Boolean Props**: Use positive naming (enabled vs disabled)
- **Size Variants**: sm, md, lg, xl with consistent meanings

## Frontend/Backend Separation Guidelines

### API Integration Patterns

- **Data Fetching**: Centralized API layer, consistent error handling
- **Type Safety**: Generate types from API schemas, validate responses
- **Caching Strategy**: React Query for server state, local storage for preferences
- **Error Boundaries**: Graceful error handling, fallback UIs

### State Management Boundaries

- **Server State**: API responses, cached data, sync status
- **Client State**: UI state, form inputs, temporary data
- **Shared State**: User preferences, authentication, global app state
- **URL State**: Filters, pagination, navigation state
