'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useUpdatePreferences } from '@/hooks/use-profile';
import type { ProfilePreferences } from '@/types/profile';
import { useEffect } from 'react';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['ko', 'en']),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  goalReminders: z.boolean(),
  eventReminders: z.boolean(),
  weeklyReport: z.boolean(),
  showProfile: z.boolean(),
  showStats: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  preferences?: ProfilePreferences;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const updatePreferencesMutation = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    setValue,
    watch,
    reset,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: preferences?.theme || 'system',
      language: preferences?.language || 'ko',
      emailNotifications: preferences?.notifications?.email ?? true,
      pushNotifications: preferences?.notifications?.push ?? false,
      goalReminders: preferences?.notifications?.goalReminders ?? true,
      eventReminders: preferences?.notifications?.eventReminders ?? true,
      weeklyReport: preferences?.notifications?.weeklyReport ?? true,
      showProfile: preferences?.privacy?.showProfile ?? true,
      showStats: preferences?.privacy?.showStats ?? true,
    },
  });

  useEffect(() => {
    if (preferences) {
      reset({
        theme: preferences.theme || 'system',
        language: preferences.language || 'ko',
        emailNotifications: preferences.notifications?.email ?? true,
        pushNotifications: preferences.notifications?.push ?? false,
        goalReminders: preferences.notifications?.goalReminders ?? true,
        eventReminders: preferences.notifications?.eventReminders ?? true,
        weeklyReport: preferences.notifications?.weeklyReport ?? true,
        showProfile: preferences.privacy?.showProfile ?? true,
        showStats: preferences.privacy?.showStats ?? true,
      });
    }
  }, [preferences, reset]);

  const onSubmit = (data: PreferencesFormData) => {
    const updates: Partial<ProfilePreferences> = {
      theme: data.theme,
      language: data.language,
      notifications: {
        email: data.emailNotifications,
        push: data.pushNotifications,
        goalReminders: data.goalReminders,
        eventReminders: data.eventReminders,
        weeklyReport: data.weeklyReport,
      },
      privacy: {
        showProfile: data.showProfile,
        showStats: data.showStats,
      },
    };

    updatePreferencesMutation.mutate(updates);
  };

  const watchedTheme = watch('theme');
  const watchedLanguage = watch('language');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 표시 설정 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">표시 설정</h3>
        
        <div className="space-y-2">
          <Label htmlFor="theme">테마</Label>
          <Select value={watchedTheme} onValueChange={(value) => setValue('theme', value as 'light' | 'dark' | 'system')}>
            <SelectTrigger>
              <SelectValue placeholder="테마를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">시스템 설정 따르기</SelectItem>
              <SelectItem value="light">라이트 모드</SelectItem>
              <SelectItem value="dark">다크 모드</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">언어</Label>
          <Select value={watchedLanguage} onValueChange={(value) => setValue('language', value as 'ko' | 'en')}>
            <SelectTrigger>
              <SelectValue placeholder="언어를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* 알림 설정 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">알림 설정</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">이메일 알림</Label>
            <p className="text-sm text-muted-foreground">
              중요한 업데이트를 이메일로 받습니다
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={watch('emailNotifications')}
            onCheckedChange={(checked) => setValue('emailNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pushNotifications">푸시 알림</Label>
            <p className="text-sm text-muted-foreground">
              브라우저 푸시 알림을 받습니다
            </p>
          </div>
          <Switch
            id="pushNotifications"
            checked={watch('pushNotifications')}
            onCheckedChange={(checked) => setValue('pushNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="goalReminders">목표 알림</Label>
            <p className="text-sm text-muted-foreground">
              목표 마감일 알림을 받습니다
            </p>
          </div>
          <Switch
            id="goalReminders"
            checked={watch('goalReminders')}
            onCheckedChange={(checked) => setValue('goalReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="eventReminders">일정 알림</Label>
            <p className="text-sm text-muted-foreground">
              일정 시작 전 알림을 받습니다
            </p>
          </div>
          <Switch
            id="eventReminders"
            checked={watch('eventReminders')}
            onCheckedChange={(checked) => setValue('eventReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weeklyReport">주간 리포트</Label>
            <p className="text-sm text-muted-foreground">
              주간 진행 상황 요약을 받습니다
            </p>
          </div>
          <Switch
            id="weeklyReport"
            checked={watch('weeklyReport')}
            onCheckedChange={(checked) => setValue('weeklyReport', checked)}
          />
        </div>
      </div>

      <Separator />

      {/* 개인정보 설정 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">개인정보 설정</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showProfile">프로필 공개</Label>
            <p className="text-sm text-muted-foreground">
              다른 사용자에게 프로필 정보를 보여줍니다
            </p>
          </div>
          <Switch
            id="showProfile"
            checked={watch('showProfile')}
            onCheckedChange={(checked) => setValue('showProfile', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showStats">통계 공개</Label>
            <p className="text-sm text-muted-foreground">
              활동 통계를 다른 사용자에게 보여줍니다
            </p>
          </div>
          <Switch
            id="showStats"
            checked={watch('showStats')}
            onCheckedChange={(checked) => setValue('showStats', checked)}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!isDirty || updatePreferencesMutation.isPending}
        className="w-full sm:w-auto"
      >
        {updatePreferencesMutation.isPending ? '저장 중...' : '설정 저장'}
      </Button>
    </form>
  );
}