import { NextRequest, NextResponse } from 'next/server';
import { VALID_CATEGORIES, FUNDRAISING_START_YEAR } from '@/lib/constants';
import { getMonthlyHistory } from '@/lib/fundraising-history';
import type { Category } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const raw = searchParams.get('category');
  const category: Category = VALID_CATEGORIES.includes(raw as Category) ? (raw as Category) : 'meals';

  const currentYear = new Date().getFullYear();
  const rawYear = Number(searchParams.get('year'));
  const year =
    Number.isInteger(rawYear) && rawYear >= FUNDRAISING_START_YEAR && rawYear <= currentYear
      ? rawYear
      : currentYear;

  const data = await getMonthlyHistory(category, year);
  return NextResponse.json(data);
}
