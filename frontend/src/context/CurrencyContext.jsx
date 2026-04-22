"use client";

import { createContext, useContext, useMemo, useState } from "react";

const CurrencyContext = createContext(null);
const STORAGE_KEY = "finance_currency";

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "EUR" },
  { code: "GBP", label: "British Pound", symbol: "GBP" },
  { code: "INR", label: "Indian Rupee", symbol: "INR" },
  { code: "JPY", label: "Japanese Yen", symbol: "JPY" },
];

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window === "undefined") {
      return "USD";
    }

    return window.localStorage.getItem(STORAGE_KEY) || "USD";
  });

  const setCurrency = (nextCurrency) => {
    setCurrencyState(nextCurrency);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextCurrency);
    }
  };

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const formatCurrency = (value) => formatter.format(Number(value || 0));

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyOptions: CURRENCY_OPTIONS,
        formatCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider.");
  }

  return context;
}
