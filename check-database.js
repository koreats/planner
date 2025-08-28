/**
 * Supabase 데이터베이스 상태 확인 스크립트
 * 테이블 존재 여부와 RLS 정책을 확인합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('\n📊 데이터베이스 테이블 확인 중...\n');
  
  const tables = ['categories', 'events', 'goals'];
  const results = {};
  
  for (const table of tables) {
    try {
      // 테이블 존재 여부 확인 (1개만 가져오기)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table} 테이블이 존재하지 않습니다.`);
          results[table] = { exists: false, error: 'Table not found' };
        } else if (error.code === '42501') {
          console.log(`⚠️  ${table} 테이블은 존재하지만 RLS 정책으로 접근이 제한됩니다.`);
          results[table] = { exists: true, rls: true, error: error.message };
        } else {
          console.log(`❓ ${table} 테이블 확인 중 오류: ${error.message}`);
          results[table] = { exists: 'unknown', error: error.message };
        }
      } else {
        console.log(`✅ ${table} 테이블이 정상적으로 존재합니다.`);
        results[table] = { exists: true, accessible: true };
      }
    } catch (err) {
      console.log(`❌ ${table} 테이블 확인 실패:`, err.message);
      results[table] = { exists: 'unknown', error: err.message };
    }
  }
  
  return results;
}

async function checkAuth() {
  console.log('\n🔐 인증 상태 확인 중...\n');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('⚠️  현재 로그인되어 있지 않습니다.');
      console.log('   RLS 정책 때문에 데이터 접근이 제한될 수 있습니다.');
      return null;
    }
    
    if (user) {
      console.log(`✅ 로그인됨: ${user.email} (ID: ${user.id})`);
      return user;
    }
  } catch (err) {
    console.log('❌ 인증 확인 실패:', err.message);
    return null;
  }
}

async function checkConnection() {
  console.log('\n🔌 Supabase 연결 확인 중...\n');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // health check 시도
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase 연결 성공');
      return true;
    } else {
      console.log(`❌ Supabase 연결 실패: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (err) {
    console.log('❌ Supabase 연결 오류:', err.message);
    return false;
  }
}

async function suggestMigration(results) {
  console.log('\n📝 권장 조치:\n');
  
  const missingTables = Object.entries(results)
    .filter(([_, info]) => info.exists === false)
    .map(([table, _]) => table);
  
  if (missingTables.length > 0) {
    console.log('다음 테이블이 누락되어 있습니다:', missingTables.join(', '));
    console.log('\n다음 방법 중 하나를 선택하세요:\n');
    console.log('1. Supabase 대시보드의 SQL Editor에서 마이그레이션 파일 실행:');
    console.log('   - supabase/migrations/001_create_events_tables.sql');
    console.log('   - supabase/migrations/002_create_goals_tables.sql');
    console.log('\n2. Supabase CLI 사용 (설치 필요):');
    console.log('   npx supabase db push');
  }
  
  const rlsIssues = Object.entries(results)
    .filter(([_, info]) => info.rls === true)
    .map(([table, _]) => table);
  
  if (rlsIssues.length > 0) {
    console.log('\nRLS 정책이 활성화되어 있습니다:', rlsIssues.join(', '));
    console.log('로그인 후 다시 시도하거나, 개발 중에는 RLS를 임시로 비활성화할 수 있습니다.');
  }
}

async function main() {
  console.log('🚀 Supabase 데이터베이스 진단 시작...');
  console.log('=' .repeat(50));
  
  // 연결 확인
  const connected = await checkConnection();
  if (!connected) {
    console.log('\n환경 변수를 확인하고 Supabase 프로젝트가 활성화되어 있는지 확인하세요.');
    process.exit(1);
  }
  
  // 인증 확인
  const user = await checkAuth();
  
  // 테이블 확인
  const results = await checkTables();
  
  // 권장 조치 제안
  await suggestMigration(results);
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ 진단 완료\n');
}

main().catch(console.error);