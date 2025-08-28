'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/lib/services/categoryService';
import { useToast } from '@/hooks/use-toast';
import { queryKeys, CACHE_TIME } from '@/lib/query/config';
import { smartInvalidate } from '@/lib/query/utils';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/calendar';

// Re-export for backward compatibility
export const categoryKeys = queryKeys.categories;

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => categoryService.getCategories(),
    staleTime: CACHE_TIME.CATEGORIES,
  });
}

/**
 * Hook to fetch a single category
 */
export function useCategory(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryService.getCategory(id),
    enabled: !!id && enabled,
    staleTime: CACHE_TIME.CATEGORIES,
  });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.createCategory(input),
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'category', data.id);
      toast({
        title: '카테고리 생성 완료',
        description: `"${data.name}" 카테고리가 추가되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '카테고리 생성 실패',
        description: error.message || '카테고리를 생성할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => categoryService.updateCategory(input),
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.detail(input.id) });
      
      // Snapshot the previous value
      const previousCategory = queryClient.getQueryData<Category>(
        queryKeys.categories.detail(input.id)
      );
      
      // Optimistically update
      if (previousCategory) {
        queryClient.setQueryData(
          queryKeys.categories.detail(input.id),
          { ...previousCategory, ...input }
        );
      }
      
      return { previousCategory };
    },
    onSuccess: (data) => {
      smartInvalidate(queryClient, 'category', data.id);
      toast({
        title: '카테고리 수정 완료',
        description: `"${data.name}" 카테고리가 수정되었습니다.`,
      });
    },
    onError: (error: Error, input, context) => {
      // Rollback on error
      if (context?.previousCategory) {
        queryClient.setQueryData(
          queryKeys.categories.detail(input.id),
          context.previousCategory
        );
      }
      toast({
        title: '카테고리 수정 실패',
        description: error.message || '카테고리를 수정할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: (_, id) => {
      smartInvalidate(queryClient, 'category', id);
      toast({
        title: '카테고리 삭제 완료',
        description: '카테고리가 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '카테고리 삭제 실패',
        description: error.message || '카테고리를 삭제할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });
}