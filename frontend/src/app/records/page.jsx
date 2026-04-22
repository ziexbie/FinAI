"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { MONTH_OPTIONS } from "@/lib/financeConfig";
import {
  getAiRecommendations,
  getHealthScore,
  getRiskPreview,
  getTotalExpenses,
} from "@/lib/financeInsights";
import {
  buildFinanceEditHref,
  fetchSavedPeriods,
  getPeriodLabel,
  getRecordKey,
  yearOptions,
} from "@/lib/financeRecords";

export default function RecordsPage() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [filters, setFilters] = useState({
    periodType: "all",
    year: "all",
    month: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedRecordKey, setSelectedRecordKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecords = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const savedRecords = await fetchSavedPeriods(user.id, filters);
        setRecords(savedRecords);
      } catch (requestError) {
        setError("Unable to load saved records right now.");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [filters, user?.id]);

  const displayRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const periodLabel = getPeriodLabel(record).toLowerCase();
      const categories = (record.expenses || []).map((expense) => expense.category.toLowerCase()).join(" ");
      return periodLabel.includes(query) || categories.includes(query);
    });
  }, [records, searchTerm]);

  useEffect(() => {
    if (displayRecords.length === 0) {
      setSelectedRecordKey("");
      return;
    }

    const selectedStillExists = displayRecords.some((record) => getRecordKey(record) === selectedRecordKey);

    if (!selectedStillExists) {
      setSelectedRecordKey(getRecordKey(displayRecords[0]));
    }
  }, [displayRecords, selectedRecordKey]);

  const selectedRecord = displayRecords.find((record) => getRecordKey(record) === selectedRecordKey) || null;
  const selectedRisk = selectedRecord ? getRiskPreview(selectedRecord) : null;
  const selectedRecommendations = getAiRecommendations(selectedRecord);
  const selectedHealthScore = getHealthScore(selectedRecord);

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === "periodType" && value !== "monthly" ? { month: "all" } : {}),
    }));
  };

  const totalIncome = displayRecords.reduce((sum, record) => sum + Number(record.income || 0), 0);
  const totalExpenses = displayRecords.reduce((sum, record) => sum + getTotalExpenses(record), 0);
  const monthlyCount = displayRecords.filter((record) => record.periodType === "monthly").length;
  const yearlyCount = displayRecords.filter((record) => record.periodType === "yearly").length;
  const highRiskCount = displayRecords.filter((record) => getRiskPreview(record).riskLevel === "High").length;

  return (
    <ProtectedRoute>
      <DashboardShell
        title="Saved Records"
        description="A cleaner review workspace for browsing saved periods, searching categories, and reopening the right edit flow with AI context attached."
      >
        <section className="records-page">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Records Filters</p>
                <h3>Review your saved history</h3>
              </div>
              <Link className="primary-button" href="/finance">
                New financial input
              </Link>
            </div>

            <div className="records-toolbar">
              <div className="toolbar-group">
                <label className="finance-field compact-field">
                  <span>Reporting Basis</span>
                  <select value={filters.periodType} onChange={(event) => updateFilter("periodType", event.target.value)}>
                    <option value="all">All periods</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>

                <label className="finance-field compact-field">
                  <span>Year</span>
                  <select value={filters.year} onChange={(event) => updateFilter("year", event.target.value)}>
                    <option value="all">All years</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                {filters.periodType === "monthly" ? (
                  <label className="finance-field compact-field">
                    <span>Month</span>
                    <select value={filters.month} onChange={(event) => updateFilter("month", event.target.value)}>
                      <option value="all">All months</option>
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="finance-field records-search">
                  <span>Search</span>
                  <input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Find by period or category"
                    type="text"
                    value={searchTerm}
                  />
                </label>
              </div>
            </div>
          </article>

          <div className="summary-grid">
            <article className="summary-card">
              <span className="summary-label">Saved periods</span>
              <strong className="summary-value">{displayRecords.length}</strong>
              <p>{monthlyCount} monthly and {yearlyCount} yearly records in the current view.</p>
            </article>

            <article className="summary-card">
              <span className="summary-label">Combined income</span>
              <strong className="summary-value">{formatCurrency(totalIncome)}</strong>
              <p>Aggregated across the records shown by the active filters.</p>
            </article>

            <article className="summary-card">
              <span className="summary-label">Combined expenses</span>
              <strong className="summary-value">{formatCurrency(totalExpenses)}</strong>
              <p>Summed from all saved expense categories in this view.</p>
            </article>

            <article className="summary-card">
              <span className="summary-label">High-risk periods</span>
              <strong className="summary-value">{highRiskCount}</strong>
              <p>Heuristic count based on spending pressure and reserve weakness.</p>
            </article>
          </div>

          {error ? <div className="banner error-banner">{error}</div> : null}

          <section className="records-layout">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Saved Records</p>
                  <h3>Monthly and yearly entries</h3>
                </div>
                {loading ? <span className="meta-chip">Loading</span> : <span className="meta-chip">{displayRecords.length} found</span>}
              </div>

              {displayRecords.length > 0 ? (
                <div className="records-list">
                  {displayRecords.map((record) => {
                    const recordKey = getRecordKey(record);
                    const isSelected = recordKey === selectedRecordKey;
                    const recordRisk = getRiskPreview(record);
                    const recordHealthScore = getHealthScore(record);

                    return (
                      <div className={isSelected ? "record-card active" : "record-card"} key={record._id || recordKey}>
                        <div className="record-card-top">
                          <div>
                            <strong>{getPeriodLabel(record)}</strong>
                            <p>
                              {(record.expenses || []).length} categories, {formatCurrency(record.income || 0)} income
                            </p>
                          </div>
                          <div className="record-card-meta">
                            <span className={`risk-pill ${recordRisk.riskLevel.toLowerCase()}-risk`}>{recordRisk.riskLevel}</span>
                            <span className="meta-chip">Score {recordHealthScore}</span>
                          </div>
                        </div>

                        <div className="record-card-actions">
                          <button className="secondary-button" onClick={() => setSelectedRecordKey(recordKey)} type="button">
                            {isSelected ? "Viewing" : "View details"}
                          </button>
                          <Link className="secondary-button" href={buildFinanceEditHref(record, "summary")}>
                            Edit summary
                          </Link>
                          <Link className="secondary-button" href={buildFinanceEditHref(record, "expenses")}>
                            Edit expenses
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dashboard-empty">
                  {loading ? "Loading saved records..." : "No saved records match the current filters or search."}
                </div>
              )}
            </article>

            <div className="records-side">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">AI Review</p>
                    <h3>{selectedRecord ? getPeriodLabel(selectedRecord) : "Choose a record"}</h3>
                  </div>
                  <span className={selectedRisk ? `risk-pill ${selectedRisk.riskLevel.toLowerCase()}-risk` : "risk-pill"}>
                    {selectedRisk?.riskLevel || "Pending"}
                  </span>
                </div>

                {selectedRecord ? (
                  <div className="analysis-panel">
                    <div className="summary-score-card">
                      <span>Health score</span>
                      <strong>{selectedHealthScore}/100</strong>
                      <p>{selectedRisk?.message}</p>
                    </div>
                    <div className="detail-row">
                      <span>Income</span>
                      <strong>{formatCurrency(selectedRecord.income || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total expenses</span>
                      <strong>{formatCurrency(getTotalExpenses(selectedRecord))}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Savings</span>
                      <strong>{formatCurrency(selectedRecord.savings || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Investments</span>
                      <strong>{formatCurrency(selectedRecord.investments || 0)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Liabilities + loan</span>
                      <strong>{formatCurrency((selectedRecord.liabilities || 0) + (selectedRecord.loan || 0))}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-empty">Select a saved record to inspect its summary and risk signal.</div>
                )}
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Recommended Actions</p>
                    <h3>Next moves for this record</h3>
                  </div>
                </div>

                <div className="strategy-list compact">
                  {selectedRecommendations.map((item) => (
                    <div className="strategy-item" key={item}>
                      <span className="strategy-bullet" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Expense Breakdown</p>
                    <h3>Saved categories</h3>
                  </div>
                </div>

                {selectedRecord?.expenses?.length ? (
                  <div className="record-expense-list">
                    {selectedRecord.expenses.map((expense, index) => (
                      <div className="record-expense-item" key={`${selectedRecordKey}-${expense.category}-${index}`}>
                        <span>{expense.category}</span>
                        <strong>{formatCurrency(expense.amount || 0)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty">No saved expense categories for this record yet.</div>
                )}
              </article>
            </div>
          </section>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
