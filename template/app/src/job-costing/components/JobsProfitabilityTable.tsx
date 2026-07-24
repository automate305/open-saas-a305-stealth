import { Input } from "../../client/components/ui/input";
import { cn } from "../../client/utils";
import { formatCurrency } from "../formatting";
import { jobStatusLabels, JobStatus } from "../status";

type JobProfitabilityRow = {
  id: string;
  customerName: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  invoiceAmount: number;
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number | null;
};

function marginBadgeClasses(marginPct: number | null): string {
  if (marginPct === null) return "bg-muted text-muted-foreground";
  if (marginPct < 20) return "bg-destructive/10 text-destructive";
  if (marginPct < 40) return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
}

function statusLabel(status: string): string {
  return jobStatusLabels[status as JobStatus] ?? status;
}

export function JobsProfitabilityTable({
  rows,
  totalPages,
  currentPage,
  onPageChange,
}: {
  rows: JobProfitabilityRow[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="border-border bg-card rounded-sm border shadow-sm">
      <div className="flex items-center justify-between p-4 md:p-6">
        <p className="font-medium">Jobs</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">page</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const value = parseInt(e.currentTarget.value);
                if (value > 0 && value <= totalPages) onPageChange(value);
              }}
              className="w-20"
            />
            <span className="text-muted-foreground text-sm">
              / {totalPages}
            </span>
          </div>
        )}
      </div>

      <div className="border-border py-4.5 grid grid-cols-12 border-y px-4 md:px-6">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Customer</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Date</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Revenue</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Cost</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Gross Profit</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Margin</p>
        </div>
      </div>

      {rows.map((job) => (
        <div
          key={job.id}
          className="py-4.5 grid grid-cols-12 gap-2 px-4 md:px-6"
        >
          <div className="col-span-3 flex flex-col justify-center gap-1">
            <p className="text-foreground text-sm">{job.customerName}</p>
            <p className="text-muted-foreground text-xs">
              {statusLabel(job.status)}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-muted-foreground text-sm">
              {(job.completedAt ?? job.scheduledAt)?.toLocaleDateString() ??
                "-"}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-foreground text-sm">
              {formatCurrency(job.invoiceAmount)}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-foreground text-sm">
              {formatCurrency(job.totalCost)}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p
              className={cn(
                "text-sm font-medium",
                job.grossProfit >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {formatCurrency(job.grossProfit)}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                marginBadgeClasses(job.marginPct),
              )}
            >
              {job.marginPct !== null ? `${job.marginPct.toFixed(0)}%` : "-"}
            </span>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <p className="text-muted-foreground p-6 text-sm">
          No jobs on this page.
        </p>
      )}
    </div>
  );
}
