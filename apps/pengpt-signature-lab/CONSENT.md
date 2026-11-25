# Volunteer handwriting consent (template)

Use this before capturing a real person’s handwriting for PenGPT Signature Lab.
This repository ships **fixture stand-ins only**. Do not commit customer signatures
or any sample collected without a signed copy of this form.

## 1. Who is collecting

- Organization / project: ________________________________
- Contact email: ________________________________________
- Date: ________________________________________________

## 2. What you are asked to provide

A short handwriting sample (photo of a few words **or** a draw-to-sign stroke
file) and, optionally, a drawn signature of a **non-production** name you choose
for the demo (for example a nickname, not your legal signature on a live contract).

## 3. How it will be used

- To condition PenGPT (open-weight handwriting model) so it can imitate the
  *style* of the sample and emit new stroke sequences.
- To compare those generated strokes with the sample in a **blind rating** and a
  **stroke-forensics** score, on a local machine.
- Generated files are labeled `synthetic: true` and shown with a **SYNTHETIC** mark.

## 4. What will not happen

- Your sample will not be uploaded to Cloudflare Pages or any public demo host.
- Your sample will not be used as a customer signature, identity document, or
  production Lumin Sign / Lumin ID credential.
- Weights and prompts will not be published with your legal name unless you
  initial here: ______ (optional, default is a code name).
- **Named-writer and stroke-file (numpy) generation stays on the operator’s
  machine.** The optional **photo → style** path is *not* local-only (see §5).
  Initial here if you **allow** that path: ______ / leave blank to **exclude** it.

## 5. Storage, deletion, and external transfer

Stroke JSON captured on the pad stays on the operator’s laptop (and, if you
agree, in a private fixture folder). You may ask for deletion at any time:
______________________________

**Photo transcription (optional, only if you initialled §4).** PenGPT’s
`inference/hand.py` sends **the photo or cropped word images** to **Anthropic
Claude** so the words can be labelled, using the operator’s `ANTHROPIC_API_KEY`.
InkSight tracing and style fit then run locally. This lab does not control
Anthropic’s retention; treat the photo as leaving the laptop. Pad JSON / named
writer generation does **not** use Claude.

## 6. Consent

I am 18 or older. I understand this is research about how cheap it is to fake
**drawn** signatures, not a request to forge a real one for fraud.

- Name (print): ________________________________
- Signature: ___________________________________
- Date: ________________________________________
- Code name in the lab (e.g. vol-e): ___________
