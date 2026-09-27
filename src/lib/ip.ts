// Truncates an IP to its network prefix (last IPv4 octet / last 5 IPv6 groups zeroed) so audit
// logs keep enough signal for abuse investigation without pinpointing an individual device.
export function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    const groups = ip.split(':');
    return groups.length >= 3 ? `${groups.slice(0, 3).join(':')}::` : ip;
  }
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts.slice(0, 3).join('.')}.0` : ip;
}
