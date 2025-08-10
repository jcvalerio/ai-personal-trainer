# 🏋️ AI Personal Trainer - Developer Guide

**Welcome to the AI Personal Trainer PWA development team!** This guide will get you from zero to productive in under 10 minutes.

## 🚀 Quick Start (< 5 minutes)

### Prerequisites
- **Node.js 18.17.0+** (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm 8.0.0+** (`npm install -g pnpm`)
- **Git** with SSH keys configured

### 1. Clone & Setup
```bash
git clone <repository-url>
cd ai-personal-trainer

# One-command setup (installs everything)
make setup
# OR traditional way:
pnpm setup:first-time
```

### 2. Environment Configuration
```bash
# Create environment file
cp .env.example .env.local

# Edit with your API keys (required):
# - DATABASE_URL (NeonDB)
# - CLERK_* keys (authentication)  
# - OPENAI_API_KEY (AI features)
```

### 3. Validate & Start
```bash
# Validate everything is working
make check

# Start development server
make dev
# OR: pnpm dev
```

**🎉 That's it! Your dev server should be running at http://localhost:3000**

---

## 📋 Development Commands

### Essential Daily Commands
```bash
make dev          # 🚀 Start development server
make check        # ✅ Run all quality checks
make fix          # 🔧 Fix linting/formatting
make test         # 🧪 Run all tests
make deploy       # 🚀 Deploy to preview
```

### Quick Validation
```bash
make ready        # ✅ Check if ready for deployment
make troubleshoot # 🏥 Diagnose common issues
make health       # 🏥 Check app health (when running)
```

### Database Operations
```bash
make db-setup     # 🗄️ Setup database tables
make db-check     # 🔍 Test database connection
make db-migrate   # ⚡ Run migrations
```

### Maintenance
```bash
make clean        # 🧹 Clean build cache
make clean-install # 🧹 Fresh install
make status       # 📊 Show project status
```

---

## 🏗️ Project Architecture

### Directory Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── (auth)/           # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   └── workouts/         # Workout-specific components
├── lib/                   # Utilities and services
│   ├── db/               # Database utilities
│   ├── services/         # Business logic services
│   └── validation/       # Zod schemas
├── scripts/              # Development/deployment scripts
├── tests/                # End-to-end tests (Playwright)
└── docs/                 # Documentation
```

### Key Technologies
- **Next.js 15** - Full-stack React framework
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **Clerk** - Authentication & user management
- **NeonDB** - Serverless PostgreSQL database
- **OpenAI API** - AI workout generation
- **Playwright** - End-to-end testing

---

## 🔧 Development Workflow

### Daily Workflow
1. **Pull latest changes**: `git pull`
2. **Start development**: `make dev`
3. **Make changes** with hot reload
4. **Run checks**: `make check` (before committing)
5. **Commit changes** (pre-commit hooks will run)
6. **Deploy preview**: `make deploy`

### Feature Development
1. **Create feature branch**: `git checkout -b feature/awesome-feature`
2. **Develop with tests**: Write code + tests
3. **Validate**: `make ready` (full validation)
4. **Create PR**: Push and create pull request
5. **Review & merge**: Team review process
6. **Deploy**: Automatic deployment on merge

### Code Quality Gates
**Pre-commit hooks automatically run:**
- ✅ Environment validation
- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Prettier formatting
- ✅ Security checks (API keys, secrets)
- ✅ Build validation (for config changes)

---

## 🧪 Testing Strategy

### Test Types
```bash
# E2E Tests (Playwright)
pnpm test:e2e              # All tests
pnpm test:e2e:ui           # With UI
pnpm test:e2e:auth         # Auth tests only
pnpm test:e2e:dashboard    # Dashboard tests
pnpm test:e2e:workouts     # Workout tests

# Debug Tests
pnpm test:e2e:debug        # Debug mode
pnpm test:e2e:headed       # Show browser
```

### Writing Tests
- **Test files**: `tests/e2e/**/*.spec.ts`
- **Page objects**: `tests/e2e/utils/page-objects/`
- **Test data**: `tests/e2e/utils/test-data.utils.ts`

Example test:
```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects/dashboard.page';

test('user can view dashboard', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.navigate();
  await expect(dashboard.welcomeMessage).toBeVisible();
});
```

---

## 🚀 Deployment Guide

### Preview Deployment (Automatic)
- **Every PR** gets a preview deployment
- **URL**: Posted in PR comments
- **Environment**: Preview database & auth

### Production Deployment
```bash
# Check readiness
make ready

# Deploy to production (requires approval)
make deploy-prod
```

### Environment Requirements
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | NeonDB connection |
| `CLERK_*` | ✅ | Authentication keys |
| `OPENAI_API_KEY` | ✅ | AI features |
| `SENTRY_DSN` | ⚪ | Error tracking |
| `POSTHOG_KEY` | ⚪ | Analytics |

---

## 🛠️ IDE Setup (VS Code)

### Recommended Extensions (auto-suggested)
- **Essential**: ESLint, Prettier, Tailwind CSS IntelliSense
- **TypeScript**: TypeScript Hero, Path Intellisense
- **Testing**: Playwright Test for VS Code
- **Git**: GitLens, GitHub Pull Requests
- **Optional**: GitHub Copilot, Error Lens

### Shortcuts & Commands
| Command | Shortcut | Description |
|---------|----------|-------------|
| `Cmd+Shift+P` → "Tasks" | - | Run development tasks |
| `F5` | - | Debug Next.js server |
| `Cmd+Shift+T` | - | Run tests |

### Settings
Project includes optimized VS Code settings:
- Auto-format on save
- ESLint integration
- Tailwind intellisense
- File nesting for cleaner explorer

---

## 🏥 Troubleshooting

### Common Issues & Solutions

#### "pnpm not found"
```bash
npm install -g pnpm
```

#### "Environment validation failed"
```bash
# Check what's missing
pnpm env:check

# Copy example file
cp .env.example .env.local
# Edit .env.local with your values
```

#### "Database connection failed"
```bash
# Check connection
make db-check

# Verify DATABASE_URL in .env.local
# Format: postgresql://user:pass@host/db?sslmode=require
```

#### "Build fails" 
```bash
# Clean and reinstall
make clean-install

# Check for TypeScript errors
pnpm type-check

# Check for lint errors
pnpm lint
```

#### "Tests failing"
```bash
# Install Playwright browsers
pnpm test:e2e:install

# Run specific test with debug
pnpm test:e2e:debug tests/e2e/auth/
```

### Advanced Troubleshooting
```bash
# Complete diagnostic
make troubleshoot

# Debug environment
make debug-env

# Debug build
make debug-build

# Show project status
make status
```

---

## 📊 Performance & Monitoring

### Local Performance Testing
```bash
# Lighthouse CI
pnpm lighthouse

# Bundle analysis
pnpm analyze

# Check build size
pnpm build && ls -la .next/
```

### Production Monitoring
- **Sentry**: Error tracking & performance
- **Vercel Analytics**: Core Web Vitals
- **Health endpoint**: `/api/health`

### Performance Budgets
- **Bundle size**: <500KB initial, <2MB total
- **Load time**: <3s on 3G, <1s on WiFi
- **Lighthouse score**: >90 across all metrics

---

## 🔒 Security Guidelines

### Environment Variables
- **Never commit** `.env.local` or secrets
- **Use descriptive names** but not values in code
- **Validate required vars** on startup

### API Security
- **Rate limiting** implemented
- **Input validation** with Zod schemas
- **Authentication** required for protected routes
- **CORS** properly configured

### Database Security
- **Connection pooling** with NeonDB
- **Prepared statements** prevent SQL injection
- **Row-level security** for multi-tenant data

---

## 🤝 Contributing Guidelines

### Code Style
- **TypeScript** for all new code
- **Functional components** with hooks
- **Tailwind CSS** for styling
- **Descriptive variable names**

### Commit Messages
```bash
feat: add workout generation API
fix: resolve authentication redirect issue
docs: update deployment guide
refactor: simplify database connection logic
```

### Pull Request Process
1. **Feature branch** from main
2. **Descriptive PR title** and description
3. **All checks pass** (automated)
4. **Team review** (at least 1 approval)
5. **Merge to main** triggers deployment

### Review Checklist
- [ ] Code follows project patterns
- [ ] Tests added/updated
- [ ] Environment variables documented
- [ ] Performance considered
- [ ] Security reviewed
- [ ] Accessibility tested

---

## 📚 Additional Resources

### Documentation
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Comprehensive deployment info
- [API Documentation](./docs/API.md) - API endpoints and schemas
- [Database Schema](./docs/DATABASE.md) - Database design and migrations

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [NeonDB Docs](https://neon.tech/docs)
- [Playwright Testing](https://playwright.dev/docs)

### Team Resources
- **Slack**: `#ai-trainer-dev`
- **Design**: Figma workspace
- **Issues**: GitHub Issues
- **Knowledge Base**: Notion workspace

---

## 🎯 Success Metrics

### Developer Experience Goals
- ⚡ **Setup time**: <10 minutes from clone to running
- 🔄 **Hot reload**: <2 seconds for changes
- ✅ **CI/CD**: <5 minutes for deployment
- 🐛 **Debug time**: Clear error messages and logs

### Code Quality Metrics
- 📊 **TypeScript coverage**: >95%
- 🧪 **Test coverage**: >80%
- 🚀 **Performance score**: >90 Lighthouse
- 🔒 **Security score**: A+ security headers

---

**Happy coding! 🎉** 

If you run into issues, check the troubleshooting section or run `make troubleshoot` for automated diagnostics.