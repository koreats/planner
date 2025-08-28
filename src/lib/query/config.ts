import type { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Optimized settings for data synchronization and caching
 */

// Cache time configurations (in milliseconds)
export const CACHE_TIME = {
  // User data - rarely changes, cache longer
  USER: 1000 * 60 * 30, // 30 minutes
  
  // Categories - changes infrequently
  CATEGORIES: 1000 * 60 * 15, // 15 minutes
  
  // Goals - moderate change frequency
  GOALS: 1000 * 60 * 5, // 5 minutes
  GOALS_DETAIL: 1000 * 60 * 10, // 10 minutes for individual goal details
  
  // Events - frequent changes
  EVENTS: 1000 * 60 * 2, // 2 minutes
  EVENTS_DETAIL: 1000 * 60 * 5, // 5 minutes for individual event details
  
  // Dashboard data - needs to be fresh
  DASHBOARD: 1000 * 60 * 1, // 1 minute
  TODAY_TASKS: 1000 * 30, // 30 seconds for today's tasks
  OVERDUE: 1000 * 60 * 2, // 2 minutes for overdue items
  
  // Statistics and metrics - can be cached longer
  STATISTICS: 1000 * 60 * 10, // 10 minutes
  METRICS: 1000 * 60 * 15, // 15 minutes
} as const;

// Garbage collection time (how long to keep inactive data in cache)
export const GC_TIME = {
  DEFAULT: 1000 * 60 * 30, // 30 minutes default
  EXTENDED: 1000 * 60 * 60, // 1 hour for less frequently accessed data
  SHORT: 1000 * 60 * 10, // 10 minutes for frequently changing data
} as const;

// Retry configurations
export const RETRY_CONFIG = {
  DEFAULT_RETRY: 3,
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  SHOULD_RETRY: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors except 429 (rate limit)
    if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }
    return failureCount < 3;
  },
} as const;

// Refetch configurations
export const REFETCH_CONFIG = {
  // Refetch on window focus for fresh data
  REFETCH_ON_WINDOW_FOCUS: true,
  
  // Don't refetch on reconnect by default (can be overridden per query)
  REFETCH_ON_RECONNECT: 'always' as const,
  
  // Refetch interval for real-time data (disabled by default, enable per query)
  REFETCH_INTERVAL: false,
} as const;

// Network mode - online/offline handling
export const NETWORK_MODE = 'offlineFirst' as const; // Continue to use cached data when offline

/**
 * Create optimized default options for QueryClient
 */
export function createQueryClientOptions(): DefaultOptions {
  return {
    queries: {
      // Default stale time - data is considered fresh for this duration
      staleTime: CACHE_TIME.GOALS, // 5 minutes default
      
      // Default garbage collection time
      gcTime: GC_TIME.DEFAULT, // 30 minutes default
      
      // Retry configuration
      retry: RETRY_CONFIG.DEFAULT_RETRY,
      retryDelay: RETRY_CONFIG.RETRY_DELAY,
      
      // Refetch configurations
      refetchOnWindowFocus: REFETCH_CONFIG.REFETCH_ON_WINDOW_FOCUS,
      refetchOnReconnect: REFETCH_CONFIG.REFETCH_ON_RECONNECT,
      refetchInterval: REFETCH_CONFIG.REFETCH_INTERVAL,
      
      // Network mode
      networkMode: NETWORK_MODE,
      
      // Structural sharing for performance
      structuralSharing: true,
    },
    mutations: {
      // Retry configuration for mutations
      retry: 1, // Only retry mutations once
      retryDelay: RETRY_CONFIG.RETRY_DELAY,
      
      // Network mode
      networkMode: NETWORK_MODE,
    },
  };
}

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  
  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },
  
  // Goals
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.goals.lists(), filters] as const,
    tree: () => [...queryKeys.goals.all, 'tree'] as const,
    hierarchy: (parentId?: string) => [...queryKeys.goals.all, 'hierarchy', parentId] as const,
    details: () => [...queryKeys.goals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.goals.details(), id] as const,
    children: (parentId: string) => [...queryKeys.goals.all, 'children', parentId] as const,
    ancestors: (goalId: string) => [...queryKeys.goals.all, 'ancestors', goalId] as const,
    descendants: (goalId: string) => [...queryKeys.goals.all, 'descendants', goalId] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    data: (filters?: any) => [...queryKeys.dashboard.all, 'data', filters] as const,
    todayTasks: () => [...queryKeys.dashboard.all, 'today-tasks'] as const,
    overdueItems: () => [...queryKeys.dashboard.all, 'overdue'] as const,
    statistics: () => [...queryKeys.dashboard.all, 'statistics'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
    progressOverview: () => [...queryKeys.dashboard.charts(), 'progress-overview'] as const,
    categoryDistribution: () => [...queryKeys.dashboard.charts(), 'category-distribution'] as const,
    productivityMetrics: () => [...queryKeys.dashboard.charts(), 'productivity-metrics'] as const,
  },
} as const;

/**
 * Invalidation patterns for efficient cache updates
 */
export const invalidationPatterns = {
  // When a goal is updated, invalidate related queries
  onGoalUpdate: (goalId: string) => [
    queryKeys.goals.detail(goalId),
    queryKeys.goals.lists(),
    queryKeys.goals.tree(),
    queryKeys.dashboard.all,
  ],
  
  // When an event is updated, invalidate related queries
  onEventUpdate: (eventId: string) => [
    queryKeys.events.detail(eventId),
    queryKeys.events.lists(),
    queryKeys.dashboard.todayTasks(),
    queryKeys.dashboard.overdueItems(),
  ],
  
  // When a category is updated, invalidate related queries
  onCategoryUpdate: (categoryId: string) => [
    queryKeys.categories.detail(categoryId),
    queryKeys.categories.lists(),
    queryKeys.events.lists(), // Events may have categories
    queryKeys.goals.lists(), // Goals may have categories
  ],
} as const;