# Claude Code Prompting Strategy for AI Personal Trainer

## Overview

This document provides optimal prompting strategies for maximizing Claude Code's effectiveness in the AI Personal Trainer project. It aligns with our established architecture, quality standards, and development workflows.

## Core Principles

1. **Evidence-Based Development**: Always provide concrete examples and measurable requirements
2. **Mobile-First Focus**: Emphasize responsive design and touch interactions in every prompt
3. **Quality-Driven**: Include validation requirements and testing expectations upfront
4. **Accessibility by Default**: Specify WCAG compliance requirements explicitly
5. **Performance-Conscious**: Include performance budgets and optimization targets

## Prompt Structure Templates

### 1. Feature Implementation Template

```markdown
## Feature: [Feature Name]

### Context

- **Component Location**: app/[locale]/[feature]/page.tsx
- **Related Systems**: [Auth, Database, UI components]
- **User Story**: As a [user type], I want to [action] so that [benefit]

### Requirements

- **Functionality**: [Specific behaviors and interactions]
- **Mobile UX**: [Touch targets min 44x44px, swipe gestures, viewport optimization]
- **Accessibility**: [WCAG 2.1 AA compliance, keyboard navigation, screen reader support]
- **Performance**: [<3s load time on 3G, bundle size <500KB]
- **Internationalization**: [Support for en, es locales]

### Technical Constraints

- Use existing UI components from components/ui/
- Follow established patterns in [reference similar feature]
- Integrate with TanStack Query for data fetching
- Maintain TypeScript strict mode compliance

### Validation Criteria

- Must pass: pnpm validate
- Component renders without errors
- Meets accessibility audit (pnpm test:e2e --accessibility)
- Performance budget maintained

### Example Usage

[Provide code snippet or user flow]
```

**Auto-activations**: This structure triggers `--persona-frontend` for UI work, `--magic` for component generation, and `--validate` for quality checks.

### 2. Bug Fix Template

```markdown
## Bug: [Issue Description]

### Reproduction Steps

1. [Step-by-step reproduction]
2. [Include environment details]
3. [Expected vs actual behavior]

### Investigation Context

- **Affected Files**: [List specific files]
- **Error Messages**: [Include full stack traces]
- **Browser/Device**: [Specific versions and devices]
- **Related PRs**: [Link to recent changes]

### Root Cause Analysis Required

- Check for state management issues
- Verify API response handling
- Inspect component lifecycle problems
- Review TypeScript type mismatches

### Fix Requirements

- Maintain backward compatibility
- Add regression test coverage
- Update relevant documentation
- Preserve existing functionality

### Validation

- Bug no longer reproducible
- All existing tests pass
- New test prevents regression
- No performance degradation
```

**Auto-activations**: Triggers `--persona-analyzer`, `--think`, `--seq` for systematic debugging.

### 3. Refactoring Template

```markdown
## Refactoring: [Target Area]

### Current State Analysis

- **Files to Refactor**: [List with line counts]
- **Code Smells**: [Duplication, complexity, coupling]
- **Performance Issues**: [Current metrics]
- **Technical Debt**: [Accumulated issues]

### Refactoring Goals

- **SOLID Compliance**: [Specific principles to apply]
- **DRY Implementation**: [Abstraction opportunities]
- **Performance Target**: [Specific improvements]
- **Maintainability**: [Reduce complexity score by X%]

### Constraints

- No breaking changes to public APIs
- Maintain all existing functionality
- Progressive refactoring (deployable at each step)
- Preserve test coverage (minimum 80%)

### Implementation Strategy

1. [Create comprehensive test coverage]
2. [Extract and abstract common patterns]
3. [Simplify complex conditionals]
4. [Optimize performance bottlenecks]
5. [Update documentation]

### Success Metrics

- Cyclomatic complexity reduced by 30%
- Bundle size reduced by 20%
- Test coverage increased to 85%
- TypeScript strict mode compliance
```

**Auto-activations**: Triggers `--persona-refactorer`, `--loop` for iterative improvement, `--wave-mode` for systematic refactoring.

### 4. Code Review Template

```markdown
## Review Request: [PR Title]

### Change Summary

- **Purpose**: [Business value and technical goals]
- **Scope**: [Files changed, lines modified]
- **Dependencies**: [New packages, API changes]
- **Breaking Changes**: [Yes/No, migration required?]

### Review Focus Areas

1. **Architecture**: Pattern consistency, SOLID principles
2. **Security**: Input validation, auth checks, data sanitization
3. **Performance**: Bundle impact, render optimization, API efficiency
4. **Accessibility**: Keyboard navigation, ARIA labels, contrast ratios
5. **Mobile UX**: Touch targets, responsive design, viewport handling

### Testing Coverage

- Unit tests: [Coverage percentage]
- Integration tests: [Key flows covered]
- E2E tests: [Critical paths validated]
- Performance tests: [Metrics validated]

### Checklist

- [ ] TypeScript types properly defined
- [ ] Proper error handling implemented
- [ ] Internationalization keys added
- [ ] Documentation updated
- [ ] Validation passes (pnpm validate)

### Risk Assessment

- **Deployment Risk**: [Low/Medium/High]
- **Rollback Plan**: [Strategy if issues arise]
- **Monitoring**: [Metrics to watch post-deploy]
```

**Auto-activations**: Triggers `--persona-architect` for architectural review, `--validate` for quality checks.

### 5. Performance Optimization Template

```markdown
## Performance Optimization: [Component/Page]

### Current Performance Metrics

- **LCP**: [Current value] → Target: <2.5s
- **FID**: [Current value] → Target: <100ms
- **CLS**: [Current value] → Target: <0.1
- **Bundle Size**: [Current] → Target: <500KB
- **Memory Usage**: [Current] → Target: <100MB mobile

### Bottleneck Analysis

- **Render Performance**: [Specific issues]
- **Network Requests**: [Waterfall analysis]
- **JavaScript Execution**: [Long tasks]
- **Asset Loading**: [Critical path issues]

### Optimization Strategies

1. **Code Splitting**: [Dynamic imports for routes]
2. **Image Optimization**: [Next.js Image component, WebP]
3. **Caching Strategy**: [TanStack Query configuration]
4. **Bundle Optimization**: [Tree shaking, dead code elimination]
5. **Render Optimization**: [Memoization, virtualization]

### Mobile-Specific Optimizations

- Reduce JavaScript payload for slower devices
- Implement progressive enhancement
- Optimize for cellular networks
- Reduce memory footprint

### Validation Requirements

- Lighthouse score >90 on mobile
- No regression in functionality
- Maintains accessibility standards
- Performance budget compliance
```

**Auto-activations**: Triggers `--persona-performance`, `--think-hard`, `--play` for performance testing.

## Context Optimization Strategies

### 1. Project Structure Context

```markdown
### Project Architecture Context

- **Framework**: Next.js 15.4.6 with App Router
- **State Management**: TanStack Query + Zustand
- **UI Components**: Radix UI + CVA + Tailwind
- **Authentication**: Clerk with multi-tenant support
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Validation**: pnpm validate (TypeScript + ESLint + Prettier)
```

### 2. File Reference Context

```markdown
### Relevant Files

- **Similar Feature**: app/[locale]/workouts/page.tsx (reference pattern)
- **Shared Components**: components/ui/button.tsx, components/ui/card.tsx
- **API Routes**: app/api/workouts/route.ts
- **Types**: types/workout.ts
- **Utilities**: lib/utils.ts, lib/api-client.ts
```

### 3. Quality Standards Context

```markdown
### Quality Requirements

- **TypeScript**: Strict mode enabled, no any types
- **Testing**: Minimum 80% coverage for new code
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Core Web Vitals targets must be met
- **Validation**: Must pass pnpm validate before commit
```

## Task Decomposition Patterns

### 1. Complex Feature Decomposition

```markdown
## Task Breakdown: [Feature Name]

### Phase 1: Foundation (2-3 tasks)

1. Create TypeScript types and interfaces
2. Set up API routes with validation
3. Implement data fetching hooks

### Phase 2: UI Implementation (3-4 tasks)

1. Build mobile-responsive layout
2. Implement interactive components
3. Add loading and error states
4. Ensure accessibility compliance

### Phase 3: Integration (2-3 tasks)

1. Connect UI to API
2. Implement error handling
3. Add optimistic updates

### Phase 4: Polish (2-3 tasks)

1. Performance optimization
2. Add E2E tests
3. Documentation update
```

### 2. Progressive Enhancement Pattern

```markdown
## Progressive Implementation

### Milestone 1: Core Functionality

- Basic feature working
- Mobile-first implementation
- Essential accessibility

### Milestone 2: Enhanced Experience

- Animations and transitions
- Advanced interactions
- Performance optimizations

### Milestone 3: Production Ready

- Complete test coverage
- Error boundaries
- Analytics integration
```

## Quality Assurance Integration

### 1. Pre-Implementation Validation

```markdown
### Before Starting Development

1. Run: pnpm validate (ensure clean baseline)
2. Create feature branch: git checkout -b feature/[name]
3. Set up test file: tests/[feature].test.tsx
4. Define TypeScript types first
```

### 2. During Development Validation

```markdown
### Continuous Validation

- Use: pnpm dev:watch (real-time validation)
- Check: pnpm type-check:watch (TypeScript monitoring)
- Test: pnpm test:watch (continuous testing)
- Format: pnpm format:watch (auto-formatting)
```

### 3. Pre-Commit Validation

```markdown
### Before Committing

1. pnpm validate:fix (auto-fix issues)
2. pnpm test (ensure tests pass)
3. pnpm build (verify build success)
4. Review changes with validation
```

## TDD Integration Strategies

### 1. Test-First Feature Development

````markdown
## TDD Approach: [Feature Name]

### Step 1: Write Failing Tests

```typescript
// tests/features/[feature].test.tsx
describe('[Feature]', () => {
  it('should render without errors', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });

  it('should be accessible', () => {
    // Test implementation
  });
});
```
````

### Step 2: Implement Minimum Code

- Create component skeleton
- Add basic functionality
- Ensure tests pass

### Step 3: Refactor

- Improve code quality
- Optimize performance
- Maintain test coverage

````

### 2. TDD Recovery Pattern

```markdown
## Returning to TDD

### For Existing Code Without Tests
1. **Characterization Tests**: Write tests that document current behavior
2. **Refactor Safely**: Make improvements with test protection
3. **Add New Features**: Use TDD for all new code

### Implementation Strategy
- Start with integration tests for critical paths
- Add unit tests for complex logic
- Use snapshot tests for UI components
- Implement E2E tests for user workflows
````

### 3. Test-Driven Bug Fixes

````markdown
## TDD Bug Fix Process

### Step 1: Reproduce with Test

```typescript
it('should not [bug behavior]', () => {
  // This test should fail, demonstrating the bug
});
```
````

### Step 2: Fix the Bug

- Implement minimal fix
- Ensure test passes
- Verify no regressions

### Step 3: Prevent Regression

- Add additional test cases
- Document the fix
- Update related tests

````

## Mobile-First Prompt Patterns

### 1. Mobile UX Requirements

```markdown
### Mobile Design Requirements
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Gestures**: Support swipe for navigation, pull-to-refresh
- **Viewport**: Optimize for 375px width (iPhone SE)
- **Orientation**: Support both portrait and landscape
- **Performance**: Optimize for 3G networks and low-end devices
````

### 2. Responsive Design Patterns

```markdown
### Responsive Implementation

- **Mobile First**: Start with mobile layout (375px)
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px
- **Touch vs Mouse**: Use hover states only on non-touch devices
- **Adaptive Loading**: Reduce features on low-end devices
```

## Performance-Conscious Prompting

### 1. Performance Requirements

```markdown
### Performance Targets

- **Initial Load**: <3s on 3G, <1s on WiFi
- **Time to Interactive**: <5s on mobile
- **Bundle Size**: <500KB initial, <2MB total
- **Runtime Performance**: 60fps scrolling, <100ms interactions
```

### 2. Optimization Directives

```markdown
### Optimization Requirements

- Use dynamic imports for code splitting
- Implement virtual scrolling for long lists
- Optimize images with Next.js Image component
- Use React.memo for expensive components
- Implement proper caching strategies
```

## Accessibility-First Prompting

### 1. Accessibility Requirements

```markdown
### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Management**: Visible focus indicators, logical tab order
- **Error Handling**: Clear error messages with guidance
```

### 2. Testing Requirements

```markdown
### Accessibility Testing

- Use axe-core for automated testing
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard-only navigation
- Test with browser zoom at 200%
- Validate color contrast ratios
```

## Command Integration Patterns

### 1. Development Workflow Commands

```markdown
### Integrate with Project Commands

- Start development: pnpm dev:watch
- Validate continuously: pnpm validate:watch
- Fix issues: pnpm validate:fix
- Test changes: pnpm test
- Check types: pnpm type-check
```

### 2. Quality Gate Commands

```markdown
### Quality Verification

- Before commit: pnpm validate
- Fix all issues: pnpm dx:fix
- Clean imports: pnpm dx:clean-imports
- Full check: pnpm quick:check
```

## Best Practices Summary

### DO's

- ✅ Provide specific performance targets and budgets
- ✅ Include mobile-first requirements in every prompt
- ✅ Specify accessibility requirements explicitly
- ✅ Reference existing patterns and components
- ✅ Include validation and testing requirements
- ✅ Break complex tasks into phases
- ✅ Use TDD approach for new features
- ✅ Provide concrete success metrics

### DON'Ts

- ❌ Assume desktop-first development
- ❌ Skip accessibility requirements
- ❌ Ignore existing project patterns
- ❌ Bypass validation workflows
- ❌ Create components without tests
- ❌ Optimize prematurely without metrics
- ❌ Ignore TypeScript strict mode
- ❌ Skip internationalization support

## Example: Complete Feature Request

```markdown
## Feature: Workout Session Timer

### Context

I need to implement a workout session timer component for the AI Personal Trainer app. This will be used during active workout sessions to track exercise duration and rest periods.

### Requirements

- **Functionality**: Count-up timer for exercises, count-down for rest periods, pause/resume capability, audio cues at intervals
- **Mobile UX**: Large touch targets (min 44x44px), swipe to skip exercise, haptic feedback on timer events, works in background
- **Accessibility**: Screen reader announcements, keyboard shortcuts (space for pause/resume), high contrast mode
- **Performance**: <100ms UI updates, minimal battery drain, works offline
- **Internationalization**: Time format based on locale, translated UI labels

### Technical Implementation

- Location: components/workouts/session-timer.tsx
- State management: Use Zustand for timer state
- Reference: Similar to components/workouts/session-tracker.tsx
- Use existing Button and Card components from components/ui/

### Testing Requirements

- Unit tests for timer logic (target 90% coverage)
- E2E test for complete workout session flow
- Performance test for battery usage
- Accessibility audit must pass

### Success Criteria

- Timer accurate to 100ms
- Works when app is backgrounded
- Passes pnpm validate
- Lighthouse performance score >95
- WCAG 2.1 AA compliant

Please implement this following TDD approach:

1. Start with failing tests for timer logic
2. Implement minimal timer functionality
3. Add UI components with mobile-first design
4. Integrate with workout session flow
5. Optimize for performance
6. Add comprehensive test coverage
```

This prompting strategy ensures Claude Code has all necessary context to deliver high-quality, production-ready code that aligns with your project standards and development workflows.
