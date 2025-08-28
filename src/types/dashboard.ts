/**
 * Dashboard Data Types
 */

import type { Goal } from './goals';
import type { Event } from './calendar';

// Dashboard Overview Statistics
export interface DashboardStatistics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  overallProgress: number;
  totalEvents: number;
  completedEvents: number;
  overdueItems: number;
  todayTasksCount: number;
}

// Chart Data Types
export interface ProgressChartData {
  name: string;
  value: number;
  color: string;
  level?: number;
}

export interface CategoryDistributionData {
  name: string;
  goals: number;
  events: number;
  color: string;
}

export interface TrendData {
  date: string;
  goals: number;
  events: number;
  progress: number;
}

// Today's Tasks
export interface TodayTask {
  id: string;
  title: string;
  type: 'goal' | 'event';
  priority: number; // 1-10 scale
  completed: boolean;
  dueTime?: string;
  category?: {
    name: string;
    color: string;
  };
  progress?: number; // for goals
  description?: string;
  originalItem: Goal | Event;
}

// Overdue Items
export interface OverdueItem {
  id: string;
  title: string;
  type: 'goal' | 'event';
  dueDate: string;
  daysOverdue: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category?: {
    name: string;
    color: string;
  };
  progress?: number; // for goals
  originalItem: Goal | Event;
}

// Productivity Metrics
export interface ProductivityMetrics {
  completionRate: number; // percentage
  averageTasksPerDay: number;
  streakDays: number; // consecutive days with completed tasks
  weeklyGoalProgress: number; // percentage
  timeToCompletion: number; // average days to complete goals
  categoryEfficiency: {
    categoryName: string;
    completionRate: number;
    color: string;
  }[];
}

// Priority Update
export interface PriorityUpdate {
  taskId: string;
  newPriority: number;
  type: 'goal' | 'event';
}

// Dashboard Data Container
export interface DashboardData {
  statistics: DashboardStatistics;
  progressChart: ProgressChartData[];
  categoryDistribution: CategoryDistributionData[];
  trends: TrendData[];
  todayTasks: TodayTask[];
  overdueItems: OverdueItem[];
  productivityMetrics: ProductivityMetrics;
  lastUpdated: string;
}

// Filters for dashboard data
export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  showCompleted?: boolean;
  priorityThreshold?: number;
}

// Helper functions
export function getUrgencyColor(urgency: OverdueItem['urgency']): string {
  switch (urgency) {
    case 'critical': return '#ef4444'; // red
    case 'high': return '#f97316'; // orange
    case 'medium': return '#eab308'; // yellow
    case 'low': return '#84cc16'; // lime
    default: return '#6b7280'; // gray
  }
}

export function getPriorityColor(priority: number): string {
  if (priority >= 9) return '#ef4444'; // red - critical
  if (priority >= 7) return '#f97316'; // orange - high  
  if (priority >= 5) return '#eab308'; // yellow - medium
  if (priority >= 3) return '#84cc16'; // lime - low
  return '#6b7280'; // gray - minimal
}

export function calculateUrgency(daysOverdue: number): OverdueItem['urgency'] {
  if (daysOverdue >= 7) return 'critical';
  if (daysOverdue >= 3) return 'high';
  if (daysOverdue >= 1) return 'medium';
  return 'low';
}