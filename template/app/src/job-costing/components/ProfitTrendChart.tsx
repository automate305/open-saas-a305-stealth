import { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";

type WeeklyProfitPoint = {
  weekLabel: string;
  revenue: number;
  grossProfit: number;
};

export function ProfitTrendChart({
  weeklyTrend,
}: {
  weeklyTrend: WeeklyProfitPoint[];
}) {
  const series = useMemo(
    () => [
      { name: "Revenue", data: weeklyTrend.map((point) => point.revenue) },
      {
        name: "Gross Profit",
        data: weeklyTrend.map((point) => point.grossProfit),
      },
    ],
    [weeklyTrend],
  );

  const options: ApexOptions = useMemo(() => {
    const allValues = weeklyTrend.flatMap((point) => [
      point.revenue,
      point.grossProfit,
    ]);
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
    const minValue = allValues.length > 0 ? Math.min(0, ...allValues) : 0;

    return {
      legend: { show: true, position: "top", horizontalAlign: "left" },
      colors: ["#80CAEE", "#3C50E0"],
      chart: {
        fontFamily: "system-ui, sans-serif",
        height: 335,
        type: "area",
        toolbar: { show: false },
      },
      stroke: { width: [2, 2], curve: "smooth" },
      grid: {
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: "category",
        categories: weeklyTrend.map((point) => point.weekLabel),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: Math.floor(minValue / 100) * 100,
        max: Math.ceil(maxValue / 100) * 100 || 100,
        labels: { formatter: (value: number) => `$${Math.round(value)}` },
      },
    };
  }, [weeklyTrend]);

  return (
    <div className="border-border bg-card shadow-default pt-7.5 sm:px-7.5 rounded-sm border px-5 pb-5">
      <div className="mb-4">
        <p className="text-foreground font-semibold">
          Revenue vs. Gross Profit
        </p>
        <p className="text-muted-foreground text-sm font-medium">
          Last 8 Weeks
        </p>
      </div>
      <ReactApexChart options={options} series={series} type="area" height={335} />
    </div>
  );
}
