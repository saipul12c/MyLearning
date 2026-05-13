const { sendRequest } = require('../utils/request');
const { RATE_LIMIT_ENDPOINTS } = require('../utils/config');

async function runRateLimit(stats, vulnerabilities) {
    console.log(`\n⏳ MEMULAI PENGUJIAN RATE LIMIT & ENUMERATION...`);

    const REQUESTS_TO_SEND = 50;

    for (const endpoint of RATE_LIMIT_ENDPOINTS) {
        console.log(`\n⚙️ Menguji Rate Limit pada Endpoint: ${endpoint}`);
        
        let blockedAt = -1;
        let successCount = 0;

        for (let i = 1; i <= REQUESTS_TO_SEND; i++) {
            // Randomize slightly to emulate an enumerator (e.g. testing different usernames or passwords)
            const payload = { email: `test${i}@example.com`, password: 'password123' };
            const res = await sendRequest(endpoint, 'POST', payload);

            if (res.status === 'BLOCKED' || res.code === 429) {
                blockedAt = i;
                stats.blocked++;
                break; // Stop after being blocked
            } else if (res.status === 'SUCCESS' || res.code === 200 || res.code === 201 || res.code === 401) {
                // 401 is normal for incorrect password, meaning it processed the request!
                successCount++;
                stats.failed++;
            } else {
                stats.failed++;
            }
        }

        if (blockedAt !== -1) {
            console.log(`   ✅ AMAN: Rate limit aktif! Diblokir setelah ${blockedAt} request berturut-turut.`);
        } else {
            console.log(`   ❌ VULNERABILITY FOUND: Tidak ada rate limit di ${endpoint}. ${successCount} request lolos!`);
            vulnerabilities.push(`Missing Rate Limit / Enumeration rentan di ${endpoint}`);
            stats.success++;
        }
    }
}

module.exports = runRateLimit;
