import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Event } from '@/types/calendar';

/**
 * Get calendar days for month view
 */
export function getMonthDays(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, date),
    isToday: isToday(day),
    dateString: format(day, 'yyyy-MM-dd'),
  }));
}

/**
 * Get calendar days for week view
 */
export function getWeekDays(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map(day => ({
    date: day,
    isToday: isToday(day),
    dateString: format(day, 'yyyy-MM-dd'),
  }));
}

/**
 * Get hours for day view
 */
export function getDayHours() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));
}

/**
 * Check if an event occurs on a specific date
 */
export function isEventOnDate(event: Event, date: Date): boolean {
  const eventStart = parseISO(event.startDate);
  const eventEnd = parseISO(event.endDate);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return (
    isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
    isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
    isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
    isWithinInterval(eventEnd, { start: dayStart, end: dayEnd })
  );
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: Event[], date: Date): Event[] {
  return events.filter(event => isEventOnDate(event, date));
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ko });
}

/**
 * Navigate calendar dates
 */
export function navigateDate(
  currentDate: Date,
  direction: 'prev' | 'next',
  view: 'day' | 'week' | 'month'
): Date {
  switch (view) {
    case 'day':
      return direction === 'next' 
        ? addDays(currentDate, 1) 
        : addDays(currentDate, -1);
    case 'week':
      return direction === 'next'
        ? addWeeks(currentDate, 1)
        : addWeeks(currentDate, -1);
    case 'month':
      return direction === 'next'
        ? addMonths(currentDate, 1)
        : subMonths(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Get week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get event color (from event, category, or default)
 */
export function getEventColor(event: Event): string {
  if (event.color) {
    return event.color;
  }
  if (event.category?.color) {
    return event.category.color;
  }
  return '#4ECDC4'; // Default teal color
}

/**
 * Sort events by start date
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return events.sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: Event[]): Map<string, Event[]> {
  const grouped = new Map<string, Event[]>();

  events.forEach(event => {
    const dateKey = format(parseISO(event.startDate), 'yyyy-MM-dd');
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });

  return grouped;
}