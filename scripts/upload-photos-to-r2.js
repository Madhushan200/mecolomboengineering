const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const manifestPath = path.join(__dirname, '..', 'extracted-photos', 'manifest.json');
const photosDir = path.join(__dirname, '..', 'extracted-photos');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`Starting upload of ${manifest.length} photos to Cloudflare R2 bucket 'me-engineering-photos'...\n`);

let uploaded = 0;
let failed = 0;

for (const item of manifest) {
  const filePath = path.join(photosDir, item.filename);
  console.log(`Uploading ${item.filename} (${item.sizeKB} KB)...`);

  try {
    const cmd = `npx.cmd wrangler r2 object put "me-engineering-photos/${item.filename}" --file="${filePath}" --content-type="image/jpeg"`;
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ✅ Uploaded successfully: ${item.filename}`);
    uploaded++;
  } catch (err) {
    console.error(`  ❌ Failed to upload ${item.filename}:`, err.message);
    failed++;
  }
}

console.log(`\n=== UPLOAD SUMMARY ===`);
console.log(`Total: ${manifest.length}`);
console.log(`Uploaded: ${uploaded}`);
console.log(`Failed: ${failed}`);
