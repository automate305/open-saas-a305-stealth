import { useState } from "react";
import { type AuthUser } from "wasp/auth";
import { getJobProfitabilityDashboard, useQuery } from "wasp/client/operations";
import { Breadcrumb } from "../admin/layout/Breadcrumb";
import { DefaultLayout } from "../admin/layout/DefaultLayout";
import { LoadingSpinner } from "../admin/layout/LoadingSpinner";
import { JobProfitabilityStatCards } from "./components/JobProfitabilityStatCards";
import { JobsProfitabilityTable } from "./components/JobsProfitabilityTable";
import { NewJobDialog } from "./components/NewJobDialog";
import { NewTechnicianDialog } from "./components/NewTechnicianDialog";
import { ProfitTrendChart } from "./components/ProfitTrendChart";
import { TechnicianProfitabilityTable } from "./components/TechnicianProfitabilityTable";

export function JobProfitabilityDashboardPage({ user }: { user: AuthUser }) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useQuery(getJobProfitabilityDashboard, {
    skipPages: currentPage - 1,
  });

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName="Job Profitability" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-sm">
          True profit per job — revenue minus real labor and materials cost,
          not just what you billed.
        </p>
        <div className="flex gap-3">
          <NewTechnicianDialog />
          <NewJobDialog />
        </div>
      </div>

      {error && (
        <div className="bg-card mb-6 rounded-lg p-6 shadow-lg">
          <p className="text-destructive font-bold">Error</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {error.message || "Something went wrong while fetching jobs."}
          </p>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {data && data.totals.jobCount === 0 && (
        <div className="bg-card rounded-lg p-8 text-center shadow-lg">
          <p className="text-foreground text-2xl font-bold">
            No jobs costed yet
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Add a technician and your first job above to see true
            profitability here.
          </p>
        </div>
      )}

      {data && data.totals.jobCount > 0 && (
        <div className="flex flex-col gap-4 md:gap-6">
          <JobProfitabilityStatCards totals={data.totals} />
          <ProfitTrendChart weeklyTrend={data.weeklyTrend} />
          <TechnicianProfitabilityTable rows={data.byTechnician} />
          <JobsProfitabilityTable
            rows={data.jobs.rows}
            totalPages={data.jobs.totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </DefaultLayout>
  );
}
