const http = require('http');

const data = JSON.stringify({
  email: 'admin@arcus.local',
  password: 'Admin@123456'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('[Test] Sending login request...');

const req = http.request(options, (res) => {
  console.log(`[Test] Status: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('[Test] Response:', responseData);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('[Test] Error:', error.message);
  process.exit(1);
});

// Set a 5-second timeout
setTimeout(() => {
  console.error('[Test] Request timeout after 5 seconds');
  process.exit(1);
}, 5000);

req.write(data);
req.end();
