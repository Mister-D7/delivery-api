import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const sqlFile = path.join(__dirname, '..', '..', 'schema-nav.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');
const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

let ok = 0;
let failed = 0;
for (const st of statements) {
  const { error } = await supabase.rpc('exec_sql', { sql: st + ';' });
  if (error) {
    failed++;
    console.log(`  FAIL: ${error.message}`);
    console.log(`    SQL: ${st.slice(0, 80)}`);
  } else {
    ok++;
    console.log(`  OK:   ${st.slice(0, 80)}`);
  }
}

console.log(`\nDone: ${ok} applied, ${failed} failed.`);
if (failed) {
  console.log('\n=> The exec_sql RPC is not available on this Supabase project.');
  console.log('=> Please run the statements below in Supabase SQL Editor, then run the seed:');
  console.log(sql);
}
