'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Trophy, Zap, CheckCircle2, Clock } from 'lucide-react';
import type { ProfileStats as ProfileStatsType } from '@/types/profile';

interface ProfileStatsProps {
  stats?: ProfileStatsType;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  if (!stats) {
    return (
      <div className="text-center text-muted-foreground">
        통계 데이터를 불러오는 중...
      </div>
    );
  }

  const goalCompletionRate = stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

  const eventCompletionRate = stats.totalEvents > 0
    ? Math.round((stats.completedEvents / stats.totalEvents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 목표</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              완료: {stats.completedGoals}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 이벤트</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              완료: {stats.completedEvents}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 스트릭</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              연속 일수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최장 스트릭</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.longestStreak}</div>
            <p className="text-xs text-muted-foreground">
              최고 기록
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 진행률 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              목표 완료율
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">전체 진행률</span>
              <Badge variant={goalCompletionRate >= 70 ? 'default' : goalCompletionRate >= 40 ? 'secondary' : 'destructive'}>
                {goalCompletionRate}%
              </Badge>
            </div>
            <Progress value={goalCompletionRate} className="w-full" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {stats.completedGoals}
                </div>
                <div className="text-muted-foreground">완료</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {stats.totalGoals - stats.completedGoals}
                </div>
                <div className="text-muted-foreground">진행 중</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              이벤트 완료율
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">전체 진행률</span>
              <Badge variant={eventCompletionRate >= 70 ? 'default' : eventCompletionRate >= 40 ? 'secondary' : 'destructive'}>
                {eventCompletionRate}%
              </Badge>
            </div>
            <Progress value={eventCompletionRate} className="w-full" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {stats.completedEvents}
                </div>
                <div className="text-muted-foreground">완료</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {stats.totalEvents - stats.completedEvents}
                </div>
                <div className="text-muted-foreground">예정</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 성취 배지 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            성취 배지
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.totalGoals >= 10 && (
              <div className="text-center space-y-2">
                <div className="text-2xl">🎯</div>
                <div className="text-sm font-medium">목표 달성자</div>
                <div className="text-xs text-muted-foreground">10개 이상 목표 생성</div>
              </div>
            )}
            
            {stats.completedGoals >= 5 && (
              <div className="text-center space-y-2">
                <div className="text-2xl">✅</div>
                <div className="text-sm font-medium">완료 마스터</div>
                <div className="text-xs text-muted-foreground">5개 이상 목표 완료</div>
              </div>
            )}
            
            {stats.currentStreak >= 7 && (
              <div className="text-center space-y-2">
                <div className="text-2xl">🔥</div>
                <div className="text-sm font-medium">일주일 스트릭</div>
                <div className="text-xs text-muted-foreground">7일 연속 활동</div>
              </div>
            )}
            
            {stats.longestStreak >= 30 && (
              <div className="text-center space-y-2">
                <div className="text-2xl">👑</div>
                <div className="text-sm font-medium">월간 챔피언</div>
                <div className="text-xs text-muted-foreground">30일 연속 활동</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}