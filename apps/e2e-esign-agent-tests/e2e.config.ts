import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";
import { scriptedSigner } from "./e2e/scripted-executor";

const live =
  process.env.E2E_LIVE_AGENT === "1" &&
  Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY);

async function liveModel() {
  const spec = "ai";
  const mod = (await Function(`return import(${JSON.stringify(spec)})`)()) as {
    gateway: (id: string) => unknown;
  };
  return mod.gateway(process.env.E2E_MODEL ?? "openai/gpt-6-luna-fast");
}

const liveAgent = live
  ? {
      default: {
        model: (await liveModel()) as never,
        system:
          "You are testing a fake Lumin Sign fixture. Use visible button names. Never leave the fixture origin.",
      },
    }
  : {
      default: { executor: scriptedSigner },
    };

export default {
  projectId: "e2e-esign-agent-tests",
  timeout: 90_000,
  retries: 0,
  workers: 1,
  tests: ["tests/**/*.e2e.ts"],
  cache: {
    mode:
      process.env.E2E_CACHE_MODE === "read-only"
        ? "read-only"
        : process.env.E2E_CACHE_MODE === "off"
          ? "off"
          : "read-write",
    dir: "fixtures/e2e-cache",
  },
  agents: liveAgent,
  targets: [
    {
      name: "web",
      engine: web({ browser: "chromium" }),
      app: {
        url: process.env.APP_URL ?? "http://127.0.0.1:5173",
        identity: "lumin-sign-fixture",
        command: {
          executable: "bun",
          args: ["run", "dev"],
          reuseExisting: true,
          log: ".e2e/logs/app.log",
          env: { E2E_TELEMETRY_DISABLED: "1" },
        },
      },
    },
  ],
} satisfies E2EConfig;
