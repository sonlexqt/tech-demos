# Envelope notes — ENV-NDA-NORTHWIND

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
