import { describe, it, expect } from 'vitest';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { configLoader } from '../../utils/config/configLoader';

describe('PayPay Bank Parsing', () => {
  // Headers: 操作日(年), 操作日(月), 操作日(日), 操作時刻(時), 操作時刻(分), 操作時刻(秒), 取引順番号, 摘要, お支払金額, お預り金額, 残高, メモ
  const paypayBankHeaders = [
    '操作日(年)', '操作日(月)', '操作日(日)',
    '操作時刻(時)', '操作時刻(分)', '操作時刻(秒)',
    '取引順番号', '摘要', 'お支払金額', 'お預り金額', '残高', 'メモ',
  ];

  const makeRow = (
    year: string, month: string, day: string,
    hour: string, minute: string, second: string,
    seqNum: string, description: string,
    withdrawal: string, deposit: string, balance: string, memo = '',
  ) => [year, month, day, hour, minute, second, seqNum, description, withdrawal, deposit, balance, memo];

  const sourceConfig = () => configLoader.getColumnMapping().sources['paypay_bank'];

  it('detects PayPay Bank file type from filename', () => {
    expect(detectFileType([], 'NBG230614pJs7q86be7hjq3b97q1321JbC2pPs.csv')).toBe('paypay_bank');
  });

  it('detects PayPay Bank file type from headers', () => {
    expect(detectFileType(paypayBankHeaders, 'unknown.csv')).toBe('paypay_bank');
  });

  it('builds deposit (income) transaction', () => {
    const row = makeRow('2026', '2', '20', '8', '43', '15', '0000101',
      '振込 オガワ　マサヒロ', '', '30000', '30000');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).not.toBeNull();
    expect(tx!.date).toBe('2026-02-20');
    expect(tx!.time).toBe('08:43:15');
    expect(tx!.type).toBe('income');
    expect(tx!.amount).toBe(30000);
    expect(tx!.source).toBe('PayPay銀行');
  });

  it('builds withdrawal (expense) transaction', () => {
    const row = makeRow('2026', '2', '28', '0', '32', '9', '0000101',
      'Visaデビット翌月払い 02月お支払分', '23497', '', '6503');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).not.toBeNull();
    expect(tx!.date).toBe('2026-02-28');
    expect(tx!.time).toBe('00:32:09');
    expect(tx!.type).toBe('expense');
    expect(tx!.amount).toBe(23497);
  });

  it('builds interest income transaction', () => {
    const row = makeRow('2026', '3', '1', '0', '16', '57', '0000101',
      '決算お利息 2月分', '', '1', '6504');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('income');
    expect(tx!.amount).toBe(1);
  });

  it('builds cashback income transaction', () => {
    const row = makeRow('2026', '3', '1', '2', '1', '4', '0000201',
      'Visaデビットキャッシュバック 翌月払い 03月分', '', '113', '6617');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('income');
    expect(tx!.amount).toBe(113);
  });

  it('sets source to PayPay銀行', () => {
    const row = makeRow('2026', '4', '1', '2', '1', '2', '0000101',
      'Visaデビットキャッシュバック 翌月払い 04月分', '', '368', '13623');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).not.toBeNull();
    expect(tx!.source).toBe('PayPay銀行');
  });

  it('returns null for empty year/month/day', () => {
    const row = makeRow('', '', '', '0', '0', '0', '', 'テスト', '', '100', '100');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).toBeNull();
  });

  it('returns null when both withdrawal and deposit are empty', () => {
    const row = makeRow('2026', '1', '1', '0', '0', '0', '0000101', 'テスト', '', '', '0');
    const tx = buildTransaction(row, 'paypay_bank', sourceConfig(), 'NBG_test.csv');

    expect(tx).toBeNull();
  });
});
