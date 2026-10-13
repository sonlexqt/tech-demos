import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("home shows the fixture envelope", async ({ app, screen }) => {
  await app.open("/");

  await expect(screen.getByRole("heading", "Two-signer desk")).toBeVisible();
  await expect(screen.getByRole("heading", "Acme × Harbor MSA")).toBeVisible();
  await expect(screen.getByRole("status")).toHaveText("Draft");
  await expect(screen.getByRole("button", "Open envelope")).toBeVisible();
});

test("prepare places a field and sends the envelope", async ({ app, screen }) => {
  await app.open("/");
  await screen.getByRole("button", "Open envelope").click();

  await expect(screen.getByRole("heading", "Fields")).toBeVisible();
  await screen.getByRole("button", "Add signature field").click();
  await expect(screen.getByTestId("signature-field")).toBeVisible();

  await screen.getByRole("button", "Send for signing").click();
  await expect(screen.getByRole("status")).toHaveText("Awaiting first signature");
  await expect(screen.getByRole("heading", "Sign as Ada Lovelace")).toBeVisible();
});

test("two signers reach Completed on the stable UI", async ({ app, screen }) => {
  await app.open("/");
  await screen.getByRole("button", "Open envelope").click();
  await screen.getByRole("button", "Add signature field").click();
  await screen.getByRole("button", "Send for signing").click();

  await screen.getByLabel("Type your signature").fill("Ada Lovelace");
  await screen.getByRole("button", "Finish").click();
  await expect(screen.getByRole("status")).toHaveText("Awaiting countersignature");

  await screen.getByRole("button", "Countersign as Bob Signer").click();
  await screen.getByLabel("Type your signature").fill("Bob Signer");
  await screen.getByRole("button", "Finish").click();
  await expect(screen.getByRole("status")).toHaveText("Completed");
});
