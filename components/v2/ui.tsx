import React from 'react';
import Link from 'next/link';
import { chromeAria } from '@/lib/i18n';

/*
 * V2 primitives, one per Figma master (Design system page, Masters band).
 * Server components: none of these needs JavaScript in the browser, so the
 * content ships in the HTML and the pages stay static.
 *
 * Rules they encode (layout.md): one Primary button per section; links are
 * never underlined and turn peach on hover; sections are separated by a 1 px
 * rule, never a box; the brand hairline (12 × 1 accent) separates meta items.
 */

type Cls = { className?: string };

/** Separator 41:75. White on a black button. */
export function Hairline({ className = '', onDark = false }: Cls & { onDark?: boolean }) {
  return <span aria-hidden className={`hairline ${onDark ? '!bg-on-primary' : ''} ${className}`} />;
}

/** Items separated by the hairline, e.g. "Helene Brox — 50 × 70 cm". */
export function Meta({ items, className = '' }: Cls & { items: React.ReactNode[] }) {
  const shown = items.filter(Boolean);
  return (
    <span className={`inline-flex flex-wrap items-center gap-[6px] ${className}`}>
      {shown.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Hairline />}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

type ButtonBase = {
  children: React.ReactNode;
  /** Primary: black and square, one per section. Secondary: outlined. Link: text only. */
  variant?: 'primary' | 'secondary' | 'link';
  /** Show price: the total after a hairline (white on Primary). */
  price?: string;
  className?: string;
  fullWidth?: boolean;
};
type ButtonAsLink = ButtonBase & { href: string; prefetch?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>;
type ButtonAsButton = ButtonBase & { href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Button 12:91. Body 16/24 padding, Label type; the 3 px outer pad leaves room for the 2 px focus ring. */
export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { children, variant = 'primary', price, className = '', fullWidth, ...rest } = props;
  const body =
    variant === 'primary'
      ? 'bg-ink text-on-primary hover:bg-primary-hover px-6 py-4'
      : variant === 'secondary'
        ? 'border border-ink text-ink hover:bg-surface-strong px-6 py-4'
        : 'text-ink hover:text-brand py-1';
  const cls = `inline-flex items-center justify-center gap-3 type-label whitespace-nowrap transition-colors disabled:opacity-40 aria-disabled:opacity-40 ${body} ${fullWidth ? 'w-full' : ''} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {price && (
        <>
          <Hairline onDark={variant === 'primary'} />
          <span>{price}</span>
        </>
      )}
    </>
  );
  if ('href' in props && props.href) {
    const { href, ...anchor } = rest as Omit<ButtonAsLink, keyof ButtonBase>;
    return <Link href={href} className={cls} {...anchor}>{inner}</Link>;
  }
  return <button type="button" className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{inner}</button>;
}

/**
 * Link 237:3689: text link, never underlined. Hover turns it peach with the
 * hairline growing in front (0 → 12 px, 200 ms). Size Body or Small.
 */
export function TextLink({
  href,
  children,
  arrow = true,
  size = 'small',
  className = '',
  external,
  ...rest
}: Cls & { href: string; children: React.ReactNode; arrow?: boolean; size?: 'body' | 'small'; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const cls = `group/link inline-flex items-center gap-2 ${size === 'body' ? 'type-body' : 'type-small'} transition-colors hover:text-brand ${className}`;
  const inner = (
    <>
      {/* The hairline grows in front on hover; at rest it takes no space, so
          the link sits flush on its column (the negative margin cancels the gap). */}
      <span aria-hidden className="-mr-2 h-px w-0 bg-brand transition-[width,margin] duration-200 ease-out group-hover/link:mr-0 group-hover/link:w-3" />
      <span>{children}</span>
      {arrow && <span aria-hidden>→</span>}
    </>
  );
  if (external || /^(https?:|mailto:)/.test(href)) {
    return <a href={href} className={cls} {...rest} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>;
  }
  return <Link href={href} className={cls} {...rest}>{inner}</Link>;
}

/** Breadcrumb 237:3712: Caption, hairline between. Visible and linked; pair it with BreadcrumbList JSON-LD. */
export function Breadcrumb({ items, locale = 'en', className = '' }: Cls & { items: { label: string; href?: string }[]; locale?: 'en' | 'no' }) {
  return (
    <nav aria-label={chromeAria[locale].landmarks.breadcrumb} className={className}>
      <ol className="flex flex-wrap items-center gap-[6px] type-caption">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-[6px]">
            {i > 0 && <Hairline />}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="transition-colors hover:text-brand">{item.label}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Page header 238:3688: optional breadcrumb, the page's H1 in Display (Mobile
 * H1), optional lead on 6 columns and a meta line. 64 below the nav, 40 on mobile.
 */
export function PageHeader({
  title,
  lead,
  meta,
  breadcrumb,
  locale = 'en',
  className = '',
  titleClassName = '',
  children,
}: Cls & {
  title: React.ReactNode;
  lead?: React.ReactNode;
  meta?: React.ReactNode[];
  breadcrumb?: { label: string; href?: string }[];
  /** Page language, for the breadcrumb's landmark label. */
  locale?: 'en' | 'no';
  titleClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={`flex flex-col gap-4 tab:gap-6 pt-10 tab:pt-block ${className}`}>
      {breadcrumb && <Breadcrumb items={breadcrumb} locale={locale} />}
      <h1 className={`type-display tab:max-w-[1061px] ${titleClassName}`}>{title}</h1>
      {lead && <div className="type-body tab:type-lead tab:max-w-[624px]">{lead}</div>}
      {meta && meta.length > 0 && <Meta items={meta} className="type-small" />}
      {children}
    </header>
  );
}

/**
 * Section header 238:3665: heading in H2 under a 1 px ink rule, one optional
 * link on the right. 64 above the content (48 on mobile).
 */
export function SectionHeader({
  title,
  link,
  as: Heading = 'h2',
  id,
  className = '',
}: Cls & { title: React.ReactNode; link?: { href: string; label: string }; as?: 'h2' | 'h3'; id?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-6 border-t border-ink pt-4 tab:pt-6 ${className}`}>
      <Heading id={id} className="type-h2">{title}</Heading>
      {link && (
        <TextLink href={link.href} arrow={false} className="shrink-0 tab:type-label">
          {link.label}
        </TextLink>
      )}
    </div>
  );
}

/**
 * Question 238:4065, the Help and FAQ row: rule underneath, + / −, answer on 6
 * columns. A native <details>, so the answer is always in the served HTML
 * (search reads it) and opening needs no JavaScript. Open the first in each group.
 */
export function Question({
  question,
  children,
  open = false,
  size = 'large',
  as: Heading = 'h3',
  className = '',
}: Cls & { question: React.ReactNode; children: React.ReactNode; open?: boolean; size?: 'large' | 'small'; as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <details open={open} className={`group/q border-b border-ink ${size === 'large' ? 'py-[14px] tab:py-[18px]' : 'py-[14px]'} ${className}`}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <Heading className={size === 'large' ? 'type-body tab:type-h3' : 'type-body'}>{question}</Heading>
        <span aria-hidden className={size === 'large' ? 'type-body tab:type-h3' : 'type-body'}>
          <span className="group-open/q:hidden">+</span>
          <span className="hidden group-open/q:inline">−</span>
        </span>
      </summary>
      <div className="mt-3 type-body tab:max-w-[624px] [&_a]:text-text-accent [&_p+p]:mt-6">{children}</div>
    </details>
  );
}

/**
 * List item 156:290. Check and Not included use a thin ink stroke; Bullet is
 * the hairline; Number uses serif numerals in text-accent. Markers 32 wide.
 */
export function ListItem({
  type = 'check',
  number,
  children,
  className = '',
}: Cls & { type?: 'check' | 'cross' | 'bullet' | 'number'; number?: string; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-4 type-body ${className}`}>
      <span aria-hidden className="flex h-[30px] w-8 shrink-0 items-center">
        {type === 'check' && (
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5.2 4.8 9 13 1" stroke="currentColor" strokeWidth="1.25" /></svg>
        )}
        {type === 'cross' && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="m1 1 8 8M9 1 1 9" stroke="currentColor" strokeWidth="1.25" /></svg>
        )}
        {type === 'bullet' && <Hairline />}
        {type === 'number' && <span className="type-numeral text-text-accent">{number}</span>}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

/**
 * Content section 258:3930: the heading on 4 columns under a rule; on the
 * other 8, under a rule, an intro and content bodies 64 apart (40 on mobile),
 * then at most one button and a text link.
 */
export function ContentSection({
  title,
  intro,
  children,
  footer,
  id,
  as: Heading = 'h2',
  className = '',
}: Cls & { title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; id?: string; as?: 'h2' | 'h3' }) {
  return (
    <section aria-labelledby={id} className={`page-grid gap-y-6 ${className}`}>
      <div className="col-span-full border-t border-ink pt-4 tab:pt-6 desk:col-span-4">
        <Heading id={id} className="type-h2">{title}</Heading>
      </div>
      <div className="col-span-full flex flex-col gap-10 tab:gap-block desk:col-span-8 desk:border-t desk:border-ink desk:pt-6">
        {intro && <div className="type-body tab:max-w-[624px] [&_p+p]:mt-6 [&_a]:text-text-accent">{intro}</div>}
        {children}
        {footer && <div className="flex flex-wrap items-center gap-8">{footer}</div>}
      </div>
    </section>
  );
}

/** Content body 158:440: one body inside a Content section, 6 columns, with an optional H3. */
export function ContentBody({ title, children, as: Heading = 'h3', className = '' }: Cls & { title?: React.ReactNode; children: React.ReactNode; as?: 'h3' | 'h4' }) {
  return (
    <div className={`flex flex-col gap-6 tab:max-w-[624px] ${className}`}>
      {title && <Heading className="type-h3">{title}</Heading>}
      <div className="type-body [&_p+p]:mt-6 [&_a]:text-text-accent [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-4 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-4">{children}</div>
    </div>
  );
}

/**
 * Link row 238:4220: a destination with a note and an arrow, rule underneath.
 * Used for route lists (404, search, Delivery contact).
 */
export function LinkRow({ href, children, note, className = '' }: Cls & { href: string; children: React.ReactNode; note?: React.ReactNode }) {
  const external = /^(https?:|mailto:)/.test(href);
  const cls = `group/row flex items-baseline justify-between gap-4 border-b border-ink py-[14px] tab:py-[18px] transition-colors hover:text-brand ${className}`;
  const inner = (
    <>
      <span className="type-body tab:type-h3">{children}</span>
      <span className="flex items-baseline gap-4 type-small">
        {note && <span className="hidden tab:inline">{note}</span>}
        <span aria-hidden className="type-body">→</span>
      </span>
    </>
  );
  return external ? <a href={href} className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>;
}

/**
 * Fact row 237:3728: a label and a value under a rule (First drops the top
 * rule when a heading's rule sits directly above). Label column 110.
 */
export function FactRow({ label, children, first = false, className = '' }: Cls & { label: React.ReactNode; children: React.ReactNode; first?: boolean }) {
  return (
    <div className={`flex gap-4 tab:gap-6 py-[10px] tab:py-3 ${first ? '' : 'border-t border-line'} ${className}`}>
      <dt className="w-[110px] shrink-0 type-body">{label}</dt>
      <dd className="min-w-0 flex-1 type-body">{children}</dd>
    </div>
  );
}

/**
 * Index row 241:3805, numbered editorial rows ("How the shop works"):
 * numeral, title and body. Desktop lays them across the grid; mobile stacks.
 */
export function IndexRow({ number, title, children, as: Heading = 'h3', className = '' }: Cls & { number: string; title: React.ReactNode; children: React.ReactNode; as?: 'h3' | 'h4' }) {
  return (
    <div className={`page-grid gap-y-2 border-t border-ink pt-4 pb-2 tab:pt-6 tab:pb-6 ${className}`}>
      <p aria-hidden className="col-span-full type-h3 text-text-accent desk:col-span-1">{number}</p>
      <Heading className="col-span-full type-h3 desk:col-span-4">{title}</Heading>
      <div className="col-span-full type-body desk:col-span-4 desk:col-start-9">{children}</div>
    </div>
  );
}
