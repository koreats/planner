'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignIn, useSignUp, useSignOut, useUser } from '@/hooks/use-auth';

export default function AuthTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const { data: user, isLoading: userLoading } = useUser();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      signUpMutation.mutate({ email, password });
    } else {
      signInMutation.mutate({ email, password });
    }
  };

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>인증 테스트</CardTitle>
          <CardDescription>
            Supabase 인증 기능을 테스트합니다
          </CardDescription>
        </CardHeader>
        
        {user ? (
          <>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">로그인됨:</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSignOut}
                disabled={signOutMutation.isPending}
                className="w-full"
              >
                {signOutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
              </Button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit"
                disabled={signInMutation.isPending || signUpMutation.isPending}
                className="w-full"
              >
                {isSignUp 
                  ? (signUpMutation.isPending ? '가입 중...' : '회원가입')
                  : (signInMutation.isPending ? '로그인 중...' : '로그인')
                }
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}