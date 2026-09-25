import React from 'react';
import Image from 'next/image';
import {
  Button,
  ContentBody,
  ContentSection,
  LinkRow,
  ListItem,
  PageHeader,
  Question,
  TextLink,
} from '@/components/v2/ui';

export interface DeliveryCopy {
  locale: 'en' | 'no';
  title: string;
  breadcrumb: { label: string; href?: string }[];
  lead: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  made: { heading: string; body: React.ReactNode };
  production: { heading: string; list: string[] };
  figure: { src: string; alt: string; width: number; height: number; caption: string };
  times: { heading: string; body: React.ReactNode };
  worldwide: { heading: string; body: React.ReactNode };
  returns: {
    heading: string;
    items: { title: string; body: React.ReactNode }[];
    emailLabel: string;
    termsLabel: string;
    termsHref: string;
  };
  questions: { heading: string; items: { q: string; a: string }[] };
  contact: {
    heading: string;
    intro: string;
    rows: { href: string; label: string }[];
    beforeHeading: string;
    beforeList: string[];
  };
  email: string;
}

/**
 * Delivery and returns (Figma: Delivery · desktop 159:447, mobile 190:1847).
 *
 * Every section the page had before V2 is still here, in the same order and
 * with the same wording for the policy itself, grouped the way the design
 * groups them: how an order is made (with production time), delivery times
 * and costs (with worldwide shipping and duties), returns and refunds as one
 * numbered set (change of mind, faulty or lost, how refunds are made), common
 * questions, and contact. The "last updated" date stays in the header.
 */
export function DeliveryBody({ copy }: { copy: DeliveryCopy }) {
  return (
    <div className="page-x pb-section">
      <PageHeader
        title={copy.title}
        breadcrumb={copy.breadcrumb}
        locale={copy.locale}
        lead={copy.lead}
        meta={[copy.lastUpdatedLabel, copy.lastUpdated]}
      />

      <div className="mt-section flex flex-col gap-section">
        <ContentSection id="made" title={copy.made.heading} intro={copy.made.body}>
          <ContentBody title={copy.production.heading}>
            <ul>
              {copy.production.list.map(item => (
                <ListItem key={item}>{item}</ListItem>
              ))}
            </ul>
          </ContentBody>
          <figure className="flex flex-col gap-tight tab:max-w-[624px]">
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-image-bg">
              <Image
                src={copy.figure.src}
                alt={copy.figure.alt}
                fill
                sizes="(max-width: 833px) 100vw, 624px"
                className="object-cover object-[50%_40%]"
              />
            </div>
            <figcaption className="type-caption">{copy.figure.caption}</figcaption>
          </figure>
        </ContentSection>

        <ContentSection id="times" title={copy.times.heading} intro={copy.times.body}>
          <ContentBody title={copy.worldwide.heading}>{copy.worldwide.body}</ContentBody>
        </ContentSection>

        <ContentSection
          id="returns"
          title={copy.returns.heading}
          footer={
            <>
              <Button href={`mailto:${copy.email}`}>{copy.returns.emailLabel}</Button>
              <TextLink href={copy.returns.termsHref} size="body" arrow={false}>{copy.returns.termsLabel}</TextLink>
            </>
          }
        >
          <ol className="flex flex-col gap-group tab:max-w-[624px]">
            {copy.returns.items.map((item, i) => (
              <ListItem key={item.title} type="number" number={String(i + 1).padStart(2, '0')}>
                <span className="block type-body">{item.title}</span>
                <span className="mt-1 block type-small">{item.body}</span>
              </ListItem>
            ))}
          </ol>
        </ContentSection>

        <ContentSection id="questions" title={copy.questions.heading}>
          <div className="tab:max-w-[624px]">
            {copy.questions.items.map(item => (
              <Question key={item.q} question={item.q} size="small" className="[&_summary]:items-center">
                <p>{item.a}</p>
              </Question>
            ))}
          </div>
        </ContentSection>

        <ContentSection id="contact" title={copy.contact.heading} intro={<p>{copy.contact.intro}</p>}>
          <div className="tab:max-w-[624px]">
            {copy.contact.rows.map(row => (
              <LinkRow key={row.href} href={row.href} className="[&>span:first-child]:type-body">
                {row.label}
              </LinkRow>
            ))}
          </div>
          <ContentBody title={copy.contact.beforeHeading}>
            <ul>
              {copy.contact.beforeList.map(item => (
                <ListItem key={item} type="bullet">{item}</ListItem>
              ))}
            </ul>
          </ContentBody>
        </ContentSection>
      </div>
    </div>
  );
}
