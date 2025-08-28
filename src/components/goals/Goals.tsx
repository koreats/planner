'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { GoalTreeNode } from './GoalTreeNode';
import { GoalForm } from './GoalForm';
import { GoalProgressBar } from './GoalProgressBar';
import { 
  useGoalTree, 
  useCreateGoal, 
  useUpdateGoal, 
  useDeleteGoal,
  useGoalStatistics,
  useUpdateGoalProgress,
} from '@/hooks/useGoals';
import { useCategories } from '@/hooks/useCategories';
import type { Goal, GoalWithChildren, CreateGoalInput, UpdateGoalInput } from '@/types/goals';
import { GOAL_LEVEL_LABELS, formatProgress } from '@/types/goals';

export function Goals() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();
  const [parentGoal, setParentGoal] = useState<Goal | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | undefined>();

  const { data: goalTree = [], isLoading: goalsLoading } = useGoalTree();
  const { data: statistics } = useGoalStatistics();
  const { data: categories = [] } = useCategories();
  
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const updateProgressMutation = useUpdateGoalProgress();

  const handleCreateGoal = (parent?: GoalWithChildren) => {
    setSelectedGoal(undefined);
    setParentGoal(parent);
    setIsFormOpen(true);
  };

  const handleEditGoal = (goal: GoalWithChildren) => {
    setSelectedGoal(goal);
    setParentGoal(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteGoal = (goal: GoalWithChildren) => {
    setGoalToDelete(goal);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (goalToDelete) {
      await deleteGoalMutation.mutateAsync(goalToDelete.id);
      setDeleteConfirmOpen(false);
      setGoalToDelete(undefined);
    }
  };

  const handleUpdateProgress = async (goal: GoalWithChildren, progress: number) => {
    await updateProgressMutation.mutateAsync({
      goalId: goal.id,
      progress,
    });
  };

  const handleSubmit = async (data: CreateGoalInput | UpdateGoalInput) => {
    if ('id' in data) {
      await updateGoalMutation.mutateAsync(data);
    } else {
      await createGoalMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
    setSelectedGoal(undefined);
    setParentGoal(undefined);
  };

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">목표를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">전체 목표</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalGoals || 0}</div>
              <p className="text-xs text-muted-foreground">
                활성: {statistics?.activeGoals || 0} | 완료: {statistics?.completedGoals || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">전체 진행률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatProgress(statistics?.overallProgress || 0)}
              </div>
              <GoalProgressBar 
                progress={statistics?.overallProgress || 0} 
                height="sm" 
                showLabel={false} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">레벨별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {([1, 2, 3, 4] as const).map(level => (
                  <div key={level} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {GOAL_LEVEL_LABELS[level]}
                    </span>
                    <span className="font-medium">
                      {statistics?.goalsByLevel?.[level] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">달성률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics?.totalGoals || 0) > 0 
                  ? Math.round(((statistics?.completedGoals || 0) / (statistics?.totalGoals || 1)) * 100)
                  : 0}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{statistics?.completedGoals || 0} / {statistics?.totalGoals || 0} 목표 달성</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Tree */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>목표 계층 구조</CardTitle>
              <CardDescription>
                장기 목표부터 일일 목표까지 4단계로 관리합니다
              </CardDescription>
            </div>
            <Button onClick={() => handleCreateGoal()}>
              <Plus className="h-4 w-4 mr-2" />
              최상위 목표 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goalTree.length === 0 ? (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                아직 등록된 목표가 없습니다. 첫 번째 목표를 추가해보세요!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {goalTree.map((goal) => (
                <GoalTreeNode
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onAddChild={handleCreateGoal}
                  onUpdateProgress={handleUpdateProgress}
                  defaultExpanded={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGoal ? '목표 수정' : '새 목표 추가'}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={selectedGoal}
            parent={parentGoal}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedGoal(undefined);
              setParentGoal(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목표 삭제 확인</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>"{goalToDelete?.title}"</strong> 목표를 삭제하시겠습니까?
              <br />
              하위 목표가 있는 경우 함께 삭제됩니다.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setGoalToDelete(undefined);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteGoalMutation.isPending}
            >
              {deleteGoalMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// We need to ensure tabs component is available
import '@/components/ui/tabs';