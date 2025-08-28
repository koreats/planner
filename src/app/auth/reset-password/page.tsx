'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdatePassword } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const updatePasswordMutation = useUpdatePassword();

  useEffect(() => {
    // Check if there's an error in the URL params
    const error = searchParams?.get('error');
    if (error) {
      toast({
        title: '비밀번호 재설정 오류',
        description: '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  }, [searchParams, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: '비밀번호 불일치',
        description: '새 비밀번호가 일치하지 않습니다.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: '비밀번호 길이 오류',
        description: '비밀번호는 최소 6자 이상이어야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    updatePasswordMutation.mutate(password, {
      onSuccess: () => {
        toast({
          title: '비밀번호 변경 완료',
          description: '새로운 비밀번호가 설정되었습니다.',
        });
        router.push('/dashboard');
      },
      onError: (error: Error) => {
        toast({
          title: '비밀번호 변경 실패',
          description: error.message || '다시 시도해주세요.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>
            새로운 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="w-full"
            >
              {updatePasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}