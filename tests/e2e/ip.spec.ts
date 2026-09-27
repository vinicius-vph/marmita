import { test, expect } from '@playwright/test';
import { anonymizeIp } from '../../src/lib/ip';

test.describe('IP anonymization', () => {
  test('zeroes the last IPv4 octet', () => {
    expect(anonymizeIp('203.0.113.42')).toBe('203.0.113.0');
  });

  test('keeps only the first three IPv6 groups', () => {
    expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3::');
  });

  test('leaves unrecognized values untouched', () => {
    expect(anonymizeIp('unknown')).toBe('unknown');
  });
});
