#!/usr/bin/env node

/**
 * Debug script to test login endpoint
 */

const http = require('http');

const requestData = JSON.stringify({
  email: 'admin@arcus.local',
  password: 'Admin@123456',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData),
  },
};

console.log('📝 Sending login request...');
console.log('Payload:', JSON.parse(requestData));

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Response received:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);

    try {
      const parsed = JSON.parse(data);
      console.log('📊 Parsed response:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(requestData);
req.end();
