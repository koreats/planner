'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser, useSignOut } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Target, User, LogOut, BarChart3, Plus } from 'lucide-react';

// Dashboard Components
import { ProgressOverviewChart } from '@/components/dashboard/ProgressOverviewChart';
import { CategoryDistributionChart } from '@/components/dashboard/CategoryDistributionChart';
import { ProductivityMetrics } from '@/components/dashboard/ProductivityMetrics';
import { TodayTasksList } from '@/components/dashboard/TodayTasksList';
import { OverdueItemsWidget } from '@/components/dashboard/OverdueItemsWidget';

// Dashboard Hooks
import { 
  useDashboardStatistics, 
  useTodayTasks, 
  useOverdueItems, 
  useProgressOverview, 
  useCategoryDistribution, 
  useProductivityMetrics,
  useUpdateTaskPriorities 
} from '@/hooks/useDashboard';

// Services
import { goalService } from '@/lib/services/goalService';
import { eventService } from '@/lib/services/eventService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { data: user } = useUser();
  const signOutMutation = useSignOut();
  const router = useRouter();
  const { toast } = useToast();

  // Dashboard Data Hooks
  const { data: statistics, isLoading: statsLoading } = useDashboardStatistics();
  const { data: todayTasks, isLoading: todayLoading } = useTodayTasks();
  const { data: overdueItems, isLoading: overdueLoading } = useOverdueItems();
  const { data: progressOverview, isLoading: progressLoading } = useProgressOverview();
  const { data: categoryDistribution, isLoading: categoryLoading } = useCategoryDistribution();
  const { data: productivityMetrics, isLoading: metricsLoading } = useProductivityMetrics();
  
  // Action hooks
  const updatePrioritiesMutation = useUpdateTaskPriorities();

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  const handleTaskComplete = async (taskId: string, type: 'goal' | 'event') => {
    try {
      if (type === 'goal') {
        await goalService.updateProgress(taskId, 100);
      } else {
        // For events, we could mark them as completed in some way
        // This depends on your event structure - for now, just show a toast
        toast({
          title: "일정 완료",
          description: "일정이 완료되었습니다.",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "작업 완료 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleOverdueItemClick = (item: any) => {
    if (item.type === 'goal') {
      router.push('/goals');
    } else {
      router.push('/calendar');
    }
  };

  const handleAddTask = () => {
    router.push('/goals?create=true');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                대시보드
              </h1>
              <p className="text-muted-foreground mt-2">
                환영합니다, {user?.email}님! 오늘의 진행 상황을 확인해보세요.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleAddTask}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                새 작업
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                disabled={signOutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {signOutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-8">
            {/* Today's Tasks and Overdue Items */}
            <div className="grid gap-6 lg:grid-cols-2">
              <TodayTasksList 
                tasks={todayTasks || []}
                onTaskComplete={handleTaskComplete}
                onPriorityUpdate={(updates) => updatePrioritiesMutation.mutate(updates)}
                onAddTask={handleAddTask}
                isLoading={todayLoading}
              />
              <OverdueItemsWidget 
                items={overdueItems || []}
                onItemClick={handleOverdueItemClick}
                onMarkComplete={handleTaskComplete}
                isLoading={overdueLoading}
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ProgressOverviewChart 
                data={progressOverview || []}
              />
              <CategoryDistributionChart 
                data={categoryDistribution || []}
              />
            </div>

            {/* Productivity Metrics */}
            <ProductivityMetrics 
              data={productivityMetrics || {
                completionRate: 0,
                averageTasksPerDay: 0,
                streakDays: 0,
                timeToCompletion: 0,
                weeklyGoalProgress: 0,
                categoryEfficiency: []
              }}
            />

            <Separator className="my-8" />

            {/* Navigation Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">빠른 이동</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/calendar">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5" />
                        캘린더
                      </CardTitle>
                      <CardDescription>
                        일정을 확인하고 관리하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        일간, 주간, 월간 뷰로 일정을 확인하고
                        카테고리별로 관리할 수 있습니다.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/goals">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" />
                        목표 관리
                      </CardTitle>
                      <CardDescription>
                        목표를 설정하고 추적하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        장기 목표부터 일일 목표까지
                        계층적으로 관리하고 진행률을 추적합니다.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/profile">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        프로필
                      </CardTitle>
                      <CardDescription>
                        계정 설정을 관리하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        프로필 정보, 알림 설정,
                        비밀번호 변경 등을 관리할 수 있습니다.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">빠른 작업</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3">
                    <Link href="/calendar?view=day">
                      <Button variant="outline">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        오늘 일정 보기
                      </Button>
                    </Link>
                    <Link href="/goals?create=true">
                      <Button variant="outline">
                        <Target className="mr-2 h-4 w-4" />
                        새 목표 추가
                      </Button>
                    </Link>
                    <Link href="/calendar?create=true">
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        새 이벤트 추가
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}