import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Universal Supabase client for browser-side use (frontend).
 * Works seamlessly inside Next.js 15+ App Router with no hanging fetches.
 * Uses environment variables for security and portability.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: "public" },

    auth: {
      persistSession: true,        // ✅ keeps magic link sessions alive
      autoRefreshToken: true,      // ✅ revalidates auth tokens automatically
    },

    global: {
      headers: { "Content-Type": "application/json" },
      fetch: async (url, options) => {
        // ✅ critical fix for "stuck" inserts in Next.js App Router
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
        try {
          return await fetch(url, { ...options, cache: "no-store", signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  }
);
