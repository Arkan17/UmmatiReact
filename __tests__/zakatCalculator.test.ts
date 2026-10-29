import { calculateZakat, DEFAULT_ZAKAT_INPUTS } from '../src/features/zakat/utils/zakatCalculator';
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS } from '../src/features/zakat/data/currencies';

describe('Zakat Calculator Math & Logic', () => {
  it('calculates Silver Nisab threshold correctly', () => {
    const inputs = {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabStandard: 'silver' as const,
      silverPricePerGram: 100,
      bankAccounts: 100000,
    };
    const result = calculateZakat(inputs);
    expect(result.nisabThreshold).toBe(Math.round(SILVER_NISAB_GRAMS * 100)); // 61,236
    expect(result.isEligible).toBe(true);
    expect(result.zakatDue).toBe(Math.round(100000 * 0.025)); // 2,500
  });

  it('calculates Gold Nisab threshold correctly', () => {
    const inputs = {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabStandard: 'gold' as const,
      goldPricePerGram: 8000,
      bankAccounts: 500000,
    };
    const result = calculateZakat(inputs);
    // 87.48 * 8000 = 699,840
    expect(result.nisabThreshold).toBe(Math.round(GOLD_NISAB_GRAMS * 8000));
    // 500,000 < 699,840 -> Below Nisab
    expect(result.isEligible).toBe(false);
    expect(result.zakatDue).toBe(0);
  });

  it('deducts liabilities from total assets accurately', () => {
    const inputs = {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabStandard: 'silver' as const,
      silverPricePerGram: 50, // Nisab = 30,618
      cashInHand: 50000,
      bankAccounts: 50000, // Total assets = 100,000
      debtsDueNow: 40000,
      billsDueNow: 10000, // Total liabilities = 50,000
    };
    const result = calculateZakat(inputs);
    expect(result.totalAssets).toBe(100000);
    expect(result.totalLiabilities).toBe(50000);
    expect(result.netZakatableWealth).toBe(50000);
    expect(result.isEligible).toBe(true);
    expect(result.zakatDue).toBe(Math.round(50000 * 0.025)); // 1,250
  });

  it('correctly accounts for gold grams multiplied by gold rate', () => {
    const inputs = {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabStandard: 'silver' as const,
      silverPricePerGram: 100,
      goldPricePerGram: 7500,
      goldGrams: 20, // 20 * 7500 = 150,000
    };
    const result = calculateZakat(inputs);
    expect(result.goldValue).toBe(150000);
    expect(result.totalMetals).toBe(150000);
    expect(result.isEligible).toBe(true);
    expect(result.zakatDue).toBe(Math.round(150000 * 0.025)); // 3,750
  });

  it('calculates Solar / Gregorian rate (2.577%) when selected', () => {
    const inputs = {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabStandard: 'silver' as const,
      silverPricePerGram: 100,
      yearType: 'solar' as const,
      bankAccounts: 100000,
    };
    const result = calculateZakat(inputs);
    expect(result.zakatRate).toBe(0.02577);
    expect(result.zakatDue).toBe(Math.round(100000 * 0.02577)); // 2,577
  });
});
