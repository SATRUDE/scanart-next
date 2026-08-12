import { NextResponse } from 'next/server';
import { lookupDiscountCode } from '@/lib/server/discounts';

// Validates a discount code server-side. The codes themselves live in the
// socialagent store and never reach the client bundle or this public
// repository; the client only ever learns whether the code it asked about is
// valid and what it is worth.
//
// This answer is display only. The charge is recomputed from the same store
// in lib/server/order.ts when the payment intent is created, so a code that
// expires between the two is applied here and refused there, which is the
// right way round.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (typeof code !== 'string' || !code.trim() || code.length > 40) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const discount = await lookupDiscountCode(code);
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
