#!/usr/bin/env python3
"""Generate the Lumin Sign mixed-corpus fixtures (own data only)."""

from __future__ import annotations

import textwrap
from pathlib import Path

from write_pdf import write_pdf

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "corpus"


def wrap(text: str, width: int = 96) -> list[str]:
    out: list[str] = []
    for para in text.split("\n"):
        if not para.strip():
            out.append("")
            continue
        out.extend(textwrap.wrap(para, width=width) or [""])
    return out


def page(header: str, body: str, footer: str) -> list[str]:
    lines = [header, ""]
    lines.extend(wrap(body))
    # pad so footer sits near the bottom of a letter page (~66 lines at 10pt)
    while len(lines) < 62:
        lines.append("")
    lines.append(footer)
    return lines


def harbor_msa(version: str) -> list[list[str]]:
    """Harbor Robotics MSA. v1 vs v2 differ in term, cap, notice, auto-renewal."""
    v2 = version == "v2"
    initial_term = "twenty-four (24) months" if v2 else "twelve (12) months"
    notice = "ninety (90) days" if v2 else "thirty (30) days"
    cap = (
        "two hundred fifty thousand United States dollars (USD 250,000) or the fees paid or payable by Customer in the twelve (12) months immediately preceding the first claim, whichever is greater"
        if v2
        else "fifty thousand United States dollars (USD 50,000) or the fees paid or payable by Customer in the six (6) months immediately preceding the first claim, whichever is less"
    )
    renew = (
        "This Agreement auto-renews for successive twelve (12) month periods unless either Party gives written notice of non-renewal at least sixty (60) days before the then-current term ends."
        if v2
        else "This Agreement does not auto-renew. Any extension requires a signed amendment or a new Order Form."
    )
    doc_id = "LUM-MSA-HARBOR-2026-V2" if v2 else "LUM-MSA-HARBOR-2026-V1"
    rev = "Revision 2 — redline accepted 14 October 2026" if v2 else "Revision 1 — circulated 2 October 2026"
    pages: list[list[str]] = []

    pages.append(
        page(
            f"LUMIN SIGN  ·  MASTER SERVICES AGREEMENT  ·  {doc_id}",
            f"""MASTER SERVICES AGREEMENT
{rev}
Envelope: ENV-MSA-7F2C91   (Lumin Sign desk — Harbor Robotics countersign)

This Master Services Agreement (the "Agreement") is entered into as of 6 October 2026 (the "Effective Date"), by and between Lumin Sign, Inc., a Delaware corporation with its principal place of business at 548 Market Street, Suite 19024, San Francisco, California 94104 ("Provider" or "Lumin Sign"), and Harbor Robotics LLC, a Delaware limited liability company with its principal place of business at 88 Pier Avenue, Oakland, California 94607 ("Customer" or "Harbor"). Provider and Customer are each a "Party" and together the "Parties."

Recitals. Provider operates an electronic signature and document-workflow platform. Customer wishes to subscribe to the platform for procurement and legal operations, including sending this Agreement itself for ordered signature (counsel, then Harbor general counsel countersign).

The Parties. For the avoidance of doubt on envelope ENV-MSA-7F2C91 the contracting parties are Lumin Sign, Inc. (Provider) and Harbor Robotics LLC (Customer). Signers: Ada Chen, Counsel, Lumin Sign (group 1) and Roberto "Bob" Alvarez, General Counsel, Harbor Robotics (group 2, countersign).
""",
            f"{doc_id}  ·  page 1 of 6  ·  Confidential fixture — not an offer",
        )
    )

    pages.append(
        page(
            f"{doc_id}  ·  Article 1 Definitions · Article 2 Services",
            """Article 1 — Definitions
"Platform" means Provider's hosted document workflow and electronic signature software, including APIs.
"Customer Data" means documents, signature fields, audit events, and metadata submitted to the Platform by or on behalf of Customer.
"Envelope" means a signature request tracked by an envelope id such as ENV-MSA-7F2C91.
"Countersign" means the second (or later) signature in an ordered signing ceremony, applied after a prior signer has completed.

Article 2 — Services
Provider shall provide the Platform in a professional and workmanlike manner. Customer's SKUs, user band, and environments are set out on the Order Form attached as Exhibit A. Sandbox tenants are for testing only and do not carry production uptime credits.
""",
            f"{doc_id}  ·  page 2 of 6  ·  Confidential fixture — not an offer",
        )
    )

    pages.append(
        page(
            f"{doc_id}  ·  Article 3 Fees · Article 4 Term",
            f"""Article 3 — Fees and Payment
Fees are as set forth on the Order Form. Invoices are due net thirty (30) days. Late amounts accrue interest at one percent (1%) per month or the maximum permitted by law, whichever is less.

Article 4 — Term and Termination
4.1 Initial Term. The initial term of this Agreement is {initial_term} beginning on the Effective Date.
4.2 Renewal. {renew}
4.3 Termination for Convenience. After the Initial Term, either Party may terminate for convenience by giving the other Party {notice} prior written notice.
4.4 Termination for Cause. Either Party may terminate if the other Party materially breaches and fails to cure within thirty (30) days after written notice.

VERSION MARKER: Harbor MSA {version}. Term and notice values on this page are the ones an agent should quote when asked what changed between v1 and v2.
""",
            f"{doc_id}  ·  page 3 of 6  ·  Confidential fixture — not an offer",
        )
    )

    pages.append(
        page(
            f"{doc_id}  ·  Article 5 IP · Article 6 Confidentiality",
            """Article 5 — Intellectual Property
Provider retains all right, title, and interest in the Platform. Customer retains all right, title, and interest in Customer Data. Custom Deliverables identified in a Statement of Work are owned by Customer upon payment.

Article 6 — Confidentiality
Each Party shall protect the other Party's Confidential Information with at least the same care it uses for its own, and no less than reasonable care, for five (5) years after disclosure. Trade secrets are protected for so long as they remain trade secrets. Envelope contents, signer emails, and audit hashes are Confidential Information.
""",
            f"{doc_id}  ·  page 4 of 6  ·  Confidential fixture — not an offer",
        )
    )

    pages.append(
        page(
            f"{doc_id}  ·  Article 7 Data · Article 8 Liability",
            f"""Article 7 — Data Protection
Provider shall process Personal Data only as described in the Data Processing Addendum. Subprocessor changes require thirty (30) days' notice.

Article 8 — Limitation of Liability
8.1 Disclaimer of Consequential Damages. Neither Party is liable for indirect, incidental, special, consequential, or punitive damages, or lost profits, even if advised of the possibility.
8.2 Cap on Damages. EXCEPT FOR THE CARVE-OUTS IN SECTION 8.3, EACH PARTY'S AGGREGATE LIABILITY ARISING OUT OF THIS AGREEMENT SHALL NOT EXCEED {cap}.
8.3 Carve-outs. The cap does not apply to a Party's indemnification obligations for third-party IP claims, breach of confidentiality, fraud, or liability that cannot be limited under law.

VERSION MARKER: Harbor MSA {version} liability cap is stated in Section 8.2 on this page. Do not confuse this cap with the Lumin Sign x Acme Holdings long-form MSA (Agreement ID LUM-MSA-2026-1041), whose Article 10.2.1 uses a twelve-month fees formula with no dollar floor.
""",
            f"{doc_id}  ·  page 5 of 6  ·  Confidential fixture — not an offer",
        )
    )

    pages.append(
        page(
            f"{doc_id}  ·  Article 9 Law · Signature block (not the countersign certificate)",
            """Article 9 — Governing Law
This Agreement is governed by the laws of the State of Delaware, without regard to conflict-of-law rules. Exclusive venue is the state or federal courts in Wilmington, Delaware.

Article 10 — Miscellaneous
This Agreement, together with the Order Form and Exhibits, is the entire agreement. Amendments must be in writing and signed by both Parties. Electronic signatures on the Platform are original signatures.

IN WITNESS WHEREOF the Parties have caused this Agreement to be executed by their duly authorized representatives. The live countersign ceremony is recorded on the separate certificate of completion for envelope ENV-MSA-7F2C91 (file ENV-MSA-7F2C91-countersign.pdf). This signature block is the contract text only; the countersign block with field id sig-countersign-gc lives on that certificate, page 3.
""",
            f"{doc_id}  ·  page 6 of 6  ·  Confidential fixture — not an offer",
        )
    )
    return pages


def countersign_pdf() -> list[list[str]]:
    pages: list[list[str]] = []
    pages.append(
        page(
            "LUMIN SIGN  ·  CERTIFICATE OF COMPLETION  ·  ENV-MSA-7F2C91",
            """Certificate of Completion
Envelope id: ENV-MSA-7F2C91
Document: Harbor Robotics — Master Services Agreement (FY26)  ·  LUM-MSA-HARBOR-2026-V2
Status: Awaiting countersignature (as of capture 14 October 2026 18:42 UTC)
Signing type: ORDER
Expires at: 2026-11-15T23:59:59Z

Parties on this envelope:
  Provider / sender: Lumin Sign, Inc.  ·  Ada Chen, Counsel  ·  ada.chen@lumin.example
  Customer / countersigner: Harbor Robotics LLC  ·  Bob Alvarez, GC  ·  bob.alvarez@harbor-robotics.example
  Viewer: Priya Raman, Deal Desk  ·  priya.raman@lumin.example

This certificate is a fixture. It is not a production Lumin Sign artifact.
""",
            "ENV-MSA-7F2C91  ·  certificate page 1 of 4  ·  fixture",
        )
    )
    pages.append(
        page(
            "ENV-MSA-7F2C91  ·  Signer order",
            """Signer order (ORDER)

Group 1 — completed
  Name: Ada Chen
  Role: Counsel, Lumin Sign, Inc.
  Email: ada.chen@lumin.example
  Signed at: 2026-10-14T17:05:11Z
  Field id: sig-sender-counsel
  IP: 198.51.100.14
  Authentication: email link + optional access code

Group 2 — pending countersign
  Name: Roberto Alvarez (Bob)
  Role: General Counsel, Harbor Robotics LLC
  Email: bob.alvarez@harbor-robotics.example
  Field id: sig-countersign-gc
  Status: waiting
  Last reminder: 2026-10-14T18:00:00Z  (delivered)

Viewers do not sign. Priya Raman can download the audit trail but cannot apply a signature.
""",
            "ENV-MSA-7F2C91  ·  certificate page 2 of 4  ·  fixture",
        )
    )
    pages.append(
        page(
            "ENV-MSA-7F2C91  ·  COUNTERSIGN BLOCK",
            """COUNTERSIGN BLOCK
Envelope ENV-MSA-7F2C91  ·  page 3 of the certificate of completion

This is the countersign block. Field id: sig-countersign-gc
Signer: Roberto Alvarez, General Counsel, Harbor Robotics LLC
Placement: page 3, lower-right, 220x64 points, required=true
Anchor tag: [[csig|req|signer2]]
Legal meaning: the second signature in an ordered ceremony. The MSA is not fully executed until this block is completed.

Do not confuse this block with:
  - the contract signature recital on MSA page 6 (that is contract text, not the live field)
  - envelope ENV-NDA-NORTHWIND (that envelope is a separate NDA; its reminder failed)
  - Ada Chen's completed sender signature (field id sig-sender-counsel)

Countersign instructions shown to Bob:
  Review Articles 4 and 8 of the v2 MSA (term, renewal, liability cap), then apply your signature in the countersign block. Applying the signature constitutes Harbor Robotics LLC's agreement to Revision 2.

Audit hash (pending): sha256:7f2c91c0unters1gn-pending-fixture
""",
            "ENV-MSA-7F2C91  ·  certificate page 3 of 4  ·  COUNTERSIGN BLOCK",
        )
    )
    pages.append(
        page(
            "ENV-MSA-7F2C91  ·  Audit excerpt",
            """Selected audit events (also duplicated, noisily, under corpus/ops/)

2026-10-14T16:55:02Z  envelope.created          ENV-MSA-7F2C91  actor=ada.chen@lumin.example
2026-10-14T16:55:40Z  document.attached         msa-harbor-v2.pdf
2026-10-14T16:56:12Z  field.placed              sig-countersign-gc page=3
2026-10-14T16:58:01Z  envelope.sent             via=email
2026-10-14T17:05:11Z  signer.completed          ada.chen@lumin.example
2026-10-14T17:05:12Z  envelope.status           Awaiting countersignature
2026-10-14T18:00:00Z  reminder.sent             bob.alvarez@harbor-robotics.example  result=delivered
2026-10-14T18:00:04Z  webhook.delivered         event=signer.reminded  dest=https://hooks.harbor.example/lumin

Expiry: 2026-11-15T23:59:59Z. If Bob has not countersigned by then, the envelope voids and Harbor must be re-sent a new envelope. This expiry is an envelope deadline, not the MSA Initial Term.
""",
            "ENV-MSA-7F2C91  ·  certificate page 4 of 4  ·  fixture",
        )
    )
    return pages


def write_notes() -> None:
    notes = CORPUS / "notes"
    notes.mkdir(parents=True, exist_ok=True)
    (notes / "env-msa-7f2c91.md").write_text(
        """# Envelope notes — ENV-MSA-7F2C91

Desk: Lumin Sign (fixture) · Owner: Priya Raman, Deal Desk
Document: Harbor Robotics MSA FY26 (Revision 2)
Status: **Awaiting countersignature**
Expires: **2026-11-15T23:59:59Z**

## Parties

- Lumin Sign, Inc. — Provider — Ada Chen (counsel) already signed
- Harbor Robotics LLC — Customer — Bob Alvarez (GC) must **countersign**

## Why this envelope exists

Harbor's procurement asked for a redline on term and liability. v1 used a twelve-month initial term, no auto-renewal, thirty-day convenience termination, and a USD 50,000 / six-month fees cap. v2 (attached as `contracts/msa-harbor-v2.pdf`) is twenty-four months, auto-renews, ninety-day convenience notice, and a USD 250,000 / twelve-month fees cap.

## Countersign

The live countersign block is **not** in the MSA body. It is on `contracts/ENV-MSA-7F2C91-countersign.pdf` page 3, field id `sig-countersign-gc`.

## Reminders

Harbor's reminder at 18:00 UTC **delivered**. Do not confuse with ENV-NDA-NORTHWIND, whose reminder **failed**.

## Open questions for legal

- Does Harbor still want Exhibit E subprocessors listed in the envelope email?
- Confirm Bob's access code was sent to the GC alias, not his personal Gmail.
""",
        encoding="utf-8",
    )
    (notes / "env-nda-northwind.md").write_text(
        """# Envelope notes — ENV-NDA-NORTHWIND

Desk: Lumin Sign (fixture) · Owner: Maya Chen, Partnerships
Document: Mutual NDA — Northwind Analytics
Status: **Stalled** — reminder failed
Expires: 2026-10-20T23:59:59Z

## Parties

- Lumin Sign, Inc.
- Northwind Analytics, Inc. (signer: Jordan Hale, jordan.hale@northwind.example)

## What went wrong

The 14 October 11:12 UTC reminder to Jordan Hale **failed**. SMTP upstream returned 550 mailbox unavailable. Webhook `reminder.failed` was posted to `https://hooks.lumin.example/sign` with delivery_id `wh_nda_550_failed`. Ops ticket SIGN-1888.

This is the envelope whose reminder failed. ENV-MSA-7F2C91 is unrelated and its Harbor reminder delivered.
""",
        encoding="utf-8",
    )
    (notes / "env-sow-contoso.md").write_text(
        """# Envelope notes — ENV-SOW-CONTOSO

Desk: Lumin Sign (fixture) · Owner: Priya Raman
Document: Statement of Work — Contoso Labs implementation
Status: Draft (not sent)
Expires: n/a

Parties will be Lumin Sign, Inc. and Contoso Labs, Inc. No countersign yet. No reminders have been scheduled. Do not use this envelope when answering questions about Harbor or Northwind.
""",
        encoding="utf-8",
    )


def write_ops() -> None:
    ops = CORPUS / "ops"
    ops.mkdir(parents=True, exist_ok=True)
    (ops / "audit-2026-10-14.txt").write_text(
        """# lumin-sign-audit  fixture capture 2026-10-14
# noisy on purpose — grep for "reminder" hits almost every envelope

2026-10-14T09:01:11Z INFO  audit envelope.viewed envelope_id=ENV-SOW-CONTOSO actor=priya.raman@lumin.example
2026-10-14T09:14:02Z INFO  audit reminder.scheduled envelope_id=ENV-SOW-CONTOSO cadence=none reason=draft_not_sent
2026-10-14T10:02:44Z INFO  audit envelope.created envelope_id=ENV-NDA-NORTHWIND actor=maya.chen@lumin.example
2026-10-14T10:03:10Z INFO  audit envelope.sent envelope_id=ENV-NDA-NORTHWIND to=jordan.hale@northwind.example
2026-10-14T11:12:07Z ERROR audit reminder.failed envelope_id=ENV-NDA-NORTHWIND to=jordan.hale@northwind.example smtp=550 mailbox unavailable provider=ses-us-west-2 ticket=SIGN-1888
2026-10-14T11:12:08Z INFO  audit reminder.retry_suppressed envelope_id=ENV-NDA-NORTHWIND reason=hard_bounce
2026-10-14T16:55:02Z INFO  audit envelope.created envelope_id=ENV-MSA-7F2C91 actor=ada.chen@lumin.example
2026-10-14T16:58:01Z INFO  audit envelope.sent envelope_id=ENV-MSA-7F2C91 to=bob.alvarez@harbor-robotics.example
2026-10-14T17:05:11Z INFO  audit signer.completed envelope_id=ENV-MSA-7F2C91 signer=ada.chen@lumin.example
2026-10-14T17:05:12Z INFO  audit envelope.status envelope_id=ENV-MSA-7F2C91 status=Awaiting_countersignature
2026-10-14T18:00:00Z INFO  audit reminder.sent envelope_id=ENV-MSA-7F2C91 to=bob.alvarez@harbor-robotics.example result=delivered
2026-10-14T18:22:19Z INFO  audit envelope.viewed envelope_id=ENV-MSA-7F2C91 actor=priya.raman@lumin.example
2026-10-14T19:01:00Z INFO  audit reminder.heartbeat worker=reminder-1 scanned=3 delivered=1 failed=1 skipped_draft=1
""",
        encoding="utf-8",
    )
    (ops / "webhooks-2026-10-14.jsonl").write_text(
        """{"ts":"2026-10-14T10:03:11Z","event":"envelope.sent","envelope_id":"ENV-NDA-NORTHWIND","dest":"https://hooks.lumin.example/sign","delivery_id":"wh_nda_sent","ok":true}
{"ts":"2026-10-14T11:12:09Z","event":"reminder.failed","envelope_id":"ENV-NDA-NORTHWIND","dest":"https://hooks.lumin.example/sign","delivery_id":"wh_nda_550_failed","ok":true,"payload":{"smtp":550,"reason":"mailbox unavailable","signer":"jordan.hale@northwind.example","ticket":"SIGN-1888"}}
{"ts":"2026-10-14T16:58:02Z","event":"envelope.sent","envelope_id":"ENV-MSA-7F2C91","dest":"https://hooks.harbor.example/lumin","delivery_id":"wh_msa_sent","ok":true}
{"ts":"2026-10-14T17:05:13Z","event":"signer.completed","envelope_id":"ENV-MSA-7F2C91","signer":"ada.chen@lumin.example","next":"countersign"}
{"ts":"2026-10-14T18:00:04Z","event":"signer.reminded","envelope_id":"ENV-MSA-7F2C91","dest":"https://hooks.harbor.example/lumin","delivery_id":"wh_msa_remind_ok","ok":true,"payload":{"result":"delivered","signer":"bob.alvarez@harbor-robotics.example"}}
{"ts":"2026-10-14T18:00:05Z","event":"reminder.sent","envelope_id":"ENV-MSA-7F2C91","ok":true}
""",
        encoding="utf-8",
    )
    (ops / "reminder-worker.txt").write_text(
        """reminder-worker  2026-10-14T19:01:00Z  scan start
  ENV-SOW-CONTOSO     skip   draft_not_sent
  ENV-NDA-NORTHWIND   FAIL   last_error=550 mailbox unavailable  (this is the failed reminder)
  ENV-MSA-7F2C91      ok     last_result=delivered  next_eligible=2026-10-16T18:00:00Z
scan done  delivered=1 failed=1 skipped=1
""",
        encoding="utf-8",
    )


def write_config() -> None:
    cfg = CORPUS / "config"
    cfg.mkdir(parents=True, exist_ok=True)
    (cfg / "reminder-cadence.toml").write_text(
        """# Lumin Sign fixture — reminder cadence (not production)

[default]
enabled = true
hours_after_send = [24, 72, 168]
skip_weekends = true

[envelopes.ENV-MSA-7F2C91]
enabled = true
hours_after_send = [2, 24, 72]
expires_at = "2026-11-15T23:59:59Z"
note = "Harbor countersign — aggressive first ping"

[envelopes.ENV-NDA-NORTHWIND]
enabled = true
hours_after_send = [24]
expires_at = "2026-10-20T23:59:59Z"
note = "Reminder failed 2026-10-14 (SMTP 550). Do not auto-retry hard bounces."

[envelopes.ENV-SOW-CONTOSO]
enabled = false
note = "Draft. Cadence ignored until send."
""",
        encoding="utf-8",
    )


def write_long_msa() -> None:
    """Same long-MSA style as apps/pageindex-contract-qa (PR #12): Lumin Sign x Acme, 25 pages, Art. 10.2.1."""
    dest = CORPUS / "pageindex-style" / "lumin-acme-msa.md"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        """# Master Services Agreement (with NDA and DPA exhibits)

- **Agreement ID:** LUM-MSA-2026-1041
- **Parties:** Lumin Sign, Inc. (Provider); Acme Holdings LLC (Customer)
- **Effective date:** October 1, 2026
- **Pages:** 25
- **Status:** Ready for review

> Fixture contract in the same long-form article style as `apps/pageindex-contract-qa` (PR #12).
> Regenerated here so this demo does not depend on or modify that app. Not an offer to contract.

## Cover, Recitals and Agreement

MASTER SERVICES AGREEMENT

This Master Services Agreement (the “Agreement”) is entered into as of October 1, 2026 (the “Effective Date”), by and between Lumin Sign, Inc., a Delaware corporation with its principal place of business at 548 Market Street, Suite 19024, San Francisco, California 94104 (“Provider” or “Lumin Sign”), and Acme Holdings LLC, a Delaware limited liability company with its principal place of business at 1 Acme Plaza, Wilmington, Delaware 19801 (“Customer”). Provider and Customer are each a “Party” and together the “Parties.”

Recitals. Provider operates a document workflow and electronic signature platform used by enterprises to prepare, review, send, and execute contracts. Customer wishes to subscribe to the platform and related professional services for its corporate, procurement, and legal operations, including review of long-form commercial agreements prior to signature.

Agreement ID LUM-MSA-2026-1041. Document control: 25 pages. Classification: Confidential. This fixture is a demo contract for comparing a PageIndex-style tree walk with XERJ ranked passages.

## Article 1 — Definitions and Interpretation

“Affiliate” means any entity that directly or indirectly controls, is controlled by, or is under common control with a Party.

“Confidential Information” means non-public information disclosed by a Party that is marked confidential or that a reasonable person would understand to be confidential.

“Customer Data” means electronic data, documents, signatures, metadata, and other content submitted to the Platform by or on behalf of Customer.

“Platform” means Provider’s hosted document workflow, contract-review, and electronic signature software.

“Subprocessor” means a third party engaged by Provider to process Personal Data on behalf of Customer, as listed in Exhibit E.

## Article 2 — Services

Provider shall provide the Services in a professional and workmanlike manner consistent with industry standards for enterprise SaaS document platforms. Customer’s specific SKUs, user bands, and environments (production, sandbox) are set out on the Order Form.

## Article 3 — Fees

Fees are as set forth on the Order Form. Invoices are due net thirty (30) days. Service credits under Exhibit B are Customer’s sole remedy for SLA misses and count toward any liability cap.

## Article 4 — Term

The Initial Term is twelve (12) months from the Effective Date. The Agreement auto-renews for successive twelve-month periods unless a Party gives sixty (60) days’ notice of non-renewal.

## Article 5 — Intellectual Property

### 5.2 Customer Data and Deliverables

Customer owns Customer Data. Custom Deliverables identified in a Statement of Work are owned by Customer upon payment. Provider retains the Platform, templates, models, and tooling used across its customer base.

## Article 6 — Confidentiality

### 6.4 Duration

Confidentiality obligations last **five (5) years** after disclosure. Trade secrets remain protected for so long as they remain trade secrets.

## Article 7 — Data Protection

### 7.3 Subprocessors

Provider shall give **thirty (30) days’ notice** before adding a Subprocessor. Exhibit E currently names Amazon Web Services, a transactional email provider, and a support-desk processor.

## Article 8 — Warranties

Each Party warrants it has the authority to enter this Agreement. Provider warrants the Platform will materially conform to the Documentation.

## Article 9 — Indemnification

Provider shall defend Customer against third-party claims that the Platform infringes a U.S. patent, copyright, or trademark, subject to prompt notice and exclusive control of the defense.

## Article 10 — Limitation of Liability

### 10.1 Disclaimer of Consequential Damages

Neither Party is liable for indirect, incidental, special, consequential, or punitive damages, or lost profits, even if advised of the possibility.

### 10.2 Limitation of Liability

#### 10.2.1 Cap on Damages

EXCEPT FOR THE CARVE-OUTS IN SECTION 10.2.3, EACH PARTY’S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID OR PAYABLE BY CUSTOMER TO PROVIDER UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE FIRST CLAIM GIVING RISE TO LIABILITY.

This is the PageIndex-style liability cap (tree path in that demo: Article 10 → 10.2 → 10.2.1 → p.14). It is a twelve-month fees cap with no dollar floor. It is not the Harbor Robotics MSA cap (USD 50,000 / six months on v1; USD 250,000 / twelve months on v2).

#### 10.2.2 Application

The limitation in Section 10.2.1 applies whether the claim is based in contract, tort (including negligence), strict liability, statute, or otherwise. Amounts recovered from insurance do not increase a Party’s liability above the cap. Service credits count toward the cap.

#### 10.2.3 Carve-outs

The limitations in Sections 10.1 and 10.2.1 do not apply to: (a) indemnification for third-party intellectual-property claims; (b) breach of Article 6 (Confidentiality); (c) a Security Incident caused by Provider’s willful misconduct or gross negligence; (d) fraud; (e) death or bodily injury; or (f) Customer’s payment obligations.

## Article 11 — Indemnification procedures

The indemnified Party shall give prompt written notice and reasonable cooperation.

## Article 12 — Insurance

Provider shall maintain the coverages listed in Exhibit F, including cyber liability.

## Article 13 — Termination

### 13.2.2 For Convenience

After the Initial Term, either Party may terminate for convenience on **ninety (90) days’** prior written notice.

## Article 14 — Governing Law

### 14.1 Governing Law

Delaware law, without regard to conflicts principles.

### 14.2 Exclusive Venue

State or federal courts in **Wilmington, Delaware**.

## Article 15 — Miscellaneous

Counterparts and electronic signatures are original. The English version controls.

## Exhibit A — Statement of Work (placeholder)

Implementation, training, and migration hours as described on the Order Form.

## Exhibit B — Service Levels

Monthly uptime target 99.9%. Credits per the table in the Order Form.

## Exhibit C — Data Processing Addendum

Provider is processor; Customer is controller. Standard contractual clauses apply to extra-EEA transfers.

## Exhibit D — Security Attachment

Encryption in transit and at rest; annual penetration test; SOC 2 Type II report on request.

## Exhibit E — Subprocessor List

Amazon Web Services; transactional email; support-desk processor.

## Exhibit F — Insurance Requirements

Cyber, E&O, and commercial general liability at the limits stated in the Order Form.

— end of 25-page-style fixture (compressed to one markdown file; article numbers match the PageIndex demo) —
""",
        encoding="utf-8",
    )


def main() -> None:
    contracts = CORPUS / "contracts"
    write_pdf(contracts / "msa-harbor-v1.pdf", harbor_msa("v1"), "LUM-MSA-HARBOR-2026-V1")
    write_pdf(contracts / "msa-harbor-v2.pdf", harbor_msa("v2"), "LUM-MSA-HARBOR-2026-V2")
    write_pdf(
        contracts / "ENV-MSA-7F2C91-countersign.pdf",
        countersign_pdf(),
        "ENV-MSA-7F2C91 Certificate of Completion",
    )
    write_notes()
    write_ops()
    write_config()
    write_long_msa()
    print(f"wrote corpus under {CORPUS}")
    for p in sorted(CORPUS.rglob("*")):
        if p.is_file():
            print(f"  {p.relative_to(CORPUS)}  {p.stat().st_size} bytes")


if __name__ == "__main__":
    main()
