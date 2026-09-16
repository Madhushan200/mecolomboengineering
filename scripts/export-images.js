const fs = require('fs');
const path = require('path');

const dataSqlPath = path.join(__dirname, '..', 'supabase-backup', 'data.sql');
const outputDir = path.join(__dirname, '..', 'extracted-photos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(dataSqlPath, 'utf8');
const lines = content.split(/\r?\n/);
let inWO = false;

const exported = [];

lines.forEach(l => {
  if (l.startsWith('COPY "public"."work_orders"')) {
    inWO = true;
  } else if (l === '\\.') {
    inWO = false;
  } else if (inWO && l.trim()) {
    const cols = l.split('\t');
    const id = cols[0];
    const woNum = cols[1];
    const title = cols[9];
    const photoUrl = cols[11];
    const afterPhotoUrl = cols[12];

    if (photoUrl && photoUrl.startsWith('data:image')) {
      const match = photoUrl.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `${woNum}_before.${ext}`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, buffer);
        exported.push({
          ticket: woNum,
          type: 'before (photo_url)',
          filename,
          sizeBytes: buffer.length,
          sizeKB: (buffer.length / 1024).toFixed(2),
          workOrderId: id,
          title
        });
      }
    }

    if (afterPhotoUrl && afterPhotoUrl.startsWith('data:image')) {
      const match = afterPhotoUrl.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `${woNum}_after.${ext}`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, buffer);
        exported.push({
          ticket: woNum,
          type: 'after (after_photo_url)',
          filename,
          sizeBytes: buffer.length,
          sizeKB: (buffer.length / 1024).toFixed(2),
          workOrderId: id,
          title
        });
      }
    }
  }
});

console.log(`✅ Successfully extracted and decoded ${exported.length} binary images to: ${outputDir}`);
console.log('\n--- EXTRACTED IMAGES MANIFEST ---');
let totalBytes = 0;
exported.forEach((item, idx) => {
  totalBytes += item.sizeBytes;
  console.log(`[${idx + 1}] File: ${item.filename.padEnd(20)} | Size: ${item.sizeKB.padStart(7)} KB | Ticket: ${item.ticket} | Title: "${item.title}"`);
});
console.log(`\nTotal Decoded Storage Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${totalBytes} bytes)`);

// Write manifest JSON
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(exported, null, 2), 'utf8');
