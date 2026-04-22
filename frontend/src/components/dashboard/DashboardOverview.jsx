"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/components/DashboardShell";
import AiInsightsSection from "@/components/dashboard/AiInsightsSection";
import PredictionChart from "@/components/dashboard/PredictionChart";
import PredictionSection from "@/components/dashboard/PredictionSection";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useFinancialAnalytics } from "@/hooks/useFinancialAnalytics";
import api from "@/lib/api";
import { MONTH_OPTIONS } from "@/lib/financeConfig";
import {
  getAiRecommendations,
  getDebtAmount,
  getExpenseRatio,
  getHealthScore,
  getLiquidityMonths,
  getNetCashflow,
  getRecentRecords,
  getRiskDrivers,
  getRiskPreview,
  getSavingsRate,
  getTotalExpenses,
} from "@/lib/financeInsights";
import { getPeriodLabel } from "@/lib/financeRecords";

const riskToneMap = {
  Low: "low-risk",
  Medium: "medium-risk",
  High: "high-risk",
};

const overviewChartColors = ["var(--accent)", "var(--danger)", "#c7d0ca", "#8d9891", "#6c746e"];
const expenseChartColors = ["#c7d0ca", "#8d9891", "var(--accent)", "#6c746e", "var(--danger)"];

const now = new Date();
const defaultYear = String(now.getFullYear());
const defaultMonth = String(now.getMonth() + 1);

export default function DashboardOverview() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [allRecords, setAllRecords] = useState([]);
  const [financeRecord, setFinanceRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodType, setPeriodType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useFinancialAnalytics({
    userId: user?.id,
    periodType,
    year: selectedYear,
    month: selectedMonth,
  });

  useEffect(() => {
    const loadFinanceDashboard = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const financeResponse = await api.get(`/finance/user/${user.id}`);
        setAllRecords(financeResponse.data.financialData || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load the finance dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadFinanceDashboard();
  }, [user?.id]);

  useEffect(() => {
    const matchingRecords = allRecords.filter((record) => {
      if (record.periodType !== periodType) {
        return false;
      }

      if (String(record.year) !== String(selectedYear)) {
        return false;
      }

      if (periodType === "monthly" && String(record.month) !== String(selectedMonth)) {
        return false;
      }

      return true;
    });

    setFinanceRecord(matchingRecords[0] || null);
  }, [allRecords, periodType, selectedMonth, selectedYear]);

  const availableYears = Array.from(new Set(allRecords.map((record) => String(record.year)).concat(defaultYear))).sort(
    (left, right) => Number(right) - Number(left)
  );

  const availableMonths = MONTH_OPTIONS.filter((month) =>
    allRecords.some(
      (record) =>
        record.periodType === "monthly" &&
        String(record.year) === String(selectedYear) &&
        String(record.month) === String(month.value)
    )
  );

  useEffect(() => {
    if (periodType !== "monthly" || availableMonths.length === 0) {
      return;
    }

    const hasSelectedMonth = availableMonths.some((month) => String(month.value) === String(selectedMonth));

    if (!hasSelectedMonth) {
      setSelectedMonth(String(availableMonths[0].value));
    }
  }, [availableMonths, periodType, selectedMonth]);

  const totalExpenses = getTotalExpenses(financeRecord);
  const savingsRate = getSavingsRate(financeRecord);
  const expenseRatio = getExpenseRatio(financeRecord);
  const netCashflow = getNetCashflow(financeRecord);
  const liquidityMonths = getLiquidityMonths(financeRecord);
  const healthScore = getHealthScore(financeRecord);
  const fallbackRisk = financeRecord ? getRiskPreview(financeRecord) : null;
  const risk = analytics?.riskScore || fallbackRisk;
  const riskLevel = risk?.label || risk?.riskLevel;
  const riskDrivers = getRiskDrivers(financeRecord);
  const recommendations = analytics?.recommendations?.length ? analytics.recommendations : getAiRecommendations(financeRecord);
  const prediction = analytics?.prediction;
  const displayHealthScore = analytics?.riskScore?.healthScore ?? healthScore;
  const recentRecords = useMemo(() => getRecentRecords(allRecords, 4), [allRecords]);
  const selectedPeriodLabel =
    periodType === "monthly"
      ? `${MONTH_OPTIONS.find((item) => String(item.value) === String(selectedMonth))?.label || "Month"} ${selectedYear}`
      : `Yearly ${selectedYear}`;

  const summaryCards = [
    {
      label: "Health Score",
      value: financeRecord ? `${displayHealthScore}/100` : "Pending",
      detail: financeRecord ? "AI confidence signal built from spending, savings, and debt." : "Add data to score.",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate}%`,
      detail: financeRecord ? "Reserve strength against income." : "No selected record",
    },
    {
      label: "Expense Load",
      value: `${expenseRatio}%`,
      detail: financeRecord ? "Share of income consumed by expenses." : "Awaiting data",
    },
    {
      label: "Risk Level",
      value: riskLevel || "Not analyzed",
      detail: risk?.explanation || risk?.message || "Add finance data to generate a risk signal.",
      tone: riskLevel ? riskToneMap[riskLevel] : "",
    },
  ];

  const overviewChartData = [
    { name: "Income", value: financeRecord?.income || 0 },
    { name: "Expenses", value: totalExpenses },
    { name: "Savings", value: financeRecord?.savings || 0 },
    { name: "Emergency", value: financeRecord?.emergencyFund || financeRecord?.savings || 0 },
    { name: "Debt", value: getDebtAmount(financeRecord) },
  ];

  const expenseChartData =
    financeRecord?.expenses?.map((expense) => ({
      name: expense.category,
      value: expense.amount,
    })) || [];

  return (
    <ProtectedRoute>
      <DashboardShell
        title="Risk Overview"
        description="An AI-first command center for financial stability, highlighting risk signals, key drivers, and the next best actions for each period."
      >
        {loading ? <div className="panel dashboard-empty">Loading your finance dashboard...</div> : null}
        {error ? <div className="banner error-banner">{error}</div> : null}

        {!loading && !error ? (
          <>
            <section className="period-toolbar">
              <div className="toolbar-group">
                <label className="finance-field compact-field">
                  <span>Basis</span>
                  <select value={periodType} onChange={(event) => setPeriodType(event.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>

                <label className="finance-field compact-field">
                  <span>Year</span>
                  <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                {periodType === "monthly" ? (
                  <label className="finance-field compact-field">
                    <span>Month</span>
                    <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                      {(availableMonths.length > 0 ? availableMonths : MONTH_OPTIONS).map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="toolbar-summary">
                <span className="meta-chip">{selectedPeriodLabel}</span>
                <span className="meta-chip">{allRecords.length} saved periods</span>
              </div>
            </section>

            <section className="hero-panel command-brief">
              <div className="hero-copy">
                <p className="eyebrow">Dashboard Brief</p>
                <h2>
                  {riskLevel
                    ? `${riskLevel} risk posture for ${selectedPeriodLabel}`
                    : `Create a risk posture for ${selectedPeriodLabel}`}
                </h2>
                <p>
                  {risk?.explanation ||
                    risk?.message ||
                    "Create or upload a financial period to start generating an AI-assisted view of spending pressure, reserve strength, and debt exposure."}
                </p>
                <div className="brief-meta-row">
                  <span className="meta-chip">{user?.name || "Current user"}</span>
                  <span className="meta-chip">{riskLevel || "Pending risk"}</span>
                  <span className="meta-chip">{financeRecord ? getPeriodLabel(financeRecord) : "No selected record"}</span>
                </div>
                <div className="hero-actions">
                  <Link className="primary-button" href="/finance">
                    Update financial input
                  </Link>
                  <Link className="secondary-button" href="/records">
                    Review saved records
                  </Link>
                </div>
              </div>

              <div className="hero-metrics">
                <div className="hero-metric">
                  <span>Health score</span>
                  <strong>{financeRecord ? `${displayHealthScore}/100` : "Pending"}</strong>
                </div>
                <div className="hero-metric">
                  <span>Net cashflow</span>
                  <strong>{financeRecord ? formatCurrency(netCashflow) : "No data"}</strong>
                </div>
                <div className="hero-metric">
                  <span>Liquidity runway</span>
                  <strong>{financeRecord ? `${liquidityMonths} months` : "No data"}</strong>
                </div>
              </div>
            </section>

            {analyticsLoading ? <div className="panel dashboard-empty">Generating predictive analytics...</div> : null}
            {analyticsError ? <div className="banner error-banner">{analyticsError}</div> : null}

            <section className="analytics-grid">
              <RiskScoreCard riskScore={risk} />
              <PredictionSection prediction={prediction} formatCurrency={formatCurrency} />
            </section>

            <PredictionChart chartData={prediction?.chartData || []} formatCurrency={formatCurrency} />

            <section className="summary-grid kpi-grid">
              {summaryCards.map((card) => (
                <article key={card.label} className={card.tone ? `summary-card ${card.tone}` : "summary-card"}>
                  <span className="summary-label">{card.label}</span>
                  <strong className="summary-value">{card.value}</strong>
                  <p>{card.detail}</p>
                </article>
              ))}
            </section>

            {!financeRecord ? (
              <section className="panel dashboard-empty">
                <h3>No financial data yet</h3>
                <p>
                  Go to Financial Input and create a monthly or yearly finance record. Once a record exists, the AI
                  manager will start scoring risk, highlighting pressure points, and suggesting actions.
                </p>
              </section>
            ) : (
              <>
                <section className="panel-grid">
                  <AiInsightsSection recommendations={recommendations} />

                  <article className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Risk Drivers</p>
                        <h3>What is shaping the signal</h3>
                      </div>
                    </div>

                    <div className="driver-list">
                      {riskDrivers.map((driver) => (
                        <div className="driver-card" key={driver.label}>
                          <div className="driver-top">
                            <span>{driver.label}</span>
                            <strong className={`driver-badge ${driver.tone}`}>
                              {driver.valueType === "currency" ? formatCurrency(driver.value) : driver.value}
                            </strong>
                          </div>
                          <p>{driver.description}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="dashboard-grid">
                  <article className="panel chart-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Overview</p>
                        <h3>Income vs commitments</h3>
                      </div>
                    </div>

                    <div className="chart-wrap">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={overviewChartData}>
                          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--muted)" tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--surface-strong)",
                              border: "1px solid var(--border)",
                              borderRadius: "12px",
                              color: "var(--foreground)",
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            {overviewChartData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={overviewChartColors[index % overviewChartColors.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  <article className="panel chart-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Expenses</p>
                        <h3>Category mix</h3>
                      </div>
                    </div>

                    <div className="chart-wrap">
                      {expenseChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={expenseChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={70}
                              outerRadius={100}
                              paddingAngle={4}
                            >
                              {expenseChartData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={expenseChartColors[index % expenseChartColors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "var(--surface-strong)",
                                border: "1px solid var(--border)",
                                borderRadius: "12px",
                                color: "var(--foreground)",
                              }}
                              formatter={(value) => formatCurrency(value)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="chart-empty">No expense categories found in the latest record.</div>
                      )}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Operating Snapshot</p>
                        <h3>Current period summary</h3>
                      </div>
                      <span className={riskLevel ? `risk-pill ${riskToneMap[riskLevel]}` : "risk-pill"}>
                        {riskLevel || "Pending"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Selected period</span>
                      <strong>{getPeriodLabel(financeRecord)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total income</span>
                      <strong>{formatCurrency(financeRecord.income || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total expenses</span>
                      <strong>{formatCurrency(totalExpenses)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Investments</span>
                      <strong>{formatCurrency(financeRecord.investments || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Emergency fund</span>
                      <strong>{formatCurrency(financeRecord.emergencyFund || financeRecord.savings || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total debt</span>
                      <strong>{formatCurrency(getDebtAmount(financeRecord))}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Last update</span>
                      <strong>{new Date(financeRecord.createdAt).toLocaleDateString()}</strong>
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Recent Activity</p>
                        <h3>Latest saved periods</h3>
                      </div>
                    </div>

                    <div className="activity-list">
                      {recentRecords.map((record) => {
                        const recordRisk = getRiskPreview(record);

                        return (
                          <div className="activity-item" key={record._id || `${record.periodType}-${record.year}-${record.month || "year"}`}>
                            <div>
                              <strong>{getPeriodLabel(record)}</strong>
                              <p>
                                {formatCurrency(record.income || 0)} income and {formatCurrency(getTotalExpenses(record))} expenses
                              </p>
                            </div>
                            <span className={`risk-pill ${riskToneMap[recordRisk.riskLevel]}`}>{recordRisk.riskLevel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </section>
              </>
            )}
          </>
        ) : null}
      </DashboardShell>
    </ProtectedRoute>
  );
}
