// Lokaler Import-Runner (nutzt denselben Code wie die Edge Function).
//   deno run --allow-net --allow-env --allow-write scripts/import.ts --dry-run [--only=nhl,de-bundesliga] [--json=report.json]
//   deno run --allow-net --allow-env --allow-write scripts/import.ts --sql=/pfad/import.sql
// --dry-run: nur abrufen + zaehlen + Qualitaetsbericht. --sql: Upsert-SQL (eine Transaktion) schreiben, NICHT ausfuehren.
import { fetchAll, quality } from '../supabase/functions/import/core/run.ts';
import { buildSql } from '../supabase/functions/import/core/sql.ts';

const args = Object.fromEntries(Deno.args.map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? 'true']; }));
const only = args.only ? String(args.only).split(',') : undefined;

const bundles = await fetchAll(undefined, only);
const report = bundles.map(quality);
for (const r of report) {
  console.log(`\n== ${r.key}: ${r.teams} Teams, ${r.matches} Spiele (${r.firstKickoff?.slice(0, 10)} .. ${r.lastKickoff?.slice(0, 10)})`);
  console.log('   Status:', JSON.stringify(r.byStatus), ' Roh:', JSON.stringify(r.rawStatus));
  console.log('   Fehlende Felder:', JSON.stringify(r.missing));
  console.log(`   Probleme (${r.issues.length}):`, r.issues.slice(0, 10).join(' | ') || '-');
}
console.log('\nAPI-Calls:', bundles.map((b) => `${b.configKey}=${b.apiCalls}`).join(', '));
if (args.json && args.json !== 'true') await Deno.writeTextFile(String(args.json), JSON.stringify(report, null, 2));
if (args.sql && args.sql !== 'true') {
  await Deno.writeTextFile(String(args.sql), buildSql(bundles));
  console.log('SQL geschrieben:', args.sql);
}
