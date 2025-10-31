'use client'; // ✅ must be here so it's always client-side

import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Universal Supabase client for browser-side use.
 * Works seamlessly inside Next.js 15+ App Router.
 * Uses environment variables for security and portability.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: "public" },

    auth: {
      persistSession: true,        // keeps magic link sessions alive
      autoRefreshToken: true,      // revalidates auth tokens automatically
    },

    global: {
      fetch: async (url, options) => {
        // ✅ Fixes hanging fetches in Next.js App Router
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          return await fetch(url, { ...options, cache: "no-store", signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  }
);
