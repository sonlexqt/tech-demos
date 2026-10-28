import { useCallback, useEffect, useState } from "react";
import { getEnvelope } from "../api/client";
import type { Envelope } from "../types";

export function useEnvelope(id: string | undefined) {
  const [envelope, setEnvelope] = useState<Envelope | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) {
      setEnvelope(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEnvelope(await getEnvelope(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load envelope");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { envelope, error, loading, reload, setEnvelope };
}
