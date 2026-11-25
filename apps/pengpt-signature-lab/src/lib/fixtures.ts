import { parseStrokeFile } from "./strokes";
import type { FixtureManifest, StrokeFile, Volunteer } from "./types";

export async function loadManifest(): Promise<FixtureManifest> {
  const res = await fetch("/fixtures/manifest.json");
  if (!res.ok) throw new Error("Missing /fixtures/manifest.json");
  return (await res.json()) as FixtureManifest;
}

export async function loadStroke(id: string): Promise<StrokeFile> {
  const res = await fetch(`/fixtures/${id}.json`);
  if (!res.ok) throw new Error(`Missing fixture ${id}`);
  return parseStrokeFile(await res.text());
}

export async function loadPair(
  volunteer: Volunteer,
): Promise<{ real: StrokeFile; generated: StrokeFile }> {
  const [real, generated] = await Promise.all([
    loadStroke(volunteer.realId),
    loadStroke(volunteer.generatedId),
  ]);
  return { real, generated };
}

export async function loadAllLabeled(
  manifest: FixtureManifest,
): Promise<StrokeFile[]> {
  const files: StrokeFile[] = [];
  for (const v of manifest.volunteers) {
    files.push(await loadStroke(v.realId), await loadStroke(v.generatedId));
  }
  return files;
}
