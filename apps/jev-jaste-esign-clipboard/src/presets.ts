export type Preset = {
  id: string;
  label: string;
  hint: string;
  text: string;
};

export const PRESETS: Preset[] = [
  {
    id: "signers",
    label: "Signer list",
    hint: "Messy Slack dump of people to add",
    text: `hey can you add these to the envelope??

Maya Chen <maya.chen@acme.io> — signer
Jordan Hale — jordan.hale@acme.io (needs to sign too)
cc: legal@acme.io pls don't add as signer

thanks!!`,
  },
  {
    id: "address",
    label: "Address block",
    hint: "Notice / HQ address with chatter",
    text: `Ship / notice address (pls use this one not the old HQ):

Acme Robotics, Inc.
447 Market Street, Suite 1200
San Francisco, CA 94105
United States

attn: legal ops`,
  },
  {
    id: "clause",
    label: "Clause paragraph",
    hint: "Indemnification blob from email",
    text: `Drop this into Indemnification (we marked it up last night):

Each party shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, and agents from and against any third-party claims arising out of the indemnifying party's material breach of this Agreement or gross negligence, provided that the indemnified party gives prompt written notice. Cap is twelve months of fees.

THIS IS NOT CONFIDENTIAL — okay to paste into the workspace clause block.

— sent from my phone`,
  },
  {
    id: "mixed",
    label: "Mixed junk",
    hint: "Signers + address + clause + noise",
    text: `slack dump — ignore the gif

Priya Nair priya.nair@northwind.co signer
billing email: accounts@northwind.co
HQ: 88 Pier Avenue, Floor 4, Oakland, CA 94607

lol also can we use this limitation of liability:

IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY THEREOF, EXCEPT FOR BREACH OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS.

also someone pasted a wifi password: hunter2-demo (do not apply)`,
  },
  {
    id: "email",
    label: "Notice email",
    hint: "Single counterparty mailbox",
    text: `FYI the counterparty notice email is:

  contracts+msa@harborlegal.com

(not the personal gmail from last thread — ignore dana.personal@gmail.com)`,
  },
];
