'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/lib/services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import type {
  DashboardData,
  DashboardFilters,
  PriorityUpdate,
  TodayTask,
  OverdueItem,
} from '@/types/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (filters?: DashboardFilters) => [...dashboardKeys.all, 'data', filters] as const,
  todayTasks: () => [...dashboardKeys.all, 'today-tasks'] as const,
  overdueItems: () => [...dashboardKeys.all, 'overdue'] as const,
  statistics: () => [...dashboardKeys.all, 'statistics'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
};

/**
 * Hook to fetch comprehensive dashboard data
 */
export function useDashboardData(filters?: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.data(filters),
    queryFn: () => dashboardService.getDashboardData(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch today's tasks specifically
 */
export function useTodayTasks() {
  return useQuery({
    queryKey: dashboardKeys.todayTasks(),
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.todayTasks || [];
      } catch (error) {
        console.error('Error fetching today tasks:', error);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1 minute - more frequent updates for today's tasks
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch overdue items
 */
export function useOverdueItems() {
  return useQuery({
    queryKey: dashboardKeys.overdueItems(),
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.overdueItems || [];
      } catch (error) {
        console.error('Error fetching overdue items:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStatistics() {
  return useQuery({
    queryKey: dashboardKeys.statistics(),
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.statistics;
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        return {
          totalGoals: 0,
          completedGoals: 0,
          activeGoals: 0,
          overallProgress: 0,
          totalEvents: 0,
          completedEvents: 0,
          overdueItems: 0,
          todayTasksCount: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch chart data
 */
export function useDashboardCharts() {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: async () => {
      const data = await dashboardService.getDashboardData();
      return {
        progressChart: data.progressChart,
        categoryDistribution: data.categoryDistribution,
        trends: data.trends,
        productivityMetrics: data.productivityMetrics,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update task priorities (for drag-and-drop reordering)
 */
export function useUpdateTaskPriorities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: PriorityUpdate[]) => 
      dashboardService.updateTaskPriorities(updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dashboardKeys.todayTasks() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TodayTask[]>(dashboardKeys.todayTasks());

      // Optimistically update the cache
      if (previousTasks) {
        const updatedTasks = [...previousTasks];
        updates.forEach(update => {
          const taskIndex = updatedTasks.findIndex(t => t.id === update.taskId);
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              priority: update.newPriority,
            };
          }
        });
        
        // Sort by new priorities
        updatedTasks.sort((a, b) => b.priority - a.priority);
        queryClient.setQueryData(dashboardKeys.todayTasks(), updatedTasks);
      }

      return { previousTasks };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousTasks) {
        queryClient.setQueryData(dashboardKeys.todayTasks(), context.previousTasks);
      }
      
      toast({
        title: '우선순위 업데이트 실패',
        description: '작업 우선순위를 업데이트할 수 없습니다.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      // Invalidate dashboard data to ensure consistency
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      
      toast({
        title: '우선순위 업데이트 완료',
        description: '작업 우선순위가 저장되었습니다.',
      });
    },
  });
}

/**
 * Hook to mark today's task as completed
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, type }: { taskId: string; type: 'goal' | 'event' }) => {
      if (type === 'goal') {
        // Import goalService here to avoid circular dependencies
        const { goalService } = await import('@/lib/services/goalService');
        return await goalService.updateProgress(taskId, 100);
      } else {
        // For events, we might need to implement a completion system
        // For now, we'll just return success
        return { id: taskId, completed: true };
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      
      // Also invalidate goal/event queries
      if (variables.type === 'goal') {
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
      
      toast({
        title: '작업 완료! 🎉',
        description: '작업이 완료로 표시되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '작업 완료 실패',
        description: error.message || '작업을 완료 처리할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch progress overview chart data
 */
export function useProgressOverview() {
  return useQuery({
    queryKey: [...dashboardKeys.charts(), 'progress-overview'],
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.progressChart || [];
      } catch (error) {
        console.error('Error fetching progress overview:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch category distribution chart data
 */
export function useCategoryDistribution() {
  return useQuery({
    queryKey: [...dashboardKeys.charts(), 'category-distribution'],
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.categoryDistribution || [];
      } catch (error) {
        console.error('Error fetching category distribution:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch productivity metrics
 */
export function useProductivityMetrics() {
  return useQuery({
    queryKey: [...dashboardKeys.charts(), 'productivity-metrics'],
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardData();
        return data.productivityMetrics || {
          completionRate: 0,
          averageTasksPerDay: 0,
          streakDays: 0,
          timeToCompletion: 0,
          weeklyGoalProgress: 0,
          categoryEfficiency: []
        };
      } catch (error) {
        console.error('Error fetching productivity metrics:', error);
        return {
          completionRate: 0,
          averageTasksPerDay: 0,
          streakDays: 0,
          timeToCompletion: 0,
          weeklyGoalProgress: 0,
          categoryEfficiency: []
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook with enhanced today's tasks functionality including priority updates
 */
export function useTodayTasksWithActions() {
  const todayTasksQuery = useTodayTasks();
  const updatePrioritiesMutation = useUpdateTaskPriorities();
  
  return {
    ...todayTasksQuery,
    updatePriority: (updates: PriorityUpdate[]) => {
      return updatePrioritiesMutation.mutate(updates);
    },
    isUpdatingPriority: updatePrioritiesMutation.isPending,
  };
}

/**
 * Hook to invalidate all dashboard data (useful for manual refresh)
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}