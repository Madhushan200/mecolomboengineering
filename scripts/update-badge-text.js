const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'out', '_next', 'static', 'chunks', 'app', 'layout-44a173e46d22de49.js'),
  path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'layout-44a173e46d22de49.js'),
  path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public', '_next', 'static', 'chunks', 'app', 'layout-44a173e46d22de49.js')
];

for (const file of targets) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Supabase Live Sync Active/g, 'Cloudflare D1 Sync Active');
    content = content.replace(/Supabase Live/g, 'Cloudflare Live');
    content = content.replace(/Supabase Offline Mode/g, 'Offline Mode');
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ Updated navbar badge in:', file);
  }
}
