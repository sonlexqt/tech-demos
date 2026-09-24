import type { JevElement, PortalState } from "../types";
import { listElements } from "./elements";
import { applyClick } from "./execute";
import { STEP_LABELS, STEP_ORDER } from "./state";

type Props = {
  state: PortalState;
  highlightIndex: number | null;
  locked: boolean;
  onChange: (next: PortalState) => void;
};

function Badge({ index, hot }: { index: number; hot: boolean }) {
  return <span className={`num${hot ? " hot" : ""}`}>{index}</span>;
}

export function EsignPortal({ state, highlightIndex, locked, onChange }: Props) {
  const elements = listElements(state);
  const byId = Object.fromEntries(elements.map((el) => [el.id, el]));
  const hot = (id: string) => byId[id]?.index === highlightIndex;

  const setField = (id: keyof PortalState, value: string) => {
    onChange({ ...state, [id]: value });
  };

  const click = (id: string) => {
    const el = byId[id];
    if (!el || locked) return;
    onChange(applyClick(state, el).state);
  };

  return (
    <section className="portal">
      <nav className="steps" aria-label="Request steps">
        {STEP_ORDER.map((step) => {
          const current = STEP_ORDER.indexOf(state.step);
          const idx = STEP_ORDER.indexOf(step);
          const cls = step === state.step ? "active" : idx < current ? "done" : "";
          return (
            <span key={step} className={`step-pill ${cls}`}>
              {STEP_LABELS[step]}
            </span>
          );
        })}
      </nav>

      <div className="card">
        {state.step === "request" && (
          <RequestStep
            state={state}
            byId={byId}
            hot={hot}
            locked={locked}
            setField={setField}
            click={click}
          />
        )}
        {state.step === "signers" && (
          <SignersStep
            state={state}
            byId={byId}
            hot={hot}
            locked={locked}
            setField={setField}
            click={click}
          />
        )}
        {state.step === "fields" && (
          <FieldsStep state={state} byId={byId} hot={hot} click={click} />
        )}
        {state.step === "review" && <ReviewStep state={state} byId={byId} hot={hot} click={click} />}
        {state.step === "sent" && <SentStep state={state} byId={byId} hot={hot} click={click} />}
      </div>
    </section>
  );
}

function RequestStep({
  state,
  byId,
  hot,
  locked,
  setField,
  click,
}: {
  state: PortalState;
  byId: Record<string, JevElement>;
  hot: (id: string) => boolean;
  locked: boolean;
  setField: (id: keyof PortalState, value: string) => void;
  click: (id: string) => void;
}) {
  return (
    <>
      <h2>Start a signature request</h2>
      <p className="lede">Name the packet, write a note, then choose how signers move through it.</p>
      <div className={`field${hot("title") ? " hot" : ""}`}>
        <label htmlFor="title">Document title</label>
        <Badge index={byId.title.index} hot={hot("title")} />
        <input
          id="title"
          value={state.title}
          disabled={locked}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Q3 Vendor Agreement"
        />
      </div>
      <div className={`field${hot("message") ? " hot" : ""}`}>
        <label htmlFor="message">Message to signers</label>
        <Badge index={byId.message.index} hot={hot("message")} />
        <textarea
          id="message"
          value={state.message}
          disabled={locked}
          onChange={(e) => setField("message", e.target.value)}
          placeholder="Please review and sign by Friday."
        />
      </div>
      <div className={`field${hot("signing-order") ? " hot" : ""}`}>
        <label htmlFor="signing-order">Signing order</label>
        <Badge index={byId["signing-order"].index} hot={hot("signing-order")} />
        <select
          id="signing-order"
          value={state.signingOrder}
          disabled={locked}
          onChange={(e) => setField("signingOrder", e.target.value)}
        >
          <option value="sequential">Sequential — one after another</option>
          <option value="parallel">Parallel — all at once</option>
        </select>
      </div>
      <div className="actions">
        <button
          className={`jev-btn primary${hot("continue-signers") ? " hot" : ""}`}
          type="button"
          onClick={() => click("continue-signers")}
        >
          <Badge index={byId["continue-signers"].index} hot={hot("continue-signers")} />
          Continue to signers
        </button>
      </div>
    </>
  );
}

function SignersStep({
  state,
  byId,
  hot,
  locked,
  setField,
  click,
}: {
  state: PortalState;
  byId: Record<string, JevElement>;
  hot: (id: string) => boolean;
  locked: boolean;
  setField: (id: keyof PortalState, value: string) => void;
  click: (id: string) => void;
}) {
  return (
    <>
      <h2>Add signers</h2>
      <p className="lede">Each recipient gets a numbered control the agent can type into or click.</p>
      {state.signers.length > 0 && (
        <div className="signers">
          {state.signers.map((s) => (
            <span key={s.id} className="chip">
              {s.name} · {s.email} · {s.role}
            </span>
          ))}
        </div>
      )}
      {state.awaitingPreview && (
        <p className="lede">Document preview is warming — a WAIT is the honest next move.</p>
      )}
      <div className={`field${hot("draft-name") ? " hot" : ""}`}>
        <label htmlFor="draft-name">Signer name</label>
        <Badge index={byId["draft-name"].index} hot={hot("draft-name")} />
        <input
          id="draft-name"
          value={state.draftName}
          disabled={locked}
          onChange={(e) => setField("draftName", e.target.value)}
          placeholder="Alex Rivera"
        />
      </div>
      <div className={`field${hot("draft-email") ? " hot" : ""}`}>
        <label htmlFor="draft-email">Signer email</label>
        <Badge index={byId["draft-email"].index} hot={hot("draft-email")} />
        <input
          id="draft-email"
          value={state.draftEmail}
          disabled={locked}
          onChange={(e) => setField("draftEmail", e.target.value)}
          placeholder="alex@acme.example"
        />
      </div>
      <div className={`field${hot("draft-role") ? " hot" : ""}`}>
        <label htmlFor="draft-role">Role</label>
        <Badge index={byId["draft-role"].index} hot={hot("draft-role")} />
        <select
          id="draft-role"
          value={state.draftRole}
          disabled={locked}
          onChange={(e) => setField("draftRole", e.target.value)}
        >
          <option value="signer">Needs to sign</option>
          <option value="cc">Receives a copy</option>
        </select>
      </div>
      <div className="actions">
        <button
          className={`jev-btn${hot("add-signer") ? " hot" : ""}`}
          type="button"
          disabled={byId["add-signer"].disabled}
          onClick={() => click("add-signer")}
        >
          <Badge index={byId["add-signer"].index} hot={hot("add-signer")} />
          Add signer
        </button>
        <button
          className={`jev-btn${hot("back-request") ? " hot" : ""}`}
          type="button"
          onClick={() => click("back-request")}
        >
          <Badge index={byId["back-request"].index} hot={hot("back-request")} />
          Back to request
        </button>
        <button
          className={`jev-btn primary${hot("continue-fields") ? " hot" : ""}`}
          type="button"
          disabled={byId["continue-fields"].disabled}
          onClick={() => click("continue-fields")}
        >
          <Badge index={byId["continue-fields"].index} hot={hot("continue-fields")} />
          Continue to fields
        </button>
      </div>
    </>
  );
}

function FieldsStep({
  state,
  byId,
  hot,
  click,
}: {
  state: PortalState;
  byId: Record<string, JevElement>;
  hot: (id: string) => boolean;
  click: (id: string) => void;
}) {
  const has = (kind: string) => state.fields.some((f) => f.kind === kind);
  return (
    <>
      <h2>Place fields</h2>
      <p className="lede">Drop zones are numbered buttons — the model picks an index, not a coordinate.</p>
      <div className="doc">
        <h3>{state.title || "Untitled packet"}</h3>
        <p>
          {state.signers[0]
            ? `Prepared for ${state.signers[0].name}.`
            : "Add a signer before sending."}{" "}
          {state.message}
        </p>
        <button
          type="button"
          className={`zone${has("signature") ? " filled" : ""}${hot("place-signature") ? " hot" : ""}`}
          onClick={() => click("place-signature")}
        >
          <Badge index={byId["place-signature"].index} hot={hot("place-signature")} />
          {has("signature") ? "Signature field placed" : "Place signature field"}
        </button>
        <button
          type="button"
          className={`zone${has("date") ? " filled" : ""}${hot("place-date") ? " hot" : ""}`}
          onClick={() => click("place-date")}
        >
          <Badge index={byId["place-date"].index} hot={hot("place-date")} />
          {has("date") ? "Date field placed" : "Place date field"}
        </button>
        <button
          type="button"
          className={`zone${has("initials") ? " filled" : ""}${hot("place-initials") ? " hot" : ""}`}
          onClick={() => click("place-initials")}
        >
          <Badge index={byId["place-initials"].index} hot={hot("place-initials")} />
          {has("initials") ? "Initials field placed" : "Place initials field"}
        </button>
      </div>
      <div className="actions">
        <button
          className={`jev-btn${hot("back-signers") ? " hot" : ""}`}
          type="button"
          onClick={() => click("back-signers")}
        >
          <Badge index={byId["back-signers"].index} hot={hot("back-signers")} />
          Back to signers
        </button>
        <button
          className={`jev-btn primary${hot("continue-review") ? " hot" : ""}`}
          type="button"
          disabled={byId["continue-review"].disabled}
          onClick={() => click("continue-review")}
        >
          <Badge index={byId["continue-review"].index} hot={hot("continue-review")} />
          Continue to review
        </button>
      </div>
    </>
  );
}

function ReviewStep({
  state,
  byId,
  hot,
  click,
}: {
  state: PortalState;
  byId: Record<string, JevElement>;
  hot: (id: string) => boolean;
  click: (id: string) => void;
}) {
  return (
    <>
      <h2>Review & send</h2>
      <p className="lede">If every required control is filled, the next honest operation is CLICK Send — then DONE.</p>
      <div className="review-grid">
        <div>
          <dt>Document</dt>
          <dd>{state.title}</dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{state.message}</dd>
        </div>
        <div>
          <dt>Order</dt>
          <dd>{state.signingOrder}</dd>
        </div>
        <div>
          <dt>Signers</dt>
          <dd>{state.signers.map((s) => `${s.name} <${s.email}> (${s.role})`).join(" · ")}</dd>
        </div>
        <div>
          <dt>Fields</dt>
          <dd>{state.fields.map((f) => f.kind).join(", ")}</dd>
        </div>
      </div>
      <div className="actions">
        <button
          className={`jev-btn${hot("back-fields") ? " hot" : ""}`}
          type="button"
          onClick={() => click("back-fields")}
        >
          <Badge index={byId["back-fields"].index} hot={hot("back-fields")} />
          Back to fields
        </button>
        <button
          className={`jev-btn primary${hot("send-request") ? " hot" : ""}`}
          type="button"
          onClick={() => click("send-request")}
        >
          <Badge index={byId["send-request"].index} hot={hot("send-request")} />
          Send signature request
        </button>
      </div>
    </>
  );
}

function SentStep({
  state,
  byId,
  hot,
  click,
}: {
  state: PortalState;
  byId: Record<string, JevElement>;
  hot: (id: string) => boolean;
  click: (id: string) => void;
}) {
  return (
    <div className="sent">
      <div className="seal">✓</div>
      <h2>Request sent</h2>
      <p className="lede">
        {state.title} is on its way to {state.signers.map((s) => s.email).join(", ") || "no one"}.
        The inspector should now choose DONE.
      </p>
      <p className="lede">{state.sentAt}</p>
      <div className="actions" style={{ justifyContent: "center" }}>
        <button
          className={`jev-btn${hot("start-another") ? " hot" : ""}`}
          type="button"
          onClick={() => click("start-another")}
        >
          <Badge index={byId["start-another"].index} hot={hot("start-another")} />
          Start another request
        </button>
      </div>
    </div>
  );
}
