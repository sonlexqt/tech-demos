export type Preset = {
  id: string;
  label: string;
  hint: string;
  text: string;
};

export const PRESETS: Preset[] = [
  {
    id: "signers",
    label: "Ordered signers",
    hint: "Slack dump with ORDER groups + a CC",
    text: `hey can you wire the MSA countersign in Lumin? ORDER not same-time

1. Marcus Chen <marcus.chen@harborlegal.com> — external counsel (signs FIRST)
2. Priya Patel <priya.patel@acme.io> — Customer
3. Dana Okonkwo <dana.okonkwo@luminpdf.com> — internal VP (ID verify — driver_license)

cc: legal@acme.io pls don't add as signer

thanks!!`,
  },
  {
    id: "thread",
    label: "Thread + expiry",
    hint: "Title, October expiry, email subject, text tags",
    text: `Re: Acme Robotics — Master Services Agreement (FY26)

Can we send this today? Title should be Acme Robotics — Master Services Agreement (FY26)

please expire end of October
signing order: counsel → customer → VP (ORDER)

email subject: Please countersign the FY26 MSA
email title: FY26 MSA ready for signature
sender: contracts@luminpdf.com

use text tags on the PDF`,
  },
  {
    id: "mixed",
    label: "Mixed junk",
    hint: "Wifi + calendar noise; maybe one signer",
    text: `slack dump — ignore the gif

also the wifi is hunter2-demo do NOT put that in the request
calendar: https://calendar.google.com/calendar/event?eid=abc123

oh and loop Priya Patel priya.patel@acme.io as customer signer if she isn't already

random: someone said "expire never" lol no`,
  },
  {
    id: "viewer",
    label: "Viewer only",
    hint: "Deal desk visibility, not a signer",
    text: `FYI loop in finance as viewer only — they should not sign

Sam Rivera <finance@acme.io> — deal desk / viewer
(not a signer)

also maybe cc dana.personal@gmail.com — ignore that one`,
  },
];
