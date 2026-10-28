import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuditTrail } from "./pages/AuditTrail";
import { Countersign } from "./pages/Countersign";
import { EnvelopeList } from "./pages/EnvelopeList";
import { FarolScenarios } from "./pages/FarolScenarios";
import { ReviewSign } from "./pages/ReviewSign";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <EnvelopeList /> },
      { path: "envelopes/:id", element: <ReviewSign /> },
      { path: "envelopes/:id/countersign", element: <Countersign /> },
      { path: "envelopes/:id/audit", element: <AuditTrail /> },
      { path: "farol", element: <FarolScenarios /> },
    ],
  },
]);
