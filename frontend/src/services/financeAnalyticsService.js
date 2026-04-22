import api from "@/lib/api";

export const fetchFinancialAnalytics = async ({ userId, periodType, year, month }) => {
  const params = {
    periodType,
    year,
  };

  if (periodType === "monthly" && month) {
    params.month = month;
  }

  const response = await api.get(`/finance/analytics/${userId}`, { params });
  return response.data;
};
