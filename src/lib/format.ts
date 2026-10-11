import { SubmissionStatus } from "@prisma/client";

export function statusLabel(status: SubmissionStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "REOPENED":
      return "Reopened";
    default:
      return status;
  }
}
