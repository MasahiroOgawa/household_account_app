import { WithholdingTaxData } from './withholdingTaxPdfParser';
import { FurusatoTaxSummary } from './furusatoTaxPdfParser';

// 令和6年分 (2024) / 令和7年分 (2025) 所得税 progressive tax brackets
const TAX_BRACKETS: [number, number, number][] = [
  // [upper limit, rate, deduction]
  [1_950_000, 0.05, 0],
  [3_300_000, 0.10, 97_500],
  [6_950_000, 0.20, 427_500],
  [9_000_000, 0.23, 636_000],
  [18_000_000, 0.33, 1_536_000],
  [40_000_000, 0.40, 2_796_000],
  [Infinity, 0.45, 4_796_000],
];

const RECONSTRUCTION_TAX_RATE = 0.021; // 復興特別所得税 2.1%

export interface TaxCalculationInput {
  // From 青色申告決算書
  businessRevenue: number;    // 事業 収入金額 (売上)
  businessIncome: number;     // 事業所得 (profit - blue deduction)
  // From 源泉徴収票
  withholding?: WithholdingTaxData;
  // From ふるさと納税
  furusato?: FurusatoTaxSummary;
  // Blue return deduction
  blueDeduction: number;      // 青色申告特別控除額 (typically 650,000)
}

export interface TaxFormBFields {
  // 収入金額等
  incomeBusinessRevenue: number;    // ア 事業・営業等 収入
  incomeSalary: number;             // カ 給与 収入

  // 所得金額等
  incomeBusinessAmount: number;     // ① 事業・営業等 所得
  incomeSalaryAmount: number;       // ⑥ 給与 所得
  totalIncome: number;              // ⑫ 合計

  // 所得から差し引かれる金額
  deductionSocialInsurance: number;     // ⑬ 社会保険料控除
  deductionLifeInsurance: number;       // ⑮ 生命保険料控除
  deductionEarthquakeInsurance: number; // ⑯ 地震保険料控除
  deductionDonation: number;            // ㉘ 寄附金控除
  deductionBasic: number;               // ㉔ 基礎控除
  totalDeductions: number;              // ㉙ 合計

  // 税額計算
  taxableIncome: number;            // ㉚ 課税される所得金額
  incomeTaxOnTaxable: number;       // ㉛ 上の㉚に対する税額
  totalTaxAmount: number;           // ㊱ 差引所得税額
  reconstructionTax: number;        // ㊲ 復興特別所得税額
  totalWithReconstruction: number;  // ㊳ 所得税及び復興特別所得税の額
  withheldTaxTotal: number;         // ㊹ 源泉徴収税額
  taxPayableOrRefund: number;       // ㊺ 申告納税額 (positive=pay, negative=refund)

  // 青色申告特別控除
  blueReturnDeduction: number;
}

const calculateIncomeTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  for (const [limit, rate, deduction] of TAX_BRACKETS) {
    if (taxableIncome <= limit) {
      return Math.floor(taxableIncome * rate - deduction);
    }
  }
  return 0;
};

export const calculateTaxFormB = (input: TaxCalculationInput): TaxFormBFields => {
  const w = input.withholding;
  const f = input.furusato;

  // 収入金額等
  const incomeBusinessRevenue = input.businessRevenue;
  const incomeSalary = w?.grossSalary ?? 0;

  // 所得金額等
  const incomeBusinessAmount = input.businessIncome;
  const incomeSalaryAmount = w?.salaryIncomeAfterDeduction ?? 0;
  const totalIncome = incomeBusinessAmount + incomeSalaryAmount;

  // 所得から差し引かれる金額
  const deductionSocialInsurance = w?.socialInsurance ?? 0;
  const deductionLifeInsurance = w?.lifeInsuranceDeduction ?? 0;
  const deductionEarthquakeInsurance = w?.earthquakeInsuranceDeduction ?? 0;
  const deductionBasic = w?.basicDeduction ?? 480_000; // Default 基礎控除 for income ≤ 24M

  // 寄附金控除: total donations - 2,000, capped at 40% of total income
  const furusatoDeductible = f ? Math.min(f.deductibleAmount, Math.floor(totalIncome * 0.4)) : 0;
  const deductionDonation = furusatoDeductible;

  const totalDeductions = deductionSocialInsurance + deductionLifeInsurance +
    deductionEarthquakeInsurance + deductionDonation + deductionBasic;

  // 税額計算
  const taxableIncome = Math.max(0, Math.floor((totalIncome - totalDeductions) / 1000) * 1000); // Round down to 1000
  const incomeTaxOnTaxable = calculateIncomeTax(taxableIncome);
  const totalTaxAmount = incomeTaxOnTaxable; // No tax credits for simplicity
  const reconstructionTax = Math.floor(totalTaxAmount * RECONSTRUCTION_TAX_RATE);
  const totalWithReconstruction = totalTaxAmount + reconstructionTax;

  // 源泉徴収税額 (from salary withholding)
  const withheldTaxTotal = w?.withheldTax ?? 0;

  // 差引 (100円未満切捨て for payment, full amount for refund)
  const rawDiff = totalWithReconstruction - withheldTaxTotal;
  const taxPayableOrRefund = rawDiff > 0
    ? Math.floor(rawDiff / 100) * 100  // 100円未満切捨て
    : rawDiff; // Refund: full amount

  return {
    incomeBusinessRevenue,
    incomeSalary,
    incomeBusinessAmount,
    incomeSalaryAmount,
    totalIncome,
    deductionSocialInsurance,
    deductionLifeInsurance,
    deductionEarthquakeInsurance,
    deductionDonation,
    deductionBasic,
    totalDeductions,
    taxableIncome,
    incomeTaxOnTaxable,
    totalTaxAmount,
    reconstructionTax,
    totalWithReconstruction,
    withheldTaxTotal,
    taxPayableOrRefund,
    blueReturnDeduction: input.blueDeduction,
  };
};
