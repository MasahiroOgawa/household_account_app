import fs from 'fs';
import path from 'path';
import { parseOricoDetailCSVFile } from './csvParser';
import Papa from 'papaparse';
const iconv = require('iconv-lite');

describe('CSV Upload (PapaParse simulation)', () => {
  it('should parse transactions from detail202501(2156).csv using PapaParse as in upload', () => {
    const csvPath = path.resolve(__dirname, '../../data/detail202501(2156).csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const results = Papa.parse(raw, { header: false, skipEmptyLines: true });
    // Pass parsed data directly to the parser, as the app does
    const transactions = parseOricoDetailCSVFile(results.data as any[][]);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions.some((t: any) => t.description && t.description.includes('遅延損害金'))).toBe(false); // Should skip invalid row
    expect(transactions.every((t: any) => t.date)).toBe(true);
    expect(transactions.every((t: any) => typeof t.amount === 'number')).toBe(true);
  });
});

describe('CSV Upload Simulation', () => {
  it('should parse transactions from detail202501(2156).csv as if uploaded', () => {
    const csvPath = path.resolve(__dirname, '../../data/detail202501(2156).csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    // Simulate browser upload: split lines, skip header, preprocess cells
    const allRows = raw.split(/\r?\n/);
    const rows = allRows.slice(1).map((line: string) =>
      line.split(',').map((cell: string) => cell.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim())
    );
    const transactions = parseOricoDetailCSVFile(rows);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions.some((t: any) => t.description && t.description.includes('遅延損害金'))).toBe(false); // Should skip invalid row
    expect(transactions.every((t: any) => t.date)).toBe(true);
    expect(transactions.every((t: any) => typeof t.amount === 'number')).toBe(true);
  });
});

describe('Orico/Detail CSV Parser', () => {
  it('parses all valid transactions from detail202501(2156).csv', () => {
    const csvPath = path.resolve(__dirname, '../../data/detail202501(2156).csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const allRows = raw.split(/\r?\n/);
    // Skip header row
    const rows = allRows.slice(1).map((line: string) =>
      line.split(',').map((cell: string) => cell.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim())
    );
    const transactions = parseOricoDetailCSVFile(rows);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions.every((t: any) => t.date)).toBe(true);
    expect(transactions.every((t: any) => typeof t.amount === 'number')).toBe(true);
  });
  it('should parse valid transactions from KAL1B10001020250712125230404.csv', () => {
    const filePath = path.resolve(__dirname, '../../data/KAL1B10001020250712125230404.csv');
    const rawBuffer = fs.readFileSync(filePath);
    const raw = iconv.decode(rawBuffer, 'shift_jis');
    const allRows = raw.split(/\r?\n/);
    // Find the header line (after <...>) and only parse rows after it
    const headerIdx = allRows.findIndex((line: string) => line.includes('利用日'));
    const rows = allRows.slice(headerIdx).map((line: string) =>
      line.split(',').map((cell: string) => cell.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim())
    );
    const transactions = parseOricoDetailCSVFile(rows);
    expect(transactions.length).toBeGreaterThan(0);
    for (const tx of transactions) {
      expect(tx.date).not.toBe('');
      expect(tx.amount).toBeGreaterThan(0);
      expect(tx.shopName).not.toBe('Unknown');
    }
  });
});
