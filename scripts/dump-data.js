const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.fdpemolavetvusapcuek:Mecolombo%40%23%24123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
const outputPath = process.argv[2] || path.join(__dirname, '..', 'supabase-backup', 'data.sql');

function formatCopyValue(val) {
  if (val === null || val === undefined) {
    return '\\N';
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'boolean') {
    return val ? 't' : 'f';
  }
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  // Escape backslashes, tabs, newlines, carriage returns
  return String(val)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

async function dumpData() {
  console.log('Connecting to PostgreSQL database for data dump...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully!');

  let sql = `-- ========================================================\n`;
  sql += `-- Supabase Database Data Dump (--data-only --use-copy)\n`;
  sql += `-- Generated on: ${new Date().toISOString()}\n`;
  sql += `-- Project: fdpemolavetvusapcuek\n`;
  sql += `-- ========================================================\n\n`;

  sql += `SET statement_timeout = 0;\n`;
  sql += `SET lock_timeout = 0;\n`;
  sql += `SET idle_in_transaction_session_timeout = 0;\n`;
  sql += `SET client_encoding = 'UTF8';\n`;
  sql += `SET standard_conforming_strings = on;\n`;
  sql += `SELECT pg_catalog.set_config('search_path', '', false);\n`;
  sql += `SET check_function_bodies = false;\n`;
  sql += `SET xmloption = content;\n`;
  sql += `SET client_min_messages = warning;\n`;
  sql += `SET row_security = off;\n\n`;

  // Get table list in topological order (handling foreign key dependencies)
  const orderedTables = [
    'departments',
    'profiles',
    'technicians',
    'system_settings',
    'work_orders',
    'work_order_photos',
    'work_order_comments',
    'work_order_status_history',
    'notifications'
  ];

  for (const tableName of orderedTables) {
    console.log(`Dumping data for table: public.${tableName}...`);

    // Get column names in ordinal position
    const colRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    if (colRes.rows.length === 0) continue;

    const columns = colRes.rows.map(r => r.column_name);
    const colListStr = columns.map(c => `"${c}"`).join(', ');

    // Fetch all rows
    const dataRes = await client.query(`
      SELECT * FROM "public"."${tableName}";
    `);

    sql += `--\n`;
    sql += `-- Data for Name: ${tableName}; Type: TABLE DATA; Schema: public; Owner: postgres\n`;
    sql += `-- Total rows: ${dataRes.rows.length}\n`;
    sql += `--\n\n`;

    if (dataRes.rows.length > 0) {
      sql += `COPY "public"."${tableName}" (${colListStr}) FROM stdin;\n`;
      for (const row of dataRes.rows) {
        const rowVals = columns.map(col => formatCopyValue(row[col]));
        sql += rowVals.join('\t') + '\n';
      }
      sql += `\\.\n\n`;
    } else {
      sql += `-- (Table is empty)\n\n`;
    }
  }

  // Handle sequences
  console.log('Extracting sequences status...');
  const seqRes = await client.query(`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    ORDER BY sequence_name;
  `);

  for (const s of seqRes.rows) {
    const seqName = s.sequence_name;
    try {
      const lastValRes = await client.query(`SELECT last_value, is_called FROM "public"."${seqName}";`);
      if (lastValRes.rows.length > 0) {
        const { last_value, is_called } = lastValRes.rows[0];
        sql += `SELECT pg_catalog.setval('"public"."${seqName}"', ${last_value}, ${is_called ? 'true' : 'false'});\n`;
      }
    } catch (err) {
      console.warn(`Could not get setval for sequence ${seqName}:`, err.message);
    }
  }

  await client.end();

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Data successfully written to: ${outputPath}`);
}

dumpData().catch(err => {
  console.error('Failed to dump data:', err);
  process.exit(1);
});
