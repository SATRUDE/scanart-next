import { TrackedLink } from '@/components/TrackedLink';
import { Hairline } from '@/components/v2/ui';
import { chromeAria } from '@/lib/i18n';

/**
 * The article's visible breadcrumb: Home / Journal / title, the same three
 * steps as its BreadcrumbList JSON-LD. The shared Breadcrumb (Figma 237:3712)
 * in Caption with the hairline between, rebuilt here only so the links keep
 * their `breadcrumb-click` event. The current step, the title the H1 repeats
 * below, is cut to one line rather than wrapping onto a line of its own.
 */
export function ArticleBreadcrumb({ title }: { title: string }) {
  const crumbs = [
    { label: 'Home', href: '/', level: 'home' },
    { label: 'Journal', href: '/journal', level: 'journal' },
  ];
  return (
    <nav aria-label={chromeAria.en.landmarks.breadcrumb}>
      <ol className="flex items-center gap-[6px] type-caption">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex shrink-0 items-center gap-[6px]">
            {i > 0 && <Hairline />}
            <TrackedLink event="breadcrumb-click" eventData={{ level: c.level }} href={c.href} className="transition-colors hover:text-brand">
              {c.label}
            </TrackedLink>
          </li>
        ))}
        <li className="flex min-w-0 items-center gap-[6px]">
          <Hairline />
          <span aria-current="page" className="truncate">{title}</span>
        </li>
      </ol>
    </nav>
  );
}
