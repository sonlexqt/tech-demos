import { createApp } from "../src/server/app";
import type { Bindings } from "../src/server/env";

const app = createApp();

const apiPrefixes = ["/oauth2", "/files", "/folders", "/users", "/api", "/open-with", "/2.0"];

function isApi(pathname: string): boolean {
  return apiPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const onRequest = async (context: {
  request: Request;
  env: Bindings;
  next: () => Promise<Response>;
}): Promise<Response> => {
  const url = new URL(context.request.url);
  if (isApi(url.pathname) || context.request.method === "OPTIONS") {
    return app.fetch(context.request, context.env);
  }
  if (url.pathname === "/open-with") {
    return app.fetch(context.request, context.env);
  }
  return context.next();
};
