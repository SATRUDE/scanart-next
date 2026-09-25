'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/v2/ui';
import { track } from '@/lib/analytics';
import {
  COPY,
  OFFERINGS,
  OFFERING_LABEL,
  RECOMMENDED_HINT,
  MESSAGES,
  type ApplyCopy,
  validate,
  type ArtistApplication,
  type Errors,
  type Offering,
} from '@/lib/artist-application';

/**
 * V2 skin (Figma Apply 221:4130, send failed 270:11159; masters Text field
 * 240:4537, Radio card 268:5236, Form section 268:5249, Checkbox 240:4553,
 * Form error 268:5258). Only the markup changed: the state, validation,
 * analytics events and the request to /api/artist-application are as before.
 *
 * Contrast, which was the reason for the old local border (the shadcn tokens
 * were 1.26:1 against white): every control boundary here is ink, so the
 * underline, radio and checkbox all clear the 3:1 WCAG 1.4.11 wants. The radio
 * cards' own outline is the #d1d1d1 border token, but the card is not the
 * control; the 18 px ink circle inside it is.
 *
 * Placeholders are #767676 (4.54:1), not the design's 45% ink (about 3.3:1):
 * they are examples, never the meaning, but they are still text.
 */
const INPUT =
  'block w-full border-0 border-b border-ink bg-transparent pt-[6px] pb-[10px] type-body text-ink outline-none placeholder:text-[#767676] focus-visible:border-b-2 focus-visible:border-focus focus-visible:pb-[9px] aria-[invalid=true]:border-error';

const EN_COPY: ApplyCopy = {
  ...COPY,
  offeringLabels: OFFERING_LABEL,
  recommendedHint: RECOMMENDED_HINT,
  fieldLabels: {
    name: 'Your name',
    basedIn: 'Where you are based',
    styleNote: 'A note on your work',
    whyFit: 'Why you think it fits here',
    email: 'Email',
    website: 'Website',
    instagram: 'Instagram',
  },
  fieldPlaceholders: {
    basedIn: 'Bergen, Norway',
    styleNote: 'What you make, and how. A few sentences is plenty.',
    whyFit: 'Having looked at the artists we show, where would yours sit?',
    email: 'you@example.com',
    website: 'https://',
    instagram: '@yourname',
  },
};

export function ArtistApplyForm({
  copy,
  locale = 'en',
}: { copy?: ApplyCopy; locale?: 'en' | 'no' } = {}) {
  const t = copy ?? EN_COPY;
  const messages = MESSAGES[locale];
  const [values, setValues] = useState<Partial<ArtistApplication>>({ keepOnFile: false });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'editing' | 'sending' | 'sent' | 'failed'>('editing');
  const summaryRef = useRef<HTMLDivElement>(null);

  // Fired once, on the first field anyone touches. Page views tell us who
  // arrived and the submit events tell us who finished; without this there is
  // no way to separate "read it and left" from "started and gave up".
  const started = useRef(false);
  const set = <K extends keyof ArtistApplication>(key: K, value: ArtistApplication[K]) => {
    if (!started.current) {
      started.current = true;
      track('artist-application-start', { locale });
    }
    setValues(v => ({ ...v, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, messages);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // The drop-off signal. Someone who cannot get past validation usually
      // leaves, and the field names say which question is doing it.
      track('artist-application-invalid', { locale, fields: Object.keys(found).sort().join(',') });
      // Move focus to the summary so a keyboard or screen-reader user is told
      // what happened rather than left wondering why nothing submitted.
      summaryRef.current?.focus();
      return;
    }
    setState('sending');
    // An ATTEMPT, not a success: it fires before the request. Compare against
    // artist-application-sent to see whether attempts are actually landing.
    track('artist-application-submit', { locale, offering: values.offering ?? 'unset' });
    try {
      const res = await fetch('/api/artist-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The locale travels with the submission so the archive records which
        // form was used, rather than guessing from a Referer header.
        body: JSON.stringify({ ...values, locale }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { errors?: Errors };
        if (body.errors) {
          // Rejected by the server but not by the browser, so the two copies of
          // validate() disagreed. Worth knowing: it should not happen.
          track('artist-application-invalid', {
            locale,
            fields: Object.keys(body.errors).sort().join(','),
            source: 'server',
          });
          setErrors(body.errors);
          setState('editing');
          summaryRef.current?.focus();
          return;
        }
        track('artist-application-failed', { locale, reason: `http-${res.status}` });
        setState('failed');
        return;
      }
      track('artist-application-sent', { locale, offering: values.offering ?? 'unset' });
      setState('sent');
    } catch {
      // The request never completed, so the applicant saw a failure we would
      // otherwise never hear about.
      track('artist-application-failed', { locale, reason: 'network' });
      setState('failed');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="flex flex-col gap-group border-t border-ink pt-4 tab:pt-6">
        <h2 className="type-h2">{t.thanksHeading}</h2>
        <p className="type-body tab:max-w-[624px]">{t.thanksBody}</p>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const showError = hasErrors || state === 'failed';
  const words = { required: t.required, optional: t.optional };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-block">
      {/* 01 What are you asking for? The requirement is one of three, so the
          error sits on the fieldset rather than on any one card. */}
      <fieldset className="flex flex-col gap-group" aria-describedby={errors.offering ? 'offering-error' : undefined}>
        <FormSection number="01" title={t.offeringLegend} marker={t.required} subtitle={t.offeringHint} legend />
        <div className="flex flex-col gap-tight">
          {OFFERINGS.map(o => (
            // The whole card is the target, well over 44 px, not the 18 px circle.
            <label
              key={o}
              className="flex cursor-pointer items-start gap-4 border border-line p-6 transition-colors hover:border-line-strong has-[:checked]:border-ink has-[:checked]:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
            >
              <span className="flex pt-[6px]">
                <input
                  type="radio"
                  name="offering"
                  value={o}
                  checked={values.offering === o}
                  onChange={() => set('offering', o as Offering)}
                  className="peer sr-only"
                />
                <span aria-hidden className="flex size-[18px] items-center justify-center rounded-full border border-ink peer-checked:[&>span]:block">
                  <span className="hidden size-[10px] rounded-full bg-ink" />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="type-body">{t.offeringLabels[o]}</span>
                <span className="type-small">{t.offeringDescriptions[o]}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.offering && <FieldError id="offering-error">{errors.offering}</FieldError>}
      </fieldset>

      {/* 02 About you and your work */}
      <fieldset className="flex flex-col gap-group">
        <FormSection number="02" title={t.aboutYou} legend />

        <Field words={words} label={t.fieldLabels.name} name="name" required error={errors.name}>
          <input
            id="name"
            className={INPUT}
            value={values.name ?? ''}
            onChange={e => set('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field words={words} label={t.fieldLabels.basedIn} name="basedIn" required error={errors.basedIn}>
          <input
            id="basedIn"
            className={INPUT}
            placeholder={t.fieldPlaceholders.basedIn}
            value={values.basedIn ?? ''}
            onChange={e => set('basedIn', e.target.value)}
            aria-invalid={Boolean(errors.basedIn)}
            aria-describedby={errors.basedIn ? 'basedIn-error' : undefined}
          />
        </Field>

        <Field words={words} label={t.fieldLabels.styleNote} name="styleNote" required error={errors.styleNote}>
          <textarea
            id="styleNote"
            rows={3}
            className={`${INPUT} min-h-[112px] resize-y`}
            placeholder={t.fieldPlaceholders.styleNote}
            value={values.styleNote ?? ''}
            onChange={e => set('styleNote', e.target.value)}
            aria-invalid={Boolean(errors.styleNote)}
            aria-describedby={errors.styleNote ? 'styleNote-error' : undefined}
          />
        </Field>

        <Field words={words} label={t.fieldLabels.whyFit} name="whyFit" required error={errors.whyFit}>
          <textarea
            id="whyFit"
            rows={3}
            className={`${INPUT} min-h-[112px] resize-y`}
            placeholder={t.fieldPlaceholders.whyFit}
            value={values.whyFit ?? ''}
            onChange={e => set('whyFit', e.target.value)}
            aria-invalid={Boolean(errors.whyFit)}
            aria-describedby={errors.whyFit ? 'whyFit-error' : undefined}
          />
        </Field>

        <Field words={words} label={t.fieldLabels.email} name="email" required error={errors.email}>
          <input
            id="email"
            type="email"
            className={INPUT}
            placeholder={t.fieldPlaceholders.email}
            value={values.email ?? ''}
            onChange={e => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>
      </fieldset>

      {/* 03 Where can we see your work? The requirement is "one of the two",
          so it sits on the section marker and the error attaches here rather
          than to an arbitrary one of them. */}
      <fieldset className="flex flex-col gap-group" aria-describedby={errors.links ? 'links-error' : undefined}>
        <FormSection number="03" title={t.linksLegend} marker={t.linksHint} legend />
        <Field words={words} label={t.fieldLabels.website} name="website">
          <input
            id="website"
            className={INPUT}
            placeholder={t.fieldPlaceholders.website}
            value={values.website ?? ''}
            onChange={e => set('website', e.target.value)}
            aria-invalid={Boolean(errors.links)}
          />
        </Field>
        <Field words={words} label={t.fieldLabels.instagram} name="instagram">
          <input
            id="instagram"
            className={INPUT}
            placeholder={t.fieldPlaceholders.instagram}
            value={values.instagram ?? ''}
            onChange={e => set('instagram', e.target.value)}
            aria-invalid={Boolean(errors.links)}
          />
        </Field>
        {errors.links && <FieldError id="links-error">{errors.links}</FieldError>}
      </fieldset>

      {/* Sets ScoutedArtist WAITING, which the store documents as "open door,
          revisit later". A real state rather than a sentiment. */}
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <span className="relative flex shrink-0 pt-[6px]">
          <input
            type="checkbox"
            checked={values.keepOnFile ?? false}
            onChange={e => set('keepOnFile', e.target.checked)}
            className="peer size-[18px] cursor-pointer appearance-none border border-ink bg-bg checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
          <svg aria-hidden width="12" height="9" viewBox="0 0 12 9" fill="none" className="pointer-events-none absolute left-[3px] top-[11px] hidden peer-checked:block">
            <path d="M1 4.5 4.3 7.8 11 1" stroke="white" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="type-body">{t.keepOnFile}</span>
      </label>

      <div className="flex flex-col gap-group">
        {/* Form error (Figma 268:5258): hidden until a send fails, then an
            error rule and title above the button, what to fix, and a way out.
            Focus moves here, so a keyboard or screen-reader user is told what
            happened rather than left wondering why nothing submitted. */}
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={showError ? 'alert' : undefined}
          className={showError ? 'flex flex-col gap-tight border-t border-error pt-4 outline-none' : 'sr-only'}
        >
          {showError && (
            <>
              <p className="type-body text-error">{t.errorTitle}</p>
              <p className="type-small">{hasErrors ? `${t.errorSummary} ${t.errorMarked}` : t.sendFailed}</p>
              {/* No "email us instead" here: an emailed application never
                  reaches the review queue (see app/(en)/artists/apply/page.tsx),
                  so a failed send asks for another try, not a detour. */}
            </>
          )}
        </div>

        <div className="flex flex-col items-start gap-4">
          <Button type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? t.submitting : t.submit}
          </Button>
          <p className="type-small tab:max-w-[624px]">{t.privacy}</p>
        </div>
      </div>
    </form>
  );
}

/**
 * Form section 268:5249: the number in text-accent at the title's size, the
 * title in H3, an optional word marker on the right and a subtitle, under a
 * 1 px rule. Rendered as the fieldset's <legend> so the group keeps its name.
 */
function FormSection({ number, title, marker, subtitle, legend }: { number: string; title: string; marker?: string; subtitle?: string; legend?: boolean }) {
  const Heading = legend ? 'legend' : 'div';
  return (
    <Heading className="float-left flex w-full flex-col gap-tight border-t border-line pt-4 [&+*]:clear-left">
      <span className="flex items-baseline gap-4">
        <span aria-hidden className="type-h3 text-text-accent">{number}</span>
        <span className="min-w-0 flex-1 type-h3">{title}</span>
        {marker && <span className="shrink-0 type-caption">{marker}</span>}
      </span>
      {subtitle && <span className="type-small">{subtitle}</span>}
    </Heading>
  );
}

/** Text field 240:4537: a label that always stays visible, with a word marker
 *  rather than an asterisk, then the underlined input and, on an error, a red
 *  rule and a sentence under it. The placeholder is only ever an example. */
function Field({
  label,
  name,
  required,
  error,
  children,
  words,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  words: { required: string; optional: string };
}) {
  return (
    <div className="flex flex-col gap-tight">
      <div className="flex items-baseline gap-3">
        <label htmlFor={name} className="type-small">
          {label}
        </label>
        <span className="type-caption">{required ? words.required : words.optional}</span>
      </div>
      {children}
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="type-small text-error">
      {children}
    </p>
  );
}
