"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartColors = {
  expenses: "var(--danger)",
  predictedExpenses: "rgba(248, 113, 113, 0.42)",
  savings: "var(--accent)",
  predictedSavings: "#8d9891",
};

export default function PredictionChart({ chartData = [], formatCurrency }) {
  return (
    <article className="panel chart-panel prediction-chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Historical vs Predicted</p>
          <h3>Expenses and savings trend</h3>
        </div>
        <span className="meta-chip">{chartData.length > 0 ? `${chartData.length} periods` : "No series"}</span>
      </div>

      <div className="chart-wrap">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="period" stroke="var(--muted)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-strong)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                formatter={(value) => (value === null ? "No value" : formatCurrency(value))}
              />
              <Legend />
              <Bar dataKey="expenses" name="Past expenses" fill={chartColors.expenses} radius={[8, 8, 0, 0]} />
              <Bar
                dataKey="predictedExpenses"
                name="Predicted expenses"
                fill={chartColors.predictedExpenses}
                radius={[8, 8, 0, 0]}
              />
              <Line dataKey="savings" name="Past savings" stroke={chartColors.savings} strokeWidth={3} dot />
              <Line
                dataKey="predictedSavings"
                name="Predicted savings"
                stroke={chartColors.predictedSavings}
                strokeDasharray="5 5"
                strokeWidth={3}
                dot
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">Add monthly records to compare historical and predicted values.</div>
        )}
      </div>
    </article>
  );
}
