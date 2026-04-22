import api from "@/lib/api";
import { MONTH_OPTIONS } from "@/lib/financeConfig";

let expenseRowCounter = 0;

const currentDate = new Date();

export const currentMonth = currentDate.getMonth() + 1;
export const currentYear = currentDate.getFullYear();

export const yearOptions = Array.from({ length: 7 }, (_, index) => String(currentYear - 3 + index));

export const createExpenseRow = () => ({
  id: `expense-${Date.now()}-${expenseRowCounter++}`,
  category: "",
  amount: "",
});

export const createPeriodState = () => ({
  periodType: "monthly",
  month: String(currentMonth),
  year: String(currentYear),
});

export const createSummaryState = () => ({
  income: "",
  savings: "",
  investments: "",
  emergencyFund: "",
  debt: "",
  liabilities: "",
  loan: "",
});

export const getRecordKey = ({ periodType, year, month }) =>
  periodType === "monthly" ? `monthly-${year}-${month}` : `yearly-${year}`;

export const getPeriodLabel = ({ periodType, month, year }) =>
  periodType === "monthly"
    ? `${MONTH_OPTIONS.find((item) => String(item.value) === String(month))?.label || "Month"} ${year}`
    : `Yearly ${year}`;

export const normalizeExpenses = (expenses = []) =>
  expenses.length > 0
    ? expenses.map((expense) => ({
        id: expense.id || `expense-${Date.now()}-${expenseRowCounter++}`,
        category: expense.category || "",
        amount: expense.amount ?? "",
      }))
    : [createExpenseRow()];

export const mapRecordToPeriod = (record) => ({
  periodType: record.periodType,
  month: record.month ? String(record.month) : String(currentMonth),
  year: String(record.year),
});

export const mapRecordToSummary = (record) => ({
  income: String(record.income ?? ""),
  savings: String(record.savings ?? ""),
  investments: String(record.investments ?? ""),
  emergencyFund: String(record.emergencyFund ?? record.savings ?? ""),
  debt: String(record.debt ?? Number(record.liabilities || 0) + Number(record.loan || 0)),
  liabilities: String(record.liabilities ?? ""),
  loan: String(record.loan ?? ""),
});

export const buildFinanceFilters = (filters = {}) => {
  const params = {};

  if (filters.periodType && filters.periodType !== "all") {
    params.periodType = filters.periodType;
  }

  if (filters.year && filters.year !== "all") {
    params.year = filters.year;
  }

  if (params.periodType === "monthly" && filters.month && filters.month !== "all") {
    params.month = filters.month;
  }

  return params;
};

export const fetchSavedPeriods = async (userId, filters = {}) => {
  const response = await api.get(`/finance/user/${userId}`, {
    params: buildFinanceFilters(filters),
  });

  return response.data.financialData || [];
};

export const analyzeRisk = async ({
  income = 0,
  expenses = [],
  savings = 0,
  investments = 0,
  emergencyFund = 0,
  debt = 0,
  liabilities = 0,
  loan = 0,
}) => {
  const response = await api.post("/finance/analyze", {
    income,
    expenses,
    savings,
    investments,
    emergencyFund,
    debt,
    liabilities,
    loan,
  });

  return response.data;
};

export const buildFinanceEditHref = (record, edit) => {
  const params = new URLSearchParams({
    edit,
    periodType: record.periodType,
    year: String(record.year),
  });

  if (record.periodType === "monthly" && record.month) {
    params.set("month", String(record.month));
  }

  return `/finance?${params.toString()}`;
};

export const parseFinanceEditSearch = (search) => {
  const params = new URLSearchParams(search);
  const edit = params.get("edit");
  const periodType = params.get("periodType");
  const year = params.get("year");
  const month = params.get("month");

  if (!edit || !["summary", "expenses"].includes(edit)) {
    return null;
  }

  if (!periodType || !["monthly", "yearly"].includes(periodType) || !year) {
    return null;
  }

  if (periodType === "monthly" && !month) {
    return null;
  }

  return {
    edit,
    period: {
      periodType,
      year,
      month: periodType === "monthly" ? month : String(currentMonth),
    },
  };
};
