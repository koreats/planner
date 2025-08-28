'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock, 
  Award,
  BarChart3 
} from 'lucide-react';
import type { ProductivityMetrics as ProductivityMetricsType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ProductivityMetricsProps {
  data: ProductivityMetricsType;
  title?: string;
  description?: string;
  className?: string;
}

export function ProductivityMetrics({
  data,
  title = "생산성 지표",
  description = "개인 성과 및 효율성 분석",
  className,
}: ProductivityMetricsProps) {
  // Get color for completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get streak badge variant
  const getStreakBadge = (days: number) => {
    if (days >= 7) return { variant: 'default' as const, color: 'bg-green-500' };
    if (days >= 3) return { variant: 'secondary' as const, color: 'bg-blue-500' };
    return { variant: 'outline' as const, color: 'bg-gray-500' };
  };

  const streakBadge = getStreakBadge(data.streakDays);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">완료율</span>
            </div>
            <div className={cn("text-2xl font-bold", getCompletionColor(data.completionRate))}>
              {data.completionRate}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">일평균 작업</span>
            </div>
            <div className="text-2xl font-bold">
              {data.averageTasksPerDay}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">연속 활동</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.streakDays}</span>
              <Badge variant={streakBadge.variant}>
                {data.streakDays}일
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">완료 소요시간</span>
            </div>
            <div className="text-2xl font-bold">
              {data.timeToCompletion}일
            </div>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">주간 목표 진행률</span>
            </div>
            <span className="text-sm font-medium">{data.weeklyGoalProgress}%</span>
          </div>
          <Progress value={data.weeklyGoalProgress} className="h-2" />
        </div>

        {/* Category Efficiency */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">카테고리별 효율성</h4>
          <div className="space-y-2">
            {data.categoryEfficiency.map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.categoryName}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {category.completionRate}%
                  </span>
                </div>
                <Progress 
                  value={category.completionRate} 
                  className="h-1"
                  style={
                    {
                      '--progress-background': category.color,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">성과 분석</h4>
          <div className="space-y-2">
            {data.completionRate >= 80 && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>우수한 완료율을 유지하고 있습니다!</span>
              </div>
            )}
            
            {data.streakDays >= 7 && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Award className="h-4 w-4" />
                <span>7일 연속 활동 중입니다. 계속 유지하세요!</span>
              </div>
            )}
            
            {data.averageTasksPerDay > 5 && (
              <div className="flex items-center gap-2 text-purple-600 text-sm">
                <Target className="h-4 w-4" />
                <span>높은 생산성을 보이고 있습니다.</span>
              </div>
            )}
            
            {data.completionRate < 50 && (
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <Clock className="h-4 w-4" />
                <span>완료율 향상이 필요합니다. 우선순위를 재검토해보세요.</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}