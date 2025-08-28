'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getSession,
  resetPassword,
  updatePassword,
  type AuthCredentials,
} from '@/lib/supabase/auth';
import { useToast } from '@/hooks/use-toast';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Hook to get current user
 */
export function useUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to get current session
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

/**
 * Hook for signing in
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
      });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: '로그인 실패',
        description: error.message || '이메일과 비밀번호를 확인해주세요.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for signing up
 */
export function useSignUp() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast({
        title: '회원가입 성공',
        description: '이메일을 확인하여 계정을 인증해주세요.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '회원가입 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for signing out
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: '로그아웃',
        description: '안전하게 로그아웃되었습니다.',
      });
      router.push('/');
    },
    onError: (error: Error) => {
      toast({
        title: '로그아웃 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for password reset
 */
export function usePasswordReset() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast({
        title: '이메일 전송',
        description: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '전송 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating password
 */
export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast({
        title: '비밀번호 변경 완료',
        description: '새로운 비밀번호가 설정되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '변경 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}