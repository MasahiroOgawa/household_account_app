import { describe, it, expect } from 'vitest';
import { detectFileType } from '../fileTypeDetector';

describe('detectFileType', () => {
  it('detects UFJ from filename pattern', () => {
    expect(detectFileType([], '3022252_202401.csv')).toBe('ufj');
  });

  it('detects PayPay from filename', () => {
    expect(detectFileType([], 'detail_2024(2156).csv')).toBe('paypay');
  });

  it('detects JRE from filename', () => {
    expect(detectFileType([], 'RB-torihikimeisai.csv')).toBe('jre');
  });

  it('detects SMBC from filename', () => {
    expect(detectFileType([], 'meisai.csv')).toBe('smbc');
  });

  it('detects Orico from filename', () => {
    expect(detectFileType([], 'KAL1B202401.csv')).toBe('orico');
  });

  it('falls back to generic for unknown filename', () => {
    expect(detectFileType([], 'random_file.csv')).toBe('generic');
  });

  it('detects UFJ from header patterns when filename is not csv', () => {
    const headers = ['日付', '摘要', 'お支払金額', 'お預り金額', '残高'];
    // generic *.csv pattern matches first for .csv files, so use non-csv name
    expect(detectFileType(headers, 'data.txt')).toBe('ufj');
  });

  it('detects SMBC from header patterns when filename is not csv', () => {
    const headers = ['年月日', 'お引出し', 'お預け入れ', '摘要'];
    expect(detectFileType(headers, 'data.txt')).toBe('smbc');
  });
});
