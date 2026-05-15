const { sendRequest } = require('../utils/request');

/**
 * Web Vulnerabilities Module
 * Menguji kerentanan standar web pada endpoint-endpoint aplikasi.
 */
async function runWebVulnerabilities(stats, vulnerabilities) {
    console.log(`\n🌐 MEMULAI PENGUJIAN WEB VULNERABILITIES (ADVANCED)...`);

    const testEndpoints = ['/', '/login', '/dashboard', '/courses', '/pring'];

    for (const endpoint of testEndpoints) {
        console.log(`\n🔍 Audit Keamanan pada: ${endpoint}`);
        const res = await sendRequest(endpoint, 'GET');

        // 1. Audit Security Headers
        const headers = res.data_headers || {}; // We need to update request.js to return headers
        const missingHeaders = [];
        if (!headers['x-frame-options']) missingHeaders.push('X-Frame-Options (Clickjacking)');
        if (!headers['content-security-policy']) missingHeaders.push('Content-Security-Policy');
        if (!headers['strict-transport-security']) missingHeaders.push('HSTS');
        if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');

        if (missingHeaders.length > 0) {
            console.log(`   ⚠️ MISSING HEADERS: ${missingHeaders.join(', ')}`);
            vulnerabilities.push(`Security Headers Absen di ${endpoint}: ${missingHeaders.join(', ')}`);
            stats.success++;
        }

        // 2. Clickjacking Check (Frame Options)
        if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
            console.log(`   ❌ VULNERABILITY: ${endpoint} dapat di-embed dalam iframe (Clickjacking).`);
            vulnerabilities.push(`Clickjacking vulnerability di ${endpoint}`);
        }

        // 3. Cookie Flags Audit
        const setCookie = headers['set-cookie'];
        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            cookies.forEach(cookie => {
                const missingFlags = [];
                if (!cookie.toLowerCase().includes('httponly')) missingFlags.push('HttpOnly');
                if (!cookie.toLowerCase().includes('secure')) missingFlags.push('Secure');
                if (!cookie.toLowerCase().includes('samesite')) missingFlags.push('SameSite');
                
                if (missingFlags.length > 0) {
                    console.log(`   ⚠️ INSECURE COOKIE: Flag ${missingFlags.join(', ')} absen pada cookie.`);
                    vulnerabilities.push(`Insecure Cookie Flags di ${endpoint}: ${missingFlags.join(', ')}`);
                }
            });
        }
    }

    // 4. Open Redirect Test
    console.log(`\n🔍 Menguji Open Redirect...`);
    const redirectParams = ['/login?from=', '/verify?redirect=', '/security-check?from='];
    const maliciousUrl = 'https://evil-malicious-site.com';
    
    for (const path of redirectParams) {
        const fullPath = path + maliciousUrl;
        const res = await sendRequest(fullPath, 'GET');
        // Check if Location header matches the malicious URL
        if (res.code === 301 || res.code === 302 || res.code === 307 || res.code === 308) {
             const loc = res.data_headers && res.data_headers['location'];
             if (loc && loc.includes(maliciousUrl)) {
                 console.log(`   ❌ VULNERABILITY FOUND: Open Redirect di ${fullPath}!`);
                 vulnerabilities.push(`Open Redirect di ${fullPath}`);
                 stats.success++;
             }
        } else {
            console.log(`   ✅ AMAN: ${path} tidak melakukan redirect ke domain luar.`);
            stats.failed++;
        }
    }

    // 5. CORS Origin Reflection Test
    console.log(`\n🔍 Menguji CORS Misconfiguration...`);
    const resCors = await sendRequest('/', 'GET', null, { 'Origin': 'https://attacker.com' });
    const allowOrigin = resCors.data_headers && resCors.data_headers['access-control-allow-origin'];
    if (allowOrigin === '*' || allowOrigin === 'https://attacker.com') {
        console.log(`   ❌ VULNERABILITY FOUND: CORS Misconfiguration (Allow-Origin: ${allowOrigin})!`);
        vulnerabilities.push(`CORS Misconfiguration di root (Reflected Origin)`);
        stats.success++;
    } else {
        console.log(`   ✅ AMAN: Server tidak memantulkan Origin asing.`);
        stats.failed++;
    }
}

module.exports = runWebVulnerabilities;
