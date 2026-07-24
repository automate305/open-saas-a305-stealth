export enum JobStatus {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Invoiced = "invoiced",
  Cancelled = "cancelled",
}

export const jobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.Scheduled]: "Scheduled",
  [JobStatus.InProgress]: "In Progress",
  [JobStatus.Completed]: "Completed",
  [JobStatus.Invoiced]: "Invoiced",
  [JobStatus.Cancelled]: "Cancelled",
};
