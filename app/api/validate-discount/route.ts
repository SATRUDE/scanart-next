import { NextResponse } from 'next/server';
import { validateDiscountCode } from '@/lib/server/order';

// Validates a discount code server-side. The codes themselves live in the
// DISCOUNT_CODES env var and never reach the client bundle or this public
// repository; the client only ever learns whether the code it asked about is
// valid and what it is worth.
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (typeof code !== 'string' || !code.trim() || code.length > 40) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const discount = validateDiscountCode(code);
    if (!discount) {
      return NextResponse.json({ valid: false });
    }
    return NextResponse.json({
      valid: true,
      code: discount.code,
      percentage: discount.percentage,
      description: `${discount.percentage}% off`,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
