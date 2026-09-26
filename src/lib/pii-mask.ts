import { readContact, type ContactColumns } from '@/lib/reservation-contact';

const MASK = '•••';

export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${Array.from(word)[0]}${MASK}`)
    .join(' ');
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const first = digits.length >= 9 ? digits.slice(-9)[0] : '•';
  return `${first}•• ••• ${digits.slice(-3)}`;
}

const CONTACT_KEYS = [
  'customer_name',
  'customer_phone',
  'customer_name_enc',
  'customer_phone_enc',
] as const satisfies readonly (keyof ContactColumns)[];

export function maskReservation<T extends ContactColumns>(reservation: T) {
  const rest: Partial<T> = { ...reservation };
  for (const key of CONTACT_KEYS) delete rest[key];
  const { name, phone } = readContact(reservation);
  return {
    ...(rest as Omit<T, (typeof CONTACT_KEYS)[number]>),
    customer_name_masked: maskName(name),
    customer_phone_masked: maskPhone(phone),
  };
}
