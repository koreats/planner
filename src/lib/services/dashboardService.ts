import { goalService } from './goalService';
import { eventService } from './eventService';
import { categoryService } from './categoryService';
import type { Goal } from '@/types/goals';
import type { Event, Category } from '@/types/calendar';
import type {
  DashboardData,
  DashboardStatistics,
  ProgressChartData,
  CategoryDistributionData,
  TodayTask,
  OverdueItem,
  ProductivityMetrics,
  TrendData,
  PriorityUpdate,
  DashboardFilters,
} from '@/types/dashboard';
import { calculateUrgency, getPriorityColor } from '@/types/dashboard';
import { isToday, isPast, differenceInDays, startOfDay, endOfDay, subDays, format } from 'date-fns';

class DashboardService {
  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    const [goals, events, categories] = await Promise.all([
      goalService.getGoals(),
      eventService.getEvents(),
      categoryService.getCategories(),
    ]);

    const statistics = this.calculateStatistics(goals, events);
    const progressChart = this.createProgressChartData(goals);
    const categoryDistribution = this.createCategoryDistribution(goals, events, categories);
    const todayTasks = this.getTodayTasks(goals, events);
    const overdueItems = this.getOverdueItems(goals, events);
    const productivityMetrics = this.calculateProductivityMetrics(goals, events, categories);
    const trends = await this.calculateTrends(goals, events);

    return {
      statistics,
      progressChart,
      categoryDistribution,
      trends,
      todayTasks,
      overdueItems,
      productivityMetrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate basic statistics for dashboard overview
   */
  private calculateStatistics(goals: Goal[], events: Event[]): DashboardStatistics {
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    
    // Calculate overall progress
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    const overallProgress = goals.length > 0 ? totalProgress / goals.length : 0;

    // Count today's tasks (Level 4 goals + today's events)
    const todayGoals = goals.filter(g => g.level === 4 && this.isDueToday(g));
    const todayEvents = events.filter(e => isToday(new Date(e.startDate)));
    const todayTasksCount = todayGoals.length + todayEvents.length;

    // Count completed events (assuming past events are completed)
    const completedEvents = events.filter(e => isPast(new Date(e.endDate))).length;

    // Count overdue items
    const overdueGoals = goals.filter(g => this.isOverdue(g));
    const overdueEvents = events.filter(e => this.isOverdue(e));
    const overdueItems = overdueGoals.length + overdueEvents.length;

    return {
      totalGoals: goals.length,
      completedGoals,
      activeGoals,
      overallProgress,
      totalEvents: events.length,
      completedEvents,
      overdueItems,
      todayTasksCount,
    };
  }

  /**
   * Create progress chart data showing completion by goal level
   */
  private createProgressChartData(goals: Goal[]): ProgressChartData[] {
    const levelGroups = {
      1: { name: '장기 목표', goals: goals.filter(g => g.level === 1) },
      2: { name: '연간 목표', goals: goals.filter(g => g.level === 2) },
      3: { name: '분기/월간 목표', goals: goals.filter(g => g.level === 3) },
      4: { name: '주간/일일 목표', goals: goals.filter(g => g.level === 4) },
    };

    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']; // purple, blue, green, orange

    return Object.entries(levelGroups).map(([level, data], index) => {
      const completed = data.goals.filter(g => g.status === 'completed').length;
      const total = data.goals.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return {
        name: data.name,
        value: Math.round(percentage),
        color: colors[index],
        level: parseInt(level),
      };
    });
  }

  /**
   * Create category distribution data
   */
  private createCategoryDistribution(
    goals: Goal[], 
    events: Event[], 
    categories: Category[]
  ): CategoryDistributionData[] {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    return categories.map(category => {
      const categoryGoals = goals.filter(g => g.categoryId === category.id).length;
      const categoryEvents = events.filter(e => e.categoryId === category.id).length;

      return {
        name: category.name,
        goals: categoryGoals,
        events: categoryEvents,
        color: category.color,
      };
    });
  }

  /**
   * Get today's tasks (Level 4 goals + today's events)
   */
  private getTodayTasks(goals: Goal[], events: Event[]): TodayTask[] {
    const tasks: TodayTask[] = [];

    // Add Level 4 goals due today or without due date but active
    const todayGoals = goals.filter(g => {
      return g.level === 4 && 
             g.status === 'active' && 
             (this.isDueToday(g) || !g.dueDate);
    });

    todayGoals.forEach(goal => {
      tasks.push({
        id: goal.id,
        title: goal.title,
        type: 'goal',
        priority: this.calculateGoalPriority(goal),
        completed: goal.status === 'completed',
        progress: goal.progress,
        category: goal.category ? {
          name: goal.category.name,
          color: goal.category.color,
        } : undefined,
        description: goal.description,
        originalItem: goal,
      });
    });

    // Add today's events
    const todayEvents = events.filter(e => isToday(new Date(e.startDate)));
    
    todayEvents.forEach(event => {
      tasks.push({
        id: event.id,
        title: event.title,
        type: 'event',
        priority: this.calculateEventPriority(event),
        completed: isPast(new Date(event.endDate)),
        dueTime: event.allDay ? undefined : format(new Date(event.startDate), 'HH:mm'),
        category: event.category ? {
          name: event.category.name,
          color: event.category.color,
        } : undefined,
        description: event.description,
        originalItem: event,
      });
    });

    // Sort by priority (descending) and then by due time
    return tasks.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
      if (a.dueTime && !b.dueTime) return -1;
      if (!a.dueTime && b.dueTime) return 1;
      return 0;
    });
  }

  /**
   * Get overdue items
   */
  private getOverdueItems(goals: Goal[], events: Event[]): OverdueItem[] {
    const items: OverdueItem[] = [];

    // Add overdue goals
    const overdueGoals = goals.filter(g => this.isOverdue(g));
    overdueGoals.forEach(goal => {
      const daysOverdue = goal.dueDate ? 
        differenceInDays(new Date(), new Date(goal.dueDate)) : 0;
      
      items.push({
        id: goal.id,
        title: goal.title,
        type: 'goal',
        dueDate: goal.dueDate!,
        daysOverdue,
        urgency: calculateUrgency(daysOverdue),
        progress: goal.progress,
        category: goal.category ? {
          name: goal.category.name,
          color: goal.category.color,
        } : undefined,
        originalItem: goal,
      });
    });

    // Add overdue events (events that ended but were not marked complete)
    const overdueEvents = events.filter(e => this.isOverdue(e));
    overdueEvents.forEach(event => {
      const daysOverdue = differenceInDays(new Date(), new Date(event.endDate));
      
      items.push({
        id: event.id,
        title: event.title,
        type: 'event',
        dueDate: event.endDate,
        daysOverdue,
        urgency: calculateUrgency(daysOverdue),
        category: event.category ? {
          name: event.category.name,
          color: event.category.color,
        } : undefined,
        originalItem: event,
      });
    });

    // Sort by urgency and days overdue
    return items.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.daysOverdue - a.daysOverdue;
    });
  }

  /**
   * Calculate productivity metrics
   */
  private calculateProductivityMetrics(
    goals: Goal[], 
    events: Event[], 
    categories: Category[]
  ): ProductivityMetrics {
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalItems = goals.length + events.length;
    const completedEvents = events.filter(e => isPast(new Date(e.endDate)));
    const completedItems = completedGoals.length + completedEvents.length;
    
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Calculate weekly goal progress (Level 4 goals from this week)
    const weekStart = subDays(new Date(), 7);
    const weeklyGoals = goals.filter(g => 
      g.level === 4 && 
      new Date(g.createdAt) >= weekStart
    );
    const weeklyProgress = weeklyGoals.length > 0 
      ? weeklyGoals.reduce((sum, g) => sum + g.progress, 0) / weeklyGoals.length
      : 0;

    // Calculate category efficiency
    const categoryEfficiency = categories.map(category => {
      const categoryItems = [
        ...goals.filter(g => g.categoryId === category.id),
        ...events.filter(e => e.categoryId === category.id),
      ];
      
      const categoryCompleted = [
        ...goals.filter(g => g.categoryId === category.id && g.status === 'completed'),
        ...events.filter(e => e.categoryId === category.id && isPast(new Date(e.endDate))),
      ];

      const categoryCompletionRate = categoryItems.length > 0 
        ? (categoryCompleted.length / categoryItems.length) * 100
        : 0;

      return {
        categoryName: category.name,
        completionRate: Math.round(categoryCompletionRate),
        color: category.color,
      };
    });

    return {
      completionRate: Math.round(completionRate),
      averageTasksPerDay: Math.round(totalItems / 7), // Assuming 7-day average
      streakDays: this.calculateStreakDays(goals, events),
      weeklyGoalProgress: Math.round(weeklyProgress),
      timeToCompletion: this.calculateAverageTimeToCompletion(completedGoals),
      categoryEfficiency,
    };
  }

  /**
   * Calculate trends data for the last 7 days
   */
  private async calculateTrends(goals: Goal[], events: Event[]): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count goals and events created/updated on this date
      const dayGoals = goals.filter(g => 
        format(new Date(g.createdAt), 'yyyy-MM-dd') === dateStr ||
        (g.updatedAt && format(new Date(g.updatedAt), 'yyyy-MM-dd') === dateStr)
      ).length;
      
      const dayEvents = events.filter(e => 
        format(new Date(e.startDate), 'yyyy-MM-dd') === dateStr
      ).length;

      // Calculate average progress for goals updated on this day
      const updatedGoals = goals.filter(g => 
        g.updatedAt && format(new Date(g.updatedAt), 'yyyy-MM-dd') === dateStr
      );
      const progress = updatedGoals.length > 0 
        ? updatedGoals.reduce((sum, g) => sum + g.progress, 0) / updatedGoals.length
        : 0;

      trends.push({
        date: format(date, 'MM/dd'),
        goals: dayGoals,
        events: dayEvents,
        progress: Math.round(progress),
      });
    }

    return trends;
  }

  /**
   * Update task priorities (for drag-and-drop)
   */
  async updateTaskPriorities(updates: PriorityUpdate[]): Promise<void> {
    const promises = updates.map(update => {
      if (update.type === 'goal') {
        // For goals, we can store priority in a custom field or use a separate priority system
        // For now, we'll assume the goalService has a priority field or we extend it
        return this.updateGoalPriority(update.taskId, update.newPriority);
      } else {
        // For events, similar approach
        return this.updateEventPriority(update.taskId, update.newPriority);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Helper methods
   */
  private isDueToday(goal: Goal): boolean {
    if (!goal.dueDate) return false;
    return isToday(new Date(goal.dueDate));
  }

  private isOverdue(item: Goal | Event): boolean {
    const dueDate = 'dueDate' in item ? item.dueDate : (item as Event).endDate;
    if (!dueDate) return false;
    
    const now = new Date();
    const due = new Date(dueDate);
    
    // For goals, check if past due date and not completed
    if ('status' in item) {
      return isPast(due) && item.status !== 'completed';
    }
    
    // For events, check if past end date
    return isPast(due);
  }

  private calculateGoalPriority(goal: Goal): number {
    let priority = 5; // Base priority
    
    // Increase priority based on goal level (higher level = more urgent)
    priority += goal.level;
    
    // Increase priority if due today
    if (goal.dueDate && isToday(new Date(goal.dueDate))) {
      priority += 2;
    }
    
    // Increase priority based on progress (closer to completion = higher priority)
    if (goal.progress > 80) priority += 2;
    else if (goal.progress > 60) priority += 1;
    
    return Math.min(10, Math.max(1, priority));
  }

  private calculateEventPriority(event: Event): number {
    let priority = 5; // Base priority
    
    // Increase priority if starting soon
    const startTime = new Date(event.startDate);
    const hoursUntilStart = (startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilStart <= 1) priority += 3;
    else if (hoursUntilStart <= 3) priority += 2;
    else if (hoursUntilStart <= 6) priority += 1;
    
    // All-day events get lower priority
    if (event.allDay) priority -= 1;
    
    return Math.min(10, Math.max(1, priority));
  }

  private calculateStreakDays(goals: Goal[], events: Event[]): number {
    // This is a simplified calculation - in a real app you'd track daily completions
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      
      const dayHasActivity = goals.some(g => 
        g.updatedAt && format(new Date(g.updatedAt), 'yyyy-MM-dd') === dateStr
      ) || events.some(e => 
        format(new Date(e.startDate), 'yyyy-MM-dd') === dateStr
      );
      
      if (dayHasActivity) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateAverageTimeToCompletion(completedGoals: Goal[]): number {
    if (completedGoals.length === 0) return 0;
    
    const completionTimes = completedGoals
      .filter(g => g.completedAt)
      .map(g => differenceInDays(new Date(g.completedAt!), new Date(g.createdAt)));
    
    return completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
      : 0;
  }

  private async updateGoalPriority(goalId: string, priority: number): Promise<void> {
    // This would need to be implemented in goalService
    // For now, we'll assume it exists or we can extend the goal model
    console.log(`Update goal ${goalId} priority to ${priority}`);
  }

  private async updateEventPriority(eventId: string, priority: number): Promise<void> {
    // This would need to be implemented in eventService
    // For now, we'll assume it exists or we can extend the event model
    console.log(`Update event ${eventId} priority to ${priority}`);
  }
}

export const dashboardService = new DashboardService();