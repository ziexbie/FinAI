"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { EXPENSE_CATEGORIES, MONTH_OPTIONS } from "@/lib/financeConfig";
import api from "@/lib/api";
import {
  analyzeRisk,
  createExpenseRow,
  createPeriodState,
  createSummaryState,
  fetchSavedPeriods,
  getPeriodLabel,
  getRecordKey,
  mapRecordToPeriod,
  mapRecordToSummary,
  normalizeExpenses,
  parseFinanceEditSearch,
  yearOptions,
} from "@/lib/financeRecords";
import {
  getAiRecommendations,
  getHealthScore,
  getLiquidityMonths,
  getNetCashflow,
  getRiskPreview,
  getSavingsRate,
  getTotalExpenses,
} from "@/lib/financeInsights";

export default function FinancePage() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const csvInputRef = useRef(null);
  const summarySectionRef = useRef(null);
  const expenseSectionRef = useRef(null);
  const [periodForm, setPeriodForm] = useState(createPeriodState);
  const [summaryForm, setSummaryForm] = useState(createSummaryState);
  const [expenseRows, setExpenseRows] = useState([createExpenseRow()]);
  const [summaryError, setSummaryError] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("");
  const [expenseStatus, setExpenseStatus] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [csvStatus, setCsvStatus] = useState("");
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [submittingSection, setSubmittingSection] = useState("");
  const [savedPeriods, setSavedPeriods] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [editingSummaryKey, setEditingSummaryKey] = useState("");
  const [editingExpenseKey, setEditingExpenseKey] = useState("");
  const [pendingScrollTarget, setPendingScrollTarget] = useState("");
  const [pendingEditRequest, setPendingEditRequest] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const initialEditRequest = parseFinanceEditSearch(window.location.search);

    if (!initialEditRequest) {
      return;
    }

    setPeriodForm(initialEditRequest.period);
    setPendingEditRequest(initialEditRequest);
  }, []);

  useEffect(() => {
    const loadSavedPeriods = async () => {
      if (!user?.id) {
        return;
      }

      try {
        const periods = await fetchSavedPeriods(user.id);
        setSavedPeriods(periods);
      } catch (requestError) {
        console.error("Unable to load saved periods", requestError);
      } finally {
        setRecordsLoaded(true);
      }
    };

    loadSavedPeriods();
  }, [user?.id]);

  const selectedPeriodKey = getRecordKey(periodForm);
  const currentRecord = savedPeriods.find((record) => getRecordKey(record) === selectedPeriodKey) || null;
  const isPeriodLocked = Boolean(editingSummaryKey || editingExpenseKey);
  const isEditingSummary = editingSummaryKey === selectedPeriodKey;
  const isEditingExpenses = editingExpenseKey === selectedPeriodKey;
  const sanitizedDraftExpenses = expenseRows
    .filter((expense) => expense.category.trim() && expense.amount !== "")
    .map((expense) => ({
      category: expense.category.trim(),
      amount: Number(expense.amount || 0),
    }))
    .filter((expense) => Number.isFinite(expense.amount) && expense.amount >= 0);
  const hasDraftInput =
    Object.values(summaryForm).some((value) => value !== "") ||
    sanitizedDraftExpenses.length > 0;
  const previewRecord = hasDraftInput
    ? {
        periodType: periodForm.periodType,
        month: periodForm.periodType === "monthly" ? Number(periodForm.month) : null,
        year: Number(periodForm.year),
        income: Number(summaryForm.income || 0),
        savings: Number(summaryForm.savings || 0),
        investments: Number(summaryForm.investments || 0),
        emergencyFund: Number(summaryForm.emergencyFund || summaryForm.savings || 0),
        debt: Number(summaryForm.debt || 0),
        liabilities: Number(summaryForm.liabilities || 0),
        loan: Number(summaryForm.loan || 0),
        expenses: sanitizedDraftExpenses,
      }
    : currentRecord;
  const previewRisk = previewRecord
    ? hasDraftInput
      ? getRiskPreview(previewRecord)
      : riskResult || getRiskPreview(previewRecord)
    : null;
  const previewHealthScore = getHealthScore(previewRecord);
  const previewSavingsRate = getSavingsRate(previewRecord);
  const previewNetCashflow = getNetCashflow(previewRecord);
  const previewLiquidityMonths = getLiquidityMonths(previewRecord);
  const previewRecommendations = getAiRecommendations(previewRecord);
  const previewTotalExpenses = getTotalExpenses(previewRecord);

  useEffect(() => {
    const loadRisk = async () => {
      if (!currentRecord) {
        setRiskResult(null);
        return;
      }

      try {
        const analysis = await analyzeRisk(currentRecord);
        setRiskResult(analysis);
      } catch (requestError) {
        setRiskResult(null);
      }
    };

    loadRisk();
  }, [currentRecord]);

  useEffect(() => {
    if (!pendingScrollTarget) {
      return;
    }

    const sectionRef = pendingScrollTarget === "summary" ? summarySectionRef : expenseSectionRef;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setPendingScrollTarget("");
      });
    });
  }, [editingExpenseKey, editingSummaryKey, pendingScrollTarget]);

  useEffect(() => {
    if (!pendingEditRequest || !recordsLoaded) {
      return;
    }

    const requestedRecord = savedPeriods.find(
      (record) => getRecordKey(record) === getRecordKey(pendingEditRequest.period)
    );

    if (!requestedRecord) {
      if (pendingEditRequest.edit === "summary") {
        setSummaryError("That saved summary could not be found. Choose a period or create it first.");
      } else {
        setExpenseError("That saved expense record could not be found. Choose a period or create it first.");
      }

      setPendingEditRequest(null);

      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/finance");
      }

      return;
    }

    const loadRequestedEdit = async () => {
      setPeriodForm(mapRecordToPeriod(requestedRecord));

      if (pendingEditRequest.edit === "summary") {
        setSummaryForm(mapRecordToSummary(requestedRecord));
        setEditingSummaryKey(getRecordKey(requestedRecord));
        setEditingExpenseKey("");
        setSummaryError("");
        setSummaryStatus(`Loaded ${getPeriodLabel(requestedRecord)} into the financial summary form.`);
        setPendingScrollTarget("summary");
      } else {
        setExpenseRows(
          normalizeExpenses(requestedRecord.expenses).map((expense) => ({
            ...expense,
            amount: String(expense.amount ?? ""),
          }))
        );
        setEditingExpenseKey(getRecordKey(requestedRecord));
        setEditingSummaryKey("");
        setExpenseError("");
        setExpenseStatus(`Loaded ${getPeriodLabel(requestedRecord)} into the expense editor.`);
        setPendingScrollTarget("expenses");
      }

      try {
        const analysis = await analyzeRisk(requestedRecord);
        setRiskResult(analysis);
      } catch (requestError) {
        setRiskResult(null);
      }
    };

    void loadRequestedEdit();

    setPendingEditRequest(null);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/finance");
    }
  }, [pendingEditRequest, recordsLoaded, savedPeriods]);

  const updatePeriodField = (field, value) => {
    setPeriodForm((current) => ({ ...current, [field]: value }));
  };

  const updateSummaryField = (field, value) => {
    setSummaryForm((current) => ({ ...current, [field]: value }));
  };

  const updateExpenseRow = (index, field, value) => {
    setExpenseRows((currentRows) =>
      currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  };

  const addExpenseRow = () => {
    setExpenseRows((currentRows) => [...currentRows, createExpenseRow()]);
  };

  const removeExpenseRow = (index) => {
    setExpenseRows((currentRows) =>
      currentRows.length === 1 ? [createExpenseRow()] : currentRows.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const refreshSavedPeriods = async () => {
    if (!user?.id) {
      return [];
    }

    const periods = await fetchSavedPeriods(user.id);
    setSavedPeriods(periods);
    setRecordsLoaded(true);
    return periods;
  };

  const resetSummarySection = () => {
    setSummaryForm(createSummaryState());
    setSummaryError("");
    setSummaryStatus("");
    setEditingSummaryKey("");
    setPendingScrollTarget("");
  };

  const resetExpenseSection = () => {
    setExpenseRows([createExpenseRow()]);
    setExpenseError("");
    setExpenseStatus("");
    setEditingExpenseKey("");
    setPendingScrollTarget("");
  };

  const handleSaveSummary = async (event) => {
    event.preventDefault();
    setSubmittingSection("summary");
    setSummaryError("");
    setSummaryStatus("");

    const numericFields = {
      income: Number(summaryForm.income || 0),
      savings: Number(summaryForm.savings || 0),
      investments: Number(summaryForm.investments || 0),
      emergencyFund: Number(summaryForm.emergencyFund || summaryForm.savings || 0),
      debt: Number(summaryForm.debt || 0),
      liabilities: Number(summaryForm.liabilities || 0),
      loan: Number(summaryForm.loan || 0),
    };

    if (!user?.id) {
      setSummaryError("User session is missing. Please log in again.");
      setSubmittingSection("");
      return;
    }

    if (Object.values(numericFields).some((value) => Number.isNaN(value) || value < 0)) {
      setSummaryError("Summary values must be valid non-negative numbers.");
      setSubmittingSection("");
      return;
    }

    try {
      const payload = {
        userId: user.id,
        periodType: periodForm.periodType,
        year: Number(periodForm.year),
        month: periodForm.periodType === "monthly" ? Number(periodForm.month) : null,
        ...numericFields,
        expenses: currentRecord?.expenses || [],
      };

      const saveResponse = await api.post("/finance/add", payload);
      const analysis = await analyzeRisk(saveResponse.data.financialData);

      setRiskResult(analysis);
      setEditingSummaryKey(getRecordKey(saveResponse.data.financialData));
      setSummaryForm(mapRecordToSummary(saveResponse.data.financialData));
      setSummaryStatus(
        isEditingSummary ? "Financial summary updated successfully." : "Financial summary saved successfully."
      );
      await refreshSavedPeriods();
    } catch (requestError) {
      setSummaryError(requestError.response?.data?.message || "Unable to save the financial summary.");
    } finally {
      setSubmittingSection("");
    }
  };

  const handleUploadCsv = async (event) => {
    event.preventDefault();
    setCsvError("");
    setCsvStatus("");

    if (!user?.id) {
      setCsvError("User session is missing. Please log in again.");
      return;
    }

    if (!csvFile) {
      setCsvError("Choose a CSV file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("userId", user.id);
    formData.append("periodType", periodForm.periodType);
    formData.append("year", periodForm.year);

    if (periodForm.periodType === "monthly") {
      formData.append("month", periodForm.month);
    }

    try {
      setUploadingCsv(true);
      const response = await api.post("/finance/upload-csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedRecord = response.data.financialData;

      setSummaryForm(mapRecordToSummary(uploadedRecord));
      setExpenseRows(
        normalizeExpenses(uploadedRecord.expenses).map((expense) => ({
          ...expense,
          amount: String(expense.amount ?? ""),
        }))
      );
      setRiskResult(response.data.analysis || null);
      setCsvStatus(
        `CSV uploaded successfully. ${uploadedRecord.expenses.length} categories and ${formatCurrency(
          uploadedRecord.totalExpenses || 0
        )} in total expenses were calculated.`
      );
      setCsvFile(null);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
      await refreshSavedPeriods();
    } catch (requestError) {
      setCsvError(requestError.response?.data?.message || "Unable to upload the CSV right now.");
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleSaveExpenses = async (event) => {
    event.preventDefault();
    setSubmittingSection("expenses");
    setExpenseError("");
    setExpenseStatus("");

    const sanitizedExpenses = expenseRows
      .filter((expense) => expense.category.trim() && expense.amount !== "")
      .map((expense) => ({
        category: expense.category.trim(),
        amount: Number(expense.amount),
      }));

    if (!user?.id) {
      setExpenseError("User session is missing. Please log in again.");
      setSubmittingSection("");
      return;
    }

    if (sanitizedExpenses.some((expense) => Number.isNaN(expense.amount) || expense.amount < 0)) {
      setExpenseError("Each expense amount must be a valid non-negative number.");
      setSubmittingSection("");
      return;
    }

    try {
      const payload = {
        userId: user.id,
        periodType: periodForm.periodType,
        year: Number(periodForm.year),
        month: periodForm.periodType === "monthly" ? Number(periodForm.month) : null,
        income: currentRecord?.income || 0,
        savings: currentRecord?.savings || 0,
        investments: currentRecord?.investments || 0,
        liabilities: currentRecord?.liabilities || 0,
        loan: currentRecord?.loan || 0,
        expenses: sanitizedExpenses,
      };

      const saveResponse = await api.post("/finance/add", payload);
      const analysis = await analyzeRisk(saveResponse.data.financialData);

      setRiskResult(analysis);
      setEditingExpenseKey(getRecordKey(saveResponse.data.financialData));
      setExpenseRows(
        normalizeExpenses(saveResponse.data.financialData.expenses).map((expense) => ({
          ...expense,
          amount: String(expense.amount ?? ""),
        }))
      );
      setExpenseStatus(
        isEditingExpenses ? "Expense categories updated successfully." : "Expense categories saved successfully."
      );
      await refreshSavedPeriods();
    } catch (requestError) {
      setExpenseError(requestError.response?.data?.message || "Unable to save expense categories.");
    } finally {
      setSubmittingSection("");
    }
  };

  return (
    <ProtectedRoute>
      <DashboardShell
        title="Financial Input"
        description="A guided intake workspace for monthly or yearly records, with AI-assisted previewing while you type and cleaner handoff into saved-record management."
      >
        <section className="finance-layout">
          <div className="finance-main">
            <article className="panel workflow-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Guided Workflow</p>
                  <h3>Build a structured risk-ready record</h3>
                </div>
                <span className="meta-chip">{getPeriodLabel(periodForm)}</span>
              </div>

              <div className="workflow-grid">
                <div className="workflow-card">
                  <span className="workflow-step">1</span>
                  <strong>Select the period</strong>
                  <p>Choose the exact monthly or yearly window you want the AI manager to track.</p>
                </div>
                <div className="workflow-card">
                  <span className="workflow-step">2</span>
                  <strong>Import or enter data</strong>
                  <p>Upload transactions by CSV, then refine the financial summary and category rows.</p>
                </div>
                <div className="workflow-card">
                  <span className="workflow-step">3</span>
                  <strong>Review AI guidance</strong>
                  <p>Watch the live preview panel for risk, reserve strength, and next recommendations.</p>
                </div>
              </div>

              <div className="hero-actions">
                <button className="secondary-button" onClick={() => summarySectionRef.current?.scrollIntoView({ behavior: "smooth" })} type="button">
                  Jump to summary
                </button>
                <button className="secondary-button" onClick={() => expenseSectionRef.current?.scrollIntoView({ behavior: "smooth" })} type="button">
                  Jump to expenses
                </button>
                <Link className="secondary-button" href="/records">
                  Open records workspace
                </Link>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Period Selection</p>
                  <h3>{getPeriodLabel(periodForm)}</h3>
                </div>
                <span className="meta-chip">{currentRecord ? "Saved period detected" : "New period"}</span>
              </div>

              <div className="finance-grid">
                <label className="finance-field">
                  <span>Reporting Basis</span>
                  <select
                    disabled={isPeriodLocked}
                    value={periodForm.periodType}
                    onChange={(event) => updatePeriodField("periodType", event.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>

                <label className="finance-field">
                  <span>Year</span>
                  <select
                    disabled={isPeriodLocked}
                    value={periodForm.year}
                    onChange={(event) => updatePeriodField("year", event.target.value)}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                {periodForm.periodType === "monthly" ? (
                  <label className="finance-field">
                    <span>Month</span>
                    <select
                      disabled={isPeriodLocked}
                      value={periodForm.month}
                      onChange={(event) => updatePeriodField("month", event.target.value)}
                    >
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="finance-note">
                    <span>Scope</span>
                    <p>This record will summarize the full selected year.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">CSV Import</p>
                  <h3>Upload financial transactions</h3>
                </div>
                <span className="meta-chip">Current period</span>
              </div>

              <form className="finance-form" onSubmit={handleUploadCsv}>
                <div className="upload-panel">
                  <label className="finance-field">
                    <span>Transactions CSV</span>
                    <input
                      accept=".csv,text/csv"
                      className="file-input"
                      ref={csvInputRef}
                      onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                      type="file"
                    />
                  </label>

                  <div className="finance-note">
                    <span>Supported columns</span>
                    <p>Use `category` and `amount` at minimum. `date`, `description`, and `type` are also supported.</p>
                  </div>
                </div>

                {csvError ? <div className="banner error-banner">{csvError}</div> : null}
                {csvStatus ? <div className="banner success-banner">{csvStatus}</div> : null}

                <div className="form-actions">
                  <button className="primary-button" disabled={uploadingCsv} type="submit">
                    {uploadingCsv ? "Uploading..." : "Upload CSV"}
                  </button>
                </div>
              </form>
            </article>

            <article className="panel" ref={summarySectionRef}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Part 1</p>
                  <h3>Income and financial summary</h3>
                </div>
                {isEditingSummary ? <span className="meta-chip">Editing summary</span> : null}
              </div>

              {isEditingSummary ? (
                <div className="edit-banner">
                  <div>
                    <strong>Summary edit mode is active</strong>
                    <p>This updates income, savings, investments, emergency fund, debt, liabilities, and loan.</p>
                  </div>
                  <button className="secondary-button" onClick={resetSummarySection} type="button">
                    Cancel summary edit
                  </button>
                </div>
              ) : null}

              <form className="finance-form" onSubmit={handleSaveSummary}>
                <div className="finance-grid">
                  <label className="finance-field">
                    <span>Income</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.income}
                      onChange={(event) => updateSummaryField("income", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Savings</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.savings}
                      onChange={(event) => updateSummaryField("savings", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Investments</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.investments}
                      onChange={(event) => updateSummaryField("investments", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Emergency fund</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.emergencyFund}
                      onChange={(event) => updateSummaryField("emergencyFund", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Total debt</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.debt}
                      onChange={(event) => updateSummaryField("debt", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Liabilities</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.liabilities}
                      onChange={(event) => updateSummaryField("liabilities", event.target.value)}
                    />
                  </label>

                  <label className="finance-field">
                    <span>Loan</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={summaryForm.loan}
                      onChange={(event) => updateSummaryField("loan", event.target.value)}
                    />
                  </label>
                </div>

                {summaryError ? <div className="banner error-banner">{summaryError}</div> : null}
                {summaryStatus ? <div className="banner success-banner">{summaryStatus}</div> : null}

                <div className="form-actions">
                  <button className="primary-button" disabled={submittingSection === "summary"} type="submit">
                    {submittingSection === "summary"
                      ? "Saving..."
                      : isEditingSummary
                        ? "Update Summary"
                        : "Save Summary"}
                  </button>
                  <button className="secondary-button" onClick={resetSummarySection} type="button">
                    Clear summary
                  </button>
                </div>
              </form>
            </article>

            <article className="panel" ref={expenseSectionRef}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Part 2</p>
                  <h3>Categories and expenses</h3>
                </div>
                {isEditingExpenses ? <span className="meta-chip">Editing expenses</span> : null}
              </div>

              {isEditingExpenses ? (
                <div className="edit-banner">
                  <div>
                    <strong>Expense edit mode is active</strong>
                    <p>This updates only the category rows and expense amounts for the selected period.</p>
                  </div>
                  <button className="secondary-button" onClick={resetExpenseSection} type="button">
                    Cancel expense edit
                  </button>
                </div>
              ) : null}

              <form className="finance-form" onSubmit={handleSaveExpenses}>
                <div className="expenses-block">
                  <div className="expenses-header">
                    <div>
                      <p className="eyebrow">Expense Breakdown</p>
                      <h3>Category rows</h3>
                    </div>
                    <button className="secondary-button" onClick={addExpenseRow} type="button">
                      Add category
                    </button>
                  </div>

                  <div className="expense-list">
                    {expenseRows.map((expense, index) => (
                      <div className="expense-row" key={expense.id || `expense-row-${index}`}>
                        <label className="finance-field">
                          <span>Category</span>
                          <input
                            list={`expense-categories-${expense.id}`}
                            type="text"
                            value={expense.category}
                            onChange={(event) => updateExpenseRow(index, "category", event.target.value)}
                          />
                          <datalist id={`expense-categories-${expense.id}`}>
                            {EXPENSE_CATEGORIES.map((category) => (
                              <option key={category} value={category} />
                            ))}
                          </datalist>
                        </label>

                        <label className="finance-field">
                          <span>Amount</span>
                          <input
                            min="0"
                            step="0.01"
                            type="number"
                            value={expense.amount}
                            onChange={(event) => updateExpenseRow(index, "amount", event.target.value)}
                          />
                        </label>

                        <button
                          className="secondary-button danger-button"
                          onClick={() => removeExpenseRow(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {expenseError ? <div className="banner error-banner">{expenseError}</div> : null}
                {expenseStatus ? <div className="banner success-banner">{expenseStatus}</div> : null}

                <div className="form-actions">
                  <button className="primary-button" disabled={submittingSection === "expenses"} type="submit">
                    {submittingSection === "expenses"
                      ? "Saving..."
                      : isEditingExpenses
                        ? "Update Expenses"
                        : "Save Expenses"}
                  </button>
                  <button className="secondary-button" onClick={resetExpenseSection} type="button">
                    Clear expenses
                  </button>
                </div>
              </form>
            </article>
          </div>

          <div className="finance-side">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">AI Copilot</p>
                  <h3>Live risk preview</h3>
                </div>
                <span
                  className={
                    previewRisk?.riskLevel ? `risk-pill ${previewRisk.riskLevel.toLowerCase()}-risk` : "risk-pill"
                  }
                >
                  {previewRisk?.riskLevel || "Pending"}
                </span>
              </div>

              {previewRecord ? (
                <div className="analysis-panel">
                  <div className="summary-score-card">
                    <span>AI health score</span>
                    <strong>{previewHealthScore}/100</strong>
                    <p>{previewRisk?.message}</p>
                  </div>
                  <div className="detail-row">
                    <span>Selected period</span>
                    <strong>{getPeriodLabel(periodForm)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Projected expenses</span>
                    <strong>{formatCurrency(previewTotalExpenses)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Projected savings rate</span>
                    <strong>{previewSavingsRate}%</strong>
                  </div>
                  <div className="detail-row">
                    <span>Net cashflow</span>
                    <strong>{formatCurrency(previewNetCashflow)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Emergency fund</span>
                    <strong>{formatCurrency(previewRecord.emergencyFund || previewRecord.savings || 0)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Total debt</span>
                    <strong>
                      {formatCurrency(
                        previewRecord.debt || Number(previewRecord.liabilities || 0) + Number(previewRecord.loan || 0)
                      )}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Liquidity runway</span>
                    <strong>{previewLiquidityMonths} months</strong>
                  </div>

                  <div className="strategy-list compact">
                    {previewRecommendations.map((item) => (
                      <div className="strategy-item" key={item}>
                        <span className="strategy-bullet" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="analysis-placeholder">
                  <div className="analysis-step">
                    <span>1</span>
                    <p>Choose a monthly or yearly period at the top of the page.</p>
                  </div>
                  <div className="analysis-step">
                    <span>2</span>
                    <p>Save the financial summary, expense categories, or both for that period.</p>
                  </div>
                  <div className="analysis-step">
                    <span>3</span>
                    <p>The current risk result will refresh here for the selected period.</p>
                  </div>
                </div>
              )}
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Workspace Status</p>
                  <h3>Current period readiness</h3>
                </div>
                <span className="meta-chip">{savedPeriods.length} saved</span>
              </div>

              <div className="strategy-list">
                <div className="strategy-item">
                  <span className="strategy-bullet" />
                  <p>{currentRecord ? "An existing record is loaded for this period." : "This period does not have a saved record yet."}</p>
                </div>
                <div className="strategy-item">
                  <span className="strategy-bullet" />
                  <p>
                    {isEditingSummary || isEditingExpenses
                      ? "Edit mode is active, so the selected period is locked to avoid accidental record switching."
                      : "You can switch periods freely until you enter an edit flow."}
                  </p>
                </div>
                <div className="strategy-item">
                  <span className="strategy-bullet" />
                  <p>
                    {csvFile
                      ? `CSV ready to upload: ${csvFile.name}`
                      : "Upload a CSV if you want categories and total expenses generated automatically."}
                  </p>
                </div>
              </div>

              <div className="hero-actions">
                <Link className="primary-button" href="/records">
                  Manage saved records
                </Link>
              </div>
            </article>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
