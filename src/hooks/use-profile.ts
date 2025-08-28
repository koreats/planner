'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profileService';
import { useUser } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updatePassword } from '@/lib/supabase/auth';
import type { Profile, ProfileUpdate, ProfilePreferences, ProfileStats, PasswordChangeData } from '@/types/profile';

export const profileKeys = {
  all: ['profile'] as const,
  profile: (userId: string) => [...profileKeys.all, 'user', userId] as const,
  stats: (userId: string) => [...profileKeys.all, 'stats', userId] as const,
};

/**
 * Hook to get user profile
 * Enhanced with race condition protection, auto-creation, and better error handling
 */
export function useProfile() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();
  
  return useQuery({
    queryKey: profileKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      // Double-check user exists at execution time
      if (!user?.id) {
        throw new Error('사용자가 인증되지 않았습니다. 로그인 후 다시 시도해주세요.');
      }
      
      // Try to get existing profile
      let profile = await profileService.getProfile(user.id);
      
      // If profile doesn't exist, create one automatically
      if (profile === null) {
        console.log('프로필이 존재하지 않아 자동으로 생성합니다.');
        profile = await profileService.createProfile(user.id, {
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
        });
      }
      
      return profile;
    },
    enabled: !!user?.id && !isUserLoading && !userError,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.name === 'ProfileFetchError' && error?.code === 'PGRST301') {
        return false;
      }
      // Don't retry on user not authenticated errors  
      if (error?.message?.includes('사용자가 인증되지 않았습니다')) {
        return false;
      }
      return failureCount < 2; // Only retry twice for other errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: ProfileUpdate) => 
      profileService.updateProfile(user!.id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.profile(user!.id), data);
      toast({
        title: '프로필 업데이트',
        description: '프로필이 성공적으로 업데이트되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '업데이트 실패',
        description: error.message || '프로필 업데이트에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (preferences: Partial<ProfilePreferences>) => 
      profileService.updatePreferences(user!.id, preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.profile(user!.id), data);
      toast({
        title: '설정 업데이트',
        description: '설정이 성공적으로 업데이트되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '설정 업데이트 실패',
        description: error.message || '설정 업데이트에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => 
      profileService.uploadAvatar(user!.id, file),
    onSuccess: (avatarUrl) => {
      // Update the profile cache with new avatar URL
      queryClient.setQueryData(
        profileKeys.profile(user!.id),
        (oldData: Profile | null) => {
          if (!oldData) return oldData;
          return { ...oldData, avatarUrl };
        }
      );
      toast({
        title: '프로필 사진 업로드',
        description: '프로필 사진이 성공적으로 업로드되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '업로드 실패',
        description: error.message || '프로필 사진 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (avatarUrl: string) => 
      profileService.deleteAvatar(user!.id, avatarUrl),
    onSuccess: () => {
      // Update the profile cache to remove avatar URL
      queryClient.setQueryData(
        profileKeys.profile(user!.id),
        (oldData: Profile | null) => {
          if (!oldData) return oldData;
          return { ...oldData, avatarUrl: null };
        }
      );
      toast({
        title: '프로필 사진 삭제',
        description: '프로필 사진이 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '삭제 실패',
        description: error.message || '프로필 사진 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get profile statistics
 */
export function useProfileStats() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: profileKeys.stats(user?.id ?? ''),
    queryFn: () => profileService.getProfileStats(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('새 비밀번호가 일치하지 않습니다.');
      }
      
      // Note: Supabase doesn't verify current password in client-side SDK
      // For better security, you might want to implement server-side verification
      return updatePassword(data.newPassword);
    },
    onSuccess: () => {
      toast({
        title: '비밀번호 변경',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '비밀번호 변경 실패',
        description: error.message || '비밀번호 변경에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => profileService.deleteAccount(user!.id),
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: '계정 삭제',
        description: '계정이 성공적으로 삭제되었습니다.',
      });
      // Redirect will be handled by auth state change
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: '계정 삭제 실패',
        description: error.message || '계정 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}