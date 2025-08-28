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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { Event, Category, CreateEventInput, UpdateEventInput } from '@/types/calendar';
import { COLOR_PRESETS } from '@/types/calendar';

const eventSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(500),
  description: z.string().optional(),
  startDate: z.string().min(1, '시작 날짜를 선택해주세요'),
  startTime: z.string().optional(),
  endDate: z.string().min(1, '종료 날짜를 선택해주세요'),
  endTime: z.string().optional(),
  allDay: z.boolean(),
  categoryId: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event;
  categories?: Category[];
  initialDate?: Date;
  onSubmit: (data: CreateEventInput | UpdateEventInput) => void;
  onCancel: () => void;
}

export function EventForm({
  event,
  categories = [],
  initialDate,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(event?.color || '');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      startDate: event ? format(new Date(event.startDate), 'yyyy-MM-dd') : 
                 initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
      startTime: event && !event.allDay ? format(new Date(event.startDate), 'HH:mm') : '09:00',
      endDate: event ? format(new Date(event.endDate), 'yyyy-MM-dd') : 
               initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
      endTime: event && !event.allDay ? format(new Date(event.endDate), 'HH:mm') : '10:00',
      allDay: event?.allDay || false,
      categoryId: event?.categoryId || '',
      color: event?.color || '',
      tags: event?.tags || [],
    },
  });

  const allDay = watch('allDay');
  const tags = watch('tags');
  const categoryId = watch('categoryId');

  // Update color when category changes
  useEffect(() => {
    if (categoryId && !selectedColor) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedColor(category.color);
      }
    }
  }, [categoryId, categories, selectedColor]);

  const handleFormSubmit = (data: EventFormData) => {
    const startDateTime = data.allDay 
      ? `${data.startDate}T00:00:00`
      : `${data.startDate}T${data.startTime}:00`;
    
    const endDateTime = data.allDay
      ? `${data.endDate}T23:59:59`
      : `${data.endDate}T${data.endTime}:00`;

    const eventData: CreateEventInput | UpdateEventInput = {
      title: data.title,
      description: data.description,
      startDate: new Date(startDateTime).toISOString(),
      endDate: new Date(endDateTime).toISOString(),
      allDay: data.allDay,
      categoryId: data.categoryId || undefined,
      color: selectedColor || undefined,
      tags: data.tags,
    };

    if (event) {
      (eventData as UpdateEventInput).id = event.id;
    }

    onSubmit(eventData);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="일정 제목을 입력하세요"
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
          placeholder="일정 설명을 입력하세요"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allDay"
          checked={allDay}
          onCheckedChange={(checked) => setValue('allDay', checked as boolean)}
        />
        <Label htmlFor="allDay">종일 일정</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">시작 날짜 *</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>
          )}
        </div>

        {!allDay && (
          <div>
            <Label htmlFor="startTime">시작 시간</Label>
            <Input
              id="startTime"
              type="time"
              {...register('startTime')}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="endDate">종료 날짜 *</Label>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>
          )}
        </div>

        {!allDay && (
          <div>
            <Label htmlFor="endTime">종료 시간</Label>
            <Input
              id="endTime"
              type="time"
              {...register('endTime')}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="categoryId">카테고리</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setValue('categoryId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
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

      <div>
        <Label>색상</Label>
        <div className="flex gap-2 flex-wrap mt-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                selectedColor === color ? "border-primary scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="tags">태그</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="태그 입력 후 추가 버튼"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
              <button
                type="button"
                className="ml-1"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          {event ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}

import { cn } from '@/lib/utils';