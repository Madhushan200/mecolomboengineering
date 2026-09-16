const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '..', 'cloudflare', 'migrations', '0001_initial_schema.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

const db = new DatabaseSync(':memory:');
db.exec(sql);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log('✅ Created Tables in SQLite (' + tables.length + '):');
tables.forEach(t => console.log('  - ' + t.name));

const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name").all();
console.log('\n✅ Created Indexes in SQLite (' + indexes.length + '):');
indexes.forEach(idx => console.log('  - ' + idx.name + ' on ' + idx.tbl_name));

// Verify foreign keys pragma
const fkStatus = db.prepare("PRAGMA foreign_keys").all();
console.log('\n✅ Foreign Keys Status:', fkStatus);
