const { TARGET_URL } = require('./utils/config');
const { getCookieJar } = require('./utils/request');
const { showMenu, printHeader, printFinalResults } = require('./utils/ui');

// Import Modules
const runDdos = require('./modules/ddos');
const runAuthBypass = require('./modules/auth-bypass');
const runCrudExploit = require('./modules/crud-exploit');
const runSecurityMisc = require('./modules/security-misc');
const runRateLimit = require('./modules/rate-limit');

// Shared State
let stats = {
    success: 0,
    failed: 0,
    blocked: 0,
    totalLatency: 0
};
let vulnerabilities = [];
let startTime;
let ATTACK_MODE = 'DDOS';

async function main() {
    printHeader(TARGET_URL);

    // Tampilkan menu dan dapatkan pilihan
    ATTACK_MODE = await showMenu();
    console.log(`Mode    : ${ATTACK_MODE}\n`);

    let customCount = 0;
    if (ATTACK_MODE === 'DDOS') {
        const { DDOS_CONFIG } = require('./utils/config');
        customCount = await require('./utils/ui').askRequestCount(DDOS_CONFIG.TOTAL_REQUESTS);
    }

    startTime = Date.now();

    try {
        if (ATTACK_MODE === 'AUTH_BYPASS') {
            await runAuthBypass(stats, vulnerabilities);
        } else if (ATTACK_MODE === 'CRUD_EXPLOIT') {
            await runCrudExploit(stats, vulnerabilities);
        } else if (ATTACK_MODE === 'SECURITY_MISC') {
            await runSecurityMisc(stats, vulnerabilities);
        } else if (ATTACK_MODE === 'RATE_LIMIT') {
            await runRateLimit(stats, vulnerabilities);
        } else {
            await runDdos(stats, startTime, customCount);
        }

        const duration = (Date.now() - startTime) / 1000;
        printFinalResults(ATTACK_MODE, stats, duration, vulnerabilities, getCookieJar());

    } catch (err) {
        console.error('\n💀 ERROR TERJADI SELAMA PENGUJIAN:', err.message);
    }
}

main().catch(err => {
    console.error('\n💀 ERROR FATAL:', err.message);
    process.exit(1);
});