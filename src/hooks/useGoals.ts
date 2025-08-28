'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalService } from '@/lib/services/goalService';
import { useToast } from '@/hooks/use-toast';
import { queryKeys, CACHE_TIME } from '@/lib/query/config';
import { 
  createOptimisticGoalUpdate, 
  smartInvalidate,
  syncRelatedQueries 
} from '@/lib/query/utils';
import type {
  Goal,
  GoalWithChildren,
  GoalFilters,
  CreateGoalInput,
  UpdateGoalInput,
  GoalStatistics,
} from '@/types/goals';

// Re-export for backward compatibility
export const goalKeys = queryKeys.goals;

/**
 * Hook to fetch goals with optional filters
 */
export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: queryKeys.goals.list(filters),
    queryFn: () => goalService.getGoals(filters),
    staleTime: CACHE_TIME.GOALS,
  });
}

/**
 * Hook to fetch goals in tree structure
 */
export function useGoalTree() {
  return useQuery({
    queryKey: queryKeys.goals.tree(),
    queryFn: () => goalService.getGoalTree(),
    staleTime: CACHE_TIME.GOALS,
  });
}

/**
 * Hook to fetch a single goal
 */
export function useGoal(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => goalService.getGoal(id),
    enabled: !!id && enabled,
    staleTime: CACHE_TIME.GOALS_DETAIL,
  });
}

/**
 * Hook to fetch goal with its children
 */
export function useGoalWithChildren(id: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.goals.detail(id), 'with-children'],
    queryFn: () => goalService.getGoalWithChildren(id),
    enabled: !!id && enabled,
    staleTime: CACHE_TIME.GOALS_DETAIL,
  });
}

/**
 * Hook to fetch goal ancestors
 */
export function useGoalAncestors(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.goals.ancestors(id),
    queryFn: () => goalService.getGoalAncestors(id),
    enabled: !!id && enabled,
    staleTime: CACHE_TIME.GOALS_DETAIL,
  });
}

/**
 * Hook to fetch goal children
 */
export function useGoalChildren(parentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.goals.children(parentId),
    queryFn: () => goalService.getGoalChildren(parentId),
    enabled: !!parentId && enabled,
    staleTime: CACHE_TIME.GOALS,
  });
}

/**
 * Hook to fetch goal statistics
 */
export function useGoalStatistics() {
  return useQuery({
    queryKey: queryKeys.dashboard.statistics(),
    queryFn: () => goalService.getGoalStatistics(),
    staleTime: CACHE_TIME.STATISTICS,
  });
}

/**
 * Hook to create a new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalService.createGoal(input),
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'goal', data.id);
      toast({
        title: '목표 생성 완료',
        description: `"${data.title}" 목표가 추가되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '목표 생성 실패',
        description: error.message || '목표를 생성할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => goalService.updateGoal(input),
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.detail(input.id) });
      
      // Snapshot the previous value
      const previousGoal = createOptimisticGoalUpdate(
        queryClient,
        input.id,
        input
      );
      
      return { previousGoal };
    },
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'goal', data.id);
      toast({
        title: '목표 수정 완료',
        description: `"${data.title}" 목표가 수정되었습니다.`,
      });
    },
    onError: (error: Error, input, context) => {
      // Rollback on error
      if (context?.previousGoal) {
        queryClient.setQueryData(
          queryKeys.goals.detail(input.id),
          context.previousGoal
        );
      }
      toast({
        title: '목표 수정 실패',
        description: error.message || '목표를 수정할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => goalService.deleteGoal(id),
    onSuccess: (_, id) => {
      smartInvalidate(queryClient, 'goal', id);
      toast({
        title: '목표 삭제 완료',
        description: '목표와 하위 목표가 모두 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '목표 삭제 실패',
        description: error.message || '목표를 삭제할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to move a goal to a different parent
 */
export function useMoveGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ goalId, newParentId }: { goalId: string; newParentId?: string }) =>
      goalService.moveGoal(goalId, newParentId),
    onSuccess: async (data, variables) => {
      // Sync both the goal and its new parent
      await syncRelatedQueries(queryClient, 'goal', variables.goalId);
      toast({
        title: '목표 이동 완료',
        description: `"${data.title}" 목표가 이동되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '목표 이동 실패',
        description: error.message || '목표를 이동할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update goal progress with automatic parent progress calculation
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) =>
      goalService.updateProgressWithParentCalculation(goalId, progress),
    onMutate: async ({ goalId, progress }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.detail(goalId) });
      
      // Optimistically update the goal's progress
      const previousGoal = createOptimisticGoalUpdate(
        queryClient,
        goalId,
        { progress }
      );
      
      return { previousGoal, goalId };
    },
    onSuccess: async (data, variables) => {
      // Sync related queries for the goal and its parents
      await syncRelatedQueries(queryClient, 'goal', variables.goalId);
      
      if (data.progress === 100) {
        toast({
          title: '목표 달성! 🎉',
          description: `"${data.title}" 목표를 완료했습니다! 상위 목표의 진행률도 자동으로 업데이트되었습니다.`,
        });
      } else {
        toast({
          title: '진행률 업데이트',
          description: `진행률이 ${Math.round(data.progress)}%로 업데이트되었습니다. 상위 목표도 자동 반영되었습니다.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: '진행률 업데이트 실패',
        description: error.message || '진행률을 업데이트할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update goal progress with parent chain invalidation for ancestors
 */
export function useUpdateGoalProgressWithAncestors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) =>
      goalService.updateProgressWithParentCalculation(goalId, progress),
    onMutate: async ({ goalId, progress }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.detail(goalId) });
      
      // Optimistically update the goal's progress
      const previousGoal = createOptimisticGoalUpdate(
        queryClient,
        goalId,
        { progress }
      );
      
      return { previousGoal, goalId };
    },
    onSuccess: async (data, variables) => {
      // Sync all related queries including ancestors
      await syncRelatedQueries(queryClient, 'goal', variables.goalId);
      
      if (data.progress === 100) {
        toast({
          title: '목표 달성! 🎉',
          description: `"${data.title}" 목표를 완료했습니다! 상위 목표들의 진행률도 자동으로 업데이트되었습니다.`,
        });
      } else {
        toast({
          title: '진행률 업데이트',
          description: `진행률이 ${Math.round(data.progress)}%로 업데이트되었습니다. 상위 목표들도 자동 반영되었습니다.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: '진행률 업데이트 실패',
        description: error.message || '진행률을 업데이트할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}