import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory store for rate limiting per edge isolate (tahan concurrent spam)
const rateLimitCache = new Map<string, number>();

// In-memory config cache to replace insecure cookie-based cache
const configCache = {
  state: {} as Record<string, any>,
  lastFetched: 0
};

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
  
  // 1. FETCH SENTINEL CONFIG (With Secure In-Memory Cache)
  let state: Record<string, any> = {}
  
  const nowMs = Date.now();
  const CACHE_TTL = 30000; // 30 seconds

  if (configCache.lastFetched > 0 && (nowMs - configCache.lastFetched) < CACHE_TTL) {
    state = configCache.state;
  } else {
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
      configCache.state = state;
      configCache.lastFetched = nowMs;

    } catch (error) {
      console.error("Sentinel Database unreachable:", error)
      // FAIL-SAFE: If DB is dead, use stale cache if available
      if (configCache.lastFetched > 0) {
        state = configCache.state;
      } else {
        state = { 
          maintenance_mode: false, 
          ddos_protection_enabled: true, 
          ddos_protection_level: 'medium',
          ddos_rate_limit: 100
        }
      }
    }
  }

  // Remove the old vulnerable cookie if present to clear client state
  if (request.cookies.has('sentinel_config_cache')) {
    response.cookies.set('sentinel_config_cache', '', { maxAge: 0 });
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

    // --- ENDPOINT SPECIFIC STRICT RATE LIMITS (ENUMERATION PROTECTION) ---
    const path = request.nextUrl.pathname;
    if (path.startsWith('/api/auth') || path.startsWith('/api/contact') || path.startsWith('/dashboard/login')) {
      const strictThrottleKey = `strict_req_${ip}_${path}`;
      const timeNow = Date.now();
      const lastStrictReq = rateLimitCache.get(strictThrottleKey) || 0;
      const STRICT_MIN_INTERVAL = 1000; // 1 req/sec

      if (lastStrictReq && (timeNow - lastStrictReq) < STRICT_MIN_INTERVAL) {
        return new NextResponse("Too Many Requests (Strict Rate Limit)", { status: 429 });
      }
      rateLimitCache.set(strictThrottleKey, timeNow);
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
        const verifiedCookie = request.cookies.get('sentinel_verified')?.value
        // Basic validation: must match token format (timestamp-random)
        const isValidToken = verifiedCookie && /^[a-z0-9]+-[a-z0-9]{8}$/.test(verifiedCookie);
        
        if (!isValidToken) {
          const challengeUrl = request.nextUrl.clone()
          challengeUrl.pathname = '/security-check'
          challengeUrl.searchParams.set('from', request.nextUrl.pathname)
          return NextResponse.rewrite(challengeUrl)
        }
      }
      
      // Level Medium: Throttling (Signature-based Throttling)
      if (level === 'medium' || level === 'high') {
        // Create a signature of IP + UserAgent to prevent cookie sharing
        const signature = btoa(`${ip}-${userAgent.slice(0, 20)}`)
        const throttleKey = `sentinel_req_${signature.slice(0, 10)}`
        
        const nowMs = Date.now()
        // Use in-memory cache for actual edge-level throttling (fallback to cookie)
        const lastReq = rateLimitCache.get(throttleKey) || parseInt(request.cookies.get(throttleKey)?.value || '0')
        
        // Gunakan interval yang lebih agresif untuk mencegah spam. 
        // Rate limit adalah req/min. Jika rateLimit = 100, maka minInterval = 600ms
        // Jika request datang lebih cepat dari minInterval, langsung blokir.
        const rateLimit = parseInt(state.ddos_rate_limit) || 100
        const minInterval = Math.max(200, Math.floor(60000 / rateLimit))
        
        if (lastReq && (nowMs - lastReq) < minInterval) {
          return new NextResponse("Too Many Requests (Sentinel Shield Active)", { status: 429 })
        }
        
        rateLimitCache.set(throttleKey, nowMs);
        if (rateLimitCache.size > 10000) rateLimitCache.clear(); // simple memory management
        
        response.cookies.set(throttleKey, nowMs.toString(), { maxAge: 5, httpOnly: true })
      }
    }

    // Rule A: Maintenance Mode
    if (state.maintenance_mode === true && !isAdmin && !isLoginPage) {
        const maintenanceUrl = request.nextUrl.clone()
        maintenanceUrl.pathname = '/maintenance'
        return NextResponse.rewrite(maintenanceUrl)
    }

    // Rule B: Security Lockdown
    if (state.security_lockdown === true && !isAdmin && request.nextUrl.pathname.startsWith('/dashboard')) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = '/'
        return NextResponse.redirect(homeUrl)
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
