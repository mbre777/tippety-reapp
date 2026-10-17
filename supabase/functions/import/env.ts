// Laeuft in Deno (Edge Function / lokales Script). Secrets nur aus der Umgebung.
export function env(name: string, required = true): string | undefined {
  const v = Deno.env.get(name);
  if (required && !v) throw new Error(`Umgebungsvariable ${name} fehlt`);
  return v;
}
