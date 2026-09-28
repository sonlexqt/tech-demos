export function isStaleEpoch(received: number, latest: number): boolean {
  return received < latest;
}
