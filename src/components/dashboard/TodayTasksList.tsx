'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  GripVertical,
  Plus,
  AlertCircle 
} from 'lucide-react';
import type { TodayTask, PriorityUpdate } from '@/types/dashboard';
import { getPriorityColor } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TodayTasksListProps {
  tasks: TodayTask[];
  onTaskComplete: (taskId: string, type: 'goal' | 'event') => void;
  onPriorityUpdate: (updates: PriorityUpdate[]) => void;
  onAddTask?: () => void;
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
}

// Sortable task item component
function SortableTaskItem({ 
  task, 
  onComplete, 
  isCompleted 
}: { 
  task: TodayTask; 
  onComplete: (checked: boolean) => void;
  isCompleted: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-background border rounded-lg transition-all",
        isDragging && "shadow-lg z-10 rotate-2",
        isCompleted && "opacity-60"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Task Checkbox */}
      <Checkbox
        id={task.id}
        checked={isCompleted}
        onCheckedChange={onComplete}
        className="flex-shrink-0"
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* Task Type Icon */}
          {task.type === 'goal' ? (
            <Target className="h-4 w-4 text-purple-500 flex-shrink-0" />
          ) : (
            <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          
          {/* Task Title */}
          <h4 className={cn(
            "font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
          
          {/* Priority Badge */}
          <Badge 
            variant="outline" 
            className="flex-shrink-0 text-xs"
            style={{ 
              borderColor: getPriorityColor(task.priority),
              color: getPriorityColor(task.priority)
            }}
          >
            P{task.priority}
          </Badge>
        </div>

        {/* Task Details */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {/* Due Time */}
          {task.dueTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.dueTime}</span>
            </div>
          )}
          
          {/* Progress (for goals) */}
          {task.type === 'goal' && task.progress !== undefined && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{task.progress}%</span>
            </div>
          )}
          
          {/* Category */}
          {task.category && (
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: task.category.color }}
              />
              <span>{task.category.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function TodayTasksList({
  tasks,
  onTaskComplete,
  onPriorityUpdate,
  onAddTask,
  title = "오늘 할 일",
  description = "우선순위별로 정렬된 오늘의 작업",
  className,
  isLoading = false,
}: TodayTasksListProps) {
  const [localTasks, setLocalTasks] = useState<TodayTask[]>(tasks);

  // Update local tasks when props change
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localTasks.findIndex(task => task.id === active.id);
    const newIndex = localTasks.findIndex(task => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Create priority updates based on new order
      const updates: PriorityUpdate[] = newTasks.map((task, index) => ({
        taskId: task.id,
        newPriority: 10 - index, // Higher index = lower priority
        type: task.type,
      }));

      onPriorityUpdate(updates);
    }
  };

  // Handle task completion
  const handleTaskComplete = (taskId: string, type: 'goal' | 'event', completed: boolean) => {
    if (completed) {
      onTaskComplete(taskId, type);
    }
  };

  // Statistics
  const completedTasks = localTasks.filter(task => task.completed).length;
  const totalTasks = localTasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {title}
              {totalTasks > 0 && (
                <Badge variant="secondary">
                  {completedTasks}/{totalTasks}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {onAddTask && (
            <Button size="sm" onClick={onAddTask}>
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          )}
        </div>
        
        {/* Progress Summary */}
        {totalTasks > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">완료율</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">작업을 불러오는 중...</p>
            </div>
          </div>
        ) : totalTasks === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">오늘 예정된 작업이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              새로운 목표나 일정을 추가해보세요
            </p>
            {onAddTask && (
              <Button variant="outline" onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                작업 추가
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={localTasks.map(task => task.id)} 
                strategy={verticalListSortingStrategy}
              >
                {localTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isCompleted={task.completed}
                    onComplete={(checked) => 
                      handleTaskComplete(task.id, task.type, checked)
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
}