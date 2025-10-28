// env.d.ts
namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;

    SANITY_PROJECT_ID: string;
    SANITY_DATASET: string;
    SANITY_API_VERSION: string;
    NEXT_PUBLIC_SANITY_PROJECT_ID: string;
    NEXT_PUBLIC_SANITY_DATASET: string;

    STAFF_ACCESS_KEY?: string;
    ADMIN_ACCESS_KEY?: string;
  }
}
