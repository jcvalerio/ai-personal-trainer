# E2E Testing Framework

Comprehensive End-to-End testing framework for the AI Personal Trainer application using Playwright.

## 🎯 Overview

This testing framework provides complete E2E test coverage for the workout system including:

- **Authentication flow** using provided test credentials
- **User onboarding** and profile creation
- **Workout dashboard** navigation and functionality
- **Workout plan** creation and management
- **Exercise library** browsing and search
- **Session tracking** and real-time updates
- **Progress tracking** and analytics
- **AI workout generation** flow

## 📁 Test Structure

```
tests/e2e/
├── auth/                      # Authentication tests
│   └── authentication.spec.ts
├── dashboard/                 # Dashboard functionality tests
│   └── dashboard.spec.ts
├── workouts/                  # Workout management tests
│   └── workout-management.spec.ts
├── exercises/                 # Exercise library tests
│   └── exercises.spec.ts
├── progress/                  # Progress tracking tests
│   └── progress.spec.ts
├── utils/                     # Test utilities and helpers
│   ├── auth.utils.ts         # Authentication utilities
│   ├── test-data.utils.ts    # Test data management
│   ├── page-objects/         # Page object models
│   └── index.ts              # Utility exports
├── auth.setup.ts             # Authentication setup
├── cleanup.teardown.ts       # Test cleanup
└── run-tests.sh             # Test runner script
```

## 🚀 Quick Start

### Prerequisites

1. Node.js 18+ and pnpm installed
2. Development server running (`pnpm dev`)
3. Test credentials configured

### Environment Setup

1. **Set test credentials** (provided by user):

   ```bash
   export CLERK_CLAUDE_TEST_USER_EMAIL="appttitude@gmail.com"
   export CLERK_CLAUDE_TEST_USER_PASSWORD="JuanK@1979"
   ```

2. **Install Playwright browsers**:

   ```bash
   pnpm test:e2e:install
   ```

3. **Run all tests**:
   ```bash
   pnpm test:e2e
   ```

## 🧪 Test Commands

### Basic Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run with browser visible
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug

# Show test report
pnpm test:e2e:report
```

### Specific Test Suites

```bash
# Authentication tests only
pnpm test:e2e:auth

# Dashboard tests only
pnpm test:e2e:dashboard

# Workout management tests
pnpm test:e2e:workouts

# Exercise library tests
pnpm test:e2e:exercises

# Progress tracking tests
pnpm test:e2e:progress
```

### Advanced Commands

```bash
# Use custom test runner script
./tests/e2e/run-tests.sh [test-type] [options]

# Examples:
./tests/e2e/run-tests.sh auth --headed
./tests/e2e/run-tests.sh workouts --debug
./tests/e2e/run-tests.sh all --clean --report
```

## 🔧 Configuration

### Main Configuration

- `playwright.config.ts` - Main Playwright configuration
- `playwright-simple.config.ts` - Simplified config for basic tests

### Environment Files

- `.env.test` - Test-specific environment variables
- Test credentials should be set as environment variables

### Key Configuration Options

```typescript
// playwright.config.ts highlights
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Browser projects
  projects: ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari'],

  // Auto-start dev server
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
}
```

## 🏗️ Test Architecture

### Page Object Models

Organized page objects for maintainable tests:

```typescript
// Example usage
import { SignInPage, DashboardPage } from './utils/page-objects';

const signInPage = new SignInPage(page);
await signInPage.signIn(email, password);

const dashboard = new DashboardPage(page);
await dashboard.verifyUserAuthenticated();
```

### Test Utilities

#### Authentication Utils

```typescript
import { AuthUtils } from './utils/auth.utils';

const authUtils = new AuthUtils(page);
await authUtils.signIn(); // Uses provided test credentials
await authUtils.verifyAuthenticated();
await authUtils.signOut();
```

#### Test Data Utils

```typescript
import { TestDataUtils } from './utils/test-data.utils';

const testData = new TestDataUtils(page);
const workoutPlans = testData.generateWorkoutPlans();
const planId = await testData.createWorkoutPlan(workoutPlans[0]);
```

### Authentication Flow

Tests use the provided credentials:

- **Email**: `appttitude@gmail.com`
- **Password**: `JuanK@1979`

The framework handles:

1. Sign-in with test credentials
2. Onboarding completion if needed
3. Authentication state management
4. Session cleanup

## 📊 Test Coverage

### Authentication Tests

- ✅ Sign-in page loading and form validation
- ✅ Successful authentication with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Navigation between sign-in/sign-up pages
- ✅ Onboarding flow completion
- ✅ Sign-out functionality
- ✅ Protected route redirection
- ✅ Session persistence across reloads

### Dashboard Tests

- ✅ Dashboard loading and content display
- ✅ Welcome message and user info
- ✅ Workout summary and statistics
- ✅ Navigation menu functionality
- ✅ Quick actions (start workout, create plan, AI generation)
- ✅ Recent workouts display
- ✅ Progress chart rendering
- ✅ Mobile responsive layout
- ✅ Performance and error handling

### Workout Management Tests

- ✅ Workout listing and display
- ✅ Search and filtering functionality
- ✅ Workout selection and details
- ✅ Plan creation and management
- ✅ AI workout generation with parameters
- ✅ Equipment and fitness level selection
- ✅ Generated workout saving
- ✅ API integration for workout data

### Exercise Library Tests

- ✅ Exercise library browsing
- ✅ Exercise search functionality
- ✅ Category filtering
- ✅ Exercise detail views
- ✅ Exercise media display
- ✅ Add to workout functionality
- ✅ Navigation integration

### Progress Tracking Tests

- ✅ Progress overview display
- ✅ Workout statistics
- ✅ Progress charts and visualizations
- ✅ Time period filtering
- ✅ Workout history
- ✅ Goal tracking
- ✅ Personal records
- ✅ Data export functionality
- ✅ Measurement tracking

## 🛠️ Debugging

### Test Failures

1. **Check screenshots** in `test-results/screenshots/`
2. **Review videos** in test results
3. **Use trace viewer**:
   ```bash
   pnpm exec playwright show-trace test-results/trace.zip
   ```

### Debug Mode

```bash
# Run single test in debug mode
pnpm exec playwright test --debug tests/e2e/auth/authentication.spec.ts
```

### Headed Mode

```bash
# Run with browser visible
pnpm test:e2e:headed
```

## 📈 CI/CD Integration

### GitHub Actions

Configured workflow: `.github/workflows/e2e-tests.yml`

Features:

- ✅ Multi-browser testing (Chrome, Firefox, Safari)
- ✅ Parallel test execution
- ✅ Test result artifacts
- ✅ Screenshot capture on failures
- ✅ HTML report generation
- ✅ PR comment integration
- ✅ GitHub Pages report deployment

### Environment Variables for CI

Required secrets in GitHub repository:

```bash
CLERK_CLAUDE_TEST_USER_EMAIL=appttitude@gmail.com
CLERK_CLAUDE_TEST_USER_PASSWORD=JuanK@1979
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
ENCRYPTION_KEY=...
CLERK_WEBHOOK_SECRET=whsec_...
```

## 🔐 Security Considerations

1. **Test credentials** are provided and should only be used for testing
2. **Environment variables** for sensitive data in CI
3. **Test data isolation** with cleanup after tests
4. **No production data** in test environment
5. **Secure authentication flows** tested without exposing credentials

## 📝 Best Practices

### Writing Tests

1. **Use Page Object Models** for maintainable tests
2. **Wait for elements** properly with Playwright's auto-waiting
3. **Use data attributes** (`data-testid`) for reliable selectors
4. **Test user workflows** not implementation details
5. **Handle loading states** and async operations
6. **Clean up test data** after test runs

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - no dependencies between tests
4. **Use setup/teardown** appropriately
5. **Parallel execution safe** - no shared state

### Error Handling

1. **Graceful degradation** when features not available
2. **Meaningful error messages** in test failures
3. **Screenshot and video** capture for debugging
4. **Retry logic** for flaky network operations
5. **Proper timeout handling** for different operations

## 🚨 Troubleshooting

### Common Issues

**Environment Variable Issues**:

```bash
# Check if variables are set
echo $CLERK_CLAUDE_TEST_USER_EMAIL
echo $CLERK_CLAUDE_TEST_USER_PASSWORD
```

**Server Not Running**:

```bash
# Ensure dev server is running
pnpm dev

# Or run tests with server start disabled
SKIP_SERVER_START=true pnpm test:e2e
```

**Browser Installation**:

```bash
# Reinstall Playwright browsers
pnpm exec playwright install --force
```

**Test Timeouts**:

- Check network connectivity
- Verify server is responsive
- Increase timeout in configuration if needed

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [CI/CD Integration](https://playwright.dev/docs/ci-intro)

## 🎉 Summary

The E2E testing framework is now fully configured with:

- ✅ **Comprehensive test coverage** for all workout system features
- ✅ **Robust authentication testing** with provided test credentials
- ✅ **Maintainable architecture** using page object models
- ✅ **CI/CD integration** with GitHub Actions
- ✅ **Multiple test execution options** for different scenarios
- ✅ **Detailed debugging capabilities** with screenshots and traces
- ✅ **Production-ready configuration** for reliable test execution

The framework is ready for immediate use and can be extended as new features are added to the application.
