import { Palette } from "./Palette";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            L
          </span>
          <div>
            <p className="eyebrow">Lumin workspace</p>
            <h1>Intent launcher</h1>
          </div>
        </div>
        <p className="lede">
          Type what you mean. Results re-rank by intent, not alias match.
        </p>
      </header>
      <Palette />
    </div>
  );
}
