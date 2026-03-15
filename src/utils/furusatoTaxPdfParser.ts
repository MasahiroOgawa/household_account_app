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

const normalizeDate = (s: string): string => {
  // Handle YYYY/MM/DD, YYYY年MM月DD日, YYYY-MM-DD
  const m = s.match(/(\d{4})[/\-年](\d{1,2})[/\-月](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return s;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseFurusatoChoicePdf = async (doc: any): Promise<FurusatoDonation[]> => {
  const donations: FurusatoDonation[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = await getTextItems(page);

    // Sort by Y descending (top-to-bottom), then X ascending
    items.sort((a: TextItem, b: TextItem) => b.y - a.y || a.x - b.x);

    // Group items into rows by Y-coordinate (tolerance ±5)
    const rows: TextItem[][] = [];
    let currentRow: TextItem[] = [];
    let lastY = -999;

    for (const item of items) {
      if (Math.abs(item.y - lastY) > 5) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [item];
        lastY = item.y;
      } else {
        currentRow.push(item);
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Look for rows with date pattern + municipality + amount
    for (const row of rows) {
      const texts = row.map(r => r.str);
      const joined = texts.join(' ');

      // Find date in row
      const dateMatch = joined.match(/(\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2})/);
      // Find amount (number with commas, typically > 1000)
      const amountMatch = joined.match(/([\d,]+)\s*円?/);

      if (dateMatch && amountMatch) {
        const amount = parseAmount(amountMatch[1]);
        if (amount < 2000) continue; // Skip non-donation amounts

        // Municipality: text that's not a date and not a number
        const municipality = texts.find(t =>
          !t.match(/^\d/) && !t.match(/^[,\s円¥]/) && t.length >= 2 &&
          !t.match(/^(寄附|合計|日付|自治体|金額|No|ふるさと)/)
        ) || '';

        if (municipality) {
          donations.push({
            date: normalizeDate(dateMatch[1]),
            municipality,
            amount,
            source: 'furusato_choice',
          });
        }
      }
    }
  }

  return donations;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseRakutenFurusatoPdf = async (doc: any): Promise<FurusatoDonation[]> => {
  const donations: FurusatoDonation[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = await getTextItems(page);

    items.sort((a: TextItem, b: TextItem) => b.y - a.y || a.x - b.x);

    // Group into rows
    const rows: TextItem[][] = [];
    let currentRow: TextItem[] = [];
    let lastY = -999;

    for (const item of items) {
      if (Math.abs(item.y - lastY) > 5) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [item];
        lastY = item.y;
      } else {
        currentRow.push(item);
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Rakuten format: look for municipality names and amounts
    for (const row of rows) {
      const texts = row.map(r => r.str);
      const joined = texts.join(' ');

      const dateMatch = joined.match(/(\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2})/);
      const amountMatch = joined.match(/([\d,]+)\s*円?/);

      if (amountMatch) {
        const amount = parseAmount(amountMatch[1]);
        if (amount < 2000) continue;

        const municipality = texts.find(t =>
          !t.match(/^\d/) && !t.match(/^[,\s円¥]/) && t.length >= 2 &&
          !t.match(/^(寄附|合計|日付|自治体|金額|No|楽天|購入|注文|ふるさと納税)/)
        ) || '';

        if (municipality) {
          donations.push({
            date: dateMatch ? normalizeDate(dateMatch[1]) : '',
            municipality,
            amount,
            source: 'rakuten',
          });
        }
      }
    }
  }

  return donations;
};

const detectSource = (items: TextItem[]): 'furusato_choice' | 'rakuten' | 'other' => {
  const allText = items.map(i => i.str).join(' ');
  if (allText.includes('ふるさとチョイス')) return 'furusato_choice';
  if (allText.includes('楽天')) return 'rakuten';
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
