import { describe, expect, it } from 'vitest';
import { sanitizePlainText } from '../../src/lib/sanitize.js';

describe('sanitizePlainText', () => {
  it('strips script tags and their contents entirely (not just the tags)', () => {
    expect(sanitizePlainText('<script>alert(1)</script>hello')).toBe('hello');
  });

  it('strips other HTML tags but keeps their inner text', () => {
    expect(sanitizePlainText('<b>bold</b> text')).toBe('bold text');
  });

  it('preserves plain Arabic and English text untouched', () => {
    expect(sanitizePlainText('مبروك التخرج يا بطل!')).toBe('مبروك التخرج يا بطل!');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizePlainText('   hello world   ')).toBe('hello world');
  });
});
