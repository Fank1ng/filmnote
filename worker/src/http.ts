import type { Env } from './worker-types';

const DEFAULT_ALLOWED_ORIGINS = [
  'null',
  'https://fank1ng.github.io',
  'https://filmnote.lccf1223.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
];

const MAX_JSON_BYTES = 256 * 1024;

export function getAllowedOrigins(env: Env): string[] {
  const configured = env && env.ALLOWED_ORIGINS;
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;
  return configured.split(',').map(origin => origin.trim()).filter(Boolean);
}

export function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(
  data: unknown,
  request: Request,
  env: Env,
  status = 200,
  extraHeaders: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...corsHeaders(request, env),
    },
  });
}

export function errorResponse(
  message: string,
  request: Request,
  env: Env,
  status = 400,
  extra: Record<string, unknown> = {},
): Response {
  return jsonResponse({ error: message, ...extra }, request, env, status);
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request, maxBytes = MAX_JSON_BYTES): Promise<T> {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len && len > maxBytes) throw new Error('Request body too large');
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('Request body too large');
  return JSON.parse(text) as T;
}
