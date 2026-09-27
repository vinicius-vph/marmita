-- Data minimization for admin_audit_log.ip_address: the app now stores only the network
-- prefix (last IPv4 octet / last 5 IPv6 groups zeroed) and purges rows older than 180 days on
-- every insert. This one-time backfill anonymizes IPs already stored under the old (exact) form
-- so nothing precise lingers waiting for retention to catch up.
UPDATE admin_audit_log
SET ip_address = regexp_replace(ip_address, '^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$', '\1.0')
WHERE ip_address ~ '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$';

UPDATE admin_audit_log
SET ip_address = split_part(ip_address, ':', 1) || ':' || split_part(ip_address, ':', 2) || ':' || split_part(ip_address, ':', 3) || '::'
WHERE ip_address LIKE '%:%' AND ip_address NOT LIKE '%::';

DELETE FROM admin_audit_log WHERE created_at < now() - interval '180 days';
