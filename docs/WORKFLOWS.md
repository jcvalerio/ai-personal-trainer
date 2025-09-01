# AI Personal Trainer - User Workflows Documentation

## Tech Stack Overview

- **Framework**: Next.js 15.4 (App Router)
- **Authentication**: Clerk
- **Database**: NeonDB (PostgreSQL)
- **Internationalization**: next-intl
- **State Management**: Zustand + TanStack React Query
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **AI Integration**: Vercel AI SDK (planned with Gemini)
- **Testing**: Playwright (E2E), Jest (Unit)

## Core User Workflows

### 1. User Registration & Onboarding

**Entry Point**: New user signs up via Clerk authentication

#### Steps:
1. **Authentication**: User signs up via Clerk (social or email/password)
2. **Profile Completion**: User redirected to `/[locale]/onboarding`
   - **Step 1**: Complete fitness profile (display name, avatar)
   - **Step 2**: Set fitness level (beginner/intermediate/advanced)
   - **Step 3**: Set fitness goals (multiple selection)
   - **Step 4**: Join/create community (optional)
   - **Step 5**: Complete setup → redirect to dashboard

#### Components Used:
- `FitnessLevelSelector` (from `/components/workouts/ui/fitness-level-selector.tsx`)
- `FitnessGoalsSelector` (from `/components/workouts/ui/fitness-goals-selector.tsx`)

#### Technical Implementation:
- **State**: React state with `OnboardingData` type
- **API**: POST `/api/user/profile` to save profile
- **Navigation**: Programmatic redirect to `/dashboard` after completion
- **Persistence**: User profile saved to NeonDB with Clerk metadata

#### Known Issues:
- ❌ Shows "null null" for email/password signup instead of email/display name
- ❌ Should display email when social integration name not available

---

### 2. AI Workout Generation

**Entry Point**: `/[locale]/workouts/generate`

#### Steps:
1. **Template Selection**: Choose between template-based or custom creation
   - **Option A**: Use proven workout template
   - **Option B**: Create from scratch
2. **Preference Setting**: Configure workout parameters
   - Fitness level selection
   - Fitness goals (multi-select)
   - Workout duration (20-120 minutes)
   - Days per week (1-7)
   - Available equipment
   - Limitations & considerations
3. **AI Generation**: Generate personalized workout plan
4. **Review & Customize**: Review generated workout, option to regenerate
5. **Save/Start**: Save as plan or start workout immediately

#### Components Used:
- `FitnessLevelSelector`
- `FitnessGoalsSelector`
- `EquipmentSelector`
- `LimitationsSelector`
- `ScheduleSliders`

#### Technical Implementation:
- **State**: Local React state for preferences
- **API Calls**:
  - GET `/api/workouts/templates` (featured templates)
  - GET `/api/workouts/templates/categories` (template categories) - **MISSING**
  - POST `/api/ai/generate-workout` - **TO BE IMPLEMENTED**
- **Navigation**: 
  - Successful generation → `/workouts/sessions/{SESSION_UUID}`
  - Dashboard redirect available

#### Known Issues:
- ❌ "Save as Plan" not working - 404 on `/api/workouts/templates/categories`
- ❌ "Start workout" navigates to fixed `/workouts/sessions/1` instead of dynamic UUID
- ❌ Missing AI integration with Gemini
- ❌ Template creation from PDF not implemented

---

### 3. Workout Session Execution

**Entry Point**: `/[locale]/workouts/sessions/[sessionId]`

#### Steps:
1. **Session Loading**: Load session data from API
2. **Session Initialization**: Initialize session execution context
3. **Exercise Execution**: Step through exercises with real-time tracking
   - Set completion tracking
   - Weight/reps/duration recording
   - Rest timer between sets
   - Progress visualization
4. **Session Completion**: Mark session as complete with metrics
5. **Results Analysis**: View session summary and statistics

#### Components Used:
- `SessionExecutionProvider` (context management)
- `EnhancedSessionInterface` (main execution UI)
- `SessionLoading` & `SessionErrorState` (loading states)

#### Technical Implementation:
- **State**: Context-based session execution state
- **API Calls**:
  - GET `/api/workouts/sessions/[sessionId]` (session data)
  - POST `/api/workouts/sessions/[sessionId]/progress` (real-time updates)
  - POST `/api/workouts/sessions/[sessionId]/complete` (session completion)
- **Persistence**: Real-time session progress saved to database
- **Recovery**: Session state recovery on page refresh

#### Known Issues:
- ❌ Sessions show "NOT_FOUND" error for valid UUIDs
- ❌ Sessions not marked as completed after finishing all exercises
- ❌ Fixed session ID (/1) used instead of proper UUID generation

---

### 4. Manual Workout Plan Creation

**Entry Point**: `/[locale]/workouts/create-manual`

#### Steps:
1. **Plan Basics**: Define plan name, description, and goals
2. **Weekly Schedule**: Set workout frequency and timing
3. **Session Templates**: Create individual workout sessions
   - Exercise selection
   - Sets, reps, and weight configuration
   - Rest periods and progression
4. **Plan Preview**: Review complete plan structure
5. **Save & Activate**: Save plan and make available for sessions

#### Components Used:
- `FormStateProvider` (form state management)
- `WizardContent` (step-by-step wizard UI)

#### Technical Implementation:
- **State**: Form state with React Hook Form + Zustand persistence
- **API**: POST `/api/workouts/plans` for plan creation
- **Validation**: Zod schemas for plan data validation
- **Navigation**: Step-by-step wizard with progress tracking

---

### 5. Progress Tracking & Measurements

**Entry Point**: `/[locale]/progress`

#### Steps:
1. **Dashboard Overview**: View fitness progress and statistics
2. **Log Measurements**: Record body measurements
   - Weight tracking
   - Body fat percentage
   - Muscle mass
   - Circumference measurements
3. **Progress Analysis**: View trends and progress charts
4. **Health Sync**: Optional integration with health devices

#### Components Used:
- `LogMeasurementDialog` (measurement entry)
- `HealthSyncDialog` (device integration)
- `StatCard` & `WorkoutStatsGrid` (statistics display)

#### Technical Implementation:
- **State**: React Query for server state + local form state
- **API Calls**:
  - GET `/api/progress/measurements` (retrieve measurements)
  - POST `/api/progress/measurements` (log new measurement)
  - GET `/api/progress/stats` (progress statistics)
- **Validation**: Zod schemas for measurement data

#### Known Issues:
- ❌ Log measurements endpoint returns 400 Bad Request
- ❌ Measurement validation errors not properly handled

---

## Data Flow Architecture

### State Management Strategy
- **Server State**: TanStack React Query for API data, caching, and synchronization
- **Client State**: Zustand for global application state
- **Form State**: React Hook Form for form management with Zod validation
- **Session State**: React Context for workout session execution
- **Authentication State**: Clerk for user authentication and session management

### API Endpoints Structure
```
/api/
├── user/
│   └── profile (POST) - User profile creation/update
├── workouts/
│   ├── templates/
│   │   ├── route.ts (GET, POST) - Template management
│   │   └── categories/route.ts - **MISSING**
│   ├── plans/
│   │   └── route.ts (GET, POST) - Workout plans
│   └── sessions/
│       └── [sessionId]/
│           ├── route.ts (GET) - Session data
│           ├── progress/route.ts (POST) - Progress updates
│           └── complete/route.ts (POST) - Session completion
├── progress/
│   ├── measurements/route.ts (GET, POST) - Body measurements
│   └── stats/route.ts (GET) - Progress statistics
└── ai/ - **TO BE CREATED**
    └── generate-workout/route.ts - AI workout generation
```

## Mobile-First Design Principles

### Touch-Friendly Interface
- **Minimum touch targets**: 44px × 44px (WCAG AA compliant)
- **Generous spacing**: Adequate space between interactive elements
- **Large buttons**: Easy-to-tap action buttons throughout workflows
- **Swipe gestures**: Intuitive navigation between workout exercises

### Responsive Design
- **Breakpoints**: Mobile-first approach with progressive enhancement
- **Component adaptation**: UI components adapt to screen size automatically
- **Performance**: Optimized for mobile data connections

## Internationalization (i18n)

### Implementation
- **Library**: next-intl for comprehensive internationalization
- **Structure**: Language files in `/messages/` directory
- **Components**: All user-facing text uses translation keys
- **Routing**: Locale-based routing with `/[locale]/` prefix

### Supported Languages
- English (en) - Primary
- Additional languages configurable via next-intl

## Error Handling Strategy

### User Experience
- **Loading States**: Comprehensive loading indicators for all async operations
- **Error Boundaries**: React error boundaries prevent application crashes
- **Fallback UI**: Graceful degradation when components fail
- **Retry Mechanisms**: User-friendly retry options for failed operations

### API Error Handling
- **Consistent Error Format**: Standardized error response structure
- **Status Codes**: Appropriate HTTP status codes for different error types
- **User Messages**: Human-readable error messages in multiple languages
- **Logging**: Comprehensive error logging for debugging

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Dynamic imports for route-based code splitting
- **Tree Shaking**: Eliminated unused code from bundles
- **Image Optimization**: Next.js Image component with WebP format

### Runtime Performance
- **React Query**: Efficient data fetching with caching and background updates
- **Memoization**: Strategic use of React.memo and useMemo for expensive operations
- **Virtual Scrolling**: For large lists (exercise databases, session history)

## Security Considerations

### Authentication & Authorization
- **Clerk Integration**: Secure authentication with social and email/password options
- **Session Management**: Secure session handling with automatic refresh
- **Route Protection**: Protected routes requiring authentication
- **API Security**: All API routes protected with authentication checks

### Data Validation
- **Client-Side**: React Hook Form with Zod validation
- **Server-Side**: API route validation with Zod schemas
- **Input Sanitization**: All user inputs sanitized and validated

---

## Testing Strategy

### E2E Testing (Playwright)
- **Critical User Flows**: All 5 main workflows covered
- **Mobile Testing**: Touch interactions and responsive design
- **Cross-Browser**: Chrome, Firefox, Safari compatibility
- **Visual Testing**: Screenshot comparisons for UI consistency

### Integration Testing
- **API Testing**: All endpoints tested with various input scenarios
- **Database Testing**: Data persistence and retrieval validation
- **Authentication Flow**: Complete auth flow testing

### Unit Testing (Jest)
- **Component Testing**: Individual component behavior and props
- **Utility Functions**: Helper functions and business logic
- **Custom Hooks**: Hook behavior and state management
- **Form Validation**: Zod schema validation logic

---

## Deployment & DevOps

### Environment Setup
- **Development**: Local development with hot reload
- **Staging**: Pre-production environment for testing
- **Production**: Optimized build with performance monitoring

### Database Management
- **NeonDB**: PostgreSQL database with connection pooling
- **Migrations**: Schema migrations with proper versioning
- **Backups**: Automated backups and recovery procedures

### Monitoring & Analytics
- **Error Tracking**: Application error monitoring
- **Performance Metrics**: Core Web Vitals and loading times
- **User Analytics**: User behavior and workflow completion rates

---

*Last Updated: 2025-01-09*
*Version: 1.0*