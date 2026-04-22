"use client";

import { useEffect, useState } from "react";
import { fetchFinancialAnalytics } from "@/services/financeAnalyticsService";

export const useFinancialAnalytics = ({ userId, periodType, year, month }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      if (!userId || !year) {
        setAnalytics(null);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchFinancialAnalytics({ userId, periodType, year, month });

        if (isMounted) {
          setAnalytics(data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Unable to load predictive analytics right now.");
          setAnalytics(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [month, periodType, userId, year]);

  return { analytics, loading, error };
};
