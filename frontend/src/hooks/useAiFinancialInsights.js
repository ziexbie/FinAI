"use client";

import { useEffect, useState } from "react";
import { fetchAiFinancialInsights } from "@/services/financeAnalyticsService";

export const useAiFinancialInsights = ({ userId, periodType, year, month, enabled = true }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAiInsights = async () => {
      if (!enabled || !userId || !year) {
        setAiInsights(null);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchAiFinancialInsights({ userId, periodType, year, month });

        if (isMounted) {
          setAiInsights(data.aiInsights || null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Unable to load Gemini AI insights right now.");
          setAiInsights(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAiInsights();

    return () => {
      isMounted = false;
    };
  }, [enabled, month, periodType, userId, year]);

  return { aiInsights, loading, error };
};
