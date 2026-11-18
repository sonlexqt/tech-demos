export type Bindings = {
  BOX_CLIENT_ID?: string;
  BOX_CLIENT_SECRET?: string;
  BOX_REDIRECT_URI?: string;
};

export function bindingsFromProcess(): Bindings {
  return {
    BOX_CLIENT_ID: process.env.BOX_CLIENT_ID || undefined,
    BOX_CLIENT_SECRET: process.env.BOX_CLIENT_SECRET || undefined,
    BOX_REDIRECT_URI: process.env.BOX_REDIRECT_URI || undefined,
  };
}

export function isLiveConfigured(env: Bindings | undefined): boolean {
  return Boolean(env?.BOX_CLIENT_ID && env?.BOX_CLIENT_SECRET);
}

export function redirectUri(env: Bindings | undefined, origin: string): string {
  return env?.BOX_REDIRECT_URI || `${origin}/api/auth/callback`;
}
