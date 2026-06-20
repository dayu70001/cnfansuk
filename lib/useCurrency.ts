"use client";

import { useEffect, useState } from "react";
import { CURRENCY_STORAGE_KEY, type CurrencyCode, normaliseCurrency } from "./currency";

const currencyChangeEvent = "cnfans-currency-change";

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>("GBP");

  useEffect(() => {
    setCurrencyState(normaliseCurrency(window.localStorage.getItem(CURRENCY_STORAGE_KEY)));

    function handleCurrencyChange() {
      setCurrencyState(normaliseCurrency(window.localStorage.getItem(CURRENCY_STORAGE_KEY)));
    }

    window.addEventListener("storage", handleCurrencyChange);
    window.addEventListener(currencyChangeEvent, handleCurrencyChange);
    return () => {
      window.removeEventListener("storage", handleCurrencyChange);
      window.removeEventListener(currencyChangeEvent, handleCurrencyChange);
    };
  }, []);

  function setCurrency(currency: CurrencyCode) {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    setCurrencyState(currency);
    window.dispatchEvent(new Event(currencyChangeEvent));
  }

  return { currency, setCurrency };
}
