const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatWhen(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return dateTime.format(parsed);
}

export function statusLabel(status: string): string {
  switch (status) {
    case "awaiting_signature":
      return "Awaiting signature";
    case "completed":
      return "Completed";
    case "voided":
      return "Voided";
    case "draft":
      return "Draft";
    case "pending":
      return "Pending";
    case "signed":
      return "Signed";
    case "declined":
      return "Declined";
    default:
      return status;
  }
}
