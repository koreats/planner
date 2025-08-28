'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Clock, 
  Target, 
  Calendar, 
  ArrowUpRight,
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import type { OverdueItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface OverdueItemsWidgetProps {
  items: OverdueItem[];
  onItemClick?: (item: OverdueItem) => void;
  onMarkComplete?: (itemId: string, type: 'goal' | 'event') => void;
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
  maxItems?: number;
}

export function OverdueItemsWidget({
  items,
  onItemClick,
  onMarkComplete,
  title = "지연 항목",
  description = "기한이 지난 목표와 일정",
  className,
  isLoading = false,
  maxItems = 10,
}: OverdueItemsWidgetProps) {
  // Sort items by urgency (most urgent first)
  const sortedItems = React.useMemo(() => {
    return items
      .sort((a, b) => {
        // Sort by urgency first, then by overdue days
        const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        
        return b.daysOverdue - a.daysOverdue;
      })
      .slice(0, maxItems);
  }, [items, maxItems]);

  // Get urgency styling
  const getUrgencyStyle = (urgency: OverdueItem['urgency']) => {
    switch (urgency) {
      case 'critical':
        return {
          badge: 'destructive' as const,
          icon: 'text-red-500',
          border: 'border-red-200',
          bg: 'bg-red-50'
        };
      case 'high':
        return {
          badge: 'destructive' as const,
          icon: 'text-orange-500',
          border: 'border-orange-200',
          bg: 'bg-orange-50'
        };
      case 'medium':
        return {
          badge: 'secondary' as const,
          icon: 'text-yellow-500',
          border: 'border-yellow-200',
          bg: 'bg-yellow-50'
        };
      case 'low':
        return {
          badge: 'outline' as const,
          icon: 'text-blue-500',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
    }
  };

  // Get overdue days text
  const getOverdueDaysText = (days: number) => {
    if (days === 0) return '오늘 기한';
    if (days === 1) return '1일 지연';
    return `${days}일 지연`;
  };

  // Statistics
  const stats = React.useMemo(() => {
    const critical = items.filter(item => item.urgency === 'critical').length;
    const high = items.filter(item => item.urgency === 'high').length;
    const totalGoals = items.filter(item => item.type === 'goal').length;
    const totalEvents = items.filter(item => item.type === 'event').length;
    
    return { critical, high, totalGoals, totalEvents, total: items.length };
  }, [items]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {title}
              {stats.total > 0 && (
                <Badge variant={stats.critical > 0 ? 'destructive' : 'secondary'}>
                  {stats.total}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        
        {/* Quick Statistics */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center">
              <div className="text-sm font-medium text-red-600">{stats.critical}</div>
              <div className="text-xs text-muted-foreground">긴급</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">{stats.high}</div>
              <div className="text-xs text-muted-foreground">높음</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-purple-600">{stats.totalGoals}</div>
              <div className="text-xs text-muted-foreground">목표</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-blue-600">{stats.totalEvents}</div>
              <div className="text-xs text-muted-foreground">일정</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">지연 항목을 확인하는 중...</p>
            </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-1">지연된 항목이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              모든 목표와 일정이 일정대로 진행되고 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item, index) => {
              const urgencyStyle = getUrgencyStyle(item.urgency);
              
              return (
                <div key={item.id}>
                  <div 
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                      urgencyStyle.border,
                      urgencyStyle.bg
                    )}
                    onClick={() => onItemClick?.(item)}
                  >
                    {/* Type Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === 'goal' ? (
                        <Target className={cn("h-4 w-4", urgencyStyle.icon)} />
                      ) : (
                        <Calendar className={cn("h-4 w-4", urgencyStyle.icon)} />
                      )}
                    </div>
                    
                    {/* Item Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate mb-1">
                            {item.title}
                          </h4>
                          
                          {/* Details */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            {/* Overdue Days */}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium text-red-600">
                                {getOverdueDaysText(item.daysOverdue)}
                              </span>
                            </div>
                            
                            {/* Due Date */}
                            <div>
                              기한: {format(new Date(item.dueDate), 'MM/dd (EEE)', { locale: ko })}
                            </div>
                            
                            {/* Category */}
                            {item.category && (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: item.category.color }}
                                />
                                <span>{item.category.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress for Goals */}
                          {item.type === 'goal' && item.progress !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>진행률: {item.progress}%</span>
                              </div>
                              <div className="flex-1 bg-muted rounded-full h-1">
                                <div 
                                  className="bg-primary rounded-full h-1 transition-all"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Description */}
                          {item.originalItem.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {item.originalItem.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Urgency Badge & Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={urgencyStyle.badge} className="text-xs">
                            {item.urgency === 'critical' && '긴급'}
                            {item.urgency === 'high' && '높음'}
                            {item.urgency === 'medium' && '보통'}
                            {item.urgency === 'low' && '낮음'}
                          </Badge>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {onMarkComplete && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkComplete(item.id, item.type);
                                }}
                              >
                                완료
                              </Button>
                            )}
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  {index < sortedItems.length - 1 && <Separator className="my-0" />}
                </div>
              );
            })}
            
            {/* Show More Button */}
            {items.length > maxItems && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {items.length - maxItems}개 항목 더 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}