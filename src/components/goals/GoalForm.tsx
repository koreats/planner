'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalLevel, GoalStatus } from '@/types/goals';
import type { Category } from '@/types/calendar';
import { GOAL_LEVEL_LABELS, getChildLevel } from '@/types/goals';

const goalSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(500),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  goal?: Goal;
  parent?: Goal;
  categories?: Category[];
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => void;
  onCancel: () => void;
}

export function GoalForm({
  goal,
  parent,
  categories = [],
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const isEdit = !!goal;
  const goalLevel = goal?.level || (parent ? getChildLevel(parent.level) : 1);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || '',
      description: goal?.description || '',
      startDate: goal?.startDate ? format(new Date(goal.startDate), 'yyyy-MM-dd') : '',
      dueDate: goal?.dueDate ? format(new Date(goal.dueDate), 'yyyy-MM-dd') : '',
      categoryId: goal?.categoryId || '',
      progress: goal?.progress || 0,
      status: goal?.status || 'active',
    },
  });

  const progress = watch('progress');
  const status = watch('status');

  const handleFormSubmit = (data: GoalFormData) => {
    if (isEdit) {
      const updateData: UpdateGoalInput = {
        id: goal.id,
        title: data.title,
        description: data.description,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        categoryId: data.categoryId === 'none' ? null : (data.categoryId || null),
        progress: data.progress,
        status: data.status,
      };
      onSubmit(updateData);
    } else {
      if (!goalLevel) {
        console.error('Goal level is required for new goals');
        return;
      }
      
      const createData: CreateGoalInput = {
        title: data.title,
        description: data.description,
        parentId: parent?.id,
        level: goalLevel as GoalLevel,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
        categoryId: data.categoryId === 'none' ? undefined : (data.categoryId || undefined),
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {parent && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            상위 목표: <strong>{parent.title}</strong> ({GOAL_LEVEL_LABELS[parent.level]})
            <br />
            새 목표 레벨: <strong>{GOAL_LEVEL_LABELS[goalLevel as GoalLevel]}</strong>
          </AlertDescription>
        </Alert>
      )}

      {!parent && !isEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            최상위 목표 (레벨 1 - 장기 목표)를 생성합니다.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="목표 제목을 입력하세요"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="목표에 대한 설명을 입력하세요"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">시작일</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
          />
        </div>

        <div>
          <Label htmlFor="dueDate">마감일</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryId">카테고리</Label>
        <Select
          value={watch('categoryId')}
          onValueChange={(value) => setValue('categoryId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">없음</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isEdit && (
        <>
          <div>
            <Label htmlFor="progress">
              진행률: {progress}%
            </Label>
            <Slider
              id="progress"
              min={0}
              max={100}
              step={5}
              value={[progress || 0]}
              onValueChange={([value]) => setValue('progress', value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="status">상태</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as GoalStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="paused">일시중지</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          {isEdit ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}

// Import Slider component from shadcn/ui
import '@/components/ui/slider';