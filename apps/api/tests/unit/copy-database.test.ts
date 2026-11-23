import { describe, expect, it } from 'vitest';
import { insertionOrder } from '../../src/db/copy-database.js';
import { poolConfig } from '../../src/db/client.js';

describe('insertionOrder', () => {
  it('puts every table after the tables it references, ignoring self-references', () => {
    const order = insertionOrder(
      ['messages', 'notebooks', 'users', 'notebook_themes', 'message_media'],
      [
        ['notebooks', 'users'],
        ['notebooks', 'notebook_themes'],
        ['messages', 'notebooks'],
        ['messages', 'messages'],
        ['message_media', 'messages'],
      ],
    );
    const at = (t: string) => order.indexOf(t);
    expect(order).toHaveLength(5);
    expect(at('users')).toBeLessThan(at('notebooks'));
    expect(at('notebook_themes')).toBeLessThan(at('notebooks'));
    expect(at('notebooks')).toBeLessThan(at('messages'));
    expect(at('messages')).toBeLessThan(at('message_media'));
  });

  it('still returns every table when there is a cycle', () => {
    expect(insertionOrder(['a', 'b'], [['a', 'b'], ['b', 'a']]).sort()).toEqual(['a', 'b']);
  });
});

describe('poolConfig', () => {
  it('drops sslmode from the URL so it cannot override the ssl option', () => {
    const config = poolConfig(
      'postgresql://postgres.abc:secret123@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require',
    );
    expect(config.connectionString).toBe('postgresql://postgres.abc:secret123@aws-0-eu-central-1.pooler.supabase.com:5432/postgres');
  });

  it('keeps a URL without parameters as it is', () => {
    const url = 'postgres://daftar:pa%40ss@localhost:5432/daftar_dev';
    expect(poolConfig(url).connectionString).toBe(url);
  });
});
