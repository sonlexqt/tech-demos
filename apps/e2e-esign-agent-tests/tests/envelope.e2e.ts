import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const wantReplay = process.env.E2E_EXPECT_REPLAY === "1";
const drift = process.env.E2E_VARIANT === "drift";

test("agent steps complete a two-signer envelope", async ({ app, agent, screen }) => {
  await app.open(drift ? "/#drift" : "/");

  const prepared = await agent.act(
    "open the envelope and place a signature field on the document",
  );
  await expect(screen.getByRole("status")).toHaveText("Awaiting first signature");
  expect(prepared.modelCalls).toBe(0);
  if (drift) {
    expect(["missed", "agent-concluded"]).toContain(prepared.cache?.mode);
    await expect(screen.getByRole("button", "Apply signature")).toBeVisible();
  } else if (wantReplay) {
    expect(prepared.cache?.mode).toBe("self-finalized");
  }

  const signed = await agent.act("sign the document as {name}", {
    params: { name: "Ada Lovelace" },
  });
  await expect(screen.getByRole("status")).toHaveText("Awaiting countersignature");
  expect(signed.modelCalls).toBe(0);
  if (!drift && wantReplay) {
    expect(signed.cache?.mode).toBe("self-finalized");
  }

  const countersigned = await agent.act("countersign the document as {name}", {
    params: { name: "Bob Signer" },
  });
  expect(countersigned.modelCalls).toBe(0);
  if (drift) {
    // Injected bug on the drifted UI: both names are in, status never Completes.
    await expect(screen.getByRole("status")).toHaveText("Awaiting countersignature");
    await expect(screen.getByRole("status")).not.toHaveText("Completed");
  } else {
    await expect(screen.getByRole("status")).toHaveText("Completed");
    if (wantReplay) {
      expect(countersigned.cache?.mode).toBe("self-finalized");
    }
  }
});
