'use client';

import { cn } from '@/lib/utils';
import { getProgressColor, formatProgress } from '@/types/goals';

interface GoalProgressBarProps {
  progress: number;
  showLabel?: boolean;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function GoalProgressBar({
  progress,
  showLabel = true,
  className,
  height = 'md',
}: GoalProgressBarProps) {
  const color = getProgressColor(progress);
  
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">진행률</span>
          <span className="text-xs font-medium">{formatProgress(progress)}</span>
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-in-out',
            heightClass
          )}
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}