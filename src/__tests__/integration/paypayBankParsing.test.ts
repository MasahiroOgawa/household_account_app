import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { configLoader } from '../../utils/config/configLoader';
import { detectEncoding, convertToUnicode } from '../../utils/parsing/encodingDetector';

describe('PayPay Bank Parsing', () => {
  const filePath = 'data/2026/transaction/NBG230614pJs7q86be7hjq3b97q1321JbC2pPs.csv';
  const fileName = 'NBG230614pJs7q86be7hjq3b97q1321JbC2pPs.csv';

  const readAndDecode = (path: string) => {
    const buf = fs.readFileSync(path);
    const uint8 = new Uint8Array(buf);
    const encoding = detectEncoding(uint8);
    return convertToUnicode(uint8, encoding);
  };

  const parseFile = (path: string, name: string) => {
    const decoded = readAndDecode(path);
    const results = Papa.parse(decoded);
    const data = results.data as any[][];
    const headers = data[0] || [];
    const detectedType = detectFileType(headers, name);
    if (!detectedType) return { detectedType: null, transactions: [] };

    const sourceConfig = configLoader.getColumnMapping().sources[detectedType];
    const skipRows = sourceConfig.skipRows || 0;
    const transactions = [];

    for (let i = skipRows; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      const tx = buildTransaction(row, detectedType, sourceConfig, name);
      if (tx) transactions.push(tx);
    }

    return { detectedType, transactions };
  };

  it('detects PayPay Bank file type from filename', () => {
    expect(detectFileType([], fileName)).toBe('paypay_bank');
  });

  it('detects PayPay Bank file type from headers', () => {
    const decoded = readAndDecode(filePath);
    const results = Papa.parse(decoded);
    const headers = results.data[0] as string[];
    expect(detectFileType(headers, 'unknown.csv')).toBe('paypay_bank');
  });

  it('parses transactions from sample file', () => {
    const { detectedType, transactions } = parseFile(filePath, fileName);

    expect(detectedType).toBe('paypay_bank');
    expect(transactions.length).toBeGreaterThan(0);
  });

  it('correctly parses composite date columns', () => {
    const { transactions } = parseFile(filePath, fileName);

    expect(transactions[0].date).toBe('2026-02-20');
  });

  it('correctly parses composite time columns', () => {
    const { transactions } = parseFile(filePath, fileName);

    expect(transactions[0].time).toBe('08:43:15');
  });

  it('correctly identifies income and expense transactions', () => {
    const { transactions } = parseFile(filePath, fileName);

    // First row: deposit of 30000 (振込 オガワ　マサヒロ)
    const deposit = transactions.find(t => t.description.includes('オガワ'));
    expect(deposit).toBeDefined();
    expect(deposit!.type).toBe('income');
    expect(deposit!.amount).toBe(30000);

    // Visaデビット翌月払い is an expense
    const visa = transactions.find(t => t.description.includes('Visaデビット翌月払い'));
    expect(visa).toBeDefined();
    expect(visa!.type).toBe('expense');
    expect(visa!.amount).toBe(23497);
  });

  it('sets source to PayPay銀行', () => {
    const { transactions } = parseFile(filePath, fileName);

    expect(transactions.every(t => t.source === 'PayPay銀行')).toBe(true);
  });
});
