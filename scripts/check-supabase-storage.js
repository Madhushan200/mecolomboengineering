const { Client } = require('pg');

const connectionString = 'postgresql://postgres.fdpemolavetvusapcuek:Mecolombo%40%23%24123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

async function checkSupabaseStorage() {
  console.log('Connecting to PostgreSQL to check Supabase Storage schema and buckets...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const bucketsRes = await client.query('SELECT * FROM storage.buckets;');
    console.log('=== SUPABASE STORAGE BUCKETS ===');
    console.log(bucketsRes.rows);

    const objectsRes = await client.query('SELECT id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata FROM storage.objects;');
    console.log('\n=== SUPABASE STORAGE OBJECTS ===');
    console.log(`Total Objects Found: ${objectsRes.rows.length}`);
    objectsRes.rows.forEach(obj => {
      console.log(`Bucket: ${obj.bucket_id} | Name: ${obj.name} | Size: ${obj.metadata?.size || 'unknown'} | Mime: ${obj.metadata?.mimetype || 'unknown'}`);
    });
  } catch (err) {
    console.error('Error querying storage schema:', err.message);
  }

  await client.end();
}

checkSupabaseStorage().catch(err => {
  console.error('Failed to check storage:', err);
});
