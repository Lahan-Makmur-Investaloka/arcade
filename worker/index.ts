/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleSso } from "../lib/sso/server";
import type { SsoConfig } from "../lib/sso/client";
import { isProtectedArcadePath, normalizedPath } from "../lib/sso-route-guard";

interface Env extends SsoConfig {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const authResponse = await handleSso(request, env);
    if (authResponse) return authResponse;

    // Make the platform-managed D1 binding available to server route modules
    // without importing the Cloudflare-only `cloudflare:` URL in Node-based
    // artifact validation.
    (globalThis as typeof globalThis & { __TEKAD_DB__?: D1Database }).__TEKAD_DB__ = env.DB;
    const url = new URL(request.url);
    const pathname = normalizedPath(url.pathname) ?? url.pathname;

    // Serve the self-contained narrative game and its assets on this Site.
    if (pathname === "/chronicles") {
      return new Response(null, { status: 308, headers: { Location: new URL('/chronicles/', url).href, 'Cache-Control': 'no-store' } });
    }
    if (pathname.startsWith("/chronicles/")) {
      const asset = await env.ASSETS.fetch(request);
      const response = new Response(asset.body, asset);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.append('Vary', 'Cookie');
      return response;
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // With run_worker_first enabled, explicitly return static assets after auth.
    if (['GET', 'HEAD'].includes(request.method) && pathname !== '/' && pathname !== '/login' && !pathname.startsWith('/api/')) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        if (!isProtectedArcadePath(pathname)) return asset;
        const response = new Response(asset.body, asset);
        response.headers.set('Cache-Control', 'no-store');
        response.headers.append('Vary', 'Cookie');
        return response;
      }
    }

    const response = await handler.fetch(request, env, ctx);
    if (isProtectedArcadePath(url.pathname) || url.pathname === '/login' || url.pathname.startsWith('/api/')) {
      const privateResponse = new Response(response.body, response);
      privateResponse.headers.set('Cache-Control', 'no-store');
      privateResponse.headers.append('Vary', 'Cookie');
      return privateResponse;
    }
    return response;
  },
};

export default worker;
