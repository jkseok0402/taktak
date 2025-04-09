import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pglite',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgres://postgres:postgres@jayewrhiqkrvfoqhmoex.supabase.co:5432/postgres'
  }
} satisfies Config;