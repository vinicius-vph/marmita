import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { decryptPii, encryptPii } from '../../src/lib/pii';
import { encryptContact } from '../../src/lib/reservation-contact';
import { maskName, maskPhone, maskReservation } from '../../src/lib/pii-mask';

const newKey = () => randomBytes(32).toString('base64');

test.describe('PII encryption', () => {
  const originalKey = process.env.PII_ENCRYPTION_KEY;

  test.beforeEach(() => {
    process.env.PII_ENCRYPTION_KEY = newKey();
  });

  test.afterAll(() => {
    process.env.PII_ENCRYPTION_KEY = originalKey;
  });

  test('round-trips text, including accents', () => {
    const text = 'João Conceição +351 912 345 678';
    expect(decryptPii(encryptPii(text, 'customer_name'), 'customer_name')).toBe(text);
  });

  test('never stores plaintext and uses a fresh IV each time', () => {
    const a = encryptPii('912345678', 'customer_phone');
    const b = encryptPii('912345678', 'customer_phone');
    expect(a).toMatch(/^v1:/);
    expect(a).not.toContain('912345678');
    expect(a).not.toBe(b);
  });

  test('rejects tampered ciphertext', () => {
    const [version, iv, tag, ciphertext] = encryptPii('Maria', 'customer_name').split(':');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;
    const tampered = [version, iv, tag, flipped.toString('base64')].join(':');
    expect(() => decryptPii(tampered, 'customer_name')).toThrow();
  });

  test('rejects a ciphertext moved to another column', () => {
    const encrypted = encryptPii('912345678', 'customer_phone');
    expect(() => decryptPii(encrypted, 'customer_name')).toThrow();
  });

  test('rejects decryption with a different key', () => {
    const encrypted = encryptPii('Maria', 'customer_name');
    process.env.PII_ENCRYPTION_KEY = newKey();
    expect(() => decryptPii(encrypted, 'customer_name')).toThrow();
  });

  test('fails clearly when the key is missing or has the wrong size', () => {
    delete process.env.PII_ENCRYPTION_KEY;
    expect(() => encryptPii('x', 'customer_name')).toThrow(/PII_ENCRYPTION_KEY/);
    process.env.PII_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
    expect(() => encryptPii('x', 'customer_name')).toThrow(/32 bytes/);
  });
});

test.describe('PII masking', () => {
  test.beforeEach(() => {
    process.env.PII_ENCRYPTION_KEY = newKey();
  });

  test('masks name and phone', () => {
    expect(maskName('Vinicius  Santos')).toBe('V••• S•••');
    expect(maskPhone('+351 912 345 678')).toBe('9•• ••• 678');
    expect(maskPhone('12345')).toBe('••• ••• 345');
  });

  test('masks encrypted rows and drops every raw contact column', () => {
    const row = { id: 'r1', quantity: 2, ...encryptContact({ name: 'Ana Sá', phone: '912345678' }) };
    const masked = maskReservation(row);
    expect(masked).toEqual({
      id: 'r1',
      quantity: 2,
      customer_name_masked: 'A••• S•••',
      customer_phone_masked: '9•• ••• 678',
    });
  });

  test('still masks legacy plaintext rows before the backfill', () => {
    const masked = maskReservation({ id: 'r2', customer_name: 'Rui Costa', customer_phone: '961234567' });
    expect(masked).toEqual({
      id: 'r2',
      customer_name_masked: 'R••• C•••',
      customer_phone_masked: '9•• ••• 567',
    });
  });
});
