import { describe, it, expect } from 'vitest';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { configLoader } from '../../utils/config/configLoader';

describe('JRE Bank Parsing', () => {
  const jreHeaders = ['取引日', '入出金', '残高', '摘要'];

  const makeRow = (date: string, amount: string, balance: string, description: string) =>
    [date, amount, balance, description];

  const sourceConfig = () => configLoader.getColumnMapping().sources['jre'];

  it('detects JRE file type from filename', () => {
    expect(detectFileType([], 'RB-torihikimeisai.csv')).toBe('jre');
  });

  it('detects JRE file type from headers', () => {
    expect(detectFileType(jreHeaders, 'unknown.csv')).toBe('jre');
  });

  it('detects JRE file type from renamed file via headers', () => {
    expect(detectFileType(jreHeaders, 'my-bank-export.csv')).toBe('jre');
  });

  it('builds income transaction (positive amount)', () => {
    const row = makeRow('20260125', '641677', '700000', '給与 カ）テスト');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).not.toBeNull();
    expect(tx!.date).toBe('2026-01-25');
    expect(tx!.type).toBe('income');
    expect(tx!.amount).toBe(641677);
    expect(tx!.description).toContain('給与');
    expect(tx!.source).toBe('JRE銀行');
  });

  it('builds expense transaction (negative amount)', () => {
    const row = makeRow('20260205', '-50000', '650000', 'ヒ゛ユーカード');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('expense');
    expect(tx!.amount).toBe(50000);
  });

  it('parses YYYYMMDD dates correctly', () => {
    const row = makeRow('20260105', '100000', '100000', 'テスト入金');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).not.toBeNull();
    expect(tx!.date).toBe('2026-01-05');
  });

  it('sets source to JRE銀行', () => {
    const row = makeRow('20260301', '200000', '300000', 'テスト');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).not.toBeNull();
    expect(tx!.source).toBe('JRE銀行');
  });

  it('keeps fee transactions', () => {
    const row = makeRow('20260115', '-220', '99780', '振込手数料');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('expense');
    expect(tx!.amount).toBe(220);
  });

  it('skips internal transfers', () => {
    const row = makeRow('20260201', '-100000', '500000', '振替 テスト口座');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).toBeNull();
  });

  it('returns null for empty date', () => {
    const row = makeRow('', '10000', '10000', 'テスト');
    const tx = buildTransaction(row, 'jre', sourceConfig(), 'RB-torihikimeisai.csv');

    expect(tx).toBeNull();
  });
});
