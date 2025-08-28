'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Tag, 
  X, 
  Filter, 
  CalendarIcon,
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventFilters } from '@/types/calendar';
import type { Category } from '@/types/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FilterPanelProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  categories?: Category[];
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  categories = [],
  className,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (localFilters.startDate) count++;
    if (localFilters.endDate) count++;
    if (localFilters.categoryId) count++;
    if (localFilters.tags && localFilters.tags.length > 0) count++;
    return count;
  }, [localFilters]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...localFilters,
      [field]: value ? new Date(value).toISOString() : undefined,
    };
    setLocalFilters(newFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = {
      ...localFilters,
      categoryId: categoryId === 'all' ? undefined : categoryId,
    };
    setLocalFilters(newFilters);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTags = [...(localFilters.tags || [])];
    if (!newTags.includes(tagInput.trim())) {
      newTags.push(tagInput.trim());
    }
    
    const newFilters = {
      ...localFilters,
      tags: newTags,
    };
    setLocalFilters(newFilters);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = (localFilters.tags || []).filter(t => t !== tag);
    const newFilters = {
      ...localFilters,
      tags: newTags.length > 0 ? newTags : undefined,
    };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const formatDateDisplay = (date: string | Date | undefined) => {
    if (!date) return '선택';
    return format(new Date(date), 'MM/dd', { locale: ko });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('flex items-center gap-2', className)}
        >
          <Filter className="h-4 w-4" />
          필터
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 min-w-[20px]">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">필터</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-xs"
              >
                초기화
              </Button>
            )}
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">기간</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={localFilters.startDate ? format(new Date(localFilters.startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <span className="self-center text-muted-foreground">~</span>
              <div className="flex-1">
                <Input
                  type="date"
                  value={localFilters.endDate ? format(new Date(localFilters.endDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">카테고리</Label>
            <Select
              value={localFilters.categoryId || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
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

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">태그</Label>
            <div className="flex gap-2">
              <Input
                placeholder="태그 입력"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="h-8 px-3"
              >
                추가
              </Button>
            </div>
            {localFilters.tags && localFilters.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {localFilters.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs py-0 pr-1"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTag(tag)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Apply Button */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilters}
              className="flex-1"
            >
              적용
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}