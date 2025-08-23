# AI Personal Trainer PWA

A mobile-first Progressive Web App for families, friends, and gyms to create AI-powered workout plans, track sessions, and share equipment knowledge.

## 🎯 Project Vision

Transform fitness coaching through AI, making personalized training accessible and affordable for families while providing gyms with modern member engagement tools.

## 🏋️ Key Features

### For Families & Friends

- **AI Workout Generation**: Personalized plans using Claude AI based on goals and available equipment
- **Session Tracking**: Day-by-day workout execution with detailed exercise guidance
- **Equipment Database**: Shared gym equipment identification and alternatives
- **Progress Analytics**: Track improvements, streaks, and achievements
- **Group Motivation**: Family leaderboards and shared progress

### For Gyms (B2B Partnership)

- **White-label Branding**: Gym-branded apps for members
- **Equipment Management**: QR code integration and booking system
- **Member Analytics**: Usage metrics and engagement insights
- **Multi-tenant Architecture**: Support multiple gyms on single platform
- **Revenue Generation**: New income stream for gym partners

## 🛠️ Technology Stack

- **Frontend**: NextJS 15.4.6 (App Router), TanStack Query, Tailwind CSS
- **Authentication**: Clerk with multi-tenant organization support
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM
- **AI Integration**: Claude API for workout generation
- **Deployment**: Vercel with GitHub Actions CI/CD
- **Monitoring**: Sentry, Vercel Analytics, PostHog

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/my-ai-personal-trainer.git
cd my-ai-personal-trainer

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up database
pnpm db:setup

# Start development server
pnpm dev
```

## 📱 Progressive Web App

Optimized for mobile devices with:

- Native-like experience on iOS and Android
- Offline workout tracking capabilities
- Push notifications for workout reminders
- Install prompts for home screen access

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile PWA    │    │   Vercel Edge   │    │   NeonDB        │
│   React/NextJS  │◄───┤   API Routes    │◄───┤   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   Claude AI     │    │   Equipment     │
│   Multi-tenant  │    │   Async Jobs    │    │   QR Codes      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Business Model

### B2C (Direct to Consumer)

- **Free Tier**: 5 users per family group
- **Premium**: $5/month per family (unlimited members)

### B2B (Gym Partnerships)

- **Small Gym** (50-100 members): $50-100/month
- **Medium Gym** (100-300 members): $150-300/month
- **Large Gym** (300+ members): $400+/month
- **Revenue Share**: 70% platform, 30% gym partner

## 📈 Development Phases

### Phase 1: Foundation & Security (Weeks 1-2)

- Multi-tenant architecture setup
- Authentication and user management
- Database schema with row-level security
- Basic security measures (rate limiting, validation)

### Phase 2: Core Features (Weeks 3-4)

- AI workout generation with async processing
- Equipment database and QR code integration
- Session tracking and progress measurement
- PWA configuration and offline support

### Phase 3: Business Features (Weeks 5-6)

- Gym dashboard and analytics
- Equipment booking system
- White-label branding capabilities
- Business intelligence and reporting

### Phase 4: Production Ready (Weeks 7-8)

- Performance optimization
- Comprehensive monitoring
- Load testing and scaling validation
- Launch preparation

## 🤝 Contributing

We follow a PR-based workflow with small, focused commits:

1. Check out a feature branch from `main`
2. Make your changes following our coding standards
3. Write tests for new functionality
4. Submit a PR with detailed description
5. Code review and merge

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://my-ai-personal-trainer.vercel.app) (Coming Soon)
- [Documentation](./docs/)
- [Design Specifications](./specs/)
- [API Documentation](./docs/API.md)

---

Built with ❤️ for the fitness community
