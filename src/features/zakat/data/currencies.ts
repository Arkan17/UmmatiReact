export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  defaultGoldPricePerGram: number; // in local currency
  defaultSilverPricePerGram: number; // in local currency
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    defaultGoldPricePerGram: 7600,
    defaultSilverPricePerGram: 96,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    defaultGoldPricePerGram: 88,
    defaultSilverPricePerGram: 1.10,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    defaultGoldPricePerGram: 322,
    defaultSilverPricePerGram: 4.0,
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    defaultGoldPricePerGram: 330,
    defaultSilverPricePerGram: 4.1,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    defaultGoldPricePerGram: 68,
    defaultSilverPricePerGram: 0.85,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    defaultGoldPricePerGram: 81,
    defaultSilverPricePerGram: 1.0,
  },
  PKR: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    defaultGoldPricePerGram: 24500,
    defaultSilverPricePerGram: 310,
  },
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    defaultGoldPricePerGram: 10500,
    defaultSilverPricePerGram: 130,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    defaultGoldPricePerGram: 120,
    defaultSilverPricePerGram: 1.5,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    defaultGoldPricePerGram: 134,
    defaultSilverPricePerGram: 1.65,
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    defaultGoldPricePerGram: 390,
    defaultSilverPricePerGram: 4.8,
  },
};

export const DEFAULT_CURRENCY = 'INR';

// Classical Islamic Nisab measurements:
// Gold: 20 Mithqals = 87.48 grams (or ~85g)
// Silver: 200 Dirhams = 612.36 grams (or ~595g)
export const GOLD_NISAB_GRAMS = 87.48;
export const SILVER_NISAB_GRAMS = 612.36;
