// Writes to Cloudflare R2 through its S3-compatible API, signed with AWS
// Signature Version 4 by hand (node:crypto), because the project has no S3
// client and one PUT does not justify adding the AWS SDK (T-0411).
//
// The bucket lives in R2's EU jurisdiction, whose endpoint is
// https://<account id>.eu.r2.cloudflarestorage.com (Cloudflare, "Data
// location"); R2 takes the region "auto".
//
// Env (names only; values are in Vercel, never in the repo):
//   R2_ACCOUNT_ID            Cloudflare account id
//   R2_ACCESS_KEY_ID         R2 API token's access key id (Object Read & Write,
//   R2_SECRET_ACCESS_KEY     scoped to the recordings bucket only)
//   R2_RECORDINGS_BUCKET     bucket name, e.g. scanart-recordings
//   R2_JURISDICTION          optional; "eu" (default) or "default"

import crypto from 'node:crypto';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  jurisdiction: 'eu' | 'default';
};

export function r2ConfigFromEnv(env: Record<string, string | undefined> = process.env): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_RECORDINGS_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, jurisdiction: env.R2_JURISDICTION === 'default' ? 'default' : 'eu' };
}

export function r2Host(config: Pick<R2Config, 'accountId' | 'jurisdiction'>): string {
  return config.jurisdiction === 'eu'
    ? `${config.accountId}.eu.r2.cloudflarestorage.com`
    : `${config.accountId}.r2.cloudflarestorage.com`;
}

const sha256 = (data: string | Uint8Array) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key: crypto.BinaryLike, data: string) => crypto.createHmac('sha256', key).update(data).digest();

/** S3 URI-encodes each path segment, keeping the slashes. */
function encodeKey(key: string): string {
  return key
    .split('/')
    .map(part => encodeURIComponent(part).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('/');
}

/** The headers that sign one request (SigV4, service s3, region auto). */
export function signRequest(input: {
  config: R2Config;
  method: string;
  key: string;
  headers: Record<string, string>;
  body: Uint8Array | string;
  now?: Date;
}): { url: string; headers: Record<string, string> } {
  const { config, method, key, body } = input;
  const host = r2Host(config);
  const path = `/${config.bucket}/${encodeKey(key)}`;
  const amzDate = (input.now ?? new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256(body);

  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(input.headers).map(([k, v]) => [k.toLowerCase(), v.trim()])),
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const names = Object.keys(headers).sort();
  const canonical = [
    method,
    path,
    '',
    names.map(n => `${n}:${headers[n]}\n`).join(''),
    names.join(';'),
    payloadHash,
  ].join('\n');
  const scope = `${day}/auto/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, day), 'auto'), 's3'), 'aws4_request');
  const signature = crypto.createHmac('sha256', signingKey).update(toSign).digest('hex');

  const { host: _host, ...sent } = headers;
  void _host;
  return {
    url: `https://${host}${path}`,
    headers: {
      ...sent,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`,
    },
  };
}

export type PutResult = 'created' | 'exists' | 'failed';

/**
 * Stores one object, refusing to overwrite (If-None-Match: *), so a replayed
 * or forged request can never replace a chunk that is already there.
 */
export async function putObject(
  config: R2Config,
  key: string,
  body: Uint8Array,
  contentType: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PutResult> {
  const { url, headers } = signRequest({
    config,
    method: 'PUT',
    key,
    body,
    headers: { 'content-type': contentType, 'if-none-match': '*' },
  });
  try {
    const res = await fetchImpl(url, { method: 'PUT', headers, body: body as BodyInit });
    if (res.ok) return 'created';
    if (res.status === 412) return 'exists';
    return 'failed';
  } catch {
    return 'failed';
  }
}

export type HeadResult = 'exists' | 'missing' | 'failed';

/** HEAD one object (a Class B operation, the cheap kind). Used by the daily
 * budget (lib/server/recording-budget.ts) to find the next free lease. */
export async function headObject(config: R2Config, key: string, fetchImpl: typeof fetch = fetch): Promise<HeadResult> {
  const { url, headers } = signRequest({ config, method: 'HEAD', key, body: '', headers: {} });
  try {
    const res = await fetchImpl(url, { method: 'HEAD', headers });
    if (res.ok) return 'exists';
    if (res.status === 404) return 'missing';
    return 'failed';
  } catch {
    return 'failed';
  }
}
