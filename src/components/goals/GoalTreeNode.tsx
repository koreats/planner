'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  Edit2, 
  Trash2, 
  Plus,
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { GoalProgressBar } from './GoalProgressBar';
import type { GoalWithChildren } from '@/types/goals';
import { 
  GOAL_LEVEL_LABELS, 
  getStatusColor, 
  canHaveChildren,
} from '@/types/goals';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GoalTreeNodeProps {
  goal: GoalWithChildren;
  level?: number;
  onEdit?: (goal: GoalWithChildren) => void;
  onDelete?: (goal: GoalWithChildren) => void;
  onAddChild?: (parent: GoalWithChildren) => void;
  onUpdateProgress?: (goal: GoalWithChildren, progress: number) => void;
  defaultExpanded?: boolean;
}

export function GoalTreeNode({
  goal,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onUpdateProgress,
  defaultExpanded = false,
}: GoalTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [tempProgress, setTempProgress] = useState(goal.progress);
  const hasChildren = goal.children && goal.children.length > 0;
  const canAddChild = canHaveChildren(goal);

  const statusIcon = {
    active: <Target className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    paused: <PauseCircle className="h-4 w-4 text-amber-600" />,
    cancelled: <XCircle className="h-4 w-4 text-red-600" />,
  }[goal.status];

  const levelColor = {
    1: 'border-l-4 border-l-purple-500',
    2: 'border-l-4 border-l-blue-500',
    3: 'border-l-4 border-l-green-500',
    4: 'border-l-4 border-l-orange-500',
  }[goal.level as 1 | 2 | 3 | 4];

  const handleProgressUpdate = async (progress: number) => {
    if (onUpdateProgress) {
      setTempProgress(progress);
      await onUpdateProgress(goal, progress);
      setShowProgressSlider(false);
    }
  };

  const handleProgressSliderChange = (values: number[]) => {
    setTempProgress(values[0]);
  };

  const handleProgressBarClick = () => {
    if (onUpdateProgress && goal.status !== 'completed') {
      setShowProgressSlider(true);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          'group flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors',
          levelColor,
          level > 0 && 'ml-6'
        )}
      >
        <div className="flex items-start gap-2">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0',
              !hasChildren && 'invisible'
            )}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {/* Status Icon */}
          {statusIcon}

          {/* Goal Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                'font-semibold',
                goal.status === 'completed' && 'line-through text-muted-foreground'
              )}>
                {goal.title}
              </h3>
              <Badge variant="outline" className="text-xs">
                {GOAL_LEVEL_LABELS[goal.level]}
              </Badge>
              {goal.category && (
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: goal.category.color + '20',
                    color: goal.category.color,
                    borderColor: goal.category.color,
                  }}
                >
                  {goal.category.name}
                </Badge>
              )}
            </div>

            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
            )}

            {/* Dates */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {goal.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>시작: {format(new Date(goal.startDate), 'yyyy-MM-dd', { locale: ko })}</span>
                </div>
              )}
              {goal.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>마감: {format(new Date(goal.dueDate), 'yyyy-MM-dd', { locale: ko })}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              {!showProgressSlider ? (
                <div 
                  className={cn(
                    "cursor-pointer transition-opacity",
                    onUpdateProgress && goal.status !== 'completed' && "hover:opacity-80"
                  )}
                  onClick={handleProgressBarClick}
                  title={onUpdateProgress && goal.status !== 'completed' ? "클릭하여 진행률 수정" : ""}
                >
                  <GoalProgressBar 
                    progress={goal.progress} 
                    height="sm"
                    showLabel={true}
                  />
                </div>
              ) : (
                <div className="space-y-2 p-2 bg-muted/50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">진행률 수정</span>
                    <span className="text-xs font-medium">{tempProgress}%</span>
                  </div>
                  <Slider
                    value={[tempProgress]}
                    onValueChange={handleProgressSliderChange}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowProgressSlider(false)}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleProgressUpdate(tempProgress)}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      업데이트
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canAddChild && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddChild?.(goal)}
                title="하위 목표 추가"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(goal)}
              title="수정"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(goal)}
              title="삭제"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1">
          {goal.children!.map((child) => (
            <GoalTreeNode
              key={child.id}
              goal={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onUpdateProgress={onUpdateProgress}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Import Slider component from shadcn/ui
import '@/components/ui/slider';