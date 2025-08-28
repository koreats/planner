'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { formatDate } from './CalendarUtils';
import type { CalendarView } from '@/types/calendar';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarHeaderProps) {
  const getTitle = () => {
    switch (view) {
      case 'day':
        return formatDate(currentDate, 'yyyy년 M월 d일 EEEE');
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return formatDate(weekStart, 'yyyy년 M월');
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
          return `${formatDate(weekStart, 'yyyy년 M월')} - ${formatDate(weekEnd, 'M월')}`;
        } else {
          return `${formatDate(weekStart, 'yyyy년 M월')} - ${formatDate(weekEnd, 'yyyy년 M월')}`;
        }
      case 'month':
        return formatDate(currentDate, 'yyyy년 M월');
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('prev')}
          title="이전"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
        >
          오늘
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('next')}
          title="다음"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold ml-4">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={view === 'day' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('day')}
          title="일 보기"
        >
          <Calendar className="h-4 w-4 mr-2" />
          일
        </Button>
        
        <Button
          variant={view === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
          title="주 보기"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          주
        </Button>
        
        <Button
          variant={view === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('month')}
          title="월 보기"
        >
          <CalendarRange className="h-4 w-4 mr-2" />
          월
        </Button>
      </div>
    </div>
  );
}