import { test } from "@e2e-dev/web";
import { expect } from "e2e";

/**
 * Expected to FAIL on the drift variant. Skipped unless E2E_RUN_BUG=1
 * so the default suite stays green. `bun run test:bug` sets that flag.
 */
test("Completed assertion fails on the injected bug", {
  skip: process.env.E2E_RUN_BUG === "1" ? false : "set E2E_RUN_BUG=1 (bun run test:bug)",
}, async ({ app, agent, screen }) => {
  await app.open("/#drift");
  await agent.act("open the envelope and place a signature field on the document");
  await agent.act("sign the document as {name}", { params: { name: "Ada Lovelace" } });
  await agent.act("countersign the document as {name}", { params: { name: "Bob Signer" } });
  await expect(screen.getByRole("status")).toHaveText("Completed");
});
