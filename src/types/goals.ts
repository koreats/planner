/**
 * Goal Management Types
 */

import type { Category } from './calendar';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type GoalLevel = 1 | 2 | 3 | 4;

export const GOAL_LEVEL_LABELS: Record<GoalLevel, string> = {
  1: '장기 목표',
  2: '연간 목표',
  3: '분기/월간 목표',
  4: '주간/일일 목표',
};

export interface Goal {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  level: GoalLevel;
  progress: number; // 0-100
  status: GoalStatus;
  startDate?: string; // ISO 8601 format
  dueDate?: string; // ISO 8601 format
  completedAt?: string; // ISO 8601 format
  categoryId?: string;
  category?: Category;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithChildren extends Goal {
  children?: GoalWithChildren[];
  parent?: Goal;
}

export interface GoalTreeNode {
  goal: Goal;
  children: GoalTreeNode[];
  expanded?: boolean;
  selected?: boolean;
}

// Input types for CRUD operations
export interface CreateGoalInput {
  title: string;
  description?: string;
  parentId?: string;
  level: GoalLevel;
  startDate?: string | Date;
  dueDate?: string | Date;
  categoryId?: string;
}

export interface UpdateGoalInput {
  id: string;
  title?: string;
  description?: string;
  progress?: number;
  status?: GoalStatus;
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  categoryId?: string | null;
}

// Filter types
export interface GoalFilters {
  level?: GoalLevel;
  status?: GoalStatus;
  categoryId?: string;
  parentId?: string | null; // null means root goals only
  searchTerm?: string;
}

// Statistics types
export interface GoalStatistics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  overallProgress: number;
  goalsByLevel: Record<GoalLevel, number>;
  goalsByStatus: Record<GoalStatus, number>;
}

// Helper function to determine if a goal can have children
export function canHaveChildren(goal: Goal): boolean {
  return goal.level < 4;
}

// Helper function to get allowed child level
export function getChildLevel(parentLevel: GoalLevel): GoalLevel | null {
  if (parentLevel >= 4) return null;
  return (parentLevel + 1) as GoalLevel;
}

// Helper function to format progress percentage
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

// Helper function to get status color
export function getStatusColor(status: GoalStatus): string {
  switch (status) {
    case 'completed':
      return '#22c55e'; // green
    case 'active':
      return '#3b82f6'; // blue
    case 'paused':
      return '#f59e0b'; // amber
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

// Helper function to get progress color
export function getProgressColor(progress: number): string {
  if (progress >= 80) return '#22c55e'; // green
  if (progress >= 60) return '#84cc16'; // lime
  if (progress >= 40) return '#f59e0b'; // amber
  if (progress >= 20) return '#fb923c'; // orange
  return '#ef4444'; // red
}