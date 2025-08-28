/**
 * Calendar and Event Types
 */

export interface Category {
  id: string;
  name: string;
  color: string; // HEX color format #RRGGBB
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  allDay: boolean;
  categoryId?: string;
  category?: Category; // Populated when joined
  tags: string[];
  color?: string; // Override color, HEX format
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  selectedDate?: Date;
  selectedEvent?: Event;
}

// Input types for CRUD operations
export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  allDay?: boolean;
  categoryId?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

// Filter types
export interface EventFilters {
  startDate?: string | Date;
  endDate?: string | Date;
  categoryId?: string;
  tags?: string[];
  searchTerm?: string;
}

// Color preset for quick selection
export const COLOR_PRESETS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#FFB6C1', // Pink
  '#87CEEB', // Sky Blue
  '#DEB887', // Tan
] as const;

export type ColorPreset = typeof COLOR_PRESETS[number];