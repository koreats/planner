# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<vooster-docs>
- @vooster-docs/prd.md
- @vooster-docs/architecture.md
- @vooster-docs/guideline.md
- @vooster-docs/step-by-step.md
- @vooster-docs/tdd.md
- @vooster-docs/clean-code.md
- @vooster-docs/git-commit-message.md
- @vooster-docs/isms-p.md
</vooster-docs>

## Project Overview

This is a Korean personal goal and calendar management web application built with Next.js 15. The app focuses on hierarchical goal management (4 levels) with automatic progress calculation and integrated calendar functionality.

## Key Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing optimizations
node test-optimizations.js    # Verify React Query optimization setup
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with RLS policies
- **State Management**: @tanstack/react-query for server state, Zustand for client state
- **UI**: Radix UI components with Tailwind CSS
- **Authentication**: Supabase Auth

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── calendar/          # Calendar view
│   ├── dashboard/         # Main dashboard
│   ├── goals/             # Goal management
├── components/
│   ├── auth/              # Auth components
│   ├── calendar/          # Calendar-specific UI
│   ├── dashboard/         # Dashboard widgets
│   ├── goals/             # Goal management UI
│   ├── ui/                # Shadcn/UI components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── api/               # API client configuration
│   ├── query/             # React Query setup (config.ts, utils.ts)
│   ├── services/          # Business logic services
│   ├── supabase/          # Supabase client setup
├── types/                 # TypeScript type definitions
supabase/
├── migrations/            # Database migrations
```

### Database Schema

**Core Tables**:
- `categories`: Color-coded categories for events and goals
- `events`: Calendar events with date ranges and categories
- `goals`: Hierarchical goal structure (4 levels) with auto-calculated progress

**Key Features**:
- Row Level Security (RLS) policies for multi-tenant data isolation
- Automatic progress calculation for parent goals based on children
- Hierarchical validation with level constraints (1-4)
- Optimistic updates with React Query

### Data Flow Patterns

1. **Service Layer**: Business logic in `src/lib/services/` - each domain has its own service file
2. **React Query Integration**: Centralized caching configuration in `src/lib/query/config.ts`
3. **Custom Hooks**: Domain-specific hooks in `src/hooks/` wrap service calls with React Query
4. **Optimistic Updates**: Configured in `src/lib/query/utils.ts` for immediate UI feedback

## Development Guidelines

### Goal Management System
- 4-level hierarchy: 장기목표(1) → 연간목표(2) → 분기/월간목표(3) → 주간/일일목표(4)
- Progress automatically calculated from children to parents
- Level validation enforced at database level

### Component Patterns
- Use Radix UI primitives from `src/components/ui/`
- Form validation with react-hook-form + Zod schemas
- Date manipulation with date-fns
- Utility functions with es-toolkit (preferred over lodash)

### State Management
- Server state: React Query with custom hooks
- Client state: Minimal, prefer React Query when possible
- Forms: react-hook-form with controlled components

### Authentication Flow
- Supabase Auth with Next.js middleware
- Protected routes use AuthGuard component
- User context available through useAuth hook

## Common Tasks

### Adding New Features
1. Define TypeScript types in `src/types/`
2. Create service functions in `src/lib/services/`
3. Build custom hooks with React Query in `src/hooks/`
4. Implement UI components following existing patterns
5. Add database migrations if needed in `supabase/migrations/`

### Database Changes
1. Create migration file in `supabase/migrations/` with numbered prefix
2. Include RLS policies for new tables
3. Update TypeScript types to match schema changes
4. Test with local Supabase setup

### Performance Optimization
- React Query configuration optimizes caching and reduces API calls
- Run `node test-optimizations.js` to verify optimization setup
- Use prefetching strategies in utils for common data access patterns