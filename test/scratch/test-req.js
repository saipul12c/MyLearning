const { sendRequest } = require('../utils/request');

async function test() {
    const res = await sendRequest('/dashboard', 'GET');
    console.log('Result:', JSON.stringify(res, null, 2));
}

test();
