import { format, parseISO } from 'date-fns';
import { pt, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const dateFnsLocales: Record<string, Locale> = { pt, en: enUS, es };

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function formatDate(dateStr: string, locale = 'pt'): string {
  try {
    const date = parseISO(dateStr);
    const l = dateFnsLocales[locale] ?? pt;
    const pattern = locale === 'en' ? 'EEEE, d MMMM' : "EEEE, d 'de' MMMM";
    return format(date, pattern, { locale: l }).toLowerCase();
  } catch {
    return dateStr;
  }
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('351')) {
    return `+351 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function formatDateTime(dateStr: string, locale = 'pt'): string {
  try {
    const date = parseISO(dateStr);
    const l = dateFnsLocales[locale] ?? pt;
    const pattern = locale === 'en'
      ? 'MMMM d, yyyy, HH:mm'
      : "d 'de' MMMM 'de' yyyy, HH:mm";
    return format(date, pattern, { locale: l }).toLowerCase();
  } catch {
    return dateStr;
  }
}
