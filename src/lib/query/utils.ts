import { QueryClient } from '@tanstack/react-query';
import { debounce, throttle } from 'es-toolkit';
import { queryKeys, invalidationPatterns } from './config';
import type { Goal } from '@/types/goals';
import type { Event } from '@/types/calendar';

/**
 * Data synchronization utilities for React Query
 */

/**
 * Prefetch common data that will be needed soon
 */
export async function prefetchCommonData(queryClient: QueryClient) {
  // Import services dynamically to avoid circular dependencies
  const [
    { categoryService },
    { goalService },
    { eventService },
    { dashboardService },
  ] = await Promise.all([
    import('@/lib/services/categoryService'),
    import('@/lib/services/goalService'),
    import('@/lib/services/eventService'),
    import('@/lib/services/dashboardService'),
  ]);

  // Prefetch categories (rarely change, used everywhere)
  await queryClient.prefetchQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => categoryService.getCategories(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Prefetch goal tree structure
  await queryClient.prefetchQuery({
    queryKey: queryKeys.goals.tree(),
    queryFn: () => goalService.getGoalTree(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch today's events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events.list({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    }),
    queryFn: () => eventService.getEvents({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Prefetch dashboard data
  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.todayTasks(),
    queryFn: async () => {
      const data = await dashboardService.getDashboardData();
      return data.todayTasks;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Smart invalidation - invalidate only what's necessary
 */
export function smartInvalidate(
  queryClient: QueryClient,
  type: 'goal' | 'event' | 'category',
  id?: string
) {
  switch (type) {
    case 'goal':
      if (id) {
        // Invalidate specific goal and related data
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.detail(id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.children(id),
        });
      }
      // Always invalidate lists and dashboard when goals change
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
      break;

    case 'event':
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detail(id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayTasks(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overdueItems(),
      });
      break;

    case 'category':
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.categories.detail(id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
      });
      // Categories affect both events and goals
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.all,
      });
      break;
  }
}

/**
 * Optimistic update helper for goals
 */
export function createOptimisticGoalUpdate<T extends Partial<Goal>>(
  queryClient: QueryClient,
  goalId: string,
  updates: T
) {
  const previousGoal = queryClient.getQueryData<Goal>(
    queryKeys.goals.detail(goalId)
  );

  if (previousGoal) {
    // Update the specific goal
    queryClient.setQueryData(
      queryKeys.goals.detail(goalId),
      { ...previousGoal, ...updates }
    );

    // Update in the list
    const previousGoals = queryClient.getQueryData<Goal[]>(
      queryKeys.goals.lists()
    );
    
    if (previousGoals) {
      queryClient.setQueryData(
        queryKeys.goals.lists(),
        previousGoals.map(goal => 
          goal.id === goalId ? { ...goal, ...updates } : goal
        )
      );
    }
  }

  return previousGoal;
}

/**
 * Optimistic update helper for events
 */
export function createOptimisticEventUpdate<T extends Partial<Event>>(
  queryClient: QueryClient,
  eventId: string,
  updates: T
) {
  const previousEvent = queryClient.getQueryData<Event>(
    queryKeys.events.detail(eventId)
  );

  if (previousEvent) {
    // Update the specific event
    queryClient.setQueryData(
      queryKeys.events.detail(eventId),
      { ...previousEvent, ...updates }
    );

    // Update in all lists that might contain this event
    queryClient.setQueriesData(
      { queryKey: queryKeys.events.lists() },
      (old: Event[] | undefined) => {
        if (!old) return old;
        return old.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        );
      }
    );
  }

  return previousEvent;
}

/**
 * Batch invalidation - useful for bulk operations
 */
export const batchInvalidate = debounce(
  (queryClient: QueryClient, queryKeys: any[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  },
  500 // Wait 500ms to batch invalidations
);

/**
 * Progressive data loading - load data in priority order
 */
export async function progressiveDataLoad(queryClient: QueryClient) {
  // Priority 1: User data and categories (needed for UI)
  await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.auth.user(),
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.categories.lists(),
    }),
  ]);

  // Priority 2: Today's data (immediately visible)
  await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.dashboard.todayTasks(),
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.dashboard.overdueItems(),
    }),
  ]);

  // Priority 3: Full dashboard and goals (background)
  await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.goals.tree(),
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.dashboard.statistics(),
    }),
  ]);
}

/**
 * Sync related queries after mutation
 */
export async function syncRelatedQueries(
  queryClient: QueryClient,
  type: 'goal' | 'event',
  id: string
) {
  if (type === 'goal') {
    // When a goal changes, we need to update parent/child relationships
    const goal = queryClient.getQueryData<Goal>(queryKeys.goals.detail(id));
    
    if (goal?.parentId) {
      // Invalidate parent to recalculate progress
      await queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(goal.parentId),
      });
      
      // Invalidate siblings
      await queryClient.invalidateQueries({
        queryKey: queryKeys.goals.children(goal.parentId),
      });
    }
    
    // Invalidate children if this is a parent goal
    await queryClient.invalidateQueries({
      queryKey: queryKeys.goals.children(id),
    });
  }

  // Always sync dashboard data after changes
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.all,
  });
}

/**
 * Throttled refresh for real-time features
 */
export const throttledRefresh = throttle(
  (queryClient: QueryClient, queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
  },
  1000 // Max once per second
);

/**
 * Clear stale data from cache
 */
export function clearStaleData(queryClient: QueryClient) {
  // Remove all inactive queries that are older than their gcTime
  queryClient.removeQueries({
    predicate: (query) => {
      return query.state.fetchStatus === 'idle' && 
             query.state.dataUpdateCount === 0;
    },
  });
}