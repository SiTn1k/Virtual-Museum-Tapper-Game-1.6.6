// Type declarations for Deno globals used in Supabase Edge Functions
// These are not part of the npm package but are available at runtime in Deno

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}
