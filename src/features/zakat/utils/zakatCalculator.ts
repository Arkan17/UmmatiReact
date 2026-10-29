import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES, DEFAULT_CURRENCY, GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS } from '../data/currencies';

const ZAKAT_STORAGE_KEY = 'ummati_saved_zakat_calculation';

export interface ZakatInputs {
  currency: string;
  nisabStandard: 'silver' | 'gold';
  goldPricePerGram: number;
  silverPricePerGram: number;
  yearType: 'lunar' | 'solar'; // Lunar: 2.5%, Solar: 2.577%

  // Cash & Liquid
  cashInHand: number;
  bankAccounts: number;
  moneyOwedToYou: number;

  // Precious Metals
  goldGrams: number;
  silverGrams: number;

  // Investments & Business
  investments: number;
  businessInventory: number;
  crypto: number;
  otherAssets: number;

  // Liabilities
  debtsDueNow: number;
  billsDueNow: number;
  otherLiabilities: number;
}

export interface ZakatResult {
  totalCash: number;
  goldValue: number;
  silverValue: number;
  totalMetals: number;
  totalBusinessAndInvestments: number;
  totalAssets: number;
  totalLiabilities: number;
  netZakatableWealth: number;
  nisabThreshold: number;
  isEligible: boolean;
  zakatRate: number;
  zakatDue: number;
}

export const DEFAULT_ZAKAT_INPUTS: ZakatInputs = {
  currency: DEFAULT_CURRENCY,
  nisabStandard: 'silver', // Scholarly consensus favors silver as it benefits the poor
  goldPricePerGram: CURRENCIES[DEFAULT_CURRENCY].defaultGoldPricePerGram,
  silverPricePerGram: CURRENCIES[DEFAULT_CURRENCY].defaultSilverPricePerGram,
  yearType: 'lunar',

  cashInHand: 0,
  bankAccounts: 0,
  moneyOwedToYou: 0,

  goldGrams: 0,
  silverGrams: 0,

  investments: 0,
  businessInventory: 0,
  crypto: 0,
  otherAssets: 0,

  debtsDueNow: 0,
  billsDueNow: 0,
  otherLiabilities: 0,
};

export function calculateZakat(inputs: ZakatInputs): ZakatResult {
  const totalCash = (inputs.cashInHand || 0) + (inputs.bankAccounts || 0) + (inputs.moneyOwedToYou || 0);

  const goldValue = (inputs.goldGrams || 0) * (inputs.goldPricePerGram || 0);
  const silverValue = (inputs.silverGrams || 0) * (inputs.silverPricePerGram || 0);
  const totalMetals = goldValue + silverValue;

  const totalBusinessAndInvestments =
    (inputs.investments || 0) +
    (inputs.businessInventory || 0) +
    (inputs.crypto || 0) +
    (inputs.otherAssets || 0);

  const totalAssets = totalCash + totalMetals + totalBusinessAndInvestments;

  const totalLiabilities =
    (inputs.debtsDueNow || 0) +
    (inputs.billsDueNow || 0) +
    (inputs.otherLiabilities || 0);

  const netZakatableWealth = Math.max(0, totalAssets - totalLiabilities);

  const nisabThreshold =
    inputs.nisabStandard === 'silver'
      ? SILVER_NISAB_GRAMS * (inputs.silverPricePerGram || 0)
      : GOLD_NISAB_GRAMS * (inputs.goldPricePerGram || 0);

  const isEligible = netZakatableWealth >= nisabThreshold && netZakatableWealth > 0;
  const zakatRate = inputs.yearType === 'lunar' ? 0.025 : 0.02577;
  const zakatDue = isEligible ? Math.round(netZakatableWealth * zakatRate) : 0;

  return {
    totalCash,
    goldValue,
    silverValue,
    totalMetals,
    totalBusinessAndInvestments,
    totalAssets,
    totalLiabilities,
    netZakatableWealth,
    nisabThreshold: Math.round(nisabThreshold),
    isEligible,
    zakatRate,
    zakatDue,
  };
}

export function formatAmount(val: number, symbol: string): string {
  const formattedNumber = Math.round(val).toLocaleString();
  return `${symbol} ${formattedNumber}`;
}

export async function saveZakatCalculation(inputs: ZakatInputs): Promise<void> {
  try {
    await AsyncStorage.setItem(ZAKAT_STORAGE_KEY, JSON.stringify(inputs));
  } catch (e) {
    console.warn('Failed to save Zakat calculation:', e);
  }
}

export async function loadZakatCalculation(): Promise<ZakatInputs | null> {
  try {
    const raw = await AsyncStorage.getItem(ZAKAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load Zakat calculation:', e);
  }
  return null;
}

export async function clearZakatCalculation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ZAKAT_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear Zakat calculation:', e);
  }
}
