import { DollarSign, Percent, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "../../client/components/ui/card";
import { cn } from "../../client/utils";
import { formatCurrency } from "../formatting";

type Totals = {
  revenue: number;
  totalCost: number;
  grossProfit: number;
  avgMarginPct: number | null;
};

export function JobProfitabilityStatCards({ totals }: { totals: Totals }) {
  return (
    <div className="2xl:gap-7.5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <div className="bg-muted h-11.5 w-11.5 flex items-center justify-center rounded-full">
            <DollarSign className="size-6" />
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="text-title-md text-foreground font-bold">
            {formatCurrency(totals.revenue)}
          </h4>
          <span className="text-muted-foreground text-sm font-medium">
            Total Revenue
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-muted h-11.5 w-11.5 flex items-center justify-center rounded-full">
            <TrendingDown className="size-6" />
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="text-title-md text-foreground font-bold">
            {formatCurrency(totals.totalCost)}
          </h4>
          <span className="text-muted-foreground text-sm font-medium">
            Labor + Materials Cost
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-muted h-11.5 w-11.5 flex items-center justify-center rounded-full">
            <TrendingUp className="size-6" />
          </div>
        </CardHeader>
        <CardContent>
          <h4
            className={cn(
              "text-title-md font-bold",
              totals.grossProfit >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {formatCurrency(totals.grossProfit)}
          </h4>
          <span className="text-muted-foreground text-sm font-medium">
            Gross Profit
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-muted h-11.5 w-11.5 flex items-center justify-center rounded-full">
            <Percent className="size-6" />
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="text-title-md text-foreground font-bold">
            {totals.avgMarginPct !== null
              ? `${totals.avgMarginPct.toFixed(1)}%`
              : "-"}
          </h4>
          <span className="text-muted-foreground text-sm font-medium">
            Avg Gross Margin
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
