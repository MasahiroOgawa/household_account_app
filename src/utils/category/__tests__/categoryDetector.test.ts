import { describe, it, expect } from 'vitest';
import { detectCategory, isInternalTransfer, isFee } from '../categoryDetector';

describe('detectCategory', () => {
  it('detects salary for income with 給与 keyword', () => {
    expect(detectCategory('給与振込', 'income')).toBe('salary');
  });

  it('detects withdraw for ATM', () => {
    expect(detectCategory('ATM出金', 'income')).toBe('withdraw');
  });

  it('returns other_expense for unknown expense', () => {
    expect(detectCategory('something completely unknown', 'expense')).toBe('other_expense');
  });

  it('returns other_income for unknown income', () => {
    expect(detectCategory('something completely unknown', 'income')).toBe('other_income');
  });

  it('detects country_refund for 還付', () => {
    expect(detectCategory('税金還付', 'income')).toBe('country_refund');
  });

  it('detects company_refund for 返金', () => {
    expect(detectCategory('返金処理', 'income')).toBe('company_refund');
  });
});

describe('isInternalTransfer', () => {
  it('returns true for 振替', () => {
    expect(isInternalTransfer('口座振替')).toBe(true);
  });

  it('returns true for チャージ', () => {
    expect(isInternalTransfer('PayPay残高チャージ')).toBe(true);
  });

  it('returns false for regular transaction', () => {
    expect(isInternalTransfer('スーパーマーケット')).toBe(false);
  });
});

describe('isFee', () => {
  it('returns true for 手数料', () => {
    expect(isFee('振込手数料')).toBe(true);
  });

  it('returns false for regular transaction', () => {
    expect(isFee('スーパーマーケット')).toBe(false);
  });
});
