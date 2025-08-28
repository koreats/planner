# 📚 Supabase 데이터베이스 마이그레이션 가이드

## 🚨 현재 문제

데이터베이스 진단 결과, Supabase에 필요한 테이블들이 생성되지 않았습니다:
- ❌ categories 테이블
- ❌ events 테이블  
- ❌ goals 테이블

## ✅ 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. 해당 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. 다음 순서로 마이그레이션 파일 내용을 복사하여 실행:

#### 1단계: categories와 events 테이블 생성
```bash
# supabase/migrations/001_create_events_tables.sql 파일 내용을 복사하여 실행
```

#### 2단계: goals 테이블 생성
```bash
# supabase/migrations/002_create_goals_tables.sql 파일 내용을 복사하여 실행
```

### 방법 2: Supabase CLI 사용

1. Supabase CLI 설치 (아직 설치하지 않은 경우):
```bash
npm install -g supabase
```

2. 프로젝트 초기화:
```bash
supabase init
```

3. 프로젝트 연결:
```bash
supabase link --project-ref tpaffpszmcnzxbydnxvm
```

4. 마이그레이션 실행:
```bash
supabase db push
```

## 🔍 테이블 생성 확인

마이그레이션 후 다시 확인:
```bash
node check-database.mjs
```

## 🎯 예상 결과

모든 테이블이 정상적으로 생성되면:
- ✅ categories 테이블
- ✅ events 테이블  
- ✅ goals 테이블

## 🔐 RLS (Row Level Security) 정책

마이그레이션 파일에는 RLS 정책이 포함되어 있습니다:
- 사용자는 자신의 데이터만 CRUD 가능
- auth.uid() = user_id 조건 적용

## ⚠️ 주의사항

1. **개발 환경**: 필요시 RLS를 일시적으로 비활성화할 수 있습니다
2. **프로덕션 환경**: RLS는 반드시 활성화된 상태를 유지해야 합니다
3. **데이터 손실**: 이미 데이터가 있는 경우, 백업을 먼저 수행하세요

## 📞 추가 지원

문제가 계속되면:
1. 브라우저 개발자 도구의 Console과 Network 탭 확인
2. Supabase 대시보드의 Logs 섹션 확인
3. 환경 변수(.env.local) 재확인