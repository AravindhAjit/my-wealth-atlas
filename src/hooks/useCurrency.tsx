import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    if (user) {
      fetchUserCurrency();
    }
  }, [user]);

  const fetchUserCurrency = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('default_currency')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data?.default_currency) {
        setCurrencyState(data.default_currency);
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const formatAmount = (amount: number): string => {
    const currencyMap: Record<string, { symbol: string; locale: string }> = {
      USD: { symbol: '$', locale: 'en-US' },
      EUR: { symbol: '€', locale: 'de-DE' },
      GBP: { symbol: '£', locale: 'en-GB' },
      JPY: { symbol: '¥', locale: 'ja-JP' },
      CAD: { symbol: 'C$', locale: 'en-CA' },
      AUD: { symbol: 'A$', locale: 'en-AU' },
      CHF: { symbol: 'CHF', locale: 'de-CH' },
      CNY: { symbol: '¥', locale: 'zh-CN' },
      INR: { symbol: '₹', locale: 'en-IN' },
    };

    const config = currencyMap[currency] || currencyMap.USD;
    
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return `${config.symbol}${amount.toFixed(2)}`;
    }
  };

  const value = {
    currency,
    setCurrency,
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};