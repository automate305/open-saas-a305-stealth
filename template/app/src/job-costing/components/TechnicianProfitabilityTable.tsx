import { cn } from "../../client/utils";
import { formatCurrency } from "../formatting";

type TechnicianProfitabilityRow = {
  id: string;
  name: string;
  jobCount: number;
  hoursWorked: number;
  laborCost: number;
  attributedRevenue: number;
  attributedGrossProfit: number;
};

export function TechnicianProfitabilityTable({
  rows,
}: {
  rows: TechnicianProfitabilityRow[];
}) {
  return (
    <div className="border-border bg-card rounded-sm border shadow-sm">
      <div className="border-border py-4.5 grid grid-cols-6 border-b px-4 md:px-6">
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Technician</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Jobs</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Hours</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Labor Cost</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Gross Profit*</p>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="text-muted-foreground p-6 text-sm">
          No labor logged against any job yet.
        </p>
      )}

      {rows.map((row) => (
        <div
          key={row.id}
          className="py-4.5 grid grid-cols-6 gap-2 px-4 md:px-6"
        >
          <div className="col-span-2 flex items-center">
            <p className="text-foreground text-sm">{row.name}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-foreground text-sm">{row.jobCount}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-foreground text-sm">
              {row.hoursWorked.toFixed(1)}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-foreground text-sm">
              {formatCurrency(row.laborCost)}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p
              className={cn(
                "text-sm font-medium",
                row.attributedGrossProfit >= 0
                  ? "text-success"
                  : "text-destructive",
              )}
            >
              {formatCurrency(row.attributedGrossProfit)}
            </p>
          </div>
        </div>
      ))}

      {rows.length > 0 && (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-xs md:px-6">
          *Gross profit on shared jobs is split across technicians
          proportional to hours worked.
        </p>
      )}
    </div>
  );
}
