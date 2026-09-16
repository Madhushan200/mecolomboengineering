const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.fdpemolavetvusapcuek:Mecolombo%40%23%24123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
const outputPath = process.argv[2] || path.join(__dirname, '..', 'supabase-backup', 'schema.sql');

async function dumpSchema() {
  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully!');

  let sql = `-- ========================================================\n`;
  sql += `-- Supabase Database Schema Dump\n`;
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

  // 1. Extensions
  console.log('Extracting extensions...');
  const extRes = await client.query(`
    SELECT extname, extversion 
    FROM pg_extension 
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname;
  `);
  if (extRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Extensions\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const row of extRes.rows) {
      sql += `CREATE EXTENSION IF NOT EXISTS "${row.extname}" WITH SCHEMA "extensions";\n`;
    }
    sql += `\n`;
  }

  // 2. Custom Types / Enums
  console.log('Extracting custom types and enums...');
  const enumRes = await client.query(`
    SELECT n.nspname as schema_name, t.typname as type_name, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY n.nspname, t.typname, e.enumsortorder;
  `);
  if (enumRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Custom Types / Enums\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    const enumMap = {};
    for (const row of enumRes.rows) {
      if (!enumMap[row.type_name]) enumMap[row.type_name] = [];
      enumMap[row.type_name].push(row.enumlabel);
    }
    for (const [typeName, labels] of Object.entries(enumMap)) {
      sql += `DO $$ BEGIN\n`;
      sql += `  CREATE TYPE "public"."${typeName}" AS ENUM (${labels.map(l => `'${l}'`).join(', ')});\n`;
      sql += `EXCEPTION WHEN duplicate_object THEN null; END $$;\n\n`;
    }
  }

  // 3. Functions
  console.log('Extracting functions...');
  const funcRes = await client.query(`
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
  `);
  if (funcRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Functions\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const row of funcRes.rows) {
      sql += `${row.function_def};\n\n`;
    }
  }

  // 4. Tables & Columns
  console.log('Extracting tables and columns...');
  const tableRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  for (const t of tableRes.rows) {
    const tableName = t.table_name;
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table: public.${tableName}\n`;
    sql += `-- --------------------------------------------------------\n\n`;

    const colRes = await client.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    sql += `CREATE TABLE IF NOT EXISTS "public"."${tableName}" (\n`;
    const colDefs = colRes.rows.map(col => {
      let typeStr = col.data_type;
      if (typeStr === 'USER-DEFINED') {
        typeStr = `"public"."${col.udt_name}"`;
      } else if (typeStr === 'character varying') {
        typeStr = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
      } else if (typeStr === 'ARRAY') {
        typeStr = `${col.udt_name.replace(/^_/, '')}[]`;
      }
      
      let def = `    "${col.column_name}" ${typeStr}`;
      if (col.column_default !== null) {
        def += ` DEFAULT ${col.column_default}`;
      }
      if (col.is_nullable === 'NO') {
        def += ` NOT NULL`;
      }
      return def;
    });

    sql += colDefs.join(',\n') + '\n);\n\n';
  }

  // 5. Constraints (Primary Key, Unique, Check, Foreign Key)
  console.log('Extracting constraints...');
  const constraintRes = await client.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      pg_get_constraintdef(c.oid, true) as constraint_def
    FROM information_schema.table_constraints tc
    JOIN pg_constraint c ON c.conname = tc.constraint_name
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE tc.table_schema = 'public' AND n.nspname = 'public'
    ORDER BY 
      CASE tc.constraint_type
        WHEN 'PRIMARY KEY' THEN 1
        WHEN 'UNIQUE' THEN 2
        WHEN 'CHECK' THEN 3
        WHEN 'FOREIGN KEY' THEN 4
        ELSE 5
      END,
      tc.table_name,
      tc.constraint_name;
  `);

  if (constraintRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Constraints\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const row of constraintRes.rows) {
      sql += `ALTER TABLE ONLY "public"."${row.table_name}"\n`;
      sql += `    DROP CONSTRAINT IF EXISTS "${row.constraint_name}",\n`;
      sql += `    ADD CONSTRAINT "${row.constraint_name}" ${row.constraint_def};\n\n`;
    }
  }

  // 6. Indexes
  console.log('Extracting indexes...');
  const indexRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' 
      AND indexname NOT IN (
        SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace
      )
    ORDER BY tablename, indexname;
  `);

  if (indexRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Indexes\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const row of indexRes.rows) {
      sql += `${row.indexdef};\n`;
    }
    sql += `\n`;
  }

  // 7. Row Level Security & Policies
  console.log('Extracting RLS policies...');
  const rlsRes = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  sql += `-- --------------------------------------------------------\n`;
  sql += `-- Row Level Security (RLS)\n`;
  sql += `-- --------------------------------------------------------\n\n`;
  for (const row of rlsRes.rows) {
    if (row.rowsecurity) {
      sql += `ALTER TABLE "public"."${row.tablename}" ENABLE ROW LEVEL SECURITY;\n`;
    }
  }
  sql += `\n`;

  const policyRes = await client.query(`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  if (policyRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- RLS Policies\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const p of policyRes.rows) {
      sql += `DROP POLICY IF EXISTS "${p.policyname}" ON "public"."${p.tablename}";\n`;
      sql += `CREATE POLICY "${p.policyname}" ON "public"."${p.tablename}"\n`;
      sql += `    AS ${p.permissive}\n`;
      sql += `    FOR ${p.cmd}\n`;
      sql += `    TO ${p.roles.join(', ')}\n`;
      if (p.qual) {
        sql += `    USING (${p.qual})\n`;
      }
      if (p.with_check) {
        sql += `    WITH CHECK (${p.with_check})\n`;
      }
      sql += `;\n\n`;
    }
  }

  // 8. Triggers
  console.log('Extracting triggers...');
  const triggerRes = await client.query(`
    SELECT 
      event_object_table as table_name,
      trigger_name,
      action_timing,
      event_manipulation,
      action_statement,
      action_orientation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);

  if (triggerRes.rows.length > 0) {
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Triggers\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    for (const t of triggerRes.rows) {
      sql += `DROP TRIGGER IF EXISTS "${t.trigger_name}" ON "public"."${t.table_name}";\n`;
      sql += `CREATE TRIGGER "${t.trigger_name}"\n`;
      sql += `    ${t.action_timing} ${t.event_manipulation} ON "public"."${t.table_name}"\n`;
      sql += `    FOR EACH ${t.action_orientation}\n`;
      sql += `    ${t.action_statement};\n\n`;
    }
  }

  // 9. Realtime Publication
  console.log('Checking publication publication_tables...');
  try {
    const pubRes = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public';
    `);
    if (pubRes.rows.length > 0) {
      sql += `-- --------------------------------------------------------\n`;
      sql += `-- Realtime Publication\n`;
      sql += `-- --------------------------------------------------------\n\n`;
      for (const row of pubRes.rows) {
        sql += `ALTER PUBLICATION supabase_realtime ADD TABLE "public"."${row.tablename}";\n`;
      }
      sql += `\n`;
    }
  } catch (err) {
    // Ignore if not permitted
  }

  // 10. Table Grants
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- Grants\n`;
  sql += `-- --------------------------------------------------------\n\n`;
  sql += `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;\n`;
  sql += `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\n`;
  sql += `GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;\n`;
  sql += `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;\n\n`;

  await client.end();

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Schema successfully written to: ${outputPath}`);
}

dumpSchema().catch(err => {
  console.error('Failed to dump schema:', err);
  process.exit(1);
});
