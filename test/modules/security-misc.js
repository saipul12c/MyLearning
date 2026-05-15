const { sendRequest } = require('../utils/request');
const { MISC_ENDPOINTS } = require('../utils/config');

async function runSecurityMisc(stats, vulnerabilities) {
    console.log(`\n🔍 MEMULAI PENGUJIAN SECURITY MISCONFIGURATION & FILE LEAKS...`);

    for (const endpoint of MISC_ENDPOINTS) {
        console.log(`\n⚙️ Menguji akses ke: ${endpoint}`);
        
        const res = await sendRequest(endpoint, 'GET');

        if (res.status === 'SUCCESS' || res.code === 200) {
            // Validate if it actually returned the sensitive file or just the Next.js fallback page
            const responseStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            
            // Check for common file content signatures
            const isVulnerable = 
                responseStr.includes('DB_PASSWORD') || 
                responseStr.includes('NEXT_PUBLIC_') || 
                responseStr.includes('[core]') || // git config
                responseStr.includes('docker-compose') || 
                responseStr.includes('"dependencies":') || // package.json
                responseStr.includes('React') === false && endpoint.includes('.env'); // If it's a 200 OK but not a React HTML page

            if (isVulnerable) {
                console.log(`   ❌ VULNERABILITY FOUND: File sensitif bocor di ${endpoint}!`);
                vulnerabilities.push(`Data/File leak di ${endpoint}`);
                stats.success++;
            } else if (res.data_headers && (res.data_headers['x-powered-by'] || res.data_headers['server']?.includes('/'))) {
                 console.log(`   ❌ VULNERABILITY FOUND: Kebocoran informasi Server/X-Powered-By di ${endpoint}!`);
                 vulnerabilities.push(`Server Banner Leak (Information Disclosure) di ${endpoint}`);
                 stats.success++;
            } else if (responseStr.toLowerCase().includes('error') && responseStr.includes('stack')) {
                 console.log(`   ❌ VULNERABILITY FOUND: Verbose Error/Stack Trace bocor di ${endpoint}!`);
                 vulnerabilities.push(`Verbose Error Leak di ${endpoint}`);
                 stats.success++;
            } else {
                console.log(`   ✅ AMAN: ${endpoint} tidak memaparkan data sensitif.`);
                stats.failed++;
            }
        } else if (res.status === 'BLOCKED' || res.code === 403 || res.code === 404) {
            console.log(`   🛡️ AMAN: ${endpoint} dikembalikan dengan status ${res.code} (Tertutup)`);
            stats.blocked++;
        } else {
            console.log(`   ✅ AMAN: Akses ke ${endpoint} gagal (Status: ${res.code})`);
            stats.failed++;
        }
    }
}

module.exports = runSecurityMisc;
