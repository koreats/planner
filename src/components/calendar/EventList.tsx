'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Tag, MapPin, Edit2, Trash2 } from 'lucide-react';
import type { Event } from '@/types/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EventListProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  className?: string;
}

export function EventList({
  events,
  onEventClick,
  onEventEdit,
  onEventDelete,
  className,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-1">일정이 없습니다</h3>
        <p className="text-sm text-muted-foreground">
          검색 조건에 맞는 일정이 없습니다.
        </p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = format(parseISO(event.startDate), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className={cn('space-y-6', className)}>
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="sticky top-0 bg-background z-10 pb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {format(parseISO(date), 'M월 d일 EEEE', { locale: ko })}
            </h3>
          </div>
          <div className="space-y-2">
            {groupedEvents[date].map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onEventClick?.(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Event Title */}
                        <h4 className="font-medium truncate">{event.title}</h4>
                        
                        {/* Category Badge */}
                        {event.category && (
                          <Badge
                            variant="outline"
                            className="flex-shrink-0"
                            style={{
                              borderColor: event.category.color,
                              color: event.category.color,
                            }}
                          >
                            {event.category.name}
                          </Badge>
                        )}
                      </div>

                      {/* Event Time */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.allDay ? (
                            '종일'
                          ) : (
                            <span>
                              {format(parseISO(event.startDate), 'HH:mm')}
                              {!isSameDay(parseISO(event.startDate), parseISO(event.endDate)) && 
                                ` - ${format(parseISO(event.endDate), 'M/d HH:mm')}`
                              }
                              {isSameDay(parseISO(event.startDate), parseISO(event.endDate)) && 
                                ` - ${format(parseISO(event.endDate), 'HH:mm')}`
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Description */}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {event.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-4">
                      {onEventEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventEdit(event);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onEventDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventDelete(event);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}