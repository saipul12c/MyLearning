const { sendRequest, randomHeader } = require('../utils/request');
const { PROTECTED_ROUTES, EXPLOIT_PAYLOADS } = require('../utils/config');

async function runAuthBypass(stats, vulnerabilities) {
    console.log(`\n🛡️ MEMULAI PENGUJIAN AUTHENTICATION BYPASS & SENTINEL EXPLOITS...`);

    for (const route of PROTECTED_ROUTES) {
        console.log(`\n🔍 Menguji Akses Tanpa Login ke: ${route}`);
        const res1 = await sendRequest(route, 'GET');
        
        if (res1.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: Rute ${route} dapat diakses tanpa login!`);
            vulnerabilities.push(`Akses Publik ke ${route}`);
            stats.success++;
        }

        console.log(`🔍 Menguji JWT Spoofing ke: ${route}`);
        const res2 = await sendRequest(route, 'GET', null, randomHeader({ addBadCookie: true }));
        if (res2.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: Sesi palsu diterima di ${route}!`);
            vulnerabilities.push(`JWT Spoofing di ${route}`);
            stats.success++;
        }

        console.log(`🔍 Menguji IP Spoofing (X-Forwarded-For) ke: ${route}`);
        const resIP = await sendRequest(route, 'GET', null, { 
            'X-Forwarded-For': '127.0.0.1',
            'X-Real-IP': '127.0.0.1',
            'X-Client-IP': '127.0.0.1'
        });
        if (resIP.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: IP Spoofing (Trusting X-Forwarded-For) di ${route}!`);
            vulnerabilities.push(`IP Spoofing di ${route}`);
            stats.success++;
        }

        console.log(`🔍 Menguji Header Authorization Bypass ke: ${route}`);
        const resAuth = await sendRequest(route, 'GET', null, { 
            'Authorization': 'Bearer null',
            'X-API-Key': 'admin'
        });
        if (resAuth.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: Authorization Header Bypass di ${route}!`);
            vulnerabilities.push(`Auth Header Bypass di ${route}`);
            stats.success++;
        }

        console.log(`🔍 Menguji Sentinel Verification Bypass (Cookie Spoof) ke: ${route}`);
        const res3 = await sendRequest(route, 'GET', null, {}, { exploitCookie: EXPLOIT_PAYLOADS.SENTINEL_BYPASS.cookie });
        if (res3.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: Sentinel Verification Bypass di ${route}!`);
            vulnerabilities.push(`Sentinel Verification Bypass di ${route}`);
            stats.success++;
        }

        console.log(`🔍 Menguji Sentinel Config Poisoning ke: ${route}`);
        const res4 = await sendRequest(route, 'GET', null, {}, { exploitCookie: EXPLOIT_PAYLOADS.SENTINEL_DISABLE.cookie });
        if (res4.status === 'SUCCESS') {
            console.log(`   ❌ VULNERABILITY FOUND: Sentinel Config Poisoning di ${route}!`);
            vulnerabilities.push(`Sentinel Config Poisoning di ${route}`);
            stats.success++;
        }
        console.log(`🔍 Menguji Sentinel Access Key Brute Force ke: ${route}`);
        const commonKeys = ['admin', '123456', 'password', 'root', 'sentinel'];
        for (const key of commonKeys) {
            const resKey = await sendRequest(route, 'GET', null, { 'X-Sentinel-Key': key });
            if (resKey.status === 'SUCCESS') {
                console.log(`   ❌ VULNERABILITY FOUND: Sentinel Key Brute Force sukses dengan key [${key}]!`);
                vulnerabilities.push(`Sentinel Key Brute Force (${key}) di ${route}`);
                stats.success++;
                break;
            }
        }

        // Update generic stats
        if (res1.status === 'BLOCKED' || res2.status === 'BLOCKED' || res3.status === 'BLOCKED' || res4.status === 'BLOCKED' || resIP.status === 'BLOCKED' || resAuth.status === 'BLOCKED') {
            stats.blocked++;
        } else {
            stats.failed++;
        }
    }
}

module.exports = runAuthBypass;
