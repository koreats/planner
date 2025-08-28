'use client';

import { cn } from '@/lib/utils';
import { getDayHours, getEventsForDate, formatDate } from './CalendarUtils';
import { EventCard } from './EventCard';
import type { Event } from '@/types/calendar';

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onTimeClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: Event) => void;
}

export function DayView({
  currentDate,
  events,
  onTimeClick,
  onEventClick,
}: DayViewProps) {
  const hours = getDayHours();
  const dayEvents = getEventsForDate(events, currentDate);
  
  // Separate all-day events from timed events
  const allDayEvents = dayEvents.filter(event => event.allDay);
  const timedEvents = dayEvents.filter(event => !event.allDay);

  return (
    <div className="flex-1 overflow-auto">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/30 p-4">
          <h3 className="text-sm font-semibold mb-2">종일 일정</h3>
          <div className="space-y-2">
            {allDayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                variant="compact"
              />
            ))}
          </div>
        </div>
      )}

      {/* Hourly schedule */}
      <div className="flex">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          {hours.map(hour => (
            <div
              key={hour.hour}
              className="h-24 border-r border-b flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-sm text-muted-foreground">
                {hour.label}
              </span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="flex-1">
          {hours.map(hour => {
            const hourEvents = timedEvents.filter(event => {
              const eventHour = new Date(event.startDate).getHours();
              return eventHour === hour.hour;
            });

            return (
              <div
                key={hour.hour}
                className={cn(
                  "h-24 border-b p-2 cursor-pointer hover:bg-muted/30 transition-colors",
                  hour.hour === new Date().getHours() &&
                    currentDate.toDateString() === new Date().toDateString() &&
                    "bg-primary/5 border-l-2 border-l-primary"
                )}
                onClick={() => onTimeClick?.(currentDate, hour.hour)}
              >
                <div className="space-y-2">
                  {hourEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}