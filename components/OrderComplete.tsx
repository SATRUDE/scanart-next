'use client';

import React from 'react';
import { TextLink } from '@/components/v2/ui';
import { OrderLine, OrderTotals, fill } from '@/components/v2/checkout/parts';
import type { CheckoutStrings } from '@/lib/i18n';

/** What the confirmation shows, captured by CheckoutPage before the basket is cleared. */
export interface CompletedOrder {
  firstName: string;
  email: string;
  lines: React.ComponentProps<typeof OrderLine>[];
  totals: React.ComponentProps<typeof OrderTotals>;
  address: string;
  /** From config/shipping.ts for the destination's zone; null when it has no estimate. */
  days: { from: string; to: string } | null;
}

/**
 * Order confirmed (Figma: Order confirmed · desktop 279:4648, mobile 279:4761).
 *
 * Every line is a real fact: the name and email the buyer typed (Stripe's
 * receipt goes to that address, receipt_email on the PaymentIntent), the
 * delivery estimate for their zone, and the production time and 14-day
 * window from the Delivery page. No order number: the only reference this
 * page holds is an internal one the buyer never sees on their receipt.
 */
export const OrderComplete: React.FC<{ t: CheckoutStrings; order: CompletedOrder; productsHref: string }> = ({ t, order, productsHref }) => {
  const v = t.v2;
  const steps = [
    v.steps.made,
    { title: v.steps.sent.title, body: order.days ? fill(v.steps.sent.body, order.days) : v.steps.sentNoEstimate },
    v.steps.decide,
  ];
  return (
    <div className="page-x page-grid gap-y-16 pt-10 pb-section tab:pt-block">
      <div className="col-span-full flex flex-col gap-10 tab:gap-block desk:col-span-6">
        <div className="flex flex-col gap-group">
          <h1 className="type-h1">{order.firstName ? fill(v.thanks, { name: order.firstName }) : v.thanksNoName}</h1>
          {order.email && <p className="type-lead">{fill(v.placed, { email: order.email })}</p>}
        </div>
        <section aria-labelledby="order-next" className="flex flex-col gap-4">
          <h2 id="order-next" className="type-h3">{v.nextHeading}</h2>
          <ol className="flex flex-col">
            {steps.map(({ title, body }, i) => (
              <li key={title} className="flex flex-col gap-tight border-t border-ink pt-4 pb-6">
                <span aria-hidden className="font-serif text-[22px] leading-[28px] text-text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-serif text-[22px] leading-[28px]">{title}</h3>
                <p className="type-body">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <TextLink href={productsHref} size="body">{v.keepBrowsing}</TextLink>
      </div>

      <aside aria-labelledby="order-summary-done" className="col-span-full desk:col-span-4 desk:col-start-9 desk:pt-2">
        <h2 id="order-summary-done" className="pb-2 type-h3">{v.yourOrder}</h2>
        <ul>
          {order.lines.map((line, i) => <OrderLine key={i} {...line} />)}
        </ul>
        <OrderTotals {...order.totals} />
        {order.address && (
          <div className="flex flex-col gap-1 pt-6">
            <p className="type-label">{v.deliveringTo}</p>
            <p className="type-small">{order.address}</p>
          </div>
        )}
      </aside>
    </div>
  );
};
