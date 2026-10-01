import type { FixtureDocument } from "../types";

export const documents: FixtureDocument[] = [
  {
    id: "doc-msa",
    title: "Master Services Agreement",
    filename: "lumin-acme-msa.md",
    pages: 8,
    body: `# MASTER SERVICES AGREEMENT

**Lumin Sign, Inc.** (“Provider”) and **Acme Holdings LLC** (“Customer”)

Effective Date: 1 October 2026 · Envelope: ENV-FIX-MSA-2026-10

This Master Services Agreement (this “Agreement”) is entered into as of the Effective Date by and between Lumin Sign, Inc., a Delaware corporation (“Provider”), and Acme Holdings LLC, a Delaware limited liability company (“Customer”). Provider and Customer are each a “Party” and together the “Parties.” Affiliates of a Party are included where this Agreement so states.

## 1. Definitions

**“Confidential Information”** means non-public information disclosed by a Party (the “Discloser”) to the other Party (the “Recipient”) that is marked confidential or that a reasonable person would understand to be confidential given its nature and the circumstances of disclosure, including Customer Data, pricing, security documentation, and the terms of this Agreement. Confidential Information does not include information that is public other than by breach, independently developed without use of the Discloser’s information, or rightfully received from a third party without a duty of confidentiality.

**“Customer Data”** means data, files, and content submitted by or on behalf of Customer to the Services, including documents uploaded for signature and signer identity attributes.

**“Custom Deliverables”** means configuration, templates, and workflow artifacts created uniquely for Customer under a Statement of Work and identified as Custom Deliverables therein. Custom Deliverables do not include Provider’s pre-existing platform, models, or generic connectors.

**“Services”** means Provider’s hosted electronic-signature and contract-workspace software, plus professional services described in an applicable Statement of Work.

**“Indemnified Claim”** means a third-party claim described in Section 8.

## 2. Services and Fees

2.1 Provider shall perform the Services in material accordance with this Agreement and each Statement of Work attached as Exhibit A (or later executed and incorporated).

2.2 Customer shall pay the Fees set out in Exhibit A within thirty (30) days of invoice. Late amounts accrue interest at 1.0% per month or the maximum allowed by law, whichever is less.

2.3 Provider may use subprocessors listed in Exhibit E. Provider shall give Customer thirty (30) days’ notice before adding a subprocessor that processes Customer Data.

## 5. Intellectual Property

5.1 Provider retains all right, title, and interest in the Services and Provider Materials.

5.2 As between the Parties, Customer owns Customer Data and Custom Deliverables. Provider hereby assigns to Customer all of Provider’s right, title, and interest in Custom Deliverables upon full payment of the applicable Fees.

5.3 Customer grants Provider a limited license to host and process Customer Data solely to provide the Services.

## 6. Confidentiality

6.1 Each Party shall use the other Party’s Confidential Information only to perform this Agreement and shall not disclose it except to personnel and professional advisors who have a need to know and are bound by written confidentiality obligations no less protective than this Section 6.

6.2 The duties in this Section 6 survive for five (5) years after termination; duties as to trade secrets survive while the information remains a trade secret under applicable law.

6.3 The mutual nondisclosure agreement dated 12 September 2026 (the “NDA”) remains in force for pre-signature diligence materials. Where the NDA’s definition of Confidential Information is broader than Section 1, the NDA controls for those pre-signature materials.

## 8. Indemnification

8.1 Provider shall defend and indemnify Customer against Indemnified Claims alleging that the unmodified Services infringe a third party’s intellectual-property right, and shall pay resulting damages and reasonable attorneys’ fees finally awarded.

8.2 Customer shall defend and indemnify Provider against Indemnified Claims arising from Customer Data, Customer’s instructions, or Customer’s misuse of the Services.

8.3 The indemnifying Party’s obligations are conditioned on prompt written notice, sole control of the defense (provided any settlement that admits fault or imposes a non-monetary obligation on the indemnified Party requires prior written consent, not to be unreasonably withheld), and reasonable cooperation.

## 9. Limitation of Liability

9.1 Except for a Party’s indemnification obligations under Section 8.1 (intellectual-property indemnity), breach of Section 6 (Confidentiality), or liability that cannot be limited by law, neither Party’s aggregate liability arising out of this Agreement will exceed the Fees paid or payable by Customer to Provider in the twelve (12) months before the first claim.

9.2 Neither Party is liable for indirect, incidental, special, consequential, or punitive damages, or lost profits, even if advised of the possibility, except to the extent arising from a breach of Section 6 or willful misconduct.

9.3 The Parties acknowledge that the Fees reflect this allocation of risk.

## 10. Term and Termination

10.1 The Initial Term is twelve (12) months from the Effective Date and renews for successive twelve-month periods unless a Party gives notice under Section 10.2.

10.2 **Notice.** After the Initial Term, either Party may terminate this Agreement for convenience by giving the other Party at least ninety (90) days’ prior written notice.

10.3 Either Party may terminate for material breach that remains uncured thirty (30) days after written notice, or immediately if the other Party becomes insolvent.

10.4 Upon termination, Recipient shall return or securely destroy Discloser’s Confidential Information within thirty (30) days, except copies retained under a legal hold or automatic backup, which remain subject to Section 6.

## 11. Insurance

Provider shall maintain the coverages described in Exhibit B for the Term, including cyber/errors-and-omissions liability of not less than $2,000,000 per occurrence.

## Exhibits

This Agreement incorporates Exhibit A (Statement of Work), Exhibit B (Insurance), and Exhibit E (Data Processing Addendum).

**IN WITNESS WHEREOF** the Parties have executed this Agreement as of the Effective Date.

Lumin Sign, Inc. · Acme Holdings LLC
`,
  },
  {
    id: "doc-nda",
    title: "Mutual Nondisclosure Agreement",
    filename: "lumin-acme-nda.md",
    pages: 4,
    body: `# MUTUAL NONDISCLOSURE AGREEMENT

**Lumin Sign, Inc.** and **Acme Holdings LLC**

Effective Date: 12 September 2026 · Envelope: ENV-FIX-NDA-2026-09

This Mutual Nondisclosure Agreement (this “NDA”) is entered into as of the Effective Date by and between Lumin Sign, Inc. (“Lumin”) and Acme Holdings LLC (“Acme”). Each is a “Party”; together the “Parties.” Affiliates are bound to the same extent as the Party that discloses or receives information through them.

## 1. Purpose

The Parties wish to explore a possible services relationship, including security review, pricing, and a draft master services agreement (the “Purpose”). Each Party may disclose Confidential Information for the Purpose only.

## 2. Definition of Confidential Information

**“Confidential Information”** means all non-public information, whether marked or unmarked, and whether disclosed in writing, orally, visually, or by inspection of facilities or systems, that relates to a Party’s business, including product roadmaps, security architecture, customer lists, pricing, and draft contracts. Oral disclosures are Confidential Information if identified as confidential at the time of disclosure and summarized in writing within ten (10) days.

Information is not Confidential Information if the Recipient can show it is public other than by breach, was already in Recipient’s possession without duty, is independently developed, or is required to be disclosed by law (with prompt notice where legally permitted).

This definition is intentionally broader than the MSA’s Section 1 definition and, per MSA §6.3, controls for pre-signature diligence materials.

## 3. Non-use and Non-disclosure

Recipient shall use Confidential Information solely for the Purpose, protect it with at least reasonable care, and not disclose it to any third party except to employees, contractors, and professional advisors who need to know and are bound in writing to protect it.

## 4. Term

This NDA begins on the Effective Date and continues for three (3) years, except that obligations as to trade secrets continue until the information ceases to be a trade secret. The MSA’s five-year confidentiality survival does not shorten this NDA for pre-signature materials.

## 5. Return or Destruction

Upon the disclosing Party’s written request, or automatically upon termination of discussions or of any later services agreement, Recipient shall promptly return or destroy Confidential Information and certify destruction in writing within fifteen (15) days, except archival copies required by law or retained under a documented legal hold.

## 6. No License; Residual Knowledge

No license is granted except the limited right to use Confidential Information for the Purpose. Residual knowledge remaining in unaided memory may be used, provided Recipient does not disclose Confidential Information or misappropriate trade secrets.

**SIGNED** as of the Effective Date.

Lumin Sign, Inc. · Acme Holdings LLC
`,
  },
];
