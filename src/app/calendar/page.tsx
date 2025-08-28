'use client';

import { Calendar } from '@/components/calendar/Calendar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function CalendarPage() {
  return (
    <AuthGuard>
      <div className="h-screen bg-background">
        <Calendar />
      </div>
    </AuthGuard>
  );
}