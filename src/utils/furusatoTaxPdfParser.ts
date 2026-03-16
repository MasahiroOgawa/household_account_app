export interface FurusatoDonation {
  date: string;
  municipality: string;
  amount: number;
  source: 'furusato_choice' | 'rakuten' | 'other';
}

export interface FurusatoTaxSummary {
  donations: FurusatoDonation[];
  totalAmount: number;
  deductibleAmount: number; // total - 2000
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

const parseAmount = (s: string): number => {
  const digits = s.replace(/[,\s円¥]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : n;
};

// Group items into rows by Y coordinate, then join chars within each row by X order
// Returns array of { y, text: joined string of items in xMin..xMax }
const collectRowTexts = (items: TextItem[], xMin: number, xMax: number, yTolerance = 4): { y: number; text: string }[] => {
  const filtered = items.filter(i => i.x >= xMin && i.x <= xMax);
  if (filtered.length === 0) return [];

  // Group by Y
  filtered.sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: { y: number; items: TextItem[] }[] = [];
  let curRow: { y: number; items: TextItem[] } | null = null;

  for (const item of filtered) {
    if (curRow && Math.abs(item.y - curRow.y) <= yTolerance) {
      curRow.items.push(item);
    } else {
      if (curRow) rows.push(curRow);
      curRow = { y: item.y, items: [item] };
    }
  }
  if (curRow) rows.push(curRow);

  return rows.map(r => ({
    y: r.y,
    text: r.items.sort((a, b) => a.x - b.x).map(i => i.str).join(''),
  }));
};

// ─── ふるさとチョイス ───
// Structured table layout:
//   申込日時:   x~61,  date like "2025/05/05"
//   決済完了日: x~132, date
//   自治体名:  x~204, chars that form municipality name (individual chars)
//   寄付金額:  x~301, amount like "12,000" + "円"
//   決済種別:  x~361
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseFurusatoChoicePdf = async (doc: any): Promise<FurusatoDonation[]> => {
  const donations: FurusatoDonation[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = await getTextItems(page);

    // Find amount items: at x~301, containing digits and comma, value >= 2000
    const amountItems = items.filter(i =>
      i.x >= 280 && i.x <= 340 && /^[\d,]+$/.test(i.str) && parseAmount(i.str) >= 2000
    );

    for (const amtItem of amountItems) {
      const amount = parseAmount(amtItem.str);
      const yTol = 5;

      // Find date on same row (x~61)
      const dateItem = items.find(i =>
        Math.abs(i.y - amtItem.y) <= yTol && i.x >= 40 && i.x <= 130 &&
        /\d{4}\/\d{2}\/\d{2}/.test(i.str)
      );

      // Find municipality on same row (x~204, chars may be individual)
      const municItems = items
        .filter(i => Math.abs(i.y - amtItem.y) <= yTol && i.x >= 190 && i.x < 280)
        .sort((a, b) => a.x - b.x);
      const municipality = municItems.map(i => i.str).join('');

      if (municipality && amount >= 2000) {
        const date = dateItem ? dateItem.str.replace(/\//g, '-') : '';
        donations.push({ date, municipality, amount, source: 'furusato_choice' });
      }
    }
  }

  return donations;
};

// ─── 楽天ふるさと納税 ───
// Web page PDF with char-by-char text. Structure per order block:
//   Municipality line: chars at x~89-150, e.g. "熊本県⾼森町"
//   注文日 line:       date at x~115, "2025/09/28("
//   Amount line:       "144,000" at x~141 + "円"
//
// Orders can span pages, so we collect items across all pages with global Y offsets.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseRakutenFurusatoPdf = async (doc: any): Promise<FurusatoDonation[]> => {
  const PAGE_HEIGHT = 900;
  const allItems: TextItem[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const rawItems = await getTextItems(page);
    const yOffset = (doc.numPages - p) * PAGE_HEIGHT;
    allItems.push(...rawItems.map(i => ({ ...i, y: i.y + yOffset })));
  }

  // Build municipality rows: collect chars at x=80-160 grouped by Y, join into strings
  // Then filter to rows containing prefecture/city suffixes and short enough to be a real name
  const municRows = collectRowTexts(allItems, 80, 160)
    .filter(r => r.text.length >= 3 && r.text.length <= 15 && /[都道府県市区町村郡]/.test(r.text))
    .filter(r => !/[0-9a-zA-Z:/.?=&]/.test(r.text)); // exclude URLs, order numbers

  // Find standalone date items at x~115
  const dateItems = allItems.filter(i =>
    /^\d{4}\/\d{2}\/\d{2}/.test(i.str) && i.x >= 100 && i.x <= 170
  );

  // Find amount items at x~141
  const amountItems = allItems.filter(i =>
    i.x >= 130 && i.x <= 180 && /^[\d,]+$/.test(i.str) && parseAmount(i.str) >= 2000
  );

  // Match each amount to nearest preceding municipality and date
  const donations: FurusatoDonation[] = [];
  for (const amtItem of amountItems) {
    const munic = municRows
      .filter(m => m.y > amtItem.y)
      .sort((a, b) => a.y - b.y)[0];

    const dateEntry = dateItems
      .filter(d => d.y > amtItem.y && d.y < (munic?.y ?? Infinity) + 10)
      .sort((a, b) => a.y - b.y)[0];

    if (munic) {
      const dateMatch = dateEntry?.str.match(/(\d{4})\/(\d{2})\/(\d{2})/);
      const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';
      donations.push({
        date,
        municipality: munic.text,
        amount: parseAmount(amtItem.str),
        source: 'rakuten',
      });
    }
  }

  return donations;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const detectSource = (items: TextItem[]): 'furusato_choice' | 'rakuten' | 'other' => {
  const allText = items.map(i => i.str).join('');
  if (allText.includes('ふるさとチョイス') || allText.includes('寄付履歴印刷')) return 'furusato_choice';
  if (allText.includes('楽天') || allText.includes('購⼊履歴')) return 'rakuten';
  return 'other';
};

const deduplicateDonations = (donations: FurusatoDonation[]): FurusatoDonation[] => {
  const seen = new Set<string>();
  return donations.filter(d => {
    const key = `${d.municipality}|${d.amount}|${d.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const parseFurusatoTaxPdf = async (file: File): Promise<FurusatoDonation[]> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  // Detect source from first page
  const page1 = await doc.getPage(1);
  const items1 = await getTextItems(page1);
  const source = detectSource(items1);

  if (source === 'furusato_choice') {
    return parseFurusatoChoicePdf(doc);
  } else if (source === 'rakuten') {
    return parseRakutenFurusatoPdf(doc);
  }

  // Generic fallback: try both parsers
  const donations = [
    ...await parseFurusatoChoicePdf(doc),
    ...await parseRakutenFurusatoPdf(doc),
  ];
  return deduplicateDonations(donations);
};

export const parseFurusatoTaxPdfs = async (files: File[]): Promise<FurusatoTaxSummary> => {
  const allDonations: FurusatoDonation[] = [];
  for (const file of files) {
    const donations = await parseFurusatoTaxPdf(file);
    allDonations.push(...donations);
  }
  const donations = deduplicateDonations(allDonations);
  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
  return {
    donations,
    totalAmount,
    deductibleAmount: Math.max(0, totalAmount - 2000),
  };
};
