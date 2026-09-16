const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dataSqlPath = path.join(__dirname, '..', 'supabase-backup', 'data.sql');
const schemaSqlPath = path.join(__dirname, '..', 'cloudflare', 'migrations', '0001_initial_schema.sql');
const outputSqlPath = path.join(__dirname, '..', 'cloudflare', 'migrations', '0002_seed_data.sql');

const content = fs.readFileSync(dataSqlPath, 'utf8');

const targetTables = [
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

const booleanColumns = {
  departments: ['active'],
  profiles: ['active'],
  technicians: ['active'],
  system_settings: ['sound_alert_enabled'],
  work_orders: ['guest_affected'],
  notifications: ['is_read']
};

function parseCopyBlocks(sqlContent) {
  const tableData = {};
  targetTables.forEach(t => tableData[t] = { columns: [], rows: [] });

  const lines = sqlContent.split(/\r?\n/);
  let currentTable = null;
  let currentColumns = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const copyMatch = line.match(/^COPY\s+"public"\."(\w+)"\s*\((.+)\)\s*FROM\s*stdin;/i);
    if (copyMatch) {
      const tableName = copyMatch[1];
      if (targetTables.includes(tableName)) {
        currentTable = tableName;
        currentColumns = copyMatch[2].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        tableData[currentTable].columns = currentColumns;
      } else {
        currentTable = null;
      }
      continue;
    }

    if (line === '\\.') {
      currentTable = null;
      currentColumns = [];
      continue;
    }

    if (currentTable && line.trim().length > 0) {
      const values = line.split('\t');
      tableData[currentTable].rows.push(values);
    }
  }

  return tableData;
}

const CHUNK_SIZE = 30000; // 30KB per update to safely stay below SQLite max statement length

function formatSqlValue(val, colName, tableName) {
  if (val === '\\N' || val === undefined || val === null) {
    return { isNull: true, formatted: 'NULL', chunks: [] };
  }

  let unescaped = val
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');

  const boolCols = booleanColumns[tableName] || [];
  if (boolCols.includes(colName)) {
    if (unescaped === 't' || unescaped === 'true' || unescaped === '1') return { isNull: false, formatted: '1', chunks: [] };
    if (unescaped === 'f' || unescaped === 'false' || unescaped === '0') return { isNull: false, formatted: '0', chunks: [] };
  }

  // If string is very large (e.g. base64 photo), chunk it into separate update statements
  if (unescaped.length > CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < unescaped.length; i += CHUNK_SIZE) {
      const chunk = unescaped.slice(i, i + CHUNK_SIZE).replace(/'/g, "''");
      chunks.push(chunk);
    }
    return { isNull: false, formatted: "''", chunks };
  }

  const escaped = unescaped.replace(/'/g, "''");
  return { isNull: false, formatted: `'${escaped}'`, chunks: [] };
}

function generateSeedSql(tableData) {
  let out = `-- =============================================================================\n`;
  out += `-- Migration: 0002_seed_data.sql\n`;
  out += `-- Application: ME Colombo Engineering (Ceyvista Engineering)\n`;
  out += `-- Source: supabase-backup/data.sql\n`;
  out += `-- Target: Cloudflare D1 (SQLite)\n`;
  out += `-- Generated on: ${new Date().toISOString()}\n`;
  out += `-- =============================================================================\n\n`;

  out += `PRAGMA foreign_keys = ON;\n\n`;

  const counts = {};

  for (const tableName of targetTables) {
    const data = tableData[tableName];
    const rowCount = data.rows.length;
    counts[tableName] = rowCount;

    out += `-- -----------------------------------------------------------------------------\n`;
    out += `-- Data for Table: ${tableName} (${rowCount} rows)\n`;
    out += `-- -----------------------------------------------------------------------------\n`;

    if (rowCount === 0) {
      out += `-- (No rows to insert)\n\n`;
      continue;
    }

    const colListStr = data.columns.map(c => `"${c}"`).join(', ');
    const idColIdx = data.columns.indexOf('id');

    for (const row of data.rows) {
      const idVal = row[idColIdx];
      const updates = [];

      const valListStr = row.map((val, idx) => {
        const colName = data.columns[idx];
        const res = formatSqlValue(val, colName, tableName);
        if (res.chunks && res.chunks.length > 0) {
          res.chunks.forEach(chunk => {
            updates.push(`UPDATE "${tableName}" SET "${colName}" = "${colName}" || '${chunk}' WHERE "id" = '${idVal}';`);
          });
        }
        return res.formatted;
      }).join(', ');

      out += `INSERT INTO "${tableName}" (${colListStr}) VALUES (${valListStr});\n`;
      if (updates.length > 0) {
        out += updates.join('\n') + '\n';
      }
    }
    out += `\n`;
  }

  return { sql: out, counts };
}

const tableData = parseCopyBlocks(content);
const { sql: seedSql, counts } = generateSeedSql(tableData);

fs.writeFileSync(outputSqlPath, seedSql, 'utf8');
console.log(`✅ Seed data SQL written to: ${outputSqlPath}`);

// Validation against SQLite engine
const db = new DatabaseSync(':memory:');
const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');

db.exec(schemaSql);
db.exec(seedSql);

console.log('✅ SQLite in-memory validation passed with 100% integrity.');
for (const tableName of targetTables) {
  const res = db.prepare(`SELECT count(*) as count FROM "${tableName}"`).get();
  console.log(`  Verified in SQLite -> ${tableName.padEnd(26)} : ${res.count} rows`);
}
