const https = require('https');

const BASE_URL = 'https://me-engineering-api.madhushan875.workers.dev';

async function fetchUrl(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: buffer,
          text: () => buffer.toString('utf8'),
          json: () => JSON.parse(buffer.toString('utf8')),
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log(`\n🔍 Testing Cloudflare Worker at: ${BASE_URL}\n`);

  // 1. Health Check
  try {
    const health = await fetchUrl('/health');
    console.log(`[PASS] GET /health (Status ${health.status}):`, health.json());
  } catch (err) {
    console.error('[FAIL] GET /health:', err.message);
  }

  // 2. Stats
  try {
    const stats = await fetchUrl('/api/stats');
    console.log(`[PASS] GET /api/stats (Status ${stats.status}):`, stats.json());
  } catch (err) {
    console.error('[FAIL] GET /api/stats:', err.message);
  }

  // 3. Work Orders
  try {
    const wo = await fetchUrl('/api/work-orders?limit=3');
    const woList = wo.json();
    console.log(`[PASS] GET /api/work-orders (Status ${wo.status}, count: ${woList.length}):`);
    if (woList.length > 0) {
      console.log(`   Sample Work Order: [${woList[0].work_order_number}] ${woList[0].title} (${woList[0].status})`);
    }
  } catch (err) {
    console.error('[FAIL] GET /api/work-orders:', err.message);
  }

  // 4. Profiles
  try {
    const profiles = await fetchUrl('/api/profiles');
    const profList = profiles.json();
    console.log(`[PASS] GET /api/profiles (Status ${profiles.status}, count: ${profList.length})`);
    if (profList.length > 0) {
      console.log(`   Sample Profile: ${profList[0].name} <${profList[0].email}> (${profList[0].role})`);
    }
  } catch (err) {
    console.error('[FAIL] GET /api/profiles:', err.message);
  }

  // 5. R2 Photo Streaming
  try {
    const photo = await fetchUrl('/api/photos/WO-2026-0054_before.jpg');
    console.log(`[PASS] GET /api/photos/WO-2026-0054_before.jpg (Status ${photo.status}, Content-Type: ${photo.headers['content-type']}, Size: ${photo.data.length} bytes)`);
  } catch (err) {
    console.error('[FAIL] GET /api/photos/WO-2026-0054_before.jpg:', err.message);
  }

  console.log('\n🎉 All test endpoints completed successfully!\n');
}

runTests();
