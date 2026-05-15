import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory store for simple throttling (timestamps)
const rateLimitCache = new Map<string, number>();

// In-memory store for DDoS Token Bucket
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const ddosBucketCache = new Map<string, RateLimitBucket>();

// In-memory config cache to replace insecure cookie-based cache
const configCache = {
  state: {} as Record<string, any>,
  lastFetched: 0
};

// Secure hashing for Sentinel tokens (Edge-compatible)
async function generateSentinelSignature(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function proxy(request: NextRequest) {
  const SENTINEL_SECRET = process.env.SENTINEL_SECRET || 'fallback-secret-for-dev-only';
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
  // CRITICAL FIX: Always trust JWT app_metadata role over database table role to prevent self-promotion bypass
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role || 'user'

  // --- SENTINEL CACHE & DDOS LOGIC ---
  // Safely get IP from headers or request object
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';

  // 1. FETCH SENTINEL CONFIG (With Secure In-Memory Cache)
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'unknown';
  let state: Record<string, any> = {}

  const nowMs = Date.now();
  const CACHE_TTL = 30000; // 30 seconds

  if (configCache.lastFetched > 0 && (nowMs - configCache.lastFetched) < CACHE_TTL) {
    state = configCache.state;
  } else {
    try {
      const { data: configs, error } = await supabase
        .from('sentinel_configs')
        .select('key, value, pending_value, release_at, expire_at, allowed_countries, rate_limit_overrides')
        .in('key', [
          'maintenance_mode',
          'security_lockdown',
          'module_auth_enabled',
          'ddos_protection_enabled',
          'ddos_protection_level',
          'ddos_rate_limit',
          'allowed_countries',
          'rate_limit_overrides',
          'expire_at',
          'ip_whitelist'
        ])

      if (error) throw error

      const nowStr = new Date().toISOString();
      const newState: Record<string, any> = {};

      // Fetch Blocked IP Status (Threat Intel)
      const { data: threatIntel } = await supabase
        .from('sentinel_threat_intelligence')
        .select('is_blocked, reason')
        .eq('ip_address', ip)
        .eq('is_blocked', true)
        .single();

      if (threatIntel) {
        newState['ip_blocked'] = true;
        newState['block_reason'] = threatIntel.reason;
      }



      (configs as any[])?.forEach((c: any) => {
        // Handle Expiry in Cache (v1.1.0)
        if (c.expire_at && new Date(c.expire_at) <= new Date()) {
          newState[c.key] = false;
        } else if (c.release_at && c.release_at <= nowStr && c.pending_value !== null) {
          newState[c.key] = c.pending_value
        } else {
          newState[c.key] = c.value
        }

        // Save metadata for Geo and QoS
        if (c.allowed_countries) newState[`${c.key}_geo`] = c.allowed_countries;
        if (c.rate_limit_overrides) newState[`${c.key}_qos`] = c.rate_limit_overrides;
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
    const isRegisterPage = request.nextUrl.pathname.startsWith('/register')
    const isMaintenancePage = request.nextUrl.pathname.startsWith('/maintenance')
    const isChallengePage = request.nextUrl.pathname.startsWith('/security-check')
    const isPublicAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
    const isPrefetch = request.headers.get('purpose') === 'prefetch' ||
      request.headers.get('x-nextjs-prefetch') === '1' ||
      request.headers.get('x-nextjs-prerender') === 'true'
    const path = request.nextUrl.pathname
    const publicPages = ['/', '/about', '/pring', '/courses', '/events', '/faq', '/contact', '/privasi', '/terms', '/login', '/register', '/verify']
    const isPublicPage = publicPages.some(p => path === p || path.startsWith(p + '/'))

    if (isPublicAsset || isMaintenancePage || isPrefetch) {
      return response
    }

    // --- SECURITY CHECK ROUTE PROTECTION ---
    if (isChallengePage) {
      const isEmergency = state.maintenance_mode === true ||
        state.security_lockdown === true ||
        state.ddos_protection_level === 'high' ||
        state.ip_blocked === true;

      if (!isEmergency && !isAdmin) {
        return createSentinelErrorResponse(
          "Akses Dibatasi",
          "Halaman verifikasi ini dinonaktifkan karena sistem sedang dalam kondisi aman. Tidak ada verifikasi tambahan yang diperlukan saat ini.",
          403
        );
      }
      return response;
    }


    // --- SENTINEL DLP (DATA LEAK PREVENTION) LAYER ---
    // Patterns for sensitive data that should NEVER leak in JSON/Text responses
    const DLP_RULES = [
      {
        name: 'INDONESIAN_PHONE',
        pattern: /(?:\+62|62|0)8[1-9][0-9]{7,10}/g,
        mask: (val: string) => val.slice(0, 4) + '****' + val.slice(-3)
      },
      {
        name: 'BCRYPT_HASH',
        pattern: /\$2[ayb]\$[0-9]{2}\$[./A-Za-z0-9]{53}/g,
        mask: () => '[PROTECTED_HASH]'
      },
      {
        name: 'JWT_TOKEN',
        pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
        mask: () => '[PROTECTED_TOKEN]'
      },
      {
        name: 'INTERNAL_ID_SECRET',
        pattern: /sb-[a-zA-Z0-9]{20,}/g,
        mask: () => '[INTERNAL_ID_MASKED]'
      }
    ];

    const applyDLP = (text: string): { scrubbed: string; violations: string[] } => {
      let scrubbed = text;
      const violations: Set<string> = new Set();

      DLP_RULES.forEach(rule => {
        const matches = text.match(rule.pattern);
        if (matches) {
          violations.add(rule.name);
          scrubbed = scrubbed.replace(rule.pattern, rule.mask as any);
        }
      });

      return { scrubbed, violations: Array.from(violations) };
    };


    // --- SENTINEL WAF (WEB APPLICATION FIREWALL) LAYER ---
    const searchParams = request.nextUrl.searchParams.toString().toLowerCase();
    const urlPath = request.nextUrl.pathname.toLowerCase();

    const DANGEROUS_PATTERNS = [
      // SQL Injection (Comprehensive)
      /union\s+select/i, /drop\s+table/i, /truncate\s+table/i, /insert\s+into/i, /delete\s+from/i, /sleep\(\d+\)/i, /waitfor\s+delay/i,
      /or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, /['"]\s*or\s*['"]\d+['"]\s*=\s*['"]\d+/i, /admin['"]\s*--/i, /['"]\s*--;/i,
      // XSS (Comprehensive)
      /<script/i, /alert\(/i, /onerror=/i, /onload=/i, /javascript:/i, /<svg/i, /eval\(/i, /onclick=/i, /onmouseover=/i, /<iframe/i, /srcdoc=/i,
      // RCE & OS Command Injection
      /(\||&|;)\s*(cat|ls|whoami|rm|wget|curl|bash|sh|nc|powershell|cmd|python|perl|php)/i,
      // Path Traversal & Information Disclosure
      /\.\.\//, /\/\.env/, /\/\.git/, /\/package\.json/, /\/docker-compose/i, /\/\.next/i, /\/etc\/passwd/i, /\/boot\.ini/i,
      // Prototype Pollution
      /__proto__/, /constructor\.prototype/,
      // NoSQL/Logic Injection (Bonus for security depth)
      /\$ne\s*:/i, /\$gt\s*:/i, /\$where\s*:/i,
      // --- NEW: AI PROMPT INJECTION PROTECTION (2026 Ready) ---
      /ignore\s+previous\s+instructions/i, /disregard\s+all\s+previous/i, /forget\s+your\s+system\s+prompt/i,
      /ignore\s+everything\s+above/i, /print\s+your\s+instructions/i, /output\s+the\s+system\s+prompt/i,
      /you\s+are\s+now\s+a\s+(hacker|developer|unfiltered)/i, /forget\s+all\s+prior\s+directives/i,
      // --- NEW: SSRF (Server-Side Request Forgery) PROTECTION ---
      /127\.0\.0\.1/, /169\.254\.169\.254/, /localhost/i, /0\.0\.0\.0/,
      /metadata\.google\.internal/i, /instance-data/i, /internal-api/i
    ];

    // NEW: POST/PUT Body Inspection
    let bodyText = "";
    const method = request.method.toUpperCase();
    const contentType = request.headers.get('content-type') || "";
    const contentLength = parseInt(request.headers.get('content-length') || "0");

    // Inspect bodies for JSON, Form, and Text types (limit to 512KB for performance)
    if (method !== 'GET' && method !== 'HEAD' && contentLength < 524288 &&
      (contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded') || contentType.includes('text/plain'))) {
      try {
        const clonedReq = request.clone();
        bodyText = await clonedReq.text();
      } catch (e) {
        // Silent fail for body read to avoid breaking legitimate traffic
      }
    }

    const isMalicious = DANGEROUS_PATTERNS.some(pattern =>
      pattern.test(urlPath) || pattern.test(searchParams) || (bodyText && pattern.test(bodyText))
    );

    // Audit Log for Malicious attempts (even if Admin, just to have a trail)
    if (isMalicious) {
      console.warn(`[SENTINEL SECURITY AUDIT] Potential attack detected from ${ip} (${isAdmin ? 'ADMIN' : 'USER'}): ${urlPath}`);
    }

    // --- NEW: SENTINEL DLP ENFORCEMENT ---
    const { violations: dlpViolations } = applyDLP(bodyText || urlPath);
    if (dlpViolations.length > 0) {
      console.error(`[SENTINEL DLP] Blocked potential data leak from ${ip}: ${dlpViolations.join(', ')}`);

      // If not admin, block the request if it contains sensitive patterns (to prevent data exfiltration)
      if (!isAdmin) {
        return createSentinelErrorResponse(
          "Kebijakan Keamanan Data (DLP)",
          "Sistem Sentinel mendeteksi adanya data sensitif dalam permintaan Anda yang melanggar kebijakan keamanan. Akses ditolak untuk mencegah kebocoran data.",
          403
        );
      }
    }

    if (isMalicious && !isAdmin) {
      return createSentinelErrorResponse(
        "Serangan Terdeteksi",
        "Sistem Sentinel mendeteksi adanya muatan (payload) berbahaya dalam permintaan Anda. IP Anda telah dicatat sebagai ancaman potensial.",
        403
      );
    }

    // --- NEW: SENTINEL IDOR / BOLA DETECTOR ---
    // Detects attempts to access other users' private data before it even hits the DB
    const privatePaths = ['/api/profiles', '/api/enrollments', '/api/lesson-progress'];
    const matchingPrivatePath = privatePaths.find(p => urlPath.startsWith(p));

    if (matchingPrivatePath && user?.id && !isAdmin) {
      // Extract the requested ID from the path (e.g., /api/profiles/SOME-ID)
      const pathSegments = urlPath.split('/').filter(Boolean);
      const requestedId = pathSegments[pathSegments.length - 1];

      // If the path has an ID and it's not the current user's ID
      // and it's not a generic 'me' or 'current' endpoint
      if (requestedId &&
        requestedId.length > 20 &&
        requestedId !== user.id &&
        !['me', 'current', 'public'].includes(requestedId)) {

        console.warn(`[SENTINEL IDOR] Unauthorized access attempt by ${user.id} to resource ${requestedId}`);

        return createSentinelErrorResponse(
          "Akses Tidak Sah (IDOR)",
          "Sistem Sentinel mendeteksi upaya akses data milik pengguna lain. Aktivitas ini telah dicatat dan dilaporkan.",
          403
        );
      }
    }

    // --- BOT & USER AGENT ANALYSIS ---
    const userAgent = request.headers.get('user-agent') || ''
    const isCommonBot = /bot|spider|crawler|curl|postman|python|headless|selenium|puppeteer|playwright/i.test(userAgent)
    const hasSuspiciousHeaders = !request.headers.get('accept-language') || !request.headers.get('accept')

    // --- NEW: SENTINEL BEHAVIORAL SHIELD (Anti-Scraper) ---

    // 1. Honey-Trap Detection: Block anything that touches the honey-trap (unless it's a prefetch)
    if ((urlPath.includes('/api/sentinel/honey-trap') || urlPath.includes('/admin/config.php')) && !isPrefetch) {
      console.warn(`[SENTINEL BOT] Honey-trap triggered by ${ip}`);
      return createSentinelErrorResponse(
        "Akses Diblokir",
        "Aktivitas otomatis terdeteksi. Akses Anda telah dibatasi secara permanen.",
        403
      );
    }

    // 2. Navigation Integrity: API requests must have a valid Referer or same-origin signal
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const fetchSite = request.headers.get('sec-fetch-site') || ''; // same-origin, cross-site, etc.
    const isApiRequest = urlPath.startsWith('/api/') && !urlPath.startsWith('/api/auth');

    if (isApiRequest && !isAdmin && !isPublicAsset) {
      // Relaxed check: Allow if referer matches OR if it's explicitly same-origin fetch
      const isSameOrigin = referer.includes(host) || origin.includes(host) || fetchSite === 'same-origin';

      if (!isSameOrigin) {
        console.warn(`[SENTINEL BOT] Missing Navigation Integrity from ${ip} for ${urlPath}`);
        return createSentinelErrorResponse(
          "Verifikasi Gagal",
          "Permintaan tidak valid. Harap gunakan browser standar untuk mengakses layanan ini.",
          403
        );
      }
    }

    // 3. Client-Hints Check (Advanced Headless Detection)
    // Real browsers in 2026 send sec-ch-ua headers. Scripts often don't.
    const clientHints = request.headers.get('sec-ch-ua');
    if (!clientHints && !isAdmin && !isPublicAsset && !isCommonBot) {
      // Optional: Log but don't block yet to avoid false positives with very old browsers
      // But for a high-security platform, we can enforce it.
      // console.warn(`[SENTINEL BOT] Missing Client Hints from ${ip}`);
    }

    // --- THREAT INTELLIGENCE LAYER (Auto-Lockdown) ---
    // Safety Net: If IP is blocked, allow access ONLY to the security challenge page
    // This allows legitimate users/admins to unblock themselves using the Sentinel Key.
    const whitelist = state.ip_whitelist as string[] || [];
    const isWhitelisted = whitelist.includes(ip);

    if (state.ip_blocked === true && !isAdmin && !isChallengePage && !isWhitelisted) {
      return createSentinelErrorResponse(
        "Akses Diblokir",
        `Sistem mendeteksi aktivitas mencurigakan dari IP Anda. Alasan: ${state.block_reason || 'Pelanggaran keamanan.'}`,
        403
      );
    }


    // --- GEO-FENCING LAYER (v1.1.0) ---
    const globalGeo = state.allowed_countries_geo as string[] || [];
    if (globalGeo.length > 0 && !isAdmin && country !== 'unknown') {
      if (!globalGeo.includes(country)) {
        return createSentinelErrorResponse(
          "Layanan Tidak Tersedia",
          `Maaf, layanan kami saat ini belum tersedia di wilayah Anda (${country}).`,
          403
        );
      }
    }

    // --- ENDPOINT SPECIFIC STRICT RATE LIMITS (ENUMERATION PROTECTION) ---
    if (path.startsWith('/api/auth') || path.startsWith('/api/contact') || path.startsWith('/dashboard/login') || isRegisterPage) {
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
    if ((isCommonBot || hasSuspiciousHeaders) && state.ddos_protection_enabled === true && !isAdmin) {
      return createSentinelErrorResponse(
        "Akses Ditolak",
        "Sistem mendeteksi akses tidak wajar. Browser Anda harus mendukung fitur standar untuk melanjutkan.",
        403
      );
    }

    // --- SESSION VERIFICATION (Bypass Layer) ---
    const verifiedCookie = request.cookies.get('sentinel_verified')?.value
    let isValidToken = false;

    if (verifiedCookie) {
      const [timestamp, sig] = verifiedCookie.split('.');
      if (timestamp && sig) {
        const now = Date.now();
        const tokenAge = now - parseInt(timestamp, 36);

        // Token valid for 30 minutes
        if (tokenAge > 0 && tokenAge < 1800000) {
          const expectedSig = await generateSentinelSignature(`${timestamp}.${ip}.${userAgent.slice(0, 20)}`, SENTINEL_SECRET);
          if (sig === expectedSig) {
            isValidToken = true;
          }
        }
      }
    }

    // --- DDOS PROTECTION LAYER ---
    if (state.ddos_protection_enabled === true && !isAdmin) {
      const level = state.ddos_protection_level || 'low'

      // Level High: "Under Attack" Mode (Signature-based Throttling + Verified Bypass)
      // Removed automatic rewrite to /security-check to align with user request.
      // High level now just enforces stricter rate limits unless verified.

      // Level Medium & High: Token Bucket Rate Limiting (v2.0)
      if (level === 'medium' || level === 'high') {
        const signature = btoa(`${ip}-${userAgent.slice(0, 10)}`)
        const throttleKey = `sentinel_bucket_${signature.slice(0, 10)}`

        const nowMs = Date.now()
        const qosOverrides = state.ddos_rate_limit_qos as Record<string, number> || {};
        const userTier = user?.app_metadata?.tier || 'free';

        let rateLimit = parseInt(state.ddos_rate_limit) || 100

        // If Level High and NOT verified, reduce rate limit significantly (e.g., 10 req/min)
        if (level === 'high' && !isValidToken) {
          rateLimit = 10;
        } else if (qosOverrides[userTier]) {
          rateLimit = qosOverrides[userTier];
        }

        // Token Bucket Logic (v2.1 - Burst Optimized for Power Users)
        let bucket = ddosBucketCache.get(throttleKey);

        // Burst Factor: Allow users to exceed average rate by 50% for short periods
        const burstLimit = Math.floor(rateLimit * 1.5);

        if (!bucket) {
          bucket = { tokens: burstLimit, lastRefill: nowMs };
        } else {
          // Refill tokens based on time passed
          const refillRate = rateLimit / 60000; // tokens per ms
          const elapsed = nowMs - bucket.lastRefill;
          const tokensToAdd = elapsed * refillRate;

          bucket.tokens = Math.min(burstLimit, bucket.tokens + tokensToAdd);
          bucket.lastRefill = nowMs;
        }

        if (bucket.tokens < 1) {
          // False Positive Prevention: Give authenticated or verified users a small emergency buffer
          if (user?.id || isValidToken) {
            bucket.tokens = 5;
          } else {
            return createSentinelErrorResponse(
              "Sentinel Shield Aktif",
              "Sistem mendeteksi aktivitas trafik tinggi. Harap tunggu beberapa detik dan silahkan refresh halaman anda",
              429
            );
          }
        }

        // Consume 1 token
        bucket.tokens -= 1;
        ddosBucketCache.set(throttleKey, bucket);
      }
    }

    // --- GLOBAL ENFORCEMENT RULES (2-Layer Security for Admins) ---
    const isEmergency = state.maintenance_mode === true ||
      state.security_lockdown === true ||
      state.ddos_protection_level === 'high';

    // 1. Mandatory Security Check for Admins during Emergency (Bypass Layer 2)
    if (isEmergency && isAdmin && !isValidToken && !isChallengePage && !isLoginPage) {
      const challengeUrl = request.nextUrl.clone()
      challengeUrl.pathname = '/security-check'
      challengeUrl.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(challengeUrl)
    }

    // 2. Rule A: Maintenance Mode (Bypassable only by Verified Session - Admin or Guest with Key)
    if (state.maintenance_mode === true && !isLoginPage && !isValidToken && !isChallengePage) {
      const maintenanceUrl = request.nextUrl.clone()
      maintenanceUrl.pathname = '/maintenance'
      return NextResponse.rewrite(maintenanceUrl)
    }

    // 3. Rule A.2: Auth Module Control (Kill Switch)
    if (state.module_auth_enabled === false && !isAdmin && !isValidToken && (isLoginPage || isRegisterPage || path.startsWith('/api/auth'))) {
      return createSentinelErrorResponse(
        "Autentikasi Dinonaktifkan",
        "Layanan login dan registrasi sementara tidak tersedia untuk alasan keamanan.",
        503
      );
    }

    // 4. Rule B: Security Lockdown
    if (state.security_lockdown === true && !isValidToken && request.nextUrl.pathname.startsWith('/dashboard')) {
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
