import { describe, expect, it } from 'vitest';
import { containsProfanity, maskProfanity } from '../../src/lib/profanity.js';

describe('profanity filter', () => {
  it('flags known blocked words case-insensitively', () => {
    expect(containsProfanity('you are a BITCH')).toBe(true);
    expect(containsProfanity('كلام عادي وجميل')).toBe(false);
  });

  it('does not flag substrings inside unrelated words', () => {
    expect(containsProfanity('classic scunthorpe example')).toBe(false);
  });

  it('masks matches while preserving length', () => {
    const masked = maskProfanity('this is shit really');
    expect(masked).toBe('this is **** really');
  });
});
