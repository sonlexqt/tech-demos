import { NavLink, Outlet, useParams } from "react-router-dom";

export function AppShell() {
  const { id } = useParams();

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="seal" aria-hidden="true" />
          <div>
            <p className="eyebrow">Local fixture · no production APIs</p>
            <h1>Lumin Sign Lab</h1>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Envelopes
          </NavLink>
          {id ? (
            <>
              <NavLink to={`/envelopes/${id}`} end>
                Review &amp; sign
              </NavLink>
              <NavLink to={`/envelopes/${id}/countersign`}>Countersign</NavLink>
              <NavLink to={`/envelopes/${id}/audit`}>Audit trail</NavLink>
            </>
          ) : (
            <span className="nav-hint">Open an envelope to sign or countersign</span>
          )}
          <NavLink to="/farol">Farol scenarios</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
