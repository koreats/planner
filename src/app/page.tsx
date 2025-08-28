'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-auth';
import { CalendarDays, Target, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            목표 달성을 위한
            <span className="text-primary"> 스마트 플래너</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            계층적 목표 관리와 일정 관리로 체계적인 생산성 향상을 경험하세요
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="px-8">
                시작하기
              </Button>
            </Link>
            <Link href="/auth-test">
              <Button size="lg" variant="outline" className="px-8">
                데모 체험
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Target className="h-8 w-8 text-primary" />}
            title="계층적 목표 관리"
            description="장기 목표부터 일일 목표까지 4단계 계층 구조로 체계적으로 관리하고 자동으로 진행률을 추적합니다."
          />
          <FeatureCard
            icon={<CalendarDays className="h-8 w-8 text-primary" />}
            title="유연한 일정 관리"
            description="일간, 주간, 월간 뷰로 일정을 확인하고 카테고리별 색상으로 직관적으로 관리할 수 있습니다."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-primary" />}
            title="진행률 자동 계산"
            description="하위 목표의 진행률이 자동으로 상위 목표에 반영되어 전체적인 진행 상황을 한눈에 파악할 수 있습니다."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8 text-primary" />}
            title="시간 관리"
            description="일정과 목표를 연계하여 시간을 효율적으로 분배하고 우선순위를 관리합니다."
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8 text-primary" />}
            title="상태 추적"
            description="목표와 일정의 상태를 실시간으로 추적하고 완료된 항목을 체크할 수 있습니다."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="개인화된 경험"
            description="개인별로 독립된 데이터 공간에서 자신만의 목표와 일정을 안전하게 관리합니다."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">
              지금 시작하고 목표를 달성하세요
            </h3>
            <p className="text-lg mb-8 opacity-90">
              무료로 가입하고 생산성을 높이는 여정을 시작하세요
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8">
                무료로 시작하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 생산성 플래너. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}