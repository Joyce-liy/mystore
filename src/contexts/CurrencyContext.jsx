import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const STORAGE_KEY = 'ms-currency';

// Taux fixe officiel BCEAO/BCEAC : 1 EUR = 655,957 XOF (Franc CFA).
// Toutes les données sont stockées en base en XOF (c'est la devise "native"
// utilisée partout dans Firestore : prixAchat, prixVente, transport, profit...).
// Ce contexte ne fait QUE de l'affichage : il ne modifie jamais les données stockées.
export const EUR_TO_XOF_RATE = 655.957;

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'XOF';
    } catch {
      return 'XOF';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, currency); } catch {}
  }, [currency]);

  const toggleCurrency = useCallback(() => {
    setCurrency(prev => (prev === 'XOF' ? 'EUR' : 'XOF'));
  }, []);

  // Convertit un montant stocké en XOF vers la devise d'affichage active.
  // Toujours fournir le montant EN XOF (la devise native des données).
  const convertAmount = useCallback((amountInXOF) => {
    const n = Number(amountInXOF) || 0;
    return currency === 'EUR' ? n / EUR_TO_XOF_RATE : n;
  }, [currency]);

  // Formate directement un montant XOF vers une chaîne affichable dans la
  // devise active (ex: "12 500 F" ou "19,06 €")
  const formatAmount = useCallback((amountInXOF) => {
    const value = convertAmount(amountInXOF);
    if (currency === 'EUR') {
      return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    }
    return `${Math.round(value).toLocaleString('fr-FR')} F`;
  }, [currency, convertAmount]);

  const value = useMemo(() => ({
    currency, toggleCurrency, convertAmount, formatAmount
  }), [currency, toggleCurrency, convertAmount, formatAmount]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency doit être utilisé à l'intérieur d'un CurrencyProvider");
  return ctx;
};