import { describe, it, expect } from 'vitest';
import { parseDate } from '../dateParser';

describe('parseDate', () => {
  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  it('returns null for null-ish input', () => {
    expect(parseDate(null as any)).toBeNull();
    expect(parseDate(undefined as any)).toBeNull();
  });

  it('parses YYYY/MM/DD format', () => {
    const date = parseDate('2024/01/15');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0); // January
    expect(date!.getDate()).toBe(15);
  });

  it('parses YYYY-MM-DD format', () => {
    const date = parseDate('2024-03-20');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(2);
    expect(date!.getDate()).toBe(20);
  });

  it('parses YYYYMMDD format', () => {
    const date = parseDate('20240315');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(2);
    expect(date!.getDate()).toBe(15);
  });

  it('parses YYYY.MM.DD format', () => {
    const date = parseDate('2024.06.01');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(5);
    expect(date!.getDate()).toBe(1);
  });

  it('parses Japanese date format', () => {
    const date = parseDate('2024年11月15日');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(10);
    expect(date!.getDate()).toBe(15);
  });

  it('trims whitespace', () => {
    const date = parseDate('  2024/01/01  ');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
  });

  it('returns null for invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });
});
