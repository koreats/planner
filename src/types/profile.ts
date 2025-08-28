export interface Profile {
  id: string;
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  preferences: ProfilePreferences;
  stats: ProfileStats;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdate {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  preferences?: ProfilePreferences;
}

export interface ProfilePreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: 'ko' | 'en';
  notifications?: {
    email?: boolean;
    push?: boolean;
    goalReminders?: boolean;
    eventReminders?: boolean;
    weeklyReport?: boolean;
  };
  privacy?: {
    showProfile?: boolean;
    showStats?: boolean;
  };
}

export interface ProfileStats {
  totalGoals: number;
  completedGoals: number;
  totalEvents: number;
  completedEvents: number;
  currentStreak: number;
  longestStreak: number;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}