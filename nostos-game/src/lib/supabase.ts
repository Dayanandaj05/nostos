import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

declare global {
  // eslint-disable-next-line no-var
  var _nostos_isOffline: boolean | undefined;
  var _nostos_offlineProbed: boolean | undefined;
}

// ── Startup probe (runs once on import, server-side only) ──────────────
// Uses Node's net module to attempt a raw TCP connection with a very short
// timeout. This completes in <50ms whether the port is open or refused,
// unlike fetch() which can hang for ~7s on macOS when the port is closed.
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && !globalThis._nostos_offlineProbed) {
  globalThis._nostos_offlineProbed = true;
  try {
    const net = require('net');
    const url = new URL(supabaseUrl);
    const port = parseInt(url.port || '54321', 10);
    const host = url.hostname;

    const socket = net.createConnection({ host, port, timeout: 500 });
    socket.on('connect', () => {
      globalThis._nostos_isOffline = false;
      socket.destroy();
    });
    socket.on('error', () => {
      globalThis._nostos_isOffline = true;
      socket.destroy();
    });
    socket.on('timeout', () => {
      globalThis._nostos_isOffline = true;
      socket.destroy();
    });
  } catch {
    globalThis._nostos_isOffline = true;
  }
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (process.env.NODE_ENV !== "production") {
    // Instant reject if we already know Supabase is offline
    if (globalThis._nostos_isOffline) {
      return Promise.reject(new Error("Supabase is offline (cached)"));
    }

    const controller = new AbortController();
    if (init?.signal) {
      init.signal.addEventListener('abort', () => controller.abort());
    }
    // 2-second hard timeout for the rare case the probe hasn't finished yet
    const timeoutId = setTimeout(() => controller.abort("Forced Timeout"), 2000);

    return fetch(input, { ...init, signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        globalThis._nostos_isOffline = false;
        return res;
      })
      .catch(err => {
        clearTimeout(timeoutId);
        globalThis._nostos_isOffline = true;
        throw new Error("Supabase is offline (cached)");
      });
  }
  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch }
});
