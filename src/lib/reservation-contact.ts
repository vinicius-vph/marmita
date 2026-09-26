import { decryptPii, encryptPii } from '@/lib/pii';

export interface ContactColumns {
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_name_enc?: string | null;
  customer_phone_enc?: string | null;
}

export const CONTACT_COLUMNS = 'customer_name, customer_phone, customer_name_enc, customer_phone_enc';

export function encryptContact(contact: { name: string; phone: string }) {
  return {
    customer_name_enc: encryptPii(contact.name, 'customer_name'),
    customer_phone_enc: encryptPii(contact.phone, 'customer_phone'),
  };
}

// Falls back to the legacy plaintext columns until the backfill has run and they are dropped.
export function readContact(row: ContactColumns): { name: string; phone: string } {
  return {
    name: row.customer_name_enc
      ? decryptPii(row.customer_name_enc, 'customer_name')
      : row.customer_name ?? '',
    phone: row.customer_phone_enc
      ? decryptPii(row.customer_phone_enc, 'customer_phone')
      : row.customer_phone ?? '',
  };
}
