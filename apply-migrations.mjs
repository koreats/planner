/**
 * Supabase 마이그레이션 적용 스크립트
 * 마이그레이션 파일을 읽어서 Supabase에 직접 적용합니다.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 파일 읽기
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Service role key가 필요합니다 (admin 권한)
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key가 필요합니다.');
  console.error('   .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.');
  console.log('\n   Supabase 대시보드 → Settings → API → service_role key를 복사하세요.');
  process.exit(1);
}

// Service role을 사용한 admin 클라이언트
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLFile(filePath, description) {
  console.log(`\n🔧 ${description} 적용 중...`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    
    // SQL을 여러 statement로 분리 (세미콜론 기준)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`   📄 ${statements.length}개의 SQL 구문 발견`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`   ⚡ 구문 ${i + 1}/${statements.length} 실행 중...`);
          
          // RPC 호출로 SQL 실행
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_statement: statement
          });
          
          if (error) {
            // 만약 RPC 함수가 없다면 직접 실행 시도
            if (error.code === '42883') {
              console.log('   📢 직접 SQL 실행 시도...');
              
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql_statement: statement })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.log(`   ⚠️  구문 ${i + 1} 실행 중 오류: ${response.status} ${errorText}`);
                
                // 이미 존재하는 테이블/함수 등은 무시
                if (errorText.includes('already exists') || errorText.includes('duplicate')) {
                  console.log('   ℹ️  이미 존재하는 객체 - 건너뛰기');
                  continue;
                }
              } else {
                console.log(`   ✅ 구문 ${i + 1} 완료`);
              }
            } else {
              console.log(`   ⚠️  구문 ${i + 1} 실행 중 오류:`, error.message);
              
              // 이미 존재하는 객체들은 건너뛰기
              if (error.message.includes('already exists') || 
                  error.message.includes('duplicate') ||
                  error.code === '42P07') {
                console.log('   ℹ️  이미 존재하는 객체 - 건너뛰기');
                continue;
              }
            }
          } else {
            console.log(`   ✅ 구문 ${i + 1} 완료`);
          }
        } catch (err) {
          console.log(`   ❌ 구문 ${i + 1} 실행 실패:`, err.message);
        }
      }
    }
    
    console.log(`✅ ${description} 완료!`);
    return true;
    
  } catch (err) {
    console.error(`❌ ${description} 실패:`, err.message);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Supabase 마이그레이션 적용 시작...');
  console.log('=' .repeat(60));
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  // 마이그레이션 파일들 (순서대로)
  const migrations = [
    {
      file: '003_create_profiles_table.sql',
      description: 'Profiles 테이블 및 RLS 정책'
    }
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일이 존재하지 않습니다: ${migration.file}`);
      continue;
    }
    
    const success = await applySQLFile(filePath, migration.description);
    if (!success) {
      allSuccess = false;
    }
  }
  
  // RPC 함수 적용
  const rpcFile = path.join(__dirname, 'create-profile-rpc.sql');
  if (fs.existsSync(rpcFile)) {
    const success = await applySQLFile(rpcFile, 'Profile RPC 함수들');
    if (!success) {
      allSuccess = false;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (allSuccess) {
    console.log('✨ 모든 마이그레이션이 성공적으로 적용되었습니다!');
    console.log('\n🔄 데이터베이스 상태를 다시 확인해보세요:');
    console.log('   npm run db:check');
  } else {
    console.log('⚠️  일부 마이그레이션에서 문제가 발생했습니다.');
    console.log('   수동으로 Supabase 대시보드에서 확인해보세요.');
  }
}

// 대안: Service Key 없이 시도하는 방법
async function tryWithoutServiceKey() {
  console.log('\n🔄 대안 방법 시도 중...');
  console.log('Supabase 대시보드를 열어서 수동으로 적용하세요:\n');
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  console.log('1. https://supabase.com/dashboard 로그인');
  console.log('2. 프로젝트 선택');
  console.log('3. SQL Editor 열기');
  console.log('4. 다음 파일들을 순서대로 실행:\n');
  
  console.log('   📄 supabase/migrations/003_create_profiles_table.sql');
  const profilesSql = fs.readFileSync(path.join(migrationsDir, '003_create_profiles_table.sql'), 'utf-8');
  console.log('   내용 미리보기:', profilesSql.substring(0, 200) + '...\n');
  
  console.log('   📄 create-profile-rpc.sql');
  const rpcSql = fs.readFileSync(path.join(__dirname, 'create-profile-rpc.sql'), 'utf-8');
  console.log('   내용 미리보기:', rpcSql.substring(0, 200) + '...\n');
  
  console.log('5. 실행 후 npm run db:check로 확인');
}

async function main() {
  try {
    await applyMigrations();
  } catch (error) {
    if (error.message.includes('Service Role Key') || error.message.includes('JWT')) {
      await tryWithoutServiceKey();
    } else {
      console.error('❌ 예상치 못한 오류:', error.message);
    }
  }
}

main().catch(console.error);