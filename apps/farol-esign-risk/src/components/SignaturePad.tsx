import { useState, type FormEvent } from "react";

type Props = {
  defaultName: string;
  disabled: boolean;
  busy: boolean;
  actionLabel: string;
  onApply: (name: string) => Promise<void>;
};

export function SignaturePad({ defaultName, disabled, busy, actionLabel, onApply }: Props) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onApply(name.trim() || defaultName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply signature");
    }
  }

  return (
    <form className="pad" onSubmit={handleSubmit}>
      <label>
        Typed signature
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={disabled || busy}
          autoComplete="name"
        />
      </label>
      <div className="signature-preview" aria-hidden="true">
        {name.trim() || "Your name"}
      </div>
      <button type="submit" disabled={disabled || busy}>
        {busy ? "Applying…" : actionLabel}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
