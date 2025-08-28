'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CalendarHeader } from './CalendarHeader';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { EventList } from './EventList';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventForm } from './EventForm';
import { EventCard } from './EventCard';
import { navigateDate } from './CalendarUtils';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import type { CalendarView, Event, CreateEventInput, UpdateEventInput, EventFilters } from '@/types/calendar';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EventFilters>({});

  // Calculate date range for current view
  const startOfView = new Date(currentDate);
  const endOfView = new Date(currentDate);
  
  if (view === 'month') {
    startOfView.setDate(1);
    endOfView.setMonth(endOfView.getMonth() + 1);
    endOfView.setDate(0);
  } else if (view === 'week') {
    const weekDay = startOfView.getDay();
    startOfView.setDate(startOfView.getDate() - weekDay);
    endOfView.setDate(startOfView.getDate() + 6);
  }

  // Combine view dates with filters
  const combinedFilters: EventFilters = {
    ...filters,
    startDate: filters.startDate || startOfView.toISOString(),
    endDate: filters.endDate || endOfView.toISOString(),
    searchTerm: searchTerm || filters.searchTerm,
  };

  const { data: events = [], isLoading: eventsLoading } = useEvents(combinedFilters);

  const { data: categories = [] } = useCategories();
  
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      setCurrentDate(navigateDate(currentDate, direction, view));
    }
  };

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFiltersChange = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setIsEventFormOpen(true);
  };

  const handleTimeClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    setSelectedDate(newDate);
    setSelectedEvent(undefined);
    setIsEventFormOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleEventSubmit = async (data: CreateEventInput | UpdateEventInput) => {
    if ('id' in data) {
      await updateEventMutation.mutateAsync(data);
    } else {
      await createEventMutation.mutateAsync(data);
    }
    setIsEventFormOpen(false);
    setSelectedEvent(undefined);
    setSelectedDate(undefined);
  };

  const handleEventEdit = () => {
    setIsEventDetailOpen(false);
    setIsEventFormOpen(true);
  };

  const handleEventDelete = async () => {
    if (selectedEvent) {
      await deleteEventMutation.mutateAsync(selectedEvent.id);
      setIsEventDetailOpen(false);
      setSelectedEvent(undefined);
    }
  };

  // Check if search or filters are active
  const hasActiveFilters = React.useMemo(() => {
    return !!(
      searchTerm ||
      filters.categoryId ||
      (filters.tags && filters.tags.length > 0) ||
      filters.startDate ||
      filters.endDate
    );
  }, [searchTerm, filters]);

  const renderView = () => {
    // Show list view when search or filters are active
    if (hasActiveFilters) {
      return (
        <div className="h-full overflow-y-auto p-4">
          <EventList
            events={events}
            onEventClick={handleEventClick}
            onEventEdit={(event) => {
              setSelectedEvent(event);
              setIsEventFormOpen(true);
            }}
            onEventDelete={async (event) => {
              await deleteEventMutation.mutateAsync(event.id);
            }}
          />
        </div>
      );
    }

    // Show regular calendar views
    switch (view) {
      case 'day':
        return (
          <DayView
            currentDate={currentDate}
            events={events}
            onTimeClick={handleTimeClick}
            onEventClick={handleEventClick}
          />
        );
      case 'week':
        return (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        );
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
      />

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onSearch={handleSearchChange}
            placeholder="일정 검색..."
          />
        </div>
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />
      </div>

      <div className="flex-1 relative">
        {eventsLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">일정을 불러오는 중...</p>
          </div>
        ) : (
          renderView()
        )}

        {/* Floating Add Button */}
        <Button
          className="absolute bottom-6 right-6 rounded-full shadow-lg"
          size="lg"
          onClick={() => {
            setSelectedEvent(undefined);
            setSelectedDate(currentDate);
            setIsEventFormOpen(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          일정 추가
        </Button>
      </div>

      {/* Event Form Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? '일정 수정' : '새 일정 추가'}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={selectedEvent}
            categories={categories}
            initialDate={selectedDate}
            onSubmit={handleEventSubmit}
            onCancel={() => {
              setIsEventFormOpen(false);
              setSelectedEvent(undefined);
              setSelectedDate(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Event Detail Sheet */}
      <Sheet open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>일정 상세</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-6 space-y-6">
              <EventCard
                event={selectedEvent}
                variant="default"
                className="shadow-none border"
              />
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">설명</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description || '설명이 없습니다.'}
                  </p>
                </div>

                {selectedEvent.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">태그</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedEvent.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleEventEdit} className="flex-1">
                  수정
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEventDelete}
                  className="flex-1"
                >
                  삭제
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';