# Contributing to AI Personal Trainer

Thank you for your interest in contributing to the AI Personal Trainer PWA! This document provides guidelines for contributing to the project.

## 🌟 How to Contribute

We welcome contributions in many forms:
- 🐛 Bug reports and fixes
- ✨ New features and enhancements
- 📝 Documentation improvements
- 🧪 Test coverage improvements
- 🎨 UI/UX improvements
- 🔧 Performance optimizations

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/ai-personal-trainer.git
   cd ai-personal-trainer
   ```
3. **Set up the development environment**:
   ```bash
   ./scripts/setup.sh
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Process

### Before You Start
- Check existing issues to avoid duplicate work
- Create an issue for major changes to discuss the approach
- Review the [Development Guide](./docs/DEVELOPMENT.md)
- Understand the [project phases](./specs/README.md)

### Code Standards

#### TypeScript
- Use strict mode and proper typing
- Avoid `any` type unless absolutely necessary
- Define interfaces for all data structures
- Use meaningful variable and function names

#### React Components
```typescript
// ✅ Good: Proper typing and structure
interface ButtonProps {
  variant: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function Button({ variant, onClick, children, disabled = false }: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`, disabled && 'btn-disabled')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ❌ Bad: Missing types and accessibility
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

#### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Ensure 44px minimum touch targets
- Implement proper focus states for accessibility
- Use semantic HTML elements

#### Accessibility Requirements
- All interactive elements must be keyboard accessible
- Proper ARIA labels and roles
- Color contrast ratio of at least 4.5:1
- Screen reader friendly content
- Focus management for modals and navigation

### Code Quality Checks

Before submitting your PR, ensure:
```bash
pnpm type-check    # TypeScript compilation
pnpm lint          # ESLint checks
pnpm format:check  # Prettier formatting
pnpm build         # Production build
```

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] **Mobile responsiveness**: Test on various screen sizes
- [ ] **PWA functionality**: Install prompt, offline behavior
- [ ] **Cross-browser**: Chrome, Firefox, Safari, Edge
- [ ] **Accessibility**: Screen readers, keyboard navigation
- [ ] **Performance**: Core Web Vitals, loading times

### Test Coverage (Phase 2+)
- Write unit tests for new functions and components
- Add integration tests for complex workflows  
- Include E2E tests for critical user journeys
- Maintain >80% test coverage

## 📝 Documentation Standards

### Code Documentation
```typescript
/**
 * Calculate the total calories burned during a workout session
 * @param exercises - Array of exercises performed
 * @param userWeight - User's weight in kilograms
 * @param duration - Session duration in minutes
 * @returns Total calories burned
 */
export function calculateCaloriesBurned(
  exercises: SessionExercise[], 
  userWeight: number, 
  duration: number
): number {
  // Implementation...
}
```

### Component Documentation
```typescript
/**
 * WorkoutCard displays a summary of a workout session
 * 
 * @example
 * <WorkoutCard
 *   workout={workoutData}
 *   onStart={handleStartWorkout}
 *   variant="compact"
 * />
 */
interface WorkoutCardProps {
  /** Workout data to display */
  workout: WorkoutSession
  /** Callback when start button is clicked */
  onStart: (workoutId: string) => void
  /** Card display variant */
  variant?: 'default' | 'compact'
}
```

### Specification Updates
- Update relevant specs when changing functionality
- Document new database schema changes
- Update API documentation for endpoint changes
- Include migration notes for breaking changes

## 🔄 Pull Request Process

### PR Requirements
1. **Clear title and description** explaining the changes
2. **Link to related issues** using "Closes #123"
3. **Screenshots** for UI changes
4. **Mobile testing evidence** for responsive changes
5. **Performance impact assessment** for significant changes

### PR Template Checklist
Use our [PR template](.github/pull_request_template.md) and ensure:
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Mobile functionality verified

### Review Process
1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing verification** on preview deployment
4. **Final approval** from project maintainer
5. **Merge** using squash and merge strategy

## 🚨 Security Guidelines

### Data Protection
- Never commit API keys, passwords, or secrets
- Use environment variables for sensitive data
- Implement proper input validation
- Follow OWASP security best practices
- Sanitize all user inputs, especially for AI prompts

### Authentication & Authorization
- Respect user permissions and roles
- Implement proper session management
- Use secure HTTP headers
- Validate all authentication tokens
- Implement rate limiting for API endpoints

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues for duplicates
2. Test on the latest version
3. Reproduce the issue consistently
4. Gather relevant information

### Bug Report Template
```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Device: iPhone 14 Pro / Desktop
- Browser: Safari 17.1
- OS: iOS 17.1
- App version: v0.1.0

## Screenshots
[Add screenshots if applicable]

## Additional Context
Any other relevant information
```

## ✨ Feature Requests

### Before Requesting
- Check if the feature aligns with project goals
- Review existing issues and discussions
- Consider the implementation complexity
- Think about user impact and benefits

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other ways to solve this problem

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Implementation Notes
Technical considerations or constraints

## Priority
- [ ] Low
- [ ] Medium  
- [ ] High
- [ ] Critical
```

## 📱 Mobile-First Development

### Design Principles
- Start with mobile (320px) and scale up
- Touch-friendly interactions (44px minimum)
- Fast loading on slow networks
- PWA best practices
- Offline-first approach

### Testing Requirements
- Test on actual mobile devices when possible
- Use Chrome DevTools device simulation
- Verify PWA installation works
- Check performance on 3G networks
- Ensure proper safe area handling (iPhone notch)

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions
- Address conflicts professionally

### Communication
- Use clear, concise language
- Provide helpful context in issues and PRs
- Respond to feedback promptly
- Ask questions when unclear
- Share knowledge and learning

## 🏆 Recognition

We appreciate all contributions! Contributors will be:
- Listed in project credits
- Mentioned in release notes for significant contributions
- Invited to join the core contributor team for consistent contributions
- Featured in project showcase for major features

## 📞 Getting Help

- **Development Questions**: GitHub Discussions
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Issues
- **Security Issues**: Email maintainers privately
- **Documentation**: Check `/docs` directory first

Thank you for contributing to AI Personal Trainer! Together, we're building the future of AI-powered fitness coaching. 💪