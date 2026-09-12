import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

declare global {
  // eslint-disable-next-line no-var
  var _nostos_isOffline: boolean | undefined;
  var _nostos_offlineProbed: boolean | undefined;
}

// ── Startup probe (runs once on import, server-side only) ──────────────
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && !globalThis._nostos_offlineProbed) {
  globalThis._nostos_offlineProbed = true;
  globalThis._nostos_isOffline = false; // default assume online, fail fast if down
  try {
    const net = require('net');
    const url = new URL(supabaseUrl);
    const port = parseInt(url.port || '54321', 10);
    const host = url.hostname;

    const socket = net.createConnection({ host, port, timeout: 150 });
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
    // Fast 150ms timeout in dev mode so offline Supabase never hangs page loads
    const timeoutId = setTimeout(() => controller.abort("Forced Timeout"), 150);

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

