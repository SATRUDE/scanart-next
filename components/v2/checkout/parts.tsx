import React from 'react';
import { SmartImage } from '@/components/SmartImage';
import { warmImage } from '@/lib/warm-image';
import { tileAspect } from '@/components/PrintCard';
import { Hairline } from '@/components/v2/ui';

/*
 * The checkout's presentational pieces, one per Figma master (Checkout and
 * Forms groups on the Design system page). No state and no payment logic:
 * CheckoutPage owns all of that and hands these plain values.
 */

/** Form section 268:5249: numeral in text-accent at the title's size, under a 1 px rule. Fields follow 24 below. */
export function FormSection({
  number,
  title,
  subtitle,
  id,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-group">
      <div className="flex flex-col gap-tight border-t border-line pt-4">
        <h2 id={id} className="flex items-baseline gap-4 type-h3">
          <span aria-hidden className="text-text-accent">{number}</span>
          <span>{title}</span>
        </h2>
        {subtitle && <p className="type-small">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Text field 240:4537: label, underlined input (ink rule), Body type. The
 * error state (red rule and a sentence) follows the browser's own validity:
 * `user-invalid` only after the buyer has interacted, never on first paint.
 * Checkout fields carry no Required marker: everything there is required.
 */
export function TextField({
  id,
  label,
  className = '',
  ...input
}: { id: string; label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`flex min-w-0 flex-col gap-tight ${className}`}>
      <label htmlFor={id} className="type-small">{label}</label>
      <input
        id={id}
        {...input}
        className="peer w-full border-0 border-b border-ink bg-transparent pt-[6px] pb-[10px] type-body text-ink outline-none placeholder:text-ink/45 focus-visible:outline-none focus:border-b-2 focus:pb-[9px] user-invalid:border-error"
      />
    </div>
  );
}

/** Form error 268:5258: error rule and title above the submit button, what to do, and a way out by email. */
export function FormError({ title, body, contact }: { title: string; body: React.ReactNode; contact?: React.ReactNode }) {
  return (
    <div role="alert" className="flex flex-col gap-tight border-t border-error pt-4">
      <p className="type-body text-error">{title}</p>
      <p className="type-small">{body}</p>
      {contact && <p className="type-small">{contact}</p>}
    </div>
  );
}

/** Order line 275:5613: read only. Image on image-bg at the print's own ratio, 64 wide. */
export function OrderLine({
  image,
  title,
  price,
  artist,
  detail,
  quantity,
  size,
}: {
  image: string;
  title: string;
  price: string;
  artist?: string;
  detail: string;
  quantity: string;
  size?: string;
}) {
  return (
    <li className="flex items-start gap-4 border-b border-line py-4">
      <span className={`relative w-16 shrink-0 overflow-hidden bg-image-bg ${tileAspect(size)}`}>
        {/* 64 px wide: without this hint SmartImage's '100vw' default makes
            the browser pick a full-viewport variant to fill a thumbnail. */}
        <SmartImage src={warmImage(image)} alt="" sizes="64px" className="h-full w-full" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex items-start justify-between gap-4 type-body">
          <span>{title}</span>
          <span className="shrink-0">{price}</span>
        </span>
        {artist && <span className="type-small">{artist}</span>}
        <span className="type-small">{detail}</span>
        <span className="type-small">{quantity}</span>
      </span>
    </li>
  );
}

/** Order totals 275:5622. Delivery is one rate per country, so it is a line, not a choice. */
export function OrderTotals({
  rows,
  note,
  totalLabel,
  total,
}: {
  rows: { label: React.ReactNode; value: React.ReactNode }[];
  note?: string;
  totalLabel: string;
  total: string;
}) {
  return (
    <div className="flex flex-col gap-[10px] pt-5">
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          <div className="flex items-baseline justify-between gap-4 type-body">
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
          {i === 1 && note && <p className="type-small">{note}</p>}
        </React.Fragment>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-[14px] type-h3">
        <span>{totalLabel}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

/** Assurance line 237:3729: hairline and caption. Three at most. */
export function AssuranceLines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-[6px] pt-6">
      {lines.map(line => (
        <li key={line} className="flex items-start gap-[10px] type-caption">
          <Hairline className="mt-[9px]" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** "2-3 business days" → { from: '2', to: '3' }, the only part of config/shipping.ts's estimate that needs no translation. */
export function deliveryDays(estimate: string | undefined): { from: string; to: string } | null {
  const m = estimate?.match(/(\d+)\s*-\s*(\d+)/);
  return m ? { from: m[1], to: m[2] } : null;
}

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
