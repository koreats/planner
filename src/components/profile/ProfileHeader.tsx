'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadAvatar, useDeleteAvatar } from '@/hooks/use-profile';
import { Camera, X } from 'lucide-react';
import { useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

interface ProfileHeaderProps {
  user: User | null;
  profile: Profile | null;
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('이미지 파일만 업로드 가능합니다 (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    uploadAvatarMutation.mutate(file);
  };

  const handleDeleteAvatar = () => {
    if (profile?.avatarUrl && confirm('프로필 사진을 삭제하시겠습니까?')) {
      deleteAvatarMutation.mutate(profile.avatarUrl);
    }
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center space-x-6">
        <div className="relative group">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="text-2xl">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-transparent"
              onClick={handleAvatarClick}
              disabled={uploadAvatarMutation.isPending}
            >
              <Camera className="h-6 w-6" />
            </Button>
            {profile?.avatarUrl && (
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-transparent ml-2"
                onClick={handleDeleteAvatar}
                disabled={deleteAvatarMutation.isPending}
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {profile?.displayName || '사용자'}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
          {profile?.bio && (
            <p className="mt-2 text-sm">{profile.bio}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>가입일: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
            <span>•</span>
            <span>ID: {user?.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </Card>
  );
}