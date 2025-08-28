import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful authentication - redirect to intended page
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Authentication failed - redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${origin}/login?error=missing_code&message=${encodeURIComponent('인증 코드가 없습니다.')}`)
}