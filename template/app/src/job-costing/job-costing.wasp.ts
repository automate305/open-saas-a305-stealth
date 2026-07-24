import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { JobProfitabilityDashboardPage } from "./JobProfitabilityDashboardPage" with { type: "ref" };
import {
  createJob,
  createTechnician,
  getJobProfitabilityDashboard,
  getTechnicians,
} from "./operations" with { type: "ref" };

export const jobCostingSpec: Spec = [
  route(
    "AdminJobProfitabilityRoute",
    "/admin/job-profitability",
    page(JobProfitabilityDashboardPage, { authRequired: true }),
  ),

  query(getJobProfitabilityDashboard, {
    entities: ["Job", "JobLineItem", "LaborEntry", "Technician"],
  }),
  query(getTechnicians, { entities: ["Technician"] }),
  action(createTechnician, { entities: ["Technician"] }),
  action(createJob, { entities: ["Job", "JobLineItem", "LaborEntry", "Technician"] }),
];
