import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // We can't easily use the client-side supabase instance here because it doesn't handle cookies
  // in the same way. In a real project, we would use @supabase/ssr.

  // PROTECTION LOGIC
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboardPath) {
    // Check for supabase auth cookie (standard name is sb-[project-id]-auth-token)
    // However, without @supabase/ssr, session management in middleware is tricky.

    // For now, I'll provide the scaffolding for route protection.
    // In a production environment, this would verify the JWT.

    // console.log("Proxy checking path:", request.nextUrl.pathname);
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
