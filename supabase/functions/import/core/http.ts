export class Http {
  calls = 0;
  async json<T = unknown>(url: string, init?: RequestInit, retries = 2): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      this.calls++;
      const res = await fetch(url, { ...init, redirect: 'follow' });
      if (res.ok) return await res.json() as T;
      if (attempt >= retries || (res.status < 500 && res.status !== 429)) {
        // URL ohne Query loggen (Tokens!)
        throw new Error(`HTTP ${res.status} bei ${url.split('?')[0]}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/** Saison-Startjahr: ab Juli zaehlt die neue Saison. */
export function seasonStartYear(d = new Date()): number {
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}
