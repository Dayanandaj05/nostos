import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

declare global {
  var _nostos_isOffline: boolean | undefined;
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (process.env.NODE_ENV !== "production") {
    let isOfflineLocked = false;
    let lockFilePath = "";

    if (typeof window === 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        lockFilePath = path.join(os.tmpdir(), 'nostos_offline.lock');
        isOfflineLocked = fs.existsSync(lockFilePath);
      } catch (e) {}
    }

    // Check global state or file system lock (cross-worker) - 0ms instant reject
    if (globalThis._nostos_isOffline || isOfflineLocked) {
      return Promise.reject(new Error("Supabase is offline (cached)"));
    }

    const controller = new AbortController();
    if (init?.signal) {
      init.signal.addEventListener('abort', () => controller.abort());
    }
    const timeoutId = setTimeout(() => controller.abort("Forced Timeout"), 100);

    return fetch(input, { ...init, signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        return res;
      })
      .catch(err => {
        clearTimeout(timeoutId);
        globalThis._nostos_isOffline = true;
        if (typeof window === 'undefined' && lockFilePath) {
          try { require('fs').writeFileSync(lockFilePath, 'offline'); } catch (e) {}
        }
        throw new Error("Supabase is offline (cached)");
      });
  }
  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch }
});
