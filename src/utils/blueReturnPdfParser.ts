export interface DepreciationAsset {
  name: string;
  acquisitionCost: number; // 取得価額
  usefulLife: number;      // 耐用年数
  rate: number;            // 償却率
  businessRatio: number;   // 事業専用割合 (%)
  bookValue: number;       // 未償却残高（期末）
}

export interface PreviousYearData {
  year: number;
  // Assets 期末
  cash: number;
  deposit: number;
  accountsReceivable: number;
  inventory: number;
  building: number;
  buildingEquipment: number;
  tools: number;
  // Liabilities 期末
  accountsPayable: number;
  unpaid: number;
  jigyounushiKari: number;
  jigyounushiKashi: number;
  motoirekin: number;
  shotokuBeforeDeduction: number;
  // Depreciation schedule from page 3
  depreciationAssets: DepreciationAsset[];
}

interface TextItem {
  str: string;
  x: number;
  y: number;
}

const parseNumber = (s: string): number => {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  const negative = trimmed.startsWith('△') || trimmed.startsWith('¡');
  const digits = trimmed.replace(/[△¡,\s]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : negative ? -n : n;
};

// Y-coordinate → field mapping for page 4 balance sheet
// These are standardized NTA form positions (tolerance ±8)
const ASSET_ROWS: [number, string][] = [
  [473, 'cash'],
  [421, 'deposit'],
  [386, 'accountsReceivable'],
  [351, 'inventory'],
  [298, 'building'],
  [281, 'buildingEquipment'],
  [228, 'tools'],
];

const LIABILITY_ROWS: [number, string][] = [
  [455, 'accountsPayable'],
  [421, 'unpaid'],
  [106, 'jigyounushiKari'],
  [89, 'motoirekin'],
  [71, 'shotokuBeforeDeduction'],
];

const ASSET_JIGYO_KASHI_Y = 71;

const matchRow = (y: number, rows: [number, string][], tolerance = 10): string | null => {
  for (const [rowY, field] of rows) {
    if (Math.abs(y - rowY) <= tolerance) return field;
  }
  return null;
};

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

// Parse 減価償却費の計算 table from page 3
// Each row: name(x≈62), 取得価額(x≈256-268), 耐用年数(x≈348-353), 償却率(x≈374), 未償却残高(x≈700+)
const parseDepreciationSchedule = (items: TextItem[]): DepreciationAsset[] => {
  // Filter to depreciation table area (y between ~120 and ~260)
  const tableItems = items.filter(i => i.y >= 120 && i.y <= 260);

  // Group items by row (y within ±12 tolerance)
  const rows: TextItem[][] = [];
  const used = new Set<number>();
  for (let idx = 0; idx < tableItems.length; idx++) {
    if (used.has(idx)) continue;
    const row = [tableItems[idx]];
    used.add(idx);
    for (let j = idx + 1; j < tableItems.length; j++) {
      if (!used.has(j) && Math.abs(tableItems[j].y - tableItems[idx].y) <= 12) {
        row.push(tableItems[j]);
        used.add(j);
      }
    }
    rows.push(row);
  }

  const assets: DepreciationAsset[] = [];
  for (const row of rows) {
    // Need at least: name, 取得価額, 耐用年数, 未償却残高
    const nameItems = row.filter(i => i.x < 130 && !/^[\d,]+$/.test(i.str) && !['定額', '定率', '－'].includes(i.str));
    const name = nameItems.map(i => i.str).join('');
    if (!name) continue;

    // 取得価額: x around 240-280 range, numeric
    const costItem = row.find(i => i.x >= 240 && i.x <= 290 && /^[\d,]+$/.test(i.str.replace(/,/g, '')));
    // 耐用年数: x around 340-360, small number
    const lifeItem = row.find(i => i.x >= 335 && i.x <= 365 && /^\d{1,2}$/.test(i.str));
    // 未償却残高: x >= 690, rightmost numeric value
    const bookItems = row.filter(i => i.x >= 690 && /^[\d,]+$/.test(i.str.replace(/,/g, '')));
    const bookItem = bookItems.length > 0 ? bookItems[bookItems.length - 1] : null;
    // 償却率: x around 370-385
    const rateItem = row.find(i => i.x >= 365 && i.x <= 395 && /^0\.\d+$/.test(i.str));
    // 事業専用割合: x around 600-620
    const ratioItem = row.find(i => i.x >= 595 && i.x <= 625 && /^\d+\.\d+$/.test(i.str));

    if (!costItem || !lifeItem) continue;

    assets.push({
      name,
      acquisitionCost: parseNumber(costItem.str),
      usefulLife: parseInt(lifeItem.str, 10) || 0,
      rate: rateItem ? parseFloat(rateItem.str) : 0,
      businessRatio: ratioItem ? parseFloat(ratioItem.str) : 100,
      bookValue: bookItem ? parseNumber(bookItem.str) : 0,
    });
  }
  return assets;
};

export const parsePreviousYearPdf = async (file: File): Promise<PreviousYearData> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  if (doc.numPages < 4) throw new Error('PDFのページ数が不足しています（4ページ以上必要）');

  // Parse depreciation schedule from page 3
  const page3 = await doc.getPage(3);
  const items3 = await getTextItems(page3);
  const depreciationAssets = parseDepreciationSchedule(items3);

  // Extract year from page 4 header area (令和X年 at y~524, x~489)
  const page4 = await doc.getPage(4);
  const items4 = await getTextItems(page4);

  // Year: single digit near top of page 4 in the liability-side header
  const yearItem = items4.find(i => i.y > 515 && i.y < 535 && i.x > 460 && i.x < 510 && /^\d+$/.test(i.str));
  const reiwaYear = yearItem ? parseInt(yearItem.str, 10) : 0;
  const year = reiwaYear > 0 ? 2018 + reiwaYear : 0; // 令和1年=2019

  // Split items into asset side (x < 350) and liability side (x >= 350)
  // Within each side: 期首 is left column, 期末 is right column
  const assetItems = items4.filter(i => i.x < 350 && i.y < 500);
  const liabilityItems = items4.filter(i => i.x >= 350 && i.y < 500);

  // Asset columns: 期首 x < 225, 期末 x >= 225
  const assetEnd: Record<string, number> = {};
  for (const item of assetItems) {
    if (item.x < 225) continue; // skip 期首 values
    const field = matchRow(item.y, ASSET_ROWS);
    if (field) assetEnd[field] = parseNumber(item.str);
  }

  // 事業主貸 期末 (asset side, y~71, 期末 column)
  const jigyouKashiItem = assetItems.find(i => Math.abs(i.y - ASSET_JIGYO_KASHI_Y) <= 10 && i.x >= 225);
  const jigyounushiKashi = jigyouKashiItem ? parseNumber(jigyouKashiItem.str) : 0;

  // Liability columns: 期首 x < 475, 期末 x >= 475
  const liabilityEnd: Record<string, number> = {};
  for (const item of liabilityItems) {
    if (item.x < 475) continue; // skip 期首 values
    const field = matchRow(item.y, LIABILITY_ROWS);
    if (field) liabilityEnd[field] = parseNumber(item.str);
  }

  return {
    year,
    cash: assetEnd.cash ?? 0,
    deposit: assetEnd.deposit ?? 0,
    accountsReceivable: assetEnd.accountsReceivable ?? 0,
    inventory: assetEnd.inventory ?? 0,
    building: assetEnd.building ?? 0,
    buildingEquipment: assetEnd.buildingEquipment ?? 0,
    tools: assetEnd.tools ?? 0,
    accountsPayable: liabilityEnd.accountsPayable ?? 0,
    unpaid: liabilityEnd.unpaid ?? 0,
    jigyounushiKari: liabilityEnd.jigyounushiKari ?? 0,
    jigyounushiKashi,
    motoirekin: liabilityEnd.motoirekin ?? 0,
    shotokuBeforeDeduction: liabilityEnd.shotokuBeforeDeduction ?? 0,
    depreciationAssets,
  };
};
