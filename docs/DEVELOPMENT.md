# Development Guide

This guide will help you set up and contribute to the AI Personal Trainer PWA project.

## 🚀 Quick Start

1. **Prerequisites**
   - Node.js 18.17.0 or higher
   - pnpm 8.0.0 or higher
   - Git

2. **Setup**
   ```bash
   git clone https://github.com/yourusername/ai-personal-trainer.git
   cd ai-personal-trainer
   ./scripts/setup.sh
   ```

3. **Development**
   ```bash
   pnpm dev
   ```
   
   The app will be available at http://localhost:3000

## 📁 Project Structure

```
ai-personal-trainer/
├── app/                    # NextJS App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable UI components
│   ├── ui/                # Basic UI components
│   └── sections/          # Page sections
├── lib/                   # Utilities and configurations
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript type definitions
│   └── index.ts           # Core types
├── specs/                 # Design specifications
│   ├── phase-1/           # Foundation specs
│   ├── phase-2/           # Core feature specs
│   ├── phase-3/           # Business feature specs
│   ├── phase-4/           # Production specs
│   └── database/          # Database design
├── docs/                  # Documentation
├── scripts/               # Development scripts
└── public/                # Static assets
```

## 🛠️ Development Workflow

### 1. Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### 2. Commit Message Format
```
type(scope): description

Examples:
feat(auth): add Clerk authentication setup
fix(ui): resolve mobile navigation overflow
docs: update development setup guide
```

### 3. Pull Request Process
1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Write tests for new functionality
4. Submit a PR with detailed description
5. Address code review feedback
6. Merge after approval

## 🧪 Testing

### Unit Tests (Coming in Phase 2)
```bash
pnpm test          # Run tests
pnpm test:ui       # Run tests with UI
```

### E2E Tests (Coming in Phase 2)
```bash
pnpm test:e2e      # Run E2E tests
pnpm test:e2e:ui   # Run E2E tests with UI
```

### Manual Testing Checklist
- [ ] Mobile responsiveness (iPhone 14 Pro, Android)
- [ ] PWA functionality (install, offline)
- [ ] Accessibility (screen readers, keyboard nav)
- [ ] Performance (Core Web Vitals)
- [ ] Cross-browser compatibility

## 🎨 Code Style

### TypeScript
- Use strict mode configuration
- Define interfaces for all data structures
- Use type-safe APIs and proper error handling
- Avoid `any` type unless absolutely necessary

### React Components
```typescript
// Good: Functional component with proper typing
interface ButtonProps {
  variant: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
}

export function Button({ variant, onClick, children }: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Ensure 44px minimum touch targets
- Implement proper focus states

### File Organization
- Keep components small and focused
- Use barrel exports for clean imports
- Group related functionality in directories
- Follow naming conventions consistently

## 🔧 Available Scripts

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint issues
pnpm type-check    # Run TypeScript checking
pnpm format        # Format code with Prettier
pnpm analyze       # Analyze bundle size
```

## 📱 Mobile Development

### PWA Requirements
- Responsive design (320px to 1920px)
- Touch-friendly interactions (44px targets)
- Fast loading (< 3s on 3G)
- Offline functionality
- Install prompts

### Testing on Devices
1. Use Chrome DevTools mobile simulation
2. Test on actual devices when possible
3. Verify PWA features work correctly
4. Check performance on slower networks

## 🚀 Deployment

### Staging
- Automatic deployment on PR to `main`
- Preview URLs provided in PR comments
- Test all changes before merging

### Production
- Automatic deployment on merge to `main`
- Runs full CI/CD pipeline
- Monitors Core Web Vitals
- Creates Sentry release (when configured)

## 🔐 Environment Variables

Create `.env.local` file:
```env
# Required for development
NODE_ENV=development

# Database (NeonDB) - Add in Phase 1 PR #3
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication (Clerk) - Add in Phase 1 PR #2
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Integration (Claude) - Add in Phase 2
ANTHROPIC_API_KEY=sk-ant-...
```

## 🐛 Debugging

### Development Tools
- React Developer Tools
- Next.js debugger configuration
- TypeScript error checking
- ESLint warnings and errors

### Common Issues
1. **Build fails**: Check TypeScript errors and dependencies
2. **Styles not applying**: Verify Tailwind configuration
3. **Hot reload not working**: Restart dev server
4. **Type errors**: Update type definitions

## 📚 Learning Resources

### Technology Stack
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

### PWA Development
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Workbox (Service Workers)](https://developers.google.com/web/tools/workbox)

### AI Integration
- [Anthropic Claude API](https://docs.anthropic.com/claude/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🤝 Getting Help

- **Documentation**: Check `/docs` and `/specs` directories
- **Issues**: Create GitHub issues for bugs and features
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Request reviews from maintainers

## 📈 Performance Guidelines

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Best Practices
- Optimize images (use Next.js Image component)
- Lazy load below-the-fold content
- Minimize bundle size (analyze with `pnpm analyze`)
- Use proper caching strategies
- Implement progressive loading states

### Mobile Performance
- Target 60fps animations
- Optimize for 3G networks
- Implement proper loading states
- Use efficient data structures
- Minimize main thread blocking

This guide will be updated as the project evolves. Always refer to the latest version for current practices and standards.