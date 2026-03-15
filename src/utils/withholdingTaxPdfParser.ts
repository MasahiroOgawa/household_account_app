export interface WithholdingTaxData {
  grossSalary: number;                  // 支払金額
  salaryIncomeAfterDeduction: number;   // 給与所得控除後の金額
  totalDeductions: number;              // 所得控除の額の合計額
  withheldTax: number;                  // 源泉徴収税額
  socialInsurance: number;              // 社会保険料等の金額
  lifeInsuranceDeduction: number;       // 生命保険料の控除額
  earthquakeInsuranceDeduction: number; // 地震保険料の控除額
  basicDeduction: number;               // 基礎控除の額
  // 内訳
  oldLifeInsurancePremium: number;      // 旧生命保険料の金額
  newLifeInsurancePremium: number;      // 新生命保険料の金額
  medicalInsurancePremium: number;      // 介護医療保険料の金額
  oldPensionInsurancePremium: number;   // 旧個人年金保険料の金額
  newPensionInsurancePremium: number;   // 新個人年金保険料の金額
}

interface TextItem {
  str: string;
  x: number;
  y: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTextItems = async (page: any): Promise<TextItem[]> => {
  const content = await page.getTextContent();
  return content.items
    .filter((i: { str?: string }) => i.str && i.str.trim())
    .map((i: { str: string; transform: number[] }) => ({
      str: i.str.trim(),
      x: Math.round(i.transform[4]),
      y: Math.round(i.transform[5]),
    }));
};

const parseNumber = (s: string): number => {
  const digits = s.replace(/[,\s円¥]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : n;
};

// Find number adjacent to a label (nearby Y coordinate, to the right)
const findValueNearLabel = (items: TextItem[], labelPattern: RegExp, opts?: { yTolerance?: number }): number => {
  const tolerance = opts?.yTolerance ?? 8;
  const labelItem = items.find(i => labelPattern.test(i.str));
  if (!labelItem) return 0;

  // Find the closest number to the right on the same row
  const candidates = items
    .filter(i =>
      Math.abs(i.y - labelItem.y) <= tolerance &&
      i.x > labelItem.x &&
      /[\d,]+/.test(i.str) &&
      parseNumber(i.str) > 0
    )
    .sort((a, b) => a.x - b.x);

  return candidates.length > 0 ? parseNumber(candidates[0].str) : 0;
};

// Parse by grouping items into rows and matching known field patterns
const parseByRowStructure = (items: TextItem[]): WithholdingTaxData => {
  const data: WithholdingTaxData = {
    grossSalary: 0,
    salaryIncomeAfterDeduction: 0,
    totalDeductions: 0,
    withheldTax: 0,
    socialInsurance: 0,
    lifeInsuranceDeduction: 0,
    earthquakeInsuranceDeduction: 0,
    basicDeduction: 0,
    oldLifeInsurancePremium: 0,
    newLifeInsurancePremium: 0,
    medicalInsurancePremium: 0,
    oldPensionInsurancePremium: 0,
    newPensionInsurancePremium: 0,
  };

  // Sort items top-to-bottom (descending Y), left-to-right
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  // 源泉徴収票 has a structured layout. Try to match fields by label proximity.
  // Main row fields (top portion of the form)
  data.grossSalary = findValueNearLabel(sorted, /支払金額/);
  data.salaryIncomeAfterDeduction = findValueNearLabel(sorted, /給与所得控除後/);
  data.totalDeductions = findValueNearLabel(sorted, /所得控除の額の合計/);
  data.withheldTax = findValueNearLabel(sorted, /源泉徴収税額/);

  // Insurance/deduction fields
  data.socialInsurance = findValueNearLabel(sorted, /社会保険料等/);
  data.lifeInsuranceDeduction = findValueNearLabel(sorted, /生命保険料の控除額/);
  data.earthquakeInsuranceDeduction = findValueNearLabel(sorted, /地震保険料の控除額/);
  data.basicDeduction = findValueNearLabel(sorted, /基礎控除の額/);

  // 内訳 fields
  data.oldLifeInsurancePremium = findValueNearLabel(sorted, /旧生命保険料の金額/);
  data.newLifeInsurancePremium = findValueNearLabel(sorted, /新生命保険料の金額/);
  data.medicalInsurancePremium = findValueNearLabel(sorted, /介護医療保険料/);
  data.oldPensionInsurancePremium = findValueNearLabel(sorted, /旧個人年金保険料/);
  data.newPensionInsurancePremium = findValueNearLabel(sorted, /新個人年金保険料/);

  return data;
};

// Fallback: extract all numbers from the text in reading order and match by position
// The standard 源泉徴収票 PDF has these numbers in a predictable top-row order:
// 支払金額, 給与所得控除後の金額, 所得控除の額の合計額, 源泉徴収税額
const parseByPosition = (items: TextItem[]): Partial<WithholdingTaxData> => {
  // Get unique Y rows near the top portion
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  // Group by Y (tolerance ±5)
  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [];
  let lastY = -999;

  for (const item of sorted) {
    if (Math.abs(item.y - lastY) > 5) {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [item];
      lastY = item.y;
    } else {
      currentRow.push(item);
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Find the row with 4 large numbers (likely the main fields)
  for (const row of rows) {
    const numbers = row
      .map(i => parseNumber(i.str))
      .filter(n => n > 10000);

    if (numbers.length >= 4) {
      return {
        grossSalary: numbers[0],
        salaryIncomeAfterDeduction: numbers[1],
        totalDeductions: numbers[2],
        withheldTax: numbers[3],
      };
    }
  }

  return {};
};

export const parseWithholdingTaxPdf = async (file: File): Promise<WithholdingTaxData> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  // 源泉徴収票 is typically a single page
  const page = await doc.getPage(1);
  const items = await getTextItems(page);

  // Primary: parse by label matching
  const data = parseByRowStructure(items);

  // Fallback for main 4 fields if label matching fails
  if (data.grossSalary === 0) {
    const fallback = parseByPosition(items);
    Object.assign(data, fallback);
  }

  return data;
};
