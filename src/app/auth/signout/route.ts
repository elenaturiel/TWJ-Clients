import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  // 303 fuerza al navegador a hacer GET al seguir la redirección; el 307 por
  // defecto repetiría el POST contra /login, que no lo acepta.
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
