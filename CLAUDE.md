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
