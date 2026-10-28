import { useCallback, useEffect, useState } from "react";
import { listEnvelopes, resetDemo } from "../api/client";
import type { EnvelopeSummary } from "../types";

export function useEnvelopes() {
  const [envelopes, setEnvelopes] = useState<EnvelopeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEnvelopes(await listEnvelopes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load envelopes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reset = useCallback(async () => {
    await resetDemo();
    await reload();
  }, [reload]);

  return { envelopes, error, loading, reload, reset };
}
