import { NextResponse } from "next/server";

/** CORS for the mobile API. A shared password + bearer token is used, so a
 * permissive origin is acceptable for this self-hosted app. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsResponse(data: unknown, init: ResponseInit = {}): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...init.headers },
  });
}

export function ok(data: unknown) {
  return corsResponse(data, { status: 200 });
}

export function created(data: unknown) {
  return corsResponse(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function badRequest(message: string) {
  return corsResponse({ error: message }, { status: 400 });
}

export function unauthorized() {
  return corsResponse({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return corsResponse({ error: "Not found" }, { status: 404 });
}

export function methodNotAllowed() {
  return corsResponse({ error: "Method not allowed" }, { status: 405 });
}

/** Handle OPTIONS preflight requests for the mobile API. */
export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}