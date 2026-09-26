import type { Reservation } from '@/types';

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

export function maskReservation<T extends Pick<Reservation, 'customer_name' | 'customer_phone'>>(
  reservation: T
) {
  const { customer_name, customer_phone, ...rest } = reservation;
  return {
    ...rest,
    customer_name_masked: maskName(customer_name),
    customer_phone_masked: maskPhone(customer_phone),
  };
}
