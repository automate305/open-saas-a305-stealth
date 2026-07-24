import type { Job, JobLineItem, LaborEntry, Technician } from "wasp/entities";
import { HttpError } from "wasp/server";
import type {
  CreateJob,
  CreateTechnician,
  GetJobProfitabilityDashboard,
  GetTechnicians,
} from "wasp/server/operations";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { JobStatus } from "./status";

//#region Actions
const createTechnicianInputSchema = z.object({
  name: z.string().nonempty(),
  hourlyCost: z.number().nonnegative(),
});

type CreateTechnicianInput = z.infer<typeof createTechnicianInputSchema>;

export const createTechnician: CreateTechnician<
  CreateTechnicianInput,
  Technician
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  const { name, hourlyCost } = ensureArgsSchemaOrThrowHttpError(
    createTechnicianInputSchema,
    rawArgs,
  );

  return context.entities.Technician.create({
    data: {
      name,
      hourlyCost,
      user: { connect: { id: context.user.id } },
    },
  });
};

const createJobInputSchema = z.object({
  customerName: z.string().nonempty(),
  address: z.string().optional(),
  status: z.nativeEnum(JobStatus).default(JobStatus.Completed),
  scheduledAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  invoiceAmount: z.number().nonnegative(),
  lineItems: z
    .array(
      z.object({
        description: z.string().nonempty(),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .default([]),
  laborEntries: z
    .array(
      z.object({
        technicianId: z.string().nonempty(),
        hours: z.number().positive(),
      }),
    )
    .default([]),
});

type CreateJobInput = z.infer<typeof createJobInputSchema>;

type JobWithCosting = Job & {
  lineItems: JobLineItem[];
  laborEntries: LaborEntry[];
};

export const createJob: CreateJob<CreateJobInput, JobWithCosting> = async (
  rawArgs,
  context,
) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  const {
    customerName,
    address,
    status,
    scheduledAt,
    completedAt,
    invoiceAmount,
    lineItems,
    laborEntries,
  } = ensureArgsSchemaOrThrowHttpError(createJobInputSchema, rawArgs);

  const technicianIds = [
    ...new Set(laborEntries.map((entry) => entry.technicianId)),
  ];
  const technicians =
    technicianIds.length > 0
      ? await context.entities.Technician.findMany({
          where: { id: { in: technicianIds }, userId: context.user.id },
        })
      : [];
  const technicianById = new Map(technicians.map((t) => [t.id, t]));

  for (const entry of laborEntries) {
    if (!technicianById.has(entry.technicianId)) {
      throw new HttpError(400, "Unknown technician");
    }
  }

  return context.entities.Job.create({
    data: {
      user: { connect: { id: context.user.id } },
      customerName,
      address,
      status,
      scheduledAt,
      completedAt,
      invoiceAmount,
      lineItems: {
        create: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
      laborEntries: {
        create: laborEntries.map((entry) => ({
          technician: { connect: { id: entry.technicianId } },
          hours: entry.hours,
          // Snapshot the technician's current cost so later rate changes
          // don't retroactively change this job's historical profitability.
          hourlyCost: technicianById.get(entry.technicianId)!.hourlyCost,
        })),
      },
    },
    include: { lineItems: true, laborEntries: true },
  });
};
//#endregion

//#region Queries
export const getTechnicians: GetTechnicians<void, Technician[]> = async (
  _args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  return context.entities.Technician.findMany({
    where: { userId: context.user.id, isActive: true },
    orderBy: { name: "asc" },
  });
};

const getJobProfitabilityDashboardInputSchema = z.object({
  skipPages: z.number().nonnegative().default(0),
});

type GetJobProfitabilityDashboardInput = z.infer<
  typeof getJobProfitabilityDashboardInputSchema
>;

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

type TechnicianProfitabilityRow = {
  id: string;
  name: string;
  jobCount: number;
  hoursWorked: number;
  laborCost: number;
  attributedRevenue: number;
  attributedGrossProfit: number;
};

type WeeklyProfitPoint = {
  weekLabel: string;
  revenue: number;
  grossProfit: number;
};

type JobProfitabilityDashboard = {
  totals: {
    jobCount: number;
    revenue: number;
    materialsCost: number;
    laborCost: number;
    totalCost: number;
    grossProfit: number;
    avgMarginPct: number | null;
  };
  weeklyTrend: WeeklyProfitPoint[];
  byTechnician: TechnicianProfitabilityRow[];
  jobs: {
    rows: JobProfitabilityRow[];
    totalPages: number;
  };
};

type CostedJob = Job & {
  lineItems: JobLineItem[];
  laborEntries: LaborEntry[];
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number | null;
};

const JOB_PAGE_SIZE = 10;
const WEEKS_OF_TREND = 8;

export const getJobProfitabilityDashboard: GetJobProfitabilityDashboard<
  GetJobProfitabilityDashboardInput,
  JobProfitabilityDashboard
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  const { skipPages } = ensureArgsSchemaOrThrowHttpError(
    getJobProfitabilityDashboardInputSchema,
    rawArgs,
  );

  // A single HVAC shop's job volume is small enough (hundreds to low
  // thousands a year) that pulling all jobs and costing them in memory is
  // simpler and plenty fast, rather than re-deriving these aggregates in SQL.
  const [jobs, technicians] = await Promise.all([
    context.entities.Job.findMany({
      where: { userId: context.user.id },
      include: { lineItems: true, laborEntries: true },
    }),
    context.entities.Technician.findMany({
      where: { userId: context.user.id },
    }),
  ]);

  const costedJobs: CostedJob[] = jobs
    .map((job) => ({ ...job, ...costJob(job) }))
    .sort((a, b) => jobDate(b).getTime() - jobDate(a).getTime());

  const totals = costedJobs.reduce(
    (acc, job) => {
      acc.revenue += job.invoiceAmount;
      acc.materialsCost += job.materialsCost;
      acc.laborCost += job.laborCost;
      acc.totalCost += job.totalCost;
      acc.grossProfit += job.grossProfit;
      return acc;
    },
    { revenue: 0, materialsCost: 0, laborCost: 0, totalCost: 0, grossProfit: 0 },
  );
  const avgMarginPct =
    totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : null;

  const weeklyTrend = buildWeeklyTrend(costedJobs);
  const byTechnician = buildTechnicianBreakdown(costedJobs, technicians);

  const totalPages = Math.max(1, Math.ceil(costedJobs.length / JOB_PAGE_SIZE));
  const pageRows: JobProfitabilityRow[] = costedJobs
    .slice(skipPages * JOB_PAGE_SIZE, skipPages * JOB_PAGE_SIZE + JOB_PAGE_SIZE)
    .map((job) => ({
      id: job.id,
      customerName: job.customerName,
      status: job.status,
      scheduledAt: job.scheduledAt,
      completedAt: job.completedAt,
      invoiceAmount: job.invoiceAmount,
      materialsCost: job.materialsCost,
      laborCost: job.laborCost,
      totalCost: job.totalCost,
      grossProfit: job.grossProfit,
      marginPct: job.marginPct,
    }));

  return {
    totals: {
      jobCount: costedJobs.length,
      revenue: totals.revenue,
      materialsCost: totals.materialsCost,
      laborCost: totals.laborCost,
      totalCost: totals.totalCost,
      grossProfit: totals.grossProfit,
      avgMarginPct,
    },
    weeklyTrend,
    byTechnician,
    jobs: { rows: pageRows, totalPages },
  };
};
//#endregion

function jobDate(job: Pick<Job, "completedAt" | "scheduledAt" | "createdAt">) {
  return job.completedAt ?? job.scheduledAt ?? job.createdAt;
}

function costJob(
  job: Job & { lineItems: JobLineItem[]; laborEntries: LaborEntry[] },
) {
  const materialsCost = job.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  const laborCost = job.laborEntries.reduce(
    (sum, entry) => sum + entry.hours * entry.hourlyCost,
    0,
  );
  const totalCost = materialsCost + laborCost;
  const grossProfit = job.invoiceAmount - totalCost;
  const marginPct =
    job.invoiceAmount > 0 ? (grossProfit / job.invoiceAmount) * 100 : null;

  return { materialsCost, laborCost, totalCost, grossProfit, marginPct };
}

function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

function buildWeeklyTrend(costedJobs: CostedJob[]): WeeklyProfitPoint[] {
  const bucketsByWeekStart = new Map<
    string,
    { revenue: number; grossProfit: number }
  >();

  for (const job of costedJobs) {
    const weekStart = startOfWeek(jobDate(job));
    const key = weekStart.toISOString();
    const bucket = bucketsByWeekStart.get(key) ?? {
      revenue: 0,
      grossProfit: 0,
    };
    bucket.revenue += job.invoiceAmount;
    bucket.grossProfit += job.grossProfit;
    bucketsByWeekStart.set(key, bucket);
  }

  const currentWeekStart = startOfWeek(new Date());
  const weeklyTrend: WeeklyProfitPoint[] = [];
  for (let i = WEEKS_OF_TREND - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    const bucket = bucketsByWeekStart.get(weekStart.toISOString()) ?? {
      revenue: 0,
      grossProfit: 0,
    };
    weeklyTrend.push({
      weekLabel: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      revenue: bucket.revenue,
      grossProfit: bucket.grossProfit,
    });
  }

  return weeklyTrend;
}

function buildTechnicianBreakdown(
  costedJobs: CostedJob[],
  technicians: Technician[],
): TechnicianProfitabilityRow[] {
  type TechAgg = {
    hoursWorked: number;
    laborCost: number;
    jobIds: Set<string>;
    attributedRevenue: number;
    attributedGrossProfit: number;
  };
  const aggByTechnicianId = new Map<string, TechAgg>();

  for (const job of costedJobs) {
    const totalHoursOnJob = job.laborEntries.reduce(
      (sum, entry) => sum + entry.hours,
      0,
    );

    for (const entry of job.laborEntries) {
      const agg = aggByTechnicianId.get(entry.technicianId) ?? {
        hoursWorked: 0,
        laborCost: 0,
        jobIds: new Set<string>(),
        attributedRevenue: 0,
        attributedGrossProfit: 0,
      };

      // Split a shared job's revenue/profit across technicians proportional
      // to hours worked (an even split if, oddly, no hours were logged).
      const share =
        totalHoursOnJob > 0
          ? entry.hours / totalHoursOnJob
          : 1 / job.laborEntries.length;

      agg.hoursWorked += entry.hours;
      agg.laborCost += entry.hours * entry.hourlyCost;
      agg.jobIds.add(job.id);
      agg.attributedRevenue += job.invoiceAmount * share;
      agg.attributedGrossProfit += job.grossProfit * share;

      aggByTechnicianId.set(entry.technicianId, agg);
    }
  }

  return technicians
    .map((technician) => {
      const agg = aggByTechnicianId.get(technician.id);
      return {
        id: technician.id,
        name: technician.name,
        jobCount: agg?.jobIds.size ?? 0,
        hoursWorked: agg?.hoursWorked ?? 0,
        laborCost: agg?.laborCost ?? 0,
        attributedRevenue: agg?.attributedRevenue ?? 0,
        attributedGrossProfit: agg?.attributedGrossProfit ?? 0,
      };
    })
    .filter((row) => row.jobCount > 0)
    .sort((a, b) => b.attributedGrossProfit - a.attributedGrossProfit);
}
