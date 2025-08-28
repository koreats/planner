'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/use-profile';
import type { Profile } from '@/types/profile';
import { format } from 'date-fns';

const profileSchema = z.object({
  displayName: z.string().max(255, '이름은 255자 이하여야 합니다').optional(),
  bio: z.string().max(500, '자기소개는 500자 이하여야 합니다').optional(),
  phoneNumber: z.string()
    .regex(/^(\+82|010|011|016|017|018|019)?[-.\s]?\d{3,4}[-.\s]?\d{4}$/, '올바른 전화번호 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: Profile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      phoneNumber: profile?.phoneNumber || '',
      dateOfBirth: profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'yyyy-MM-dd') : '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'yyyy-MM-dd') : '',
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormData) => {
    const updates = {
      displayName: data.displayName || null,
      bio: data.bio || null,
      phoneNumber: data.phoneNumber || null,
      dateOfBirth: data.dateOfBirth || null,
    };
    updateProfileMutation.mutate(updates);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">이름</Label>
        <Input
          id="displayName"
          placeholder="표시할 이름을 입력하세요"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">자기소개</Label>
        <Textarea
          id="bio"
          placeholder="간단한 자기소개를 작성하세요"
          rows={4}
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">전화번호</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="010-0000-0000"
          {...register('phoneNumber')}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">생년월일</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...register('dateOfBirth')}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={!isDirty || updateProfileMutation.isPending}
        className="w-full sm:w-auto"
      >
        {updateProfileMutation.isPending ? '저장 중...' : '프로필 저장'}
      </Button>
    </form>
  );
}