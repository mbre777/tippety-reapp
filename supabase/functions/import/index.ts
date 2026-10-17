// Supabase Edge Function "import" (noch NICHT deployt).
// Aufruf: POST /functions/v1/import  Header: x-import-secret: <IMPORT_SECRET>  Body optional: {"only":["nhl"]}
// Benoetigte Secrets: SPORTMONKS_API_TOKEN, IMPORT_SECRET, SUPABASE_DB_URL (von Supabase bereitgestellt)
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';
import { fetchAll, quality } from './core/run.ts';
import { buildSql } from './core/sql.ts';
import { env } from './env.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST' || req.headers.get('x-import-secret') !== env('IMPORT_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  const body = await req.json().catch(() => ({})) as { only?: string[]; dryRun?: boolean };
  const bundles = await fetchAll(undefined, body.only);
  const report = bundles.map(quality);
  if (body.dryRun) return Response.json({ dryRun: true, report });
  const sql = postgres(env('SUPABASE_DB_URL')!, { max: 1, prepare: false });
  try {
    await sql.unsafe(buildSql(bundles, { transaction: true }));
  } finally {
    await sql.end();
  }
  return Response.json({ ok: true, report });
});
