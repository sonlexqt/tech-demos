# Master Services Agreement (with NDA and DPA exhibits)

- **Agreement ID:** LUM-MSA-2026-1041
- **Parties:** Lumin Sign, Inc. (Provider); Acme Holdings LLC (Customer)
- **Effective date:** October 1, 2026
- **Pages:** 25
- **Status:** Ready for review

> Fixture contract for the PageIndex (VectifyAI) demo. Not an offer to contract.

## Cover, Recitals and Agreement

*node_id `0000` · p. 1*

MASTER SERVICES AGREEMENT

This Master Services Agreement (the “Agreement”) is entered into as of October 1, 2026 (the “Effective Date”), by and between Lumin Sign, Inc., a Delaware corporation with its principal place of business at 548 Market Street, Suite 19024, San Francisco, California 94104 (“Provider” or “Lumin Sign”), and Acme Holdings LLC, a Delaware limited liability company with its principal place of business at 1 Acme Plaza, Wilmington, Delaware 19801 (“Customer”). Provider and Customer are each a “Party” and together the “Parties.”

Recitals. Provider operates a document workflow and electronic signature platform used by enterprises to prepare, review, send, and execute contracts. Customer wishes to subscribe to the platform and related professional services for its corporate, procurement, and legal operations, including review of long-form commercial agreements prior to signature. The Parties also wish to set out confidentiality, data processing, security, and intellectual-property terms that will govern all Statements of Work issued under this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows. This Agreement includes the body of the MSA and Exhibits A through F (Statement of Work, Service Levels, Data Processing Addendum, Security Attachment, Subprocessor List, and Insurance Requirements). In the event of conflict, the following order of precedence applies: (1) a mutually signed amendment; (2) the Data Processing Addendum for data-protection matters; (3) the body of this Agreement; (4) the remaining Exhibits; (5) an Order Form or SOW.

Agreement ID LUM-MSA-2026-1041. Document control: 25 pages. Classification: Confidential — attorney-client work product when circulated internally by Customer’s legal operations team. This fixture is a demo contract for PageIndex-style tree-index Q&A and is not an offer to contract.

## Article 1 — Definitions and Interpretation

*node_id `0001` · pp. 2–3*

For purposes of this Agreement, the following capitalized terms have the meanings set forth below. Terms defined in an Exhibit apply to that Exhibit and, unless a contrary intent is clear, to the Agreement as a whole.

### 1.1 Defined Terms

*node_id `0002` · pp. 2–3*

“Affiliate” means any entity that directly or indirectly controls, is controlled by, or is under common control with a Party, where “control” means ownership of more than fifty percent (50%) of the voting securities or equivalent.

“Authorized User” means an employee, contractor, or agent of Customer or its Affiliates who is provisioned credentials to access the Platform under Customer’s account.

“Confidential Information” means non-public information disclosed by a Party (the “Disclosing Party”) to the other (the “Receiving Party”) that is marked confidential or that a reasonable person would understand to be confidential given its nature and the circumstances of disclosure, including business plans, pricing, customer lists, product roadmaps, security documentation, and the terms of this Agreement.

“Customer Data” means electronic data, documents, signatures, metadata, and other content submitted to the Platform by or on behalf of Customer, excluding Provider’s Usage Data.

“Custom Deliverables” means documents, playbooks, clause libraries, integration scripts, or other work product created specifically for Customer under a Statement of Work and expressly identified as a Customer-owned deliverable therein. Templates, models, and tooling that Provider uses across its customer base are not Custom Deliverables.

“Documentation” means Provider’s then-current user guides, API references, and administrator materials for the Platform.

“Malicious Code” means viruses, worms, time bombs, Trojan horses, and other harmful or malicious code, files, scripts, agents, or programs.

“Order Form” means an ordering document signed by the Parties that specifies subscription SKUs, quantities, fees, and the subscription term.

“Personal Data” has the meaning given in the Data Processing Addendum (Exhibit C).

“Platform” means Provider’s hosted document workflow, contract-review, and electronic signature software, including related APIs, as updated from time to time.

“Professional Services” means implementation, training, migration, or other consulting services described in a Statement of Work.

“Services” means the Platform subscription and any Professional Services.

“Statement of Work” or “SOW” means a statement of work under Exhibit A or a later SOW signed by the Parties.

“Subprocessor” means a third party engaged by Provider to process Personal Data on behalf of Customer, as listed in Exhibit E.

“Trade Secret” means information that derives independent economic value from not being generally known and is the subject of reasonable efforts to maintain its secrecy.

“Usage Data” means telemetry, logs, and aggregated statistics about use of the Platform that do not identify Customer or an individual.

### 1.2 Interpretation

*node_id `0003` · p. 3*

References to Articles, Sections, and Exhibits are to this Agreement unless otherwise indicated. The words “include,” “includes,” and “including” mean “including without limitation.” “Or” is inclusive. Headings are for convenience only and do not affect interpretation. A reference to “writing” includes email and Platform notices that produce a durable record. No rule of construction against the drafter applies. If a provision is held unenforceable, the remainder stays in effect and the invalid provision is modified to the minimum extent necessary to make it valid.

This Agreement may be executed in counterparts (including electronic signatures) and will be deemed an original in each counterpart. The English language version controls over any translation.

## Article 2 — Services

*node_id `0004` · pp. 4–5*

Provider shall provide the Services in a professional and workmanlike manner consistent with industry standards for enterprise SaaS document platforms. Customer’s specific SKUs, user bands, and environments (production, sandbox) are set out on the Order Form.

### 2.1 Platform Services

*node_id `0005` · p. 4*

Subject to this Agreement, Provider grants Customer a non-exclusive, non-transferable right to access and use the Platform during the subscription term specified on the Order Form, solely for Customer’s internal business purposes. The Platform includes: (a) document upload and storage in Customer’s tenant; (b) preparation and routing of envelopes for electronic signature; (c) role-based access control and SSO via SAML 2.0 or OIDC; (d) an audit trail of views, signatures, and administrative events; and (e) a contract-review workspace that exposes a hierarchical index of long documents so reviewers can locate operative clauses before sending for signature.

Provider may modify the Platform provided it does not materially decrease core functionality during a paid term. Beta or preview features are provided AS IS and may be withdrawn. Customer is responsible for Authorized User accounts, credential hygiene, and decisions about whom to invite as signers or viewers.

Usage limits (envelope volume, storage, API rate limits) appear on the Order Form. Overage is billed at the rates stated there, or if silent, at Provider’s then-current list rates with thirty (30) days’ notice.

### 2.2 Professional Services

*node_id `0006` · p. 5*

Professional Services are described in Exhibit A and any later SOW. Unless an SOW states a fixed fee, Professional Services are time-and-materials at the rates in the SOW. Customer will provide timely access to stakeholders, sample contracts, brand assets, and SSO metadata reasonably required for implementation.

Either Party may request a change. Provider will estimate impact on fees and schedule; work on the changed scope begins only after a written change order. Provider personnel remain Provider employees or contractors; nothing in an SOW creates a partnership or joint venture.

### 2.3 Service Levels and Support

*node_id `0007` · p. 5*

Provider will use commercially reasonable efforts to make the production Platform available in accordance with the uptime commitment and support response targets in Exhibit B (Service Levels). Service credits described in Exhibit B are Customer’s exclusive remedy for Provider’s failure to meet those commitments, and credits apply only to future invoices. Planned maintenance windows and exclusions (force majeure, Customer-caused outages, third-party backbone failures) are defined in Exhibit B.

Support is provided in English via the in-product helpdesk and email during the hours stated in Exhibit B. Designated Customer administrators may open severity-1 incidents for production outages.

## Article 3 — Customer Obligations

*node_id `0008` · p. 6*

Customer shall use the Services in compliance with applicable law, including electronic-signature, privacy, export, and records-retention laws in the jurisdictions where Customer sends envelopes. Customer is solely responsible for: (a) the accuracy and legality of Customer Data and the content of documents sent for signature; (b) obtaining any consent or disclosure required for electronic signatures and notices; (c) determining whether a particular document type may be executed electronically; and (d) retaining executed copies as required by Customer’s regulatory profile.

Customer shall not, and shall not permit Authorized Users to: (i) reverse engineer, decompile, or create derivative works of the Platform except to the extent this restriction is prohibited by law; (ii) use the Platform to store or transmit Malicious Code or infringing material; (iii) perform unannounced penetration testing without Provider’s prior written consent; (iv) resell or timeshare the Platform except as expressly allowed in an Order Form for Affiliate use; or (v) exceed documented API limits in a manner that degrades the service for others.

Customer will maintain commercially reasonable security for systems that connect to the Platform, promptly revoke access for departed users, and notify Provider of suspected credential compromise within forty-eight (48) hours of discovery.

## Article 4 — Fees, Invoicing and Taxes

*node_id `0009` · pp. 6–7*

Fees for the Platform subscription and Professional Services are set out in the Order Form and applicable SOW. Unless otherwise stated, Platform fees are invoiced annually in advance, and Professional Services are invoiced monthly in arrears.

### 4.1 Fees

*node_id `0010` · p. 6*

Customer shall pay the fees specified on each Order Form and SOW. Subscription fees cover the user band and envelope volume stated on the Order Form. Fees are non-refundable and non-cancellable except: (a) unused prepaid fees refunded if Customer terminates for Provider’s uncured material breach under Section 13.2.1; or (b) as required by law. Provider may increase renewal fees by up to seven percent (7%) upon at least sixty (60) days’ notice before the renewal date; larger increases require a new Order Form.

### 4.2 Invoicing and Payment

*node_id `0011` · p. 7*

Invoices are due net thirty (30) days from the invoice date, payable in U.S. dollars by ACH or wire. Overdue amounts accrue interest at one and one-half percent (1.5%) per month, or the maximum rate permitted by law, whichever is less. If any undisputed amount is more than fifteen (15) days overdue, Provider may suspend the Services after written notice and a reasonable opportunity to pay. Disputed amounts must be noticed in writing within fifteen (15) days of invoice with a bona fide explanation; the Parties will work in good faith to resolve disputes within thirty (30) days.

### 4.3 Taxes

*node_id `0012` · p. 7*

Fees are exclusive of taxes, duties, and similar governmental charges. Customer is responsible for all sales, use, value-added, and withholding taxes arising from its purchases hereunder, excluding taxes based on Provider’s net income or employment of Provider personnel. If Customer is exempt, it will provide a valid exemption certificate. If Provider is required to withhold, Customer will gross up payments so Provider receives the amount it would have received without withholding, unless Customer provides documentation that eliminates the withholding obligation.

## Article 5 — Intellectual Property

*node_id `0013` · pp. 7–8*

This Article allocates ownership of the Platform, Customer Data, and work product created during Professional Services. The allocation is intended to let Customer take work product it paid to have customized, while Provider continues to operate and improve a multi-tenant platform.

### 5.1 Provider Platform IP

*node_id `0014` · pp. 7–8*

As between the Parties, Provider owns and retains all right, title, and interest (including all intellectual-property rights) in and to the Platform, Documentation, Usage Data, Provider trademarks, and any pre-existing tools, models, templates, connectors, and know-how, including improvements and derivative works thereof created during the Term (collectively, “Platform IP”). Except for the limited rights expressly granted in this Agreement, no license is granted by implication, estoppel, or otherwise. Provider may use Usage Data to operate, secure, and improve the Services.

### 5.2 Customer Data and Deliverables

*node_id `0015` · p. 8*

As between the Parties, Customer owns all right, title, and interest in and to Customer Data and Custom Deliverables. Customer grants Provider a limited license to host, copy, transmit, and display Customer Data solely to provide and support the Services and as required by law.

Upon delivery and payment of applicable Professional Services fees, Provider hereby assigns to Customer all of Provider’s right, title, and interest in Custom Deliverables, excluding Platform IP embedded therein. To the extent Platform IP is embedded in a Custom Deliverable, Provider grants Customer a non-exclusive, non-transferable, non-sublicensable license to use that Platform IP solely as embodied in the Custom Deliverable and solely during the Term in connection with the Services. Customer may retain copies of Custom Deliverables after termination for its internal records and for completing envelopes already in flight, but the license to embedded Platform IP ends when the subscription ends except for static exported documents (for example, a signed PDF or an exported clause playbook in ordinary office formats).

Customer represents it has all rights necessary to submit Customer Data to the Platform and to grant the licenses in this Section.

### 5.3 Feedback

*node_id `0016` · p. 8*

If Customer provides suggestions, enhancement requests, or other feedback (“Feedback”), Provider may use Feedback without restriction or obligation, and Customer grants Provider a perpetual, irrevocable, royalty-free license to exploit Feedback in any manner. Feedback is not Customer Confidential Information.

## Article 6 — Confidentiality

*node_id `0017` · pp. 8–9*

The Parties expect to exchange pricing, security materials, unpublished product plans, and Customer contract corpora. This Article is the standalone non-disclosure regime and applies whether or not a document is marked, if a reasonable person would treat it as confidential.

### 6.1 Definition of Confidential Information

*node_id `0018` · pp. 8–9*

Confidential Information is defined in Section 1.1 and includes the existence and terms of this Agreement, Order Forms, unpublished security questionnaires, penetration-test summaries, and Customer’s uploaded contract corpus. Information is Confidential Information if marked or if the circumstances of disclosure would lead a reasonable person to treat it as confidential. Oral disclosures are Confidential Information if identified as confidential at the time and summarized in writing within fifteen (15) days.

### 6.2 Obligations

*node_id `0019` · p. 9*

The Receiving Party shall: (a) use Confidential Information solely to perform or exercise rights under this Agreement; (b) protect it using at least the same degree of care it uses for its own similar information, and no less than reasonable care; and (c) disclose it only to employees, contractors, and professional advisors who have a need to know and who are bound by written confidentiality obligations no less protective than this Article. The Receiving Party remains responsible for its representatives. Upon written request after termination, the Receiving Party will return or destroy Confidential Information, except for copies retained in backup systems or as required by law or professional recordkeeping, which remain subject to this Article.

### 6.3 Exceptions

*node_id `0020` · p. 9*

The obligations in this Article do not apply to information that the Receiving Party can document: (a) is or becomes public through no breach; (b) was rightfully known without confidentiality duty before disclosure; (c) is independently developed without use of Confidential Information; or (d) is rightfully received from a third party without confidentiality duty. Compelled disclosure is permitted to the extent required by law, regulation, or court order, provided the Receiving Party (if legally permitted) gives prompt notice and reasonable cooperation so the Disclosing Party may seek a protective order. Disclosure under this paragraph is limited to the required portion.

### 6.4 Duration of Confidentiality Obligations

*node_id `0021` · p. 9*

The Receiving Party’s obligations under this Article survive for five (5) years after the termination or expiration of this Agreement. Notwithstanding the foregoing, obligations with respect to Trade Secrets survive until the information ceases to qualify as a Trade Secret under the Defend Trade Secrets Act or other applicable law. Survival does not extend the Term of the subscription or any license except as expressly stated in Article 5 or Section 13.3.

## Article 7 — Data Processing

*node_id `0022` · pp. 10–11*

This Article and Exhibit C (Data Processing Addendum) govern Provider’s processing of Personal Data. If GDPR, UK GDPR, or similar law does not apply to a particular dataset, the operational commitments in this Article still apply as contractual process requirements.

### 7.1 Roles of the Parties

*node_id `0023` · p. 10*

For Personal Data contained in Customer Data, Customer is the controller (or processor on behalf of its own clients) and Provider is the processor (or subprocessor). Provider will process Personal Data only on Customer’s documented instructions, including those in this Agreement, Exhibit C, and configuration of the Platform, unless required by law (in which case Provider will notify Customer unless legally prohibited). Each Party is independently responsible for Personal Data it collects about the other Party’s business contacts for contract administration (business-card data), for which each Party is an independent controller.

### 7.2 Processing Instructions and Assistance

*node_id `0024` · pp. 10–11*

Provider will implement the technical and organizational measures in Exhibit D and will assist Customer, at Customer’s reasonable expense for extraordinary requests, with data-subject requests, data-protection impact assessments, and consultations with supervisory authorities, in each case to the extent related to Provider’s processing.

Upon termination or expiration, Provider will delete Customer Data from production systems within thirty (30) days, except (a) copies Customer exports; (b) data retained as required by law or a documented legal hold; and (c) encrypted backups that expire on Provider’s standard rotation (not to exceed ninety (90) days). Customer may request one export of Customer Data in a reasonable structured format within fifteen (15) days after termination.

### 7.3 Subprocessors

*node_id `0025` · p. 11*

Customer authorizes Provider to engage the Subprocessors listed in Exhibit E (Subprocessor List). Provider will impose data-protection terms on each Subprocessor no less protective than Exhibit C and remains liable for Subprocessor performance as for its own acts.

Provider will give Customer thirty (30) days’ prior written notice (email to the admin contact on the Order Form is sufficient) before authorizing a new Subprocessor or a material change in processing location for an existing Subprocessor. Customer may object on reasonable data-protection grounds within that period. If the Parties cannot resolve an objection, Customer may terminate the affected Services without penalty and receive a pro-rata refund of unused prepaid fees for the terminated portion. Hosting-region changes that remain within a previously approved country do not require a new notice.

### 7.4 International Transfers

*node_id `0026` · p. 11*

Unless the Order Form specifies an EU or UK production region, Customer Data in production is hosted in the United States. Transfers of Personal Data from the EEA, UK, or Switzerland to the United States (or any other third country) are made under the Standard Contractual Clauses and UK international data transfer addendum incorporated into Exhibit C, or a successor transfer mechanism. Provider will not transfer Personal Data to a new country without the notice process in Section 7.3 where that change adds a Subprocessor or hosting location.

## Article 8 — Security

*node_id `0027` · p. 12*

Provider’s security commitments are detailed in Exhibit D (Security Attachment) and summarized here. Customer remains responsible for account administration and for classifying documents it uploads.

### 8.1 Security Program

*node_id `0028` · p. 12*

Provider will maintain a written information-security program designed to protect Customer Data against accidental or unlawful destruction, loss, alteration, and unauthorized disclosure or access. The program includes, at minimum, the controls in Exhibit D: (a) SOC 2 Type II attestation covering security and availability, renewed at least annually; (b) encryption of Customer Data at rest using AES-256 (or equivalent) and in transit using TLS 1.2 or higher; (c) logical isolation of Customer’s tenant; (d) least-privilege access, MFA for production access, and quarterly access reviews; (e) vulnerability scanning and a documented patch SLA; and (f) at least annual independent penetration testing, with an executive summary available to Customer under NDA.

Upon written request no more than once per twelve (12) months, Provider will complete Customer’s reasonable security questionnaire (not to exceed the SIG Lite or equivalent) and share the latest SOC 2 report under NDA.

### 8.2 Security Incident Notice

*node_id `0029` · p. 12*

A “Security Incident” means accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Customer Data in Provider’s possession or control. Provider will notify Customer without undue delay and in any event within seventy-two (72) hours after confirming a Security Incident, and will provide information reasonably available about the nature of the incident, likely consequences, and measures taken or proposed. Notification will go to the security contact on the Order Form. Provider will not disclose Customer’s identity in public incident reports without consent except as required by law.

## Article 9 — Representations and Warranties

*node_id `0030` · p. 13*

Each Party represents that it has the legal power and authority to enter this Agreement and that its signatory is authorized. Customer represents that its use of electronic signatures under this Agreement will comply with the ESIGN Act, UETA, eIDAS (where applicable), and similar laws that Customer determines apply to a given envelope.

Provider warrants that: (a) the Platform will perform materially in accordance with the Documentation during the subscription term; (b) Professional Services will be performed in a professional manner; and (c) Provider will not knowingly introduce Malicious Code into the Platform. Customer’s exclusive remedy for a breach of (a) or (b) is, at Provider’s option, re-performance or a credit of fees for the non-conforming period. Provider does not warrant that the Platform will be uninterrupted or error-free, or that it will meet Customer’s legal conclusions about a particular contract.

EXCEPT AS EXPRESSLY PROVIDED IN THIS AGREEMENT, THE SERVICES AND DOCUMENTATION ARE PROVIDED “AS IS.” PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. Provider is not a law firm and does not provide legal advice. Outputs of any contract-review features are informational aids and do not replace Customer’s counsel.

## Article 10 — Limitation of Liability

*node_id `0031` · p. 14*

The Parties have allocated risk through the fees, the service credits in Exhibit B, and the caps and exclusions in this Article. The limitations apply to the maximum extent permitted by law and regardless of the theory of liability.

### 10.1 Disclaimer of Indirect Damages

*node_id `0032` · p. 14*

EXCEPT FOR THE CARVE-OUTS IN SECTION 10.2.3, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, COVER, BUSINESS-INTERRUPTION, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, GOODWILL, OR DATA, WHETHER IN CONTRACT, TORT, OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.

### 10.2 Limitation of Liability

*node_id `0033` · p. 14*

This Section 10.2 sets the monetary cap and the categories of claims that sit outside the cap. The cap is an aggregate cap per Party, not per incident, and includes amounts paid as service credits.

#### 10.2.1 Cap on Damages

*node_id `0034` · p. 14*

EXCEPT FOR THE CARVE-OUTS IN SECTION 10.2.3, EACH PARTY’S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID OR PAYABLE BY CUSTOMER TO PROVIDER UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE FIRST CLAIM GIVING RISE TO LIABILITY. If twelve months have not elapsed, the cap is the fees paid or payable for the elapsed period annualized, or the fees on the initial Order Form, whichever is greater. Multiple claims do not enlarge the cap.

#### 10.2.2 Application

*node_id `0035` · p. 14*

The limitation in Section 10.2.1 applies whether the claim is based in contract, tort (including negligence), strict liability, statute, or otherwise. Amounts recovered from insurance do not increase a Party’s liability above the cap, except that a Party may still recover from its own insurers. Service credits count toward the cap.

#### 10.2.3 Carve-Outs

*node_id `0036` · p. 14*

The limitations in Sections 10.1 and 10.2.1 do not apply to: (a) a Party’s indemnification obligations for third-party intellectual-property claims under Article 11; (b) a Party’s breach of Article 6 (Confidentiality); (c) Provider’s breach of Article 7 or Exhibit C that results in a Security Incident caused by Provider’s willful misconduct or gross negligence; (d) fraud or fraudulent misrepresentation; (e) liability for death or bodily injury; or (f) Customer’s payment obligations. Nothing in this Article limits liability that cannot be limited under applicable law.

## Article 11 — Indemnification

*node_id `0037` · p. 15*

Provider indemnity. Provider will defend Customer and its officers and employees against any third-party claim alleging that the Platform, as provided by Provider and used in accordance with this Agreement, infringes a U.S. patent, copyright, or trademark, or misappropriates a trade secret, and will pay damages and reasonable attorneys’ fees finally awarded (or agreed in a settlement approved by Provider). If the Platform becomes, or in Provider’s opinion is likely to become, the subject of an injunction, Provider may: (i) procure the right to continue; (ii) replace or modify the Platform so it is non-infringing; or (iii) terminate the affected Services and refund unused prepaid fees. Provider has no obligation for claims arising from: Customer Data; combinations not supplied by Provider; use after Provider notifies Customer to stop due to a claim; or modifications by anyone other than Provider.

Customer indemnity. Customer will defend Provider against third-party claims arising from Customer Data, Customer’s instructions to send documents, or Customer’s use of the Services in violation of law or this Agreement, and will pay damages and reasonable attorneys’ fees finally awarded (or agreed in a Customer-approved settlement).

Procedure. The indemnified Party must give prompt written notice, grant exclusive control of defense and settlement (provided no settlement imposes an obligation on the indemnified Party other than payment of amounts the indemnifying Party funds), and provide reasonable cooperation at the indemnifying Party’s expense. This Article states the indemnifying Party’s sole liability, and the indemnified Party’s exclusive remedy, for third-party IP and Customer-content claims described above.

## Article 12 — Insurance

*node_id `0038` · p. 16*

During the Term, Provider will maintain, at its own expense, insurance substantially as follows (or greater as specified in Exhibit F): (a) Commercial General Liability of at least $2,000,000 per occurrence and $4,000,000 aggregate; (b) Professional Liability / Errors & Omissions of at least $5,000,000 per claim; (c) Cyber / Privacy Liability of at least $5,000,000 per occurrence, including notification and regulatory defense; (d) Workers’ Compensation as required by law; and (e) Automobile Liability of $1,000,000 if vehicles are used on Customer premises (not expected for this SaaS engagement).

Upon request, Provider will furnish certificates of insurance. Policies will be placed with insurers rated A- VII or better by A.M. Best (or equivalent). Provider’s insurance is primary with respect to Provider’s negligence. Additional insured status for CGL, and a waiver of subrogation, will be provided where required by Exhibit F and permitted by the insurer. Insurance does not limit Provider’s liability except as Article 10 already limits it.

## Article 13 — Term and Termination

*node_id `0039` · pp. 16–17*

This Article sets the commercial life of the MSA, how either Party can exit, and what happens to data and fees when the relationship ends.

### 13.1 Term and Renewal

*node_id `0040` · pp. 16–17*

This Agreement begins on the Effective Date and continues for an Initial Term of thirty-six (36) months. Thereafter it automatically renews for successive twelve (12) month periods unless either Party gives written notice of non-renewal at least sixty (60) days before the end of the then-current term. Each Order Form has the subscription term stated on its face; if silent, it follows the Initial Term and renewals of this Agreement. An Order Form in effect at non-renewal of the MSA continues until that Order Form’s own end date, governed by these terms.

### 13.2 Termination

*node_id `0041` · p. 17*

Termination rights are cumulative with non-renewal. Fees already due remain payable except as this Section provides a refund.

#### 13.2.1 Termination for Cause

*node_id `0042` · p. 17*

Either Party may terminate this Agreement or the affected Order Form if the other Party materially breaches and fails to cure within thirty (30) days after receiving written notice describing the breach in reasonable detail. Either Party may terminate immediately upon written notice if the other Party becomes insolvent, makes an assignment for creditors, or becomes the subject of bankruptcy proceedings that are not dismissed within sixty (60) days. If Customer terminates for Provider’s uncured material breach, Provider will refund prepaid unused subscription fees for the terminated period.

#### 13.2.2 Termination for Convenience

*node_id `0043` · p. 17*

After the Initial Term, either Party may terminate this Agreement for convenience by providing ninety (90) days’ prior written notice to the other Party. Convenience termination does not entitle Customer to a refund of prepaid fees, and Customer remains responsible for fees due through the effective termination date. Provider will not terminate for convenience solely to move Customer onto a materially diminished product without offering a commercially reasonable migration path during the notice period. Convenience termination cannot be exercised during the Initial Term except by mutual written agreement.

### 13.3 Effect of Termination

*node_id `0044` · p. 17*

Upon termination or expiration: (a) rights to access the Platform end, except a fifteen (15) day read-only export window for Customer administrators; (b) Provider’s deletion and export duties in Section 7.2 apply; (c) outstanding fees become due; and (d) licenses granted to Customer for Platform IP end except as Section 5.2 preserves static exported documents. Articles 5, 6, 7 (to the extent of deletion and residual processing), 10, 11, 14, and 15, and accrued payment obligations, survive. Termination is without prejudice to remedies accrued.

## Article 14 — Governing Law and Disputes

*node_id `0045` · p. 18*

The Parties select a single body of law and forum so disputes about a multi-state SaaS relationship have a predictable venue.

### 14.1 Governing Law

*node_id `0046` · p. 18*

This Agreement is governed by the laws of the State of Delaware, without regard to its conflict-of-laws rules. The United Nations Convention on Contracts for the International Sale of Goods does not apply. The Uniform Computer Information Transactions Act does not apply. Mandatory consumer or privacy laws that cannot be waived remain applicable to the extent required.

### 14.2 Exclusive Venue

*node_id `0047` · p. 18*

Subject to Section 14.3, the state and federal courts located in Wilmington, Delaware shall have exclusive jurisdiction over any dispute arising out of or relating to this Agreement, and each Party consents to personal jurisdiction and venue there. Each Party waives any objection of inconvenient forum. Either Party may still seek provisional injunctive relief in any court of competent jurisdiction to protect Confidential Information or intellectual property pending a decision on the merits.

### 14.3 Optional Arbitration for Smaller Claims

*node_id `0048` · p. 18*

Either Party may elect binding arbitration for a claim in which the amount in controversy is less than two hundred fifty thousand dollars ($250,000), exclusive of interest and fees. Arbitration will be administered by the American Arbitration Association under its Commercial Arbitration Rules, before a single arbitrator, sitting in Wilmington, Delaware. The arbitrator may award the same damages and relief a court could award, subject to Article 10. Judgment on the award may be entered in any court of competent jurisdiction. Class, collective, and representative actions are waived to the extent permitted by law. If a Party elects arbitration, the other Party will cooperate in good faith to commence proceedings within thirty (30) days.

## Article 15 — General Provisions

*node_id `0049` · p. 19*

Notices. Notices must be in writing and are effective when delivered by confirmed email to the legal contacts on the Order Form (with a copy to legal@luminsign.example and legal@acmeholdings.example) or by overnight courier to the addresses in the preamble.

Assignment. Neither Party may assign this Agreement without the other’s prior written consent, except to an Affiliate or in connection with a merger, acquisition, or sale of substantially all assets, provided the assignee is not a direct competitor of the non-assigning Party and assumes this Agreement in writing. Any other attempted assignment is void.

Force majeure. Neither Party is liable for delay or failure caused by events beyond its reasonable control, including natural disasters, war, terrorism, riots, embargoes, acts of government, epidemics, or widespread internet-backbone failures, provided it gives prompt notice and uses reasonable efforts to mitigate. If a force-majeure event continues more than sixty (60) days, either Party may terminate the affected Services.

Entire agreement; amendments; waiver. This Agreement (including Exhibits and Order Forms) is the entire agreement and supersedes all prior proposals and NDAs with respect to its subject matter (pre-existing NDAs continue for disclosures made under them before the Effective Date). Amendments must be in a writing signed by both Parties. A waiver must be signed and applies only to the instance described.

Export and government. Customer will not export the Platform in violation of U.S. export laws. If Customer is a U.S. government entity, the Services are “commercial computer software” under FAR 12.212 and DFARS 227.7202.

Relationship; third parties; counterparts. The Parties are independent contractors. No third-party beneficiaries except indemnified persons under Article 11. Electronic signatures and counterparts are valid. Provider may identify Customer as a customer on its website unless Customer objects in writing.

## Exhibit A — Statement of Work No. 1 (Implementation)

*node_id `0050` · p. 20*

Project name. Acme Holdings — Lumin Sign implementation (SOW-1).

Objectives. Enable production sending of MSAs, NDAs, and vendor onboarding packets from Acme’s legal operations team, with a review workspace that surfaces a hierarchical index for long-form agreements.

Scope. (1) Tenant provisioning in the U.S. region; (2) SAML SSO against Customer’s IdP for up to two domains; (3) migration of up to forty (40) existing signature templates; (4) configuration of one clause playbook covering limitation of liability, confidentiality, termination, data processing, IP, and governing law; (5) two ninety-minute live trainings for administrators and senders; (6) a sandbox-to-production checklist.

Out of scope. Custom development of Customer’s ERP; wet-ink courier workflows; legal advice on Customer’s playbook positions; more than two rounds of playbook edits.

Timeline. Eight (8) weeks from kickoff, assuming Customer returns SSO metadata and template exports within ten (10) business days. Estimated effort: one hundred twenty (120) hours.

Fees. Fixed fee of $48,000, invoiced 50% at kickoff and 50% at production go-live. Additional hours at $250 per hour under a change order.

Customer-owned deliverables. The configured clause playbook export and the migration inventory spreadsheet are Custom Deliverables under Section 5.2. Platform configuration remaining in the tenant is not a Custom Deliverable.

Assumptions. Customer names a single project owner; legal review of playbook positions occurs within five (5) business days per round.

## Exhibit B — Service Levels

*node_id `0051` · p. 21*

Monthly Uptime Percentage = (total minutes in month − Downtime) / total minutes in month, excluding Planned Maintenance (not to exceed four hours per calendar month, noticed at least 48 hours in advance) and exclusions in Article 2 and this Exhibit.

Commitment: 99.9% Monthly Uptime Percentage for the production Platform.

Credits (applied to the following month’s subscription fee, exclusive remedy): 99.0% up to but not including 99.9% → 5% credit; 95.0% up to but not including 99.0% → 15% credit; below 95.0% → 25% credit. Customer must request a credit within thirty (30) days after the affected month.

Support hours. Monday–Friday 06:00–18:00 Pacific, excluding U.S. federal holidays. Severity 1 (production unavailable for all users): initial response within one (1) hour during support hours and two (2) hours outside support hours. Severity 2 (major feature impaired): four (4) business hours. Severity 3 (minor or how-to): one (1) business day.

Status page. Provider will maintain a public or customer-authenticated status page. Scheduled maintenance is posted there and does not count as Downtime if within the Planned Maintenance envelope.

## Exhibit C — Data Processing Addendum

*node_id `0052` · p. 22*

This Data Processing Addendum (“DPA”) is part of the Agreement. Capitalized terms not defined here have the meanings in the Agreement or in Regulation (EU) 2016/679 (“GDPR”).

Subject matter and duration. Provider processes names, email addresses, signature images, IP addresses, device data, and document metadata of Authorized Users and of signers/viewers Customer invites, for the Term plus the deletion period in Section 7.2. Nature of processing: hosting, transmission, display, logging, and support. Purpose: providing the Services. Categories of data subjects: Customer personnel and external counterparties Customer invites.

Instructions. This DPA, the Agreement, and Customer’s use of Platform settings are the complete documented instructions. Additional instructions require a written change and may affect fees.

Transfers. The Parties incorporate the Controller-to-Processor Standard Contractual Clauses (Module Two) and, where Customer is a processor, Module Three, including the UK addendum. Annexes are deemed completed by this Exhibit, Exhibit D, and Exhibit E.

Audits. Customer may audit Provider’s relevant controls no more than once per twelve (12) months, on thirty (30) days’ notice, during business hours, subject to confidentiality and scoping to reduce disruption. Provider may satisfy an audit with a current SOC 2 Type II report plus a follow-up call, unless a regulator requires more.

CCPA/CPRA. Provider is a “service provider” and will not sell or share Personal Information or retain it except as permitted to provide the Services.

## Exhibit D — Security Attachment

*node_id `0053` · p. 23*

This Security Attachment describes Provider’s baseline controls. Provider may update controls if the update does not materially diminish protection.

Encryption. Customer Data is encrypted at rest with AES-256 (or current industry equivalent) and in transit with TLS 1.2 or higher. Keys are managed in a dedicated KMS with annual rotation and dual-control for production key access.

Assurance. Provider maintains a SOC 2 Type II report covering security and availability, produced by an independent auditor at least annually. ISO 27001 certification is a roadmap item and is not committed in this Agreement.

Access and logging. Production access requires MFA, is logged, and is reviewed quarterly. Application audit logs for signature events are retained for at least seven (7) years. Privileged access sessions to the production data plane are recorded.

Backups and recovery. Encrypted backups at least daily; recovery-point objective of twenty-four (24) hours and recovery-time objective of eight (8) hours for a full-region event. Tabletop exercises at least annually.

Vulnerability management. Critical vulnerabilities in production internet-facing systems targeted for mitigation within seven (7) days of a stable patch; high within thirty (30) days. Annual third-party penetration test.

Customer responsibilities. SSO configuration, user offboarding, classification of uploaded documents, and decisions to enable optional features such as external sharing links.

## Exhibit E — Subprocessor List

*node_id `0054` · p. 24*

Customer authorizes the following Subprocessors as of the Effective Date. Changes follow Section 7.3 (thirty days’ prior written notice).

Amazon Web Services, Inc. — cloud hosting and object storage — United States (us-east-1 / us-west-2). Processes Customer Data including document contents.

Twilio Inc. (SendGrid) — transactional email delivery of signature invitations and completion receipts — United States. Processes signer email addresses and envelope metadata (not full document bodies).

Zendesk, Inc. — support ticketing — United States. Processes contact information and the content of support requests Authorized Users submit.

Functional Software, Inc. (Sentry) — application error monitoring — United States. Processes technical diagnostics; Provider configures scrubbing to avoid document contents.

Datadog, Inc. — infrastructure and application performance monitoring — United States. Processes operational telemetry and may process IP addresses.

Provider will keep this list available in the Platform admin console. An RSS or email subscription for Subprocessor changes is available to Customer administrators. Objection and termination rights are in Section 7.3.

## Exhibit F — Insurance Requirements and Signature Block

*node_id `0055` · p. 25*

Provider will maintain the coverages in Article 12. Certificates will name “Acme Holdings LLC and its Affiliates” as additional insureds on the CGL policy with respect to Provider’s operations, and will include a waiver of subrogation in favor of Customer where available at commercially reasonable cost. Provider will endeavor to provide thirty (30) days’ notice of cancellation (ten days for non-payment). Self-insurance is not permitted for cyber liability.

Customer is not required to name Provider as additional insured. Each Party bears its own insurance costs.

IN WITNESS WHEREOF, the Parties have executed this Master Services Agreement as of the Effective Date.

LUMIN SIGN, INC. — Name: _______________________ Title: _______________________ Date: _______________

ACME HOLDINGS LLC — Name: _______________________ Title: _______________________ Date: _______________

Reviewer note (not part of the operative contract): Confirm Article 10 cap, Article 6 five-year confidentiality, Article 13 ninety-day convenience notice, Article 7 / Exhibits C–E data path, Article 5 deliverable ownership, and Article 14 Delaware / Wilmington venue before sending this packet for signature.
