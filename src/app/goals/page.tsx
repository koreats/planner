'use client';

import { Goals } from '@/components/goals/Goals';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function GoalsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">목표 관리</h1>
          <p className="text-muted-foreground mt-2">
            장기 목표부터 일일 목표까지 계층적으로 관리하고 진행 상황을 추적하세요
          </p>
        </div>
        <Goals />
      </div>
    </AuthGuard>
  );
}