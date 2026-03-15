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

// Find a numeric value within a bounding box (x/y range)
const findNumberInBox = (items: TextItem[], xMin: number, xMax: number, yMin: number, yMax: number): number => {
  const candidates = items.filter(i =>
    i.x >= xMin && i.x <= xMax &&
    i.y >= yMin && i.y <= yMax &&
    /[\d,]/.test(i.str) &&
    parseNumber(i.str) > 0
  );
  // Return the largest number found (the actual value, not stray digits)
  if (candidates.length === 0) return 0;
  return Math.max(...candidates.map(c => parseNumber(c.str)));
};

// 源泉徴収票 PDF coordinate-based parsing
// Based on the standard e-Tax PDF layout:
//
// Row 1 (y~497 labels, y~474-478 values):
//   支払金額      x: 90-165    value at x~132
//   給与所得控除後  x: 170-250   value at x~213
//   所得控除の額   x: 250-330   value at x~291
//   源泉徴収税額   x: 330-410   value at x~374
//
// Row 2 (y~413 labels, y~394-398 values):
//   特定親族特別控除  x: 15-90    value at x~77
//   社会保険料等     x: 90-170   value at x~135
//   生命保険料控除   x: 170-250  value at x~221
//   地震保険料控除   x: 250-330  value at x~301
//   住宅借入金等控除  x: 330-410  value at x~390
//
// Row 3 (y~337 labels, y~335 values) - 生命保険料の金額内訳:
//   新生命保険料   x: 30-100   value at x~103
//   旧生命保険料   x: 100-175  value at x~162
//   介護医療保険料  x: 175-250  value at x~251
//   新個人年金保険料 x: 250-330  value at x~323
//   旧個人年金保険料 x: 330-410  value at x~395
//
// 基礎控除の額: y~268-272, x~265-330, value at x~309

const parseByCoordinates = (items: TextItem[]): WithholdingTaxData => {
  // Row 1: Main 4 fields (labels y~497, values y~470-485)
  const grossSalary = findNumberInBox(items, 90, 170, 465, 490);
  const salaryIncomeAfterDeduction = findNumberInBox(items, 170, 255, 465, 490);
  const totalDeductions = findNumberInBox(items, 255, 335, 465, 490);
  const withheldTax = findNumberInBox(items, 335, 410, 460, 490);

  // Row 2: Deduction detail fields (labels y~413, values y~388-405)
  const socialInsurance = findNumberInBox(items, 90, 175, 385, 410);
  const lifeInsuranceDeduction = findNumberInBox(items, 175, 255, 385, 410);
  const earthquakeInsuranceDeduction = findNumberInBox(items, 255, 335, 385, 410);

  // Row 3: 生命保険料内訳 (labels y~333-337, values y~330-342)
  const newLifeInsurancePremium = findNumberInBox(items, 30, 115, 325, 345);
  const oldLifeInsurancePremium = findNumberInBox(items, 115, 190, 325, 345);
  const medicalInsurancePremium = findNumberInBox(items, 190, 265, 325, 345);
  const newPensionInsurancePremium = findNumberInBox(items, 265, 340, 325, 345);
  const oldPensionInsurancePremium = findNumberInBox(items, 340, 415, 325, 345);

  // 基礎控除の額 (y~268-280, x~265-330)
  const basicDeduction = findNumberInBox(items, 265, 335, 262, 282);

  return {
    grossSalary,
    salaryIncomeAfterDeduction,
    totalDeductions,
    withheldTax,
    socialInsurance,
    lifeInsuranceDeduction,
    earthquakeInsuranceDeduction,
    basicDeduction,
    newLifeInsurancePremium,
    oldLifeInsurancePremium,
    medicalInsurancePremium,
    newPensionInsurancePremium,
    oldPensionInsurancePremium,
  };
};

export const parseWithholdingTaxPdf = async (file: File): Promise<WithholdingTaxData> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  // 源泉徴収票 is typically a single page
  const page = await doc.getPage(1);
  const items = await getTextItems(page);

  return parseByCoordinates(items);
};
