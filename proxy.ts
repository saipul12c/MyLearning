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

  // Helper for premium error pages
  const createSentinelErrorResponse = (title: string, message: string, status: number) => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | MyLearning Sentinel</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;900&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg: #09090b;
            --card: rgba(24, 24, 27, 0.4);
            --border: rgba(63, 63, 70, 0.4);
            --primary: #8b5cf6;
            --secondary: #06b6d4;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background-color: var(--bg);
            color: white;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
          }
          .background {
            position: fixed;
            inset: 0;
            z-index: -1;
            background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 0% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 40%);
          }
          .noise {
            position: fixed;
            inset: 0;
            z-index: -1;
            opacity: 0.03;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          }
          .card {
            background: var(--card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            padding: 3rem 2rem;
            border-radius: 2rem;
            max-width: 440px;
            width: 90%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .icon-container {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(139, 92, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 900;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, white, #a1a1aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #a1a1aa;
            font-size: 0.9375rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
          }
          .status {
            font-size: 0.75rem;
            font-weight: 900;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 0.5rem;
            display: block;
          }
          .btn {
            display: inline-block;
            background: white;
            color: black;
            text-decoration: none;
            padding: 0.875rem 2rem;
            border-radius: 1rem;
            font-weight: 700;
            font-size: 0.875rem;
            transition: all 0.3s;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.2);
          }
          .footer {
            margin-top: 2rem;
            font-size: 0.7rem;
            color: #3f3f46;
            letter-spacing: 0.05em;
          }
        </style>
      </head>
      <body>
        <div class="background"></div>
        <div class="noise"></div>
        <div class="card">
          <span class="status">${status} ERROR</span>
          <div class="icon-container">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
          </div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="/" class="btn">Kembali ke Beranda</a>
          <div class="footer">SENTINEL SHIELD PROTECTION &bull; MYLEARNING</div>
        </div>
      </body>
      </html>
    `;
    return new NextResponse(html, { 
      status, 
      headers: { 'Content-Type': 'text/html' } 
    });
  }


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
    const isPrefetch = request.headers.get('purpose') === 'prefetch' || request.headers.get('x-nextjs-prefetch') === '1'
    const path = request.nextUrl.pathname
    const publicPages = ['/', '/about', '/pring', '/courses', '/events', '/faq', '/contact', '/privasi', '/terms', '/login', '/register', '/verify']
    const isPublicPage = publicPages.some(p => path === p || path.startsWith(p + '/'))

    if (isPublicAsset || isMaintenancePage || isChallengePage || isPrefetch) {
        return response
    }

    // --- ENDPOINT SPECIFIC STRICT RATE LIMITS (ENUMERATION PROTECTION) ---
    if (path.startsWith('/api/auth') || path.startsWith('/api/contact') || path.startsWith('/dashboard/login')) {
      const strictThrottleKey = `strict_req_${ip}_${path}`;
      const timeNow = Date.now();
      const lastStrictReq = rateLimitCache.get(strictThrottleKey) || 0;
      const STRICT_MIN_INTERVAL = 1000; // 1 req/sec

      if (lastStrictReq && (timeNow - lastStrictReq) < STRICT_MIN_INTERVAL) {
        return createSentinelErrorResponse(
          "Terlalu Banyak Permintaan",
          "Sistem mendeteksi aktivitas yang tidak biasa. Silakan tunggu beberapa saat sebelum mencoba kembali.",
          429
        );
      }
      rateLimitCache.set(strictThrottleKey, timeNow);
    }

    // --- ENHANCED BOT DETECTION ---
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = /bot|spider|crawler|curl|postman|python|headless/i.test(userAgent)
    
    if (isBot && state.ddos_protection_enabled === true && !isAdmin) {
       return createSentinelErrorResponse(
         "Akses Ditolak",
         "Lalu lintas otomatis atau bot tidak diizinkan untuk mengakses bagian ini demi keamanan sistem.",
         403
       );
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
        let minInterval = Math.max(200, Math.floor(60000 / rateLimit))
        
        // Relax limit for public pages to allow fast navigation and better UX
        if (isPublicPage) {
            minInterval = 150 // Allow up to ~6 requests/sec for public marketing pages
        }
        
        if (lastReq && (nowMs - lastReq) < minInterval) {
          return createSentinelErrorResponse(
            "Sentinel Shield Aktif",
            "Kecepatan akses Anda melebihi batas yang diizinkan. Kami membatasi ini untuk mencegah serangan DDoS.",
            429
          );
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
        return createSentinelErrorResponse(
          "Verifikasi Diperlukan",
          "Terjadi kesalahan saat memproses verifikasi keamanan. Silakan muat ulang halaman ini.",
          503
        );
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
