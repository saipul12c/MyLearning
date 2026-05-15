const { sendRequest } = require('../utils/request');

/**
 * Business Logic Exploits Module
 * Menguji celah pada logika bisnis aplikasi (Race Condition, Parameter Pollution).
 */
async function runBusinessLogic(stats, vulnerabilities) {
    console.log(`\n💼 MEMULAI PENGUJIAN BUSINESS LOGIC EXPLOITS...`);

    // 1. Voucher Race Condition Test
    // Mensimulasikan penggunaan satu kode voucher oleh banyak request secara bersamaan
    console.log(`\n🧪 Menguji Voucher Race Condition...`);
    const voucherCode = 'DISKON100'; // Contoh kode
    const raceTasks = [];
    for (let i = 0; i < 10; i++) {
        raceTasks.push(sendRequest('/courses/javascript-fundamental', 'POST', { 
            voucher_code: voucherCode,
            action: 'enroll'
        }));
    }

    const results = await Promise.all(raceTasks);
    const successRace = results.filter(r => r.status === 'SUCCESS' && (r.data.applied || r.data.success)).length;
    
    if (successRace > 1) {
        console.log(`   ❌ VULNERABILITY FOUND: Race Condition terdeteksi! Voucher terpakai ${successRace} kali secara bersamaan.`);
        vulnerabilities.push(`Race Condition pada sistem Voucher (${successRace} success)`);
        stats.success++;
    } else {
        console.log(`   ✅ AMAN: Sistem menangani konkurensi voucher dengan benar.`);
        stats.failed++;
    }

    // 2. HTTP Parameter Pollution (HPP)
    // Mengirim parameter ganda untuk melihat bagaimana server memprosesnya
    console.log(`\n🧪 Menguji HTTP Parameter Pollution (HPP)...`);
    const hppRes = await sendRequest('/courses?id=100&id=200', 'GET');
    // Jika server bingung dan menampilkan data yang tidak seharusnya, atau crash
    if (hppRes.code === 500) {
        console.log(`   ❌ VULNERABILITY FOUND: HPP menyebabkan Internal Server Error!`);
        vulnerabilities.push(`HPP Vulnerability (Server Crash) di /courses`);
        stats.success++;
    } else {
        console.log(`   ✅ AMAN: Server menangani parameter ganda dengan stabil.`);
        stats.failed++;
    }
}

module.exports = runBusinessLogic;
