import { r2ConfigFromEnv } from '@/lib/server/r2';
import { ingest } from '@/lib/server/recordings';

// Session recording chunks from lib/recorder/client.ts, stored in Cloudflare
// R2 (EU). All checks and the storage live in lib/server/recordings.ts; see
// the note there for what protects this public endpoint and what is kept.
// Node runtime: it uses node:zlib and node:crypto.
export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request: Request): Promise<Response> {
  const result = await ingest(request, { config: r2ConfigFromEnv() });
  return new Response(null, {
    status: result.status,
    headers: { 'cache-control': 'no-store', ...(result.reason ? { 'x-rec-reason': result.reason } : {}) },
  });
}
