const readline = require('readline');

function printDdosProgress(stats, startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = ((stats.success + stats.failed + stats.blocked) / Math.max(elapsed, 0.1)).toFixed(1);
    process.stdout.write(`\r✅ Sukses: ${stats.success}  🛡️ Diblokir: ${stats.blocked}  ❌ Gagal: ${stats.failed}  ⚡ RPS: ${rps}  🕒 ${elapsed.toFixed(1)}s`);
}

function showMenu() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PILIH MODE PENETRATION TESTING    ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║ 1. DDoS Attack                     ║');
    console.log('║ 2. Authentication Bypass Test      ║');
    console.log('║ 3. CRUD Exploit & Injection Test   ║');
    console.log('║ 4. Security Misconfiguration Test  ║');
    console.log('║ 5. Rate Limit & Enumeration Test   ║');
    console.log('╚══════════════════════════════════════╝');

    return new Promise((resolve) => {
        const ask = () => {
            rl.question('Masukkan pilihan (1/2/3/4/5): ', (answer) => {
                const choice = answer.trim();
                if (choice === '1') {
                    rl.close();
                    resolve('DDOS');
                } else if (choice === '2') {
                    rl.close();
                    resolve('AUTH_BYPASS');
                } else if (choice === '3') {
                    rl.close();
                    resolve('CRUD_EXPLOIT');
                } else if (choice === '4') {
                    rl.close();
                    resolve('SECURITY_MISC');
                } else if (choice === '5') {
                    rl.close();
                    resolve('RATE_LIMIT');
                } else {
                    console.log('Pilihan tidak valid. Silakan masukkan 1, 2, 3, 4, atau 5.');
                    ask();
                }
            });
        };
        ask();
    });
}

function printHeader(targetUrl) {
    console.log(`╔════════════════════════════════════════════════╗`);
    console.log(`║      SENTINEL PENETRATION TESTING SUITE        ║`);
    console.log(`╚════════════════════════════════════════════════╝`);
    console.log(`Target  : ${targetUrl}`);
}

function printFinalResults(mode, stats, duration, vulnerabilities, cookieJar) {
    const avgLatency = stats.success > 0 ? (stats.totalLatency / stats.success).toFixed(2) : 0;

    console.log(`\n\n📊 HASIL FINAL PENGUJIAN (${duration.toFixed(2)} detik)`);
    console.log(`✅ Berhasil (Tembus): ${stats.success}`);
    console.log(`🛡️  Diblokir Sentinel : ${stats.blocked}`);
    console.log(`❌ Gagal / Ditolak  : ${stats.failed}`);
    
    if (mode === 'DDOS') {
        console.log(`⏱️  Latensi Rata-rata  : ${avgLatency} ms`);
        if (cookieJar) console.log(`🍪 Cookie Tertangkap : ${cookieJar.substring(0, 50)}...`);
    }

    if (vulnerabilities.length > 0) {
        console.log(`\n🚨 CELAH KEAMANAN DITEMUKAN (${vulnerabilities.length}):`);
        vulnerabilities.forEach((vuln, i) => console.log(`   ${i + 1}. ${vuln}`));
        console.log(`\n⚠️ SEGERA PERBAIKI SISTEM ANDA!`);
    } else if (mode !== 'DDOS') {
        console.log(`\n🎉 SELAMAT! Tidak ada celah keamanan yang ditemukan pada pengujian ini.`);
        console.log(`   Sistem Autentikasi dan Sentinel Anda sangat kokoh.`);
    }
}

function askRequestCount(defaultCount) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`\n🔢 Jumlah Request (Default ${defaultCount}): `, (answer) => {
            rl.close();
            const count = parseInt(answer.trim());
            resolve(isNaN(count) ? defaultCount : count);
        });
    });
}

module.exports = {
    printDdosProgress,
    showMenu,
    printHeader,
    printFinalResults,
    askRequestCount
};

