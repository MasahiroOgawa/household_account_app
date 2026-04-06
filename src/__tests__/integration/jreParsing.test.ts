import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { configLoader } from '../../utils/config/configLoader';
import { detectEncoding, convertToUnicode } from '../../utils/parsing/encodingDetector';

const jre2026Path = 'data/2026/RB-torihikimeisai.csv';
const jre2025Path = 'data/2025/RB-torihikimeisai.csv';
const has2026 = fs.existsSync(jre2026Path);
const has2025 = fs.existsSync(jre2025Path);

describe('JRE Bank Parsing', () => {
  const readAndDecode = (filePath: string) => {
    const buf = fs.readFileSync(filePath);
    const uint8 = new Uint8Array(buf);
    const encoding = detectEncoding(uint8);
    return convertToUnicode(uint8, encoding);
  };

  const parseJreFile = (filePath: string, fileName: string) => {
    const decoded = readAndDecode(filePath);
    const results = Papa.parse(decoded);
    const data = results.data as any[][];
    const headers = data[0] || [];
    const detectedType = detectFileType(headers, fileName);
    if (!detectedType) return { detectedType: null, transactions: [] };

    const sourceConfig = configLoader.getColumnMapping().sources[detectedType];
    const skipRows = sourceConfig.skipRows || 0;
    const transactions = [];

    for (let i = skipRows; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      const tx = buildTransaction(row, detectedType, sourceConfig, fileName);
      if (tx) transactions.push(tx);
    }

    return { detectedType, transactions };
  };

  it('detects JRE file type from filename', () => {
    expect(detectFileType([], 'RB-torihikimeisai.csv')).toBe('jre');
  });

  it.skipIf(!has2026)('detects JRE file type from actual headers', () => {
    const decoded = readAndDecode(jre2026Path);
    const results = Papa.parse(decoded);
    const headers = results.data[0] as string[];
    expect(detectFileType(headers, 'unknown.csv')).toBe('jre');
  });

  it.skipIf(!has2026)('detects JRE file type from renamed file via headers', () => {
    const decoded = readAndDecode(jre2026Path);
    const results = Papa.parse(decoded);
    const headers = results.data[0] as string[];
    expect(detectFileType(headers, 'my-bank-export.csv')).toBe('jre');
  });

  it.skipIf(!has2026)('parses 2026 JRE CSV with correct transaction count', () => {
    const { detectedType, transactions } = parseJreFile(jre2026Path, 'RB-torihikimeisai.csv');

    expect(detectedType).toBe('jre');
    expect(transactions.length).toBe(12);
  });

  it.skipIf(!has2026)('correctly identifies income and expense transactions', () => {
    const { transactions } = parseJreFile(jre2026Path, 'RB-torihikimeisai.csv');

    const salary = transactions.find(t => t.description.includes('給与'));
    expect(salary).toBeDefined();
    expect(salary!.type).toBe('income');
    expect(salary!.amount).toBe(641677);

    const expense = transactions.find(t => t.description.includes('ヒ゛ユ'));
    expect(expense).toBeDefined();
    expect(expense!.type).toBe('expense');
  });

  it.skipIf(!has2026)('parses YYYYMMDD dates correctly', () => {
    const { transactions } = parseJreFile(jre2026Path, 'RB-torihikimeisai.csv');

    expect(transactions[0].date).toBe('2026-01-05');
    const lastTx = transactions[transactions.length - 1];
    expect(lastTx.date).toBe('2026-02-27');
  });

  it.skipIf(!has2026)('sets source to JRE銀行', () => {
    const { transactions } = parseJreFile(jre2026Path, 'RB-torihikimeisai.csv');

    expect(transactions.every(t => t.source === 'JRE銀行')).toBe(true);
  });

  it.skipIf(!has2025)('keeps fee transactions', () => {
    const { transactions } = parseJreFile(jre2025Path, 'RB-torihikimeisai.csv');

    const fee = transactions.find(t => t.description.includes('手数料'));
    expect(fee).toBeDefined();
    expect(fee!.type).toBe('expense');
  });

  it.skipIf(!has2025)('parses 2025 JRE CSV file', () => {
    const { detectedType, transactions } = parseJreFile(jre2025Path, 'RB-torihikimeisai.csv');

    expect(detectedType).toBe('jre');
    expect(transactions.length).toBeGreaterThan(0);
  });
});
