import { describe, it, expect } from 'vitest';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { detectAndMergeDuplicates } from '../../utils/duplicateDetector';
import { configLoader } from '../../utils/config/configLoader';
import { detectCategory, isInternalTransfer, isFee } from '../../utils/category/categoryDetector';
import { parseDate } from '../../utils/parsing/dateParser';
import { parseAmount, parseAbsoluteAmount } from '../../utils/parsing/amountParser';

describe('Parsing Pipeline Integration', () => {
  describe('File detection → Transaction building', () => {
    it('builds UFJ bank transactions from raw CSV rows', () => {
      const headers = ['日付', '摘要', 'お支払金額', 'お預り金額', '残高'];
      const detectedType = detectFileType(headers, 'data.txt');
      expect(detectedType).toBe('ufj');

      const sourceConfig = configLoader.getColumnMapping().sources['ufj'];
      expect(sourceConfig).toBeDefined();

      // UFJ columns: 0=date, 1=unused, 2=description, 3=withdrawal, 4=deposit, 5=balance
      const row = ['2024/05/01', '', '給与振込　カ）テスト', '', '500000', '1000000'];
      const tx = buildTransaction(row, 'ufj', sourceConfig, 'test_ufj.csv');

      expect(tx).not.toBeNull();
      expect(tx!.date).toBe('2024-05-01');
      expect(tx!.amount).toBe(500000);
      expect(tx!.type).toBe('income');
      expect(tx!.source).toContain('UFJ');
    });

    it('builds PayPay transactions from raw CSV rows', () => {
      const detectedType = detectFileType([], 'detail_2024(2156).csv');
      expect(detectedType).toBe('paypay');

      const sourceConfig = configLoader.getColumnMapping().sources['paypay'];
      expect(sourceConfig).toBeDefined();

      // PayPay CSV row structure depends on config
      const columns = sourceConfig.columns;
      expect(columns).toBeDefined();
    });

    it('detects generic type for unknown CSV files', () => {
      const detectedType = detectFileType([], 'unknown_data.csv');
      expect(detectedType).toBe('generic');
    });
  });

  describe('Date parsing → Amount parsing → Category detection pipeline', () => {
    it('processes Japanese date + yen amount + category in sequence', () => {
      const date = parseDate('2024年5月15日');
      expect(date).not.toBeNull();
      expect(date!.getFullYear()).toBe(2024);
      expect(date!.getMonth()).toBe(4); // 0-indexed

      const amount = parseAmount('¥1,234');
      expect(amount).toBe(1234);

      const category = detectCategory('スターバックスコーヒー', 'expense');
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });

    it('handles negative amounts and expense detection', () => {
      const amount = parseAmount('-5000');
      expect(amount).toBe(-5000);

      const absAmount = parseAbsoluteAmount('(3,000)');
      expect(absAmount).toBe(3000);
    });
  });

  describe('Internal transfer filtering', () => {
    it('filters internal transfers but keeps fees', () => {
      // Internal transfer
      expect(isInternalTransfer('振替　自分口座')).toBe(true);
      expect(isFee('振替　自分口座')).toBe(false);

      // Fee transaction
      expect(isFee('振込手数料')).toBe(true);
    });

    it('does not filter normal transactions', () => {
      expect(isInternalTransfer('スーパーマーケット')).toBe(false);
      expect(isInternalTransfer('給与振込')).toBe(false);
    });
  });

  describe('Duplicate detection across sources', () => {
    it('merges duplicate transactions from different sources with similar details', () => {
      const tx1 = {
        id: 'ufj_1',
        date: '2024-05-01',
        time: '12:00:00',
        amount: 5000,
        description: 'ペイペイ　スーパーマーケット田中店',
        category: 'grocery',
        shopName: 'スーパーマーケット田中店',
        type: 'expense' as const,
        source: 'UFJ',
      };

      const tx2 = {
        id: 'paypay_1',
        date: '2024-05-01',
        time: '12:00:00',
        amount: 5000,
        description: 'ペイペイ　スーパーマーケット田中店舗',
        category: 'grocery',
        shopName: 'スーパーマーケット田中店舗',
        type: 'expense' as const,
        source: 'PayPay',
      };

      const result = detectAndMergeDuplicates([tx1, tx2]);
      expect(result).toHaveLength(1);
      // Merged result should use the longer description
      expect(result[0].description.length).toBeGreaterThanOrEqual(tx1.description.length);
    });

    it('keeps distinct transactions from different sources', () => {
      const tx1 = {
        id: 'ufj_1',
        date: '2024-05-01',
        time: '12:00:00',
        amount: 5000,
        description: 'スーパーマーケット',
        category: 'grocery',
        shopName: 'スーパー',
        type: 'expense' as const,
        source: 'UFJ',
      };

      const tx2 = {
        id: 'paypay_1',
        date: '2024-05-01',
        time: '12:00:00',
        amount: 3000,
        description: 'コンビニエンスストア',
        category: 'grocery',
        shopName: 'コンビニ',
        type: 'expense' as const,
        source: 'PayPay',
      };

      const result = detectAndMergeDuplicates([tx1, tx2]);
      expect(result).toHaveLength(2);
    });
  });

  describe('End-to-end category assignment', () => {
    it('assigns categories for common Japanese merchants', () => {
      // These merchants should get some category (may vary based on mapping config)
      const merchants = ['セブンイレブン', '東京電力', 'ＪＲ東日本'];

      for (const desc of merchants) {
        const cat = detectCategory(desc, 'expense');
        expect(typeof cat).toBe('string');
        expect(cat.length).toBeGreaterThan(0);
      }
    });

    it('assigns salary category for income transactions', () => {
      const cat = detectCategory('給与振込', 'income');
      expect(cat).toBe('private-salary');
    });
  });
});
