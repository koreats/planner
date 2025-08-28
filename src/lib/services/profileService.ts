import { createClient } from '@/lib/supabase/client';
import type { Profile, ProfileUpdate, ProfilePreferences, ProfileStats } from '@/types/profile';

class ProfileService {
  /**
   * Get user profile
   * Using RPC call to bypass PostgREST schema cache issues
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient();
    
    try {
      // 첫 번째 시도: 일반적인 방법
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error) {
        return this.transformProfile(data);
      }

      // 스키마 캐시 오류인 경우, 대안 방법 사용
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.log('스키마 캐시 문제 감지 - 대안 방법 사용 중...');
        
        // 대안 1: RPC 함수 사용 시도
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile', {
          input_user_id: userId
        });

        if (!rpcError && rpcData) {
          return this.transformProfile(rpcData);
        }

        // 대안 2: 다른 쿼리 패턴 사용
        const { data: altData, error: altError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            display_name,
            bio,
            avatar_url,
            phone_number,
            date_of_birth,
            preferences,
            stats,
            created_at,
            updated_at
          `)
          .eq('user_id', userId)
          .limit(1);

        if (!altError && altData && altData.length > 0) {
          return this.transformProfile(altData[0]);
        }

        // 모든 방법 실패 시 기본 처리
        throw new Error('프로필을 찾을 수 없습니다. 데이터베이스 연결을 확인해주세요.');
      }

      // 다른 오류들 처리
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, return null
        return null;
      }
      
      // Enhanced error logging for debugging
      console.error('Error fetching profile:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
        userId,
        timestamp: new Date().toISOString()
      });
      
      // Create more descriptive error for client
      const enhancedError = new Error(
        error.code === 'PGRST301' 
          ? '프로필에 접근할 권한이 없습니다. 로그인 상태를 확인해주세요.'
          : error.message || '프로필을 가져오는 중 오류가 발생했습니다.'
      );
      enhancedError.name = 'ProfileFetchError';
      (enhancedError as any).originalError = error;
      (enhancedError as any).code = error.code;
      
      throw enhancedError;
      
    } catch (err) {
      // 전체 프로세스 실패 시 처리
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('예기치 못한 오류가 발생했습니다.');
    }
  }

  /**
   * Create user profile
   */
  async createProfile(userId: string, profileData?: Partial<ProfileUpdate>): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    return this.transformProfile(data);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const supabase = createClient();
    
    // Prepare the update data
    const updateData: any = {};
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return this.transformProfile(data);
  }

  /**
   * Update profile preferences
   */
  async updatePreferences(userId: string, preferences: Partial<ProfilePreferences>): Promise<Profile> {
    const supabase = createClient();
    
    // First get current preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current preferences:', fetchError);
      throw fetchError;
    }

    // Merge preferences
    const mergedPreferences = {
      ...currentProfile.preferences,
      ...preferences,
      notifications: {
        ...currentProfile.preferences?.notifications,
        ...preferences.notifications,
      },
      privacy: {
        ...currentProfile.preferences?.privacy,
        ...preferences.privacy,
      },
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences: mergedPreferences })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }

    return this.transformProfile(data);
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = createClient();
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatarUrl: publicUrl });

    return publicUrl;
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
    const supabase = createClient();
    
    // Extract file path from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts.slice(-2).join('/'); // Get userId/filename.ext

    // Delete from storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }

    // Update profile to remove avatar URL
    await this.updateProfile(userId, { avatarUrl: null });
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('stats')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile stats:', error);
      throw error;
    }

    return data.stats as ProfileStats;
  }

  /**
   * Delete user profile and account
   */
  async deleteAccount(userId: string): Promise<void> {
    const supabase = createClient();
    
    // Delete user data (cascades will handle related data)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }
  }

  /**
   * Transform database profile to application profile
   */
  private transformProfile(data: any): Profile {
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      phoneNumber: data.phone_number,
      dateOfBirth: data.date_of_birth,
      preferences: data.preferences as ProfilePreferences,
      stats: data.stats as ProfileStats,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const profileService = new ProfileService();