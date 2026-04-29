import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 1. Get User Session & Role
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch profile to check role
  let role = 'user'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    role = profile?.role || 'user'
  }

  // --- SENTINEL CACHE & DDOS LOGIC ---
  // Safely get IP from headers or request object
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // 1. FETCH SENTINEL CONFIG (With Smart Cache & Fail-Safe)
  const cachedConfig = request.cookies.get('sentinel_config_cache')?.value
  let state: Record<string, any> = {}
  let isFromCache = false

  if (cachedConfig) {
    try {
      state = JSON.parse(cachedConfig)
      isFromCache = true
    } catch (e) {
      state = {}
    }
  }

  // Fetch from DB if no cache OR if we want to force a periodic revalidation (e.g. every 5% of requests)
  if (Object.keys(state).length === 0 || (isFromCache && Math.random() < 0.05)) {
    try {
      const { data: configs, error } = await supabase
        .from('sentinel_configs')
        .select('key, value, pending_value, release_at')
        .in('key', [
          'maintenance_mode', 
          'security_lockdown', 
          'ddos_protection_enabled', 
          'ddos_protection_level',
          'ddos_rate_limit'
        ])

      if (error) throw error

      const nowStr = new Date().toISOString()
      const newState: Record<string, any> = {}
      configs?.forEach(c => {
        if (c.release_at && c.release_at <= nowStr && c.pending_value !== null) {
          newState[c.key] = c.pending_value
        } else {
          newState[c.key] = c.value
        }
      })
      state = newState

      // Update cache
      response.cookies.set('sentinel_config_cache', JSON.stringify(state), { 
        maxAge: 1800,
        path: '/',
        sameSite: 'strict',
        httpOnly: true // Secure from JS
      })
    } catch (error) {
      console.error("Sentinel Database unreachable:", error)
      // FAIL-SAFE: If DB is dead, and we don't even have a cache, 
      // default to PROTECTED state if this looks like an attack.
      if (Object.keys(state).length === 0) {
        state = { 
          maintenance_mode: false, 
          ddos_protection_enabled: true, 
          ddos_protection_level: 'medium' 
        }
      }
    }
  }

  // 2. ENFORCE RULES
  try {
    const isAdmin = role === 'admin'
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isMaintenancePage = request.nextUrl.pathname.startsWith('/maintenance')
    const isChallengePage = request.nextUrl.pathname.startsWith('/security-check')
    const isPublicAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)

    if (isPublicAsset || isMaintenancePage || isChallengePage) {
        return response
    }

    // --- ENHANCED BOT DETECTION ---
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = /bot|spider|crawler|curl|postman|python|headless/i.test(userAgent)
    
    if (isBot && state.ddos_protection_enabled === true && !isAdmin) {
       return new NextResponse("Access Denied (Bot Detected)", { status: 403 })
    }

    // --- DDOS PROTECTION LAYER ---
    if (state.ddos_protection_enabled === true && !isAdmin) {
      const level = state.ddos_protection_level || 'low'
      
      // Level High: "Under Attack" Mode (Show Challenge)
      if (level === 'high') {
        const isVerified = request.cookies.get('sentinel_verified')
        if (!isVerified) {
          return NextResponse.rewrite(new URL('/security-check?from=' + encodeURIComponent(request.nextUrl.pathname), request.url))
        }
      }
      
      // Level Medium: Throttling (Signature-based Throttling)
      if (level === 'medium' || level === 'high') {
        // Create a signature of IP + UserAgent to prevent cookie sharing
        const signature = btoa(`${ip}-${userAgent.slice(0, 20)}`)
        const throttleKey = `sentinel_req_${signature.slice(0, 10)}`
        const lastReq = request.cookies.get(throttleKey)?.value
        const nowMs = Date.now()
        
        if (lastReq && (nowMs - parseInt(lastReq)) < 200) { // Slightly tighter (5 req/sec)
          return new NextResponse("Too Many Requests (Sentinel Shield Active)", { status: 429 })
        }
        response.cookies.set(throttleKey, nowMs.toString(), { maxAge: 5, httpOnly: true })
      }
    }

    // Rule A: Maintenance Mode
    if (state.maintenance_mode === true && !isAdmin && !isLoginPage) {
        return NextResponse.rewrite(new URL('/maintenance', request.url))
    }

    // Rule B: Security Lockdown
    if (state.security_lockdown === true && !isAdmin && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    console.error("Sentinel Enforcement Error:", error)
    // In case of error during enforcement, default to showing the page to avoid breaking the app
    // unless we are in high ddos mode.
    if (state.ddos_protection_level === 'high') {
        return new NextResponse("Security Verification Required (Enforcement Error)", { status: 503 })
    }
    return response
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
