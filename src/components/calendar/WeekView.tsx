'use client';

import { cn } from '@/lib/utils';
import { getWeekDays, getDayHours, getEventsForDate, formatDate } from './CalendarUtils';
import { EventCard } from './EventCard';
import type { Event } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

export function WeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: WeekViewProps) {
  const days = getWeekDays(currentDate);
  const hours = getDayHours();

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-shrink-0">
          <div className="h-16 border-r border-b" />
          {hours.map(hour => (
            <div
              key={hour.hour}
              className="h-20 border-r border-b flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-muted-foreground">
                {hour.label}
              </span>
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(events, day.date);
            const dayOfWeek = day.date.getDay();
            
            return (
              <div key={day.dateString} className="border-r">
                {/* Day header */}
                <div
                  className={cn(
                    "h-16 border-b p-2 text-center cursor-pointer hover:bg-muted/50",
                    day.isToday && "bg-primary/5"
                  )}
                  onClick={() => onDateClick?.(day.date)}
                >
                  <div
                    className={cn(
                      "text-xs font-medium",
                      dayOfWeek === 0 && "text-red-500",
                      dayOfWeek === 6 && "text-blue-500"
                    )}
                  >
                    {weekDays[dayIndex]}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold mt-1",
                      day.isToday && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                </div>

                {/* Hour slots */}
                {hours.map(hour => (
                  <div
                    key={hour.hour}
                    className="h-20 border-b p-1 hover:bg-muted/30"
                    onClick={() => onDateClick?.(day.date)}
                  >
                    {/* Events for this hour */}
                    <div className="space-y-1">
                      {dayEvents
                        .filter(event => {
                          if (event.allDay) return hour.hour === 0;
                          const eventHour = new Date(event.startDate).getHours();
                          return eventHour === hour.hour;
                        })
                        .map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onClick={onEventClick}
                            variant="minimal"
                            className="text-xs"
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}