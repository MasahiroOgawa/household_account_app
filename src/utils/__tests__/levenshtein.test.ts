import { describe, it, expect } from 'vitest';
import { levenshteinDistance, calculateStringSimilarity } from '../levenshtein';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns the length of the other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('returns 0 for two empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('calculates single character difference', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });

  it('calculates insertion distance', () => {
    expect(levenshteinDistance('abc', 'abcd')).toBe(1);
  });

  it('calculates deletion distance', () => {
    expect(levenshteinDistance('abcd', 'abc')).toBe(1);
  });

  it('calculates complex differences', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('calculateStringSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(calculateStringSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 1.0 for two empty strings', () => {
    expect(calculateStringSimilarity('', '')).toBe(1.0);
  });

  it('returns 0 for completely different strings of same length', () => {
    expect(calculateStringSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns value between 0 and 1 for partially similar strings', () => {
    const similarity = calculateStringSimilarity('hello', 'hallo');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it('is symmetric', () => {
    expect(calculateStringSimilarity('abc', 'abcd')).toBe(
      calculateStringSimilarity('abcd', 'abc')
    );
  });
});
