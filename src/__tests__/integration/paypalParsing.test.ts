import { describe, it, expect } from 'vitest';
import { detectFileType } from '../../utils/parsing/fileTypeDetector';
import { buildTransaction } from '../../utils/parsing/transactionBuilder';
import { configLoader } from '../../utils/config/configLoader';

describe('PayPal CSV Parsing', () => {
  const paypalHeaders = [
    '日付', '時間', 'タイムゾーン', '名前', 'タイプ', 'ステータス', '通貨',
    '合計', '手数料', '正味', '送信者メールアドレス', '受信者メールアドレス',
    '取引ID', '配送先住所', '住所ステータス', '商品タイトル', '商品ID',
    '配送および手数料の額', '保険金額', '消費税', 'オプション1: 名前',
    'オプション1: 金額', 'オプション2: 名前', 'オプション2: 金額',
    'リファレンス トランザクションID', '請求書番号', 'カスタム番号', '数量',
    '領収書ID', '残高', '住所1行目', '住所2行目/地区/地域', '市区町村',
    '都道府県', '郵便番号', '国および地域', '連絡先の電話番号', '件名',
    '備考', '国コード', '残高への影響',
  ];

  // Column indices: 0=日付, 1=時間, 3=名前, 7=合計, 15=商品タイトル, 40=残高への影響
  const makeRow = (overrides: Record<number, string>) => {
    const row = new Array(41).fill('');
    for (const [idx, val] of Object.entries(overrides)) row[Number(idx)] = val;
    return row;
  };

  it('detects PayPal from header patterns', () => {
    expect(detectFileType(paypalHeaders, 'data.csv')).toBe('paypal');
  });

  it('detects PayPal from filename Download.CSV', () => {
    expect(detectFileType([], 'Download.CSV')).toBe('paypal');
  });

  it('builds income transaction from PayPal row', () => {
    const sourceConfig = configLoader.getColumnMapping().sources['paypal'];
    expect(sourceConfig).toBeDefined();

    const row = makeRow({
      0: '2025/02/17', 1: '09:52:20', 3: '悦章 角谷',
      7: '10,396', 15: '角谷様専用WAWパーツ', 40: '入金',
    });
    const tx = buildTransaction(row, 'paypal', sourceConfig, 'Download.CSV');

    expect(tx).not.toBeNull();
    expect(tx!.date).toBe('2025-02-17');
    expect(tx!.time).toBe('09:52:20');
    expect(tx!.amount).toBe(10396);
    expect(tx!.type).toBe('income');
    expect(tx!.shopName).toBe('悦章 角谷');
    expect(tx!.description).toBe('角谷様専用WAWパーツ');
    expect(tx!.source).toBe('PayPal');
  });

  it('builds expense transaction when 残高への影響 is 出金', () => {
    const sourceConfig = configLoader.getColumnMapping().sources['paypal'];
    const row = makeRow({
      0: '2025/03/10', 1: '14:30:00', 3: 'Amazon',
      7: '3,000', 15: 'USB Cable', 40: '出金',
    });
    const tx = buildTransaction(row, 'paypal', sourceConfig, 'Download.CSV');

    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('expense');
    expect(tx!.amount).toBe(3000);
    expect(tx!.shopName).toBe('Amazon');
  });

  it('uses description fallback when 商品タイトル is empty', () => {
    const sourceConfig = configLoader.getColumnMapping().sources['paypal'];
    const row = makeRow({
      0: '2025/01/15', 1: '10:00:00', 3: 'テスト太郎',
      7: '1,000', 15: '', 40: '入金',
    });
    const tx = buildTransaction(row, 'paypal', sourceConfig, 'Download.CSV');

    expect(tx).not.toBeNull();
    expect(tx!.description).toBe('PayPal Transaction');
  });
});
