import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("replay detects UI drift and re-plans; hard assert catches the Completed bug", async ({
  app,
  agent,
  screen,
}) => {
  await app.open("/#drift");

  const prepared = await agent.act(
    "open the envelope and place a signature field on the document",
  );
  await expect(screen.getByRole("button", "Apply signature")).toBeVisible();
  await expect(screen.getByRole("status")).toHaveText("Awaiting first signature");
  expect(["missed", "agent-concluded"]).toContain(prepared.cache?.mode);

  await agent.act("sign the document as {name}", {
    params: { name: "Ada Lovelace" },
  });
  await expect(screen.getByRole("status")).toHaveText("Awaiting countersignature");

  await agent.act("countersign the document as {name}", {
    params: { name: "Bob Signer" },
  });

  // Injected bug: drift variant never promotes the envelope to Completed.
  await expect(screen.getByRole("status")).toHaveText("Awaiting countersignature");
  await expect(screen.getByRole("status")).not.toHaveText("Completed");
});
