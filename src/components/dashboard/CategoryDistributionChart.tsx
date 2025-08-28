'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import type { CategoryDistributionData } from '@/types/dashboard';

interface CategoryDistributionChartProps {
  data: CategoryDistributionData[];
  title?: string;
  description?: string;
  className?: string;
}

export function CategoryDistributionChart({
  data,
  title = "카테고리별 분포",
  description = "목표와 일정의 카테고리별 현황",
  className,
}: CategoryDistributionChartProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const goals = payload.find((p: any) => p.dataKey === 'goals')?.value || 0;
      const events = payload.find((p: any) => p.dataKey === 'events')?.value || 0;
      
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              목표: <span className="font-medium text-[#8b5cf6]">{goals}개</span>
            </p>
            <p className="text-sm">
              일정: <span className="font-medium text-[#3b82f6]">{events}개</span>
            </p>
            <p className="text-sm text-muted-foreground">
              총 {goals + events}개 항목
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate totals for summary
  const totalGoals = data.reduce((sum, item) => sum + item.goals, 0);
  const totalEvents = data.reduce((sum, item) => sum + item.events, 0);
  const totalItems = totalGoals + totalEvents;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="goals" 
                name="목표"
                fill="#8b5cf6"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="events" 
                name="일정"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#8b5cf6]">{totalGoals}</div>
            <div className="text-xs text-muted-foreground">총 목표</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">{totalEvents}</div>
            <div className="text-xs text-muted-foreground">총 일정</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-muted-foreground">전체 항목</div>
          </div>
        </div>
        
        {/* Most Active Category */}
        {data.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            {(() => {
              const mostActive = data.reduce((max, item) => 
                (item.goals + item.events) > (max.goals + max.events) ? item : max
              );
              return (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">가장 활발한 카테고리</div>
                  <div className="font-medium" style={{ color: mostActive.color }}>
                    {mostActive.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mostActive.goals + mostActive.events}개 항목
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}