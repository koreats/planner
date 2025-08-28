'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/lib/services/eventService';
import { useToast } from '@/hooks/use-toast';
import { queryKeys, CACHE_TIME } from '@/lib/query/config';
import { 
  createOptimisticEventUpdate, 
  smartInvalidate 
} from '@/lib/query/utils';
import type {
  Event,
  EventFilters,
  CreateEventInput,
  UpdateEventInput,
} from '@/types/calendar';

// Re-export for backward compatibility
export const eventKeys = queryKeys.events;

/**
 * Hook to fetch events with optional filters
 */
export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => eventService.getEvents(filters),
    staleTime: CACHE_TIME.EVENTS,
  });
}

/**
 * Hook to fetch a single event
 */
export function useEvent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventService.getEvent(id),
    enabled: !!id && enabled,
    staleTime: CACHE_TIME.EVENTS_DETAIL,
  });
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateEventInput) => eventService.createEvent(input),
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'event', data.id);
      toast({
        title: '일정 생성 완료',
        description: `"${data.title}" 일정이 추가되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '일정 생성 실패',
        description: error.message || '일정을 생성할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateEventInput) => eventService.updateEvent(input),
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.events.detail(input.id) });
      
      // Snapshot the previous value and optimistically update
      const previousEvent = createOptimisticEventUpdate(
        queryClient,
        input.id,
        input
      );
      
      return { previousEvent };
    },
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'event', data.id);
      toast({
        title: '일정 수정 완료',
        description: `"${data.title}" 일정이 수정되었습니다.`,
      });
    },
    onError: (error: Error, input, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(
          queryKeys.events.detail(input.id),
          context.previousEvent
        );
      }
      toast({
        title: '일정 수정 실패',
        description: error.message || '일정을 수정할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: (_, id) => {
      smartInvalidate(queryClient, 'event', id);
      toast({
        title: '일정 삭제 완료',
        description: '일정이 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '일정 삭제 실패',
        description: error.message || '일정을 삭제할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}