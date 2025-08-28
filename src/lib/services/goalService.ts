import { createClient } from '@/lib/supabase/client';
import type {
  Goal,
  GoalWithChildren,
  CreateGoalInput,
  UpdateGoalInput,
  GoalFilters,
  GoalStatistics,
} from '@/types/goals';

class GoalService {
  private supabase = createClient();

  /**
   * Get all goals for the current user with optional filters
   */
  async getGoals(filters?: GoalFilters): Promise<Goal[]> {
    let query = this.supabase
      .from('goals')
      .select(`
        *,
        category:categories(*)
      `)
      .order('level', { ascending: true })
      .order('created_at', { ascending: true });

    // Apply filters
    if (filters?.level !== undefined) {
      query = query.eq('level', filters.level);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parentId);
      }
    }
    if (filters?.searchTerm) {
      query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(this.transformGoal);
  }

  /**
   * Get goals in hierarchical structure
   */
  async getGoalTree(): Promise<GoalWithChildren[]> {
    const goals = await this.getGoals();
    return this.buildGoalTree(goals);
  }

  /**
   * Get a single goal by ID
   */
  async getGoal(id: string): Promise<Goal> {
    const { data, error } = await this.supabase
      .from('goals')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return this.transformGoal(data);
  }

  /**
   * Get goal with all its children
   */
  async getGoalWithChildren(id: string): Promise<GoalWithChildren> {
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === id);
    
    if (!goal) {
      throw new Error('Goal not found');
    }

    return this.buildGoalBranch(goal, goals);
  }

  /**
   * Get all ancestors of a goal
   */
  async getGoalAncestors(id: string): Promise<Goal[]> {
    const ancestors: Goal[] = [];
    let currentGoal = await this.getGoal(id);

    while (currentGoal.parentId) {
      const parent = await this.getGoal(currentGoal.parentId);
      ancestors.unshift(parent);
      currentGoal = parent;
    }

    return ancestors;
  }

  /**
   * Get direct children of a goal
   */
  async getGoalChildren(parentId: string): Promise<Goal[]> {
    return this.getGoals({ parentId });
  }

  /**
   * Create a new goal
   */
  async createGoal(input: CreateGoalInput): Promise<Goal> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate parent level if provided
    if (input.parentId) {
      const parent = await this.getGoal(input.parentId);
      if (parent.level >= 4) {
        throw new Error('Cannot add children to level 4 goals');
      }
      if (input.level !== parent.level + 1) {
        throw new Error('Child level must be exactly one greater than parent level');
      }
    } else if (input.level !== 1) {
      throw new Error('Root goals must be level 1');
    }

    const goalData = {
      title: input.title,
      description: input.description,
      parent_id: input.parentId,
      level: input.level,
      start_date: input.startDate ? this.toISOString(input.startDate) : null,
      due_date: input.dueDate ? this.toISOString(input.dueDate) : null,
      category_id: input.categoryId,
      user_id: user.id,
    };

    const { data, error } = await this.supabase
      .from('goals')
      .insert(goalData)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return this.transformGoal(data);
  }

  /**
   * Update an existing goal
   */
  async updateGoal(input: UpdateGoalInput): Promise<Goal> {
    const { id, ...updateData } = input;

    const goalData: any = {};
    
    if (updateData.title !== undefined) goalData.title = updateData.title;
    if (updateData.description !== undefined) goalData.description = updateData.description;
    if (updateData.progress !== undefined) {
      goalData.progress = Math.min(100, Math.max(0, updateData.progress));
    }
    if (updateData.status !== undefined) goalData.status = updateData.status;
    if (updateData.startDate !== undefined) {
      goalData.start_date = updateData.startDate ? this.toISOString(updateData.startDate) : null;
    }
    if (updateData.dueDate !== undefined) {
      goalData.due_date = updateData.dueDate ? this.toISOString(updateData.dueDate) : null;
    }
    if (updateData.categoryId !== undefined) goalData.category_id = updateData.categoryId;

    // Auto-complete if progress is 100
    if (goalData.progress === 100 && goalData.status !== 'completed') {
      goalData.status = 'completed';
      goalData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('goals')
      .update(goalData)
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return this.transformGoal(data);
  }

  /**
   * Delete a goal and all its children
   */
  async deleteGoal(id: string): Promise<void> {
    // Children will be deleted automatically due to CASCADE
    const { error } = await this.supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Move a goal to a different parent
   */
  async moveGoal(goalId: string, newParentId?: string): Promise<Goal> {
    const goal = await this.getGoal(goalId);
    
    // Determine new level
    let newLevel = 1;
    if (newParentId) {
      const newParent = await this.getGoal(newParentId);
      if (newParent.level >= 4) {
        throw new Error('Cannot move goal to level 4 parent');
      }
      newLevel = newParent.level + 1;
    }

    // Check if moving would create invalid hierarchy
    if (newLevel > 4) {
      throw new Error('Cannot create goals deeper than level 4');
    }

    // Update the goal
    const { data, error } = await this.supabase
      .from('goals')
      .update({
        parent_id: newParentId || null,
        level: newLevel,
      })
      .eq('id', goalId)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Update all descendants' levels
    await this.updateDescendantLevels(goalId, newLevel);

    return this.transformGoal(data);
  }

  /**
   * Update progress for a goal
   */
  async updateProgress(goalId: string, progress: number): Promise<Goal> {
    return this.updateGoal({
      id: goalId,
      progress,
      status: progress === 100 ? 'completed' : 'active',
    });
  }

  /**
   * Get goal statistics
   */
  async getGoalStatistics(): Promise<GoalStatistics> {
    const goals = await this.getGoals();

    const stats: GoalStatistics = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      overallProgress: 0,
      goalsByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
      goalsByStatus: {
        active: 0,
        completed: 0,
        paused: 0,
        cancelled: 0,
      },
    };

    let totalProgress = 0;
    goals.forEach(goal => {
      stats.goalsByLevel[goal.level]++;
      stats.goalsByStatus[goal.status]++;
      totalProgress += goal.progress;
    });

    stats.overallProgress = goals.length > 0 ? totalProgress / goals.length : 0;

    return stats;
  }

  /**
   * Calculate parent goal progress based on children's progress (client-side)
   */
  async calculateParentProgress(parentId: string): Promise<number> {
    const children = await this.getGoalChildren(parentId);
    
    if (children.length === 0) {
      return 0;
    }

    // Only consider active and completed goals for progress calculation
    const relevantChildren = children.filter(child => 
      child.status === 'active' || child.status === 'completed'
    );

    if (relevantChildren.length === 0) {
      return 0;
    }

    const totalProgress = relevantChildren.reduce((sum, child) => sum + child.progress, 0);
    const averageProgress = totalProgress / relevantChildren.length;
    
    return Math.round(averageProgress * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Update parent progress and propagate changes up the hierarchy
   */
  async updateParentProgressChain(goalId: string): Promise<void> {
    const goal = await this.getGoal(goalId);
    
    // If this goal has no parent, nothing to update
    if (!goal.parentId) {
      return;
    }

    // Calculate new parent progress
    const newParentProgress = await this.calculateParentProgress(goal.parentId);
    const parent = await this.getGoal(goal.parentId);

    // Only update if progress actually changed
    if (Math.abs(parent.progress - newParentProgress) > 0.01) {
      const newStatus = newParentProgress === 100 ? 'completed' : 
                       parent.status === 'completed' && newParentProgress < 100 ? 'active' : 
                       parent.status;

      // Update parent goal
      await this.updateGoal({
        id: goal.parentId,
        progress: newParentProgress,
        status: newStatus,
      });

      // Recursively update grandparent and above
      await this.updateParentProgressChain(goal.parentId);
    }
  }

  /**
   * Update progress with automatic parent progress calculation
   */
  async updateProgressWithParentCalculation(goalId: string, progress: number): Promise<Goal> {
    // Update the current goal
    const updatedGoal = await this.updateProgress(goalId, progress);
    
    // Update parent progress chain
    await this.updateParentProgressChain(goalId);
    
    return updatedGoal;
  }

  /**
   * Build hierarchical tree from flat goal list
   */
  private buildGoalTree(goals: Goal[]): GoalWithChildren[] {
    const goalMap = new Map<string, GoalWithChildren>();
    const rootGoals: GoalWithChildren[] = [];

    // First pass: create map of all goals
    goals.forEach(goal => {
      goalMap.set(goal.id, { ...goal, children: [] });
    });

    // Second pass: build tree structure
    goals.forEach(goal => {
      const goalNode = goalMap.get(goal.id)!;
      
      if (goal.parentId) {
        const parent = goalMap.get(goal.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(goalNode);
          goalNode.parent = parent;
        }
      } else {
        rootGoals.push(goalNode);
      }
    });

    return rootGoals;
  }

  /**
   * Build a branch of the goal tree starting from a specific goal
   */
  private buildGoalBranch(goal: Goal, allGoals: Goal[]): GoalWithChildren {
    const children = allGoals
      .filter(g => g.parentId === goal.id)
      .map(child => this.buildGoalBranch(child, allGoals));

    return {
      ...goal,
      children,
    };
  }

  /**
   * Update levels of all descendants
   */
  private async updateDescendantLevels(goalId: string, parentLevel: number): Promise<void> {
    const children = await this.getGoalChildren(goalId);
    
    for (const child of children) {
      const newLevel = parentLevel + 1;
      if (newLevel <= 4) {
        await this.supabase
          .from('goals')
          .update({ level: newLevel })
          .eq('id', child.id);
        
        // Recursively update grandchildren
        await this.updateDescendantLevels(child.id, newLevel);
      }
    }
  }

  /**
   * Transform database record to Goal type
   */
  private transformGoal(data: any): Goal {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      parentId: data.parent_id,
      level: data.level,
      progress: parseFloat(data.progress || 0),
      status: data.status,
      startDate: data.start_date,
      dueDate: data.due_date,
      completedAt: data.completed_at,
      categoryId: data.category_id,
      category: data.category,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Convert date to ISO string format
   */
  private toISOString(date: string | Date): string {
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return date.toISOString();
  }
}

export const goalService = new GoalService();