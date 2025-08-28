'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Download } from 'lucide-react';
import { useDeleteAccount } from '@/hooks/use-profile';
import { useUser } from '@/hooks/use-auth';

export function DangerZone() {
  const { data: user } = useUser();
  const deleteAccountMutation = useDeleteAccount();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = () => {
    if (confirmText === '계정삭제') {
      deleteAccountMutation.mutate();
      setIsDeleteDialogOpen(false);
    }
  };

  const handleExportData = async () => {
    try {
      // 사용자 데이터를 JSON으로 내보내기
      // 실제로는 별도의 서비스에서 데이터를 수집해야 함
      const userData = {
        profile: user,
        exportDate: new Date().toISOString(),
        note: '이 파일은 개인 데이터를 포함하고 있습니다. 안전하게 보관하세요.',
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('데이터 내보내기에 실패했습니다.');
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive">위험 구역</h2>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            이 섹션의 작업들은 되돌릴 수 없습니다. 신중하게 진행하세요.
          </AlertDescription>
        </Alert>

        {/* 데이터 내보내기 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">데이터 내보내기</h3>
          <p className="text-sm text-muted-foreground">
            계정을 삭제하기 전에 개인 데이터를 백업할 수 있습니다.
            모든 목표, 이벤트, 설정 정보가 JSON 파일로 다운로드됩니다.
          </p>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            데이터 내보내기
          </Button>
        </div>

        {/* 계정 삭제 */}
        <div className="space-y-3 pt-4 border-t border-destructive/20">
          <h3 className="text-lg font-medium text-destructive">계정 삭제</h3>
          <p className="text-sm text-muted-foreground">
            계정을 영구적으로 삭제합니다. 모든 데이터(목표, 이벤트, 설정 등)가 
            완전히 삭제되며 복구할 수 없습니다.
          </p>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                계정 삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  정말로 계정을 삭제하시겠습니까?
                </DialogTitle>
                <DialogDescription>
                  이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 
                  영구적으로 삭제됩니다.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    삭제될 데이터:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>모든 목표와 진행 상황</li>
                      <li>모든 캘린더 이벤트</li>
                      <li>프로필 정보 및 설정</li>
                      <li>활동 통계</li>
                      <li>계정 정보</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="confirm-delete">
                    계속하려면 <strong>'계정삭제'</strong>를 입력하세요:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="계정삭제"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setConfirmText('');
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== '계정삭제' || deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? '삭제 중...' : '영구 삭제'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}