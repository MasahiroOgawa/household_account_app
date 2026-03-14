import { describe, it, expect } from 'vitest';
import { detectCategory, isInternalTransfer, isFee } from '../categoryDetector';

describe('detectCategory', () => {
  it('detects salary for income with 給与 keyword', () => {
    expect(detectCategory('給与振込', 'income')).toBe('private-salary');
  });

  it('detects deposit for ATM', () => {
    expect(detectCategory('ATM出金', 'income')).toBe('private-deposit');
  });

  it('returns private-other_expense for unknown expense', () => {
    expect(detectCategory('something completely unknown', 'expense')).toBe('private-other_expense');
  });

  it('returns private-other_income for unknown income', () => {
    expect(detectCategory('something completely unknown', 'income')).toBe('private-other_income');
  });

  it('detects private-tax_refund for 還付', () => {
    expect(detectCategory('税金還付', 'income')).toBe('private-tax_refund');
  });

  it('detects private-company_refund for 返金', () => {
    expect(detectCategory('返金処理', 'income')).toBe('private-company_refund');
  });

  it('detects Japanese subcategory for mapped merchants', () => {
    expect(detectCategory('ＡＭＡＺＯＮ．ＣＯ．ＪＰ', 'expense')).toBe('消耗品費');
  });

  it('detects 旅費交通費 for travel-related merchants', () => {
    expect(detectCategory('ＪＲ東海', 'expense')).toBe('旅費交通費');
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
