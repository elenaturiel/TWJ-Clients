import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { homePathForRole } from '@/lib/auth/get-profile';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      return NextResponse.redirect(`${origin}${homePathForRole(profile?.role)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
