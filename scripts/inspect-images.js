const fs = require('fs');
const path = require('path');

const dataSqlPath = path.join(__dirname, '..', 'supabase-backup', 'data.sql');
const content = fs.readFileSync(dataSqlPath, 'utf8');

const lines = content.split(/\r?\n/);
let inWO = false;
let inPhotos = false;

const workOrderPhotos = [];
const photoRecords = [];

lines.forEach(l => {
  if (l.startsWith('COPY "public"."work_orders"')) {
    inWO = true;
    inPhotos = false;
  } else if (l.startsWith('COPY "public"."work_order_photos"')) {
    inPhotos = true;
    inWO = false;
  } else if (l === '\\.') {
    inWO = false;
    inPhotos = false;
  } else if (inWO && l.trim()) {
    const cols = l.split('\t');
    const id = cols[0];
    const woNum = cols[1];
    const photoUrl = cols[11];
    const afterPhotoUrl = cols[12];
    if (photoUrl && photoUrl !== '\\N') {
      workOrderPhotos.push({
        id,
        woNum,
        field: 'photo_url',
        isBase64: photoUrl.startsWith('data:image'),
        length: photoUrl.length,
        mimeType: photoUrl.startsWith('data:image') ? photoUrl.slice(5, photoUrl.indexOf(';')) : 'unknown',
        preview: photoUrl.slice(0, 60),
        fullData: photoUrl
      });
    }
    if (afterPhotoUrl && afterPhotoUrl !== '\\N') {
      workOrderPhotos.push({
        id,
        woNum,
        field: 'after_photo_url',
        isBase64: afterPhotoUrl.startsWith('data:image'),
        length: afterPhotoUrl.length,
        mimeType: afterPhotoUrl.startsWith('data:image') ? afterPhotoUrl.slice(5, afterPhotoUrl.indexOf(';')) : 'unknown',
        preview: afterPhotoUrl.slice(0, 60),
        fullData: afterPhotoUrl
      });
    }
  } else if (inPhotos && l.trim()) {
    const cols = l.split('\t');
    photoRecords.push({
      id: cols[0],
      workOrderId: cols[1],
      photoUrl: cols[2],
      photoType: cols[3],
      caption: cols[4],
      uploadedBy: cols[5]
    });
  }
});

console.log('=== WORK ORDER PHOTOS IN DATABASE ===');
console.log(`Total Work Order Photos Found: ${workOrderPhotos.length}`);
workOrderPhotos.forEach((p, idx) => {
  console.log(`[${idx + 1}] Ticket: ${p.woNum} | Field: ${p.field} | MIME: ${p.mimeType} | Size: ${(p.length / 1024).toFixed(2)} KB | Preview: ${p.preview}`);
});

console.log('\n=== WORK_ORDER_PHOTOS TABLE RECORDS ===');
console.log(`Total records in work_order_photos: ${photoRecords.length}`);

// Check static images in public directory
console.log('\n=== STATIC IMAGES IN PUBLIC/ ===');
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  publicFiles.forEach(f => {
    const stat = fs.statSync(path.join(publicDir, f));
    console.log(` - public/${f} (${(stat.size / 1024).toFixed(2)} KB)`);
  });
}
