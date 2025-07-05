// software/frontend/src/components/neighborhood-comparison.tsx
"use client";

import React from "react"; // Import React
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonData {
  average_score: number;
  your_score: number;
  // Add other potential comparison points if backend provides them
}
interface NeighborhoodComparisonProps {
  comparisonData: ComparisonData | null | undefined;
}

const formatChartData = (data: ComparisonData | null | undefined) => {
  if (!data) {
    return [
      { name: "Your Location", risk: 0, average: 0 },
      { name: "Baseline Average", risk: 0, average: 0 },
    ];
  }
  return [
    {
      name: "Your Location",
      risk: data.your_score,
      average: data.average_score,
    },
    {
      name: "Baseline Average",
      risk: data.average_score,
      average: data.average_score,
    }, // Example: Show average as its own bar
  ];
};

const getComparisonText = (data: ComparisonData | null | undefined) => {
  if (
    !data ||
    data.your_score === undefined ||
    data.average_score === undefined
  )
    return "Comparison data will appear here after assessment.";
  if (data.your_score > data.average_score) {
    const diff = data.your_score - data.average_score;
    return `This chart compares your location's fire risk score (${data.your_score}) with a baseline average (${data.average_score}). Your location currently has a higher risk score (+${diff} points).`;
  } else if (data.your_score < data.average_score) {
    const diff = data.average_score - data.your_score;
    return `This chart compares your location's fire risk score (${data.your_score}) with a baseline average (${data.average_score}). Your location currently has a lower risk score (-${diff} points).`;
  } else {
    return `This chart compares your location's fire risk score (${data.your_score}) with a baseline average (${data.average_score}). Your location's risk score matches the baseline average.`;
  }
};

const getRiskLevelText = (score: number | undefined): string => {
  if (score === undefined) return "-";
  if (score > 7) return "High";
  if (score > 4) return "Moderate";
  return "Low";
};

const getRiskLevelColor = (score: number | undefined): string => {
  if (score === undefined) return "text-gray-500";
  if (score > 7) return "text-red-500";
  if (score > 4) return "text-orange-500";
  return "text-green-600";
};

const getComparisonPercentage = (
  data: ComparisonData | null | undefined
): string => {
  if (!data || !data.average_score || data.your_score === undefined) return "-";
  if (data.average_score === 0) return data.your_score > 0 ? "+INF%" : "0%";
  const diff = data.your_score - data.average_score;
  const percentage = Math.round((diff / data.average_score) * 100);
  return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
};

const NeighborhoodComparison: React.FC<NeighborhoodComparisonProps> = ({
  comparisonData,
}) => {
  const chartData = formatChartData(comparisonData);
  const comparisonText = getComparisonText(comparisonData);
  const riskLevel = getRiskLevelText(comparisonData?.your_score);
  const riskColor = getRiskLevelColor(comparisonData?.your_score);
  const comparisonPercent = getComparisonPercentage(comparisonData);
  // Placeholder trend - could be derived if backend provides historical data
  const trendText = "Stable";
  const trendColor = "text-gray-500";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">{comparisonText}</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 10]}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: "12px", padding: "5px 10px" }}
              itemStyle={{ padding: "0" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar
              dataKey="risk"
              name="Risk Score"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="average"
              name="Baseline Avg"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Your Risk Level</p>
          <p className={`text-2xl font-bold ${riskColor}`}>{riskLevel}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Compared to Baseline</p>
          <p
            className={`text-2xl font-bold ${
              comparisonPercent.startsWith("+") && comparisonPercent !== "+0%"
                ? "text-red-500"
                : comparisonPercent.startsWith("-")
                ? "text-green-600"
                : "text-gray-500"
            }`}
          >
            {comparisonPercent}
          </p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Trend (Placeholder)</p>
          <p className={`text-2xl font-bold ${trendColor}`}>{trendText}</p>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodComparison;
