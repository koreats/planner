'use client';

import { cn } from '@/lib/utils';
import { getMonthDays, getEventsForDate } from './CalendarUtils';
import { EventCard } from './EventCard';
import type { Event } from '@/types/calendar';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const days = getMonthDays(currentDate);

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div
            key={day}
            className={cn(
              "p-2 text-center text-sm font-semibold",
              day === '일' && "text-red-500",
              day === '토' && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 h-full">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(events, day.date);
          const dayOfWeek = day.date.getDay();
          
          return (
            <div
              key={day.dateString}
              className={cn(
                "min-h-[100px] border-r border-b p-2 cursor-pointer hover:bg-muted/50 transition-colors",
                !day.isCurrentMonth && "bg-muted/20 text-muted-foreground",
                day.isToday && "bg-primary/5"
              )}
              onClick={() => onDateClick?.(day.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    dayOfWeek === 0 && "text-red-500",
                    dayOfWeek === 6 && "text-blue-500",
                    day.isToday && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                  )}
                >
                  {day.date.getDate()}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    variant="minimal"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayEvents.length - 3} 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}