import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * WebCrypto-Polyfill für Hermes/Expo Go: supabase-js nutzt für PKCE crypto.getRandomValues
 * und crypto.subtle.digest('SHA-256'). Fehlen sie, fällt es auf code_challenge_method=plain zurück
 * ("WebCrypto API is not supported…"). expo-crypto ist in Expo Go enthalten.
 */
if (Platform.OS !== 'web') {
  const g = globalThis as unknown as { crypto?: Record<string, unknown> };
  const c: Record<string, unknown> = g.crypto ?? {};
  if (typeof c.getRandomValues !== 'function') {
    c.getRandomValues = <T extends ArrayBufferView | null>(arr: T) => Crypto.getRandomValues(arr as never) as T;
  }
  if (!c.subtle) {
    c.subtle = {
      digest: async (algo: string | { name: string }, data: BufferSource) => {
        const name = (typeof algo === 'string' ? algo : algo.name).toUpperCase();
        if (name !== 'SHA-256') throw new Error(`digest ${name} nicht unterstützt`);
        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array((data as ArrayBufferView).buffer, (data as ArrayBufferView).byteOffset, (data as ArrayBufferView).byteLength);
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes as Uint8Array<ArrayBuffer>);
      },
    };
  }
  if (!g.crypto) g.crypto = c;
}
