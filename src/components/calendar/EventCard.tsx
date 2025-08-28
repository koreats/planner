'use client';

import { cn } from '@/lib/utils';
import { Clock, Tag } from 'lucide-react';
import { formatDate, getEventColor } from './CalendarUtils';
import type { Event } from '@/types/calendar';

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export function EventCard({
  event,
  onClick,
  variant = 'default',
  className,
}: EventCardProps) {
  const color = getEventColor(event);
  const isMultiDay = new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          "px-1 py-0.5 text-xs truncate cursor-pointer hover:opacity-80 transition-opacity rounded",
          className
        )}
        style={{
          backgroundColor: color + '20',
          color: color,
          borderLeft: `2px solid ${color}`,
        }}
        onClick={handleClick}
        title={event.title}
      >
        {!event.allDay && (
          <span className="font-medium">
            {formatDate(event.startDate, 'HH:mm')}
          </span>
        )}
        {' '}
        {event.title}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "p-2 rounded-md cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        style={{
          backgroundColor: color + '10',
          borderLeft: `3px solid ${color}`,
        }}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{event.title}</p>
            {!event.allDay && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <Clock className="inline-block w-3 h-3 mr-1" />
                {formatDate(event.startDate, 'HH:mm')}
                {isMultiDay && ` - ${formatDate(event.endDate, 'HH:mm')}`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      style={{
        backgroundColor: color + '10',
        borderLeft: `4px solid ${color}`,
      }}
      onClick={handleClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm">{event.title}</h4>
          {event.category && (
            <span
              className="px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: color + '20',
                color: color,
              }}
            >
              {event.category.name}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {event.allDay ? (
              <span>종일</span>
            ) : (
              <span>
                {formatDate(event.startDate, 'HH:mm')}
                {isMultiDay && (
                  <>
                    {' - '}
                    {formatDate(event.endDate, 'M/d HH:mm')}
                  </>
                )}
              </span>
            )}
          </div>

          {event.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{event.tags.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}