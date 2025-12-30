import http from 'http';

// Wait for server to be likely ready (manual start required)
const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/?test[$gt]=1', // Malicious query
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        // We expect a 200 OK or similar, NOT a 500 Internal Server Error
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        if (res.statusCode !== 500) {
            console.log('SUCCESS: Server handled request without crashing (Fix Verified)');
        } else {
            console.log('FAIL: Server returned 500 Error');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
