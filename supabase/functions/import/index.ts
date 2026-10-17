// Supabase Edge Function "import".
// Aufruf: POST /functions/v1/import  Header: x-import-secret: <IMPORT_SECRET>
// Body: {"mode":"full"} (Standard; Stammdaten + Spielplan aller Whitelist-Ligen, optional "only":[keys], "dryRun":true)
//       {"mode":"results"} (nur Spiele mit kickoff_at in [now()-4h, now()+15min]; leeres Fenster -> keine API-Calls)
// Secrets: SPORTMONKS_API_TOKEN, IMPORT_SECRET; SUPABASE_DB_URL stellt Supabase bereit.
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';
import { fetchAll, quality } from './core/run.ts';
import { buildSql } from './core/sql.ts';
import { buildResultsSql, fetchResults, WINDOW_SQL, type WindowRow } from './core/results.ts';
import { env } from './env.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST' || req.headers.get('x-import-secret') !== env('IMPORT_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  const body = await req.json().catch(() => ({})) as { mode?: 'full' | 'results'; only?: string[]; dryRun?: boolean };
  const sql = postgres(env('SUPABASE_DB_URL')!, { max: 1, prepare: false });
  try {
    if (body.mode === 'results') {
      const rows = await sql.unsafe<WindowRow[]>(WINDOW_SQL);
      if (rows.length === 0) return Response.json({ ok: true, mode: 'results', inWindow: 0, apiCalls: 0 });
      const now = Date.now();
      const r = await fetchResults([...rows], new Date(now - 4 * 3600e3), new Date(now + 15 * 60e3));
      if (!body.dryRun) await sql.unsafe(buildResultsSql(r));
      return Response.json({
        ok: true, mode: 'results', inWindow: r.requested, fetched: r.matches.length,
        apiCalls: Object.fromEntries(r.callsByProvider), warnings: r.warnings,
      });
    }
    const bundles = await fetchAll(undefined, body.only);
    const report = bundles.map(quality);
    if (!body.dryRun) await sql.unsafe(buildSql(bundles, { transaction: true }));
    return Response.json({ ok: true, mode: 'full', dryRun: !!body.dryRun, report });
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error).message ?? e) }, { status: 500 });
  } finally {
    await sql.end();
  }
});
