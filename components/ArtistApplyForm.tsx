'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
 * A VISIBLE border, applied locally rather than waiting on a token decision.
 *
 * The design system's border tokens are unusable on a form: `border-neutral-200`
 * is 1.26:1 against white and `border-gray-100` on outline buttons is 1.10:1,
 * both far under the 3:1 that WCAG 1.4.11 wants for a control boundary. Stan
 * proposed a `border-strong` token at neutral/500 (#737373, 4.74:1) and that is
 * Mark's call to adopt.
 *
 * Rather than ship an inaccessible form while the token is decided, or invent a
 * token nobody agreed to, this uses neutral-500 directly here. If the token is
 * adopted it is a find-and-replace in one file; if it is not, this page is still
 * accessible. Ticket: "The size and frame pickers have a 1.25:1 border".
 */
const FIELD = 'border-neutral-500';

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
      <div role="status" className="rounded-lg bg-muted/30 p-8">
        <h2 className="text-2xl text-neutral-900">{t.thanksHeading}</h2>
        <p className="mt-4 max-w-prose text-muted-foreground leading-relaxed">{t.thanksBody}</p>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      <div
        ref={summaryRef}
        tabIndex={-1}
        role={hasErrors ? 'alert' : undefined}
        className={hasErrors ? 'rounded border border-destructive p-4 text-sm' : 'sr-only'}
      >
        {hasErrors ? t.errorSummary : ''}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">{t.offeringLegend}</legend>
        <p className="mt-1 text-sm text-muted-foreground">{t.recommendedHint}</p>
        <div className="mt-3 space-y-1">
          {OFFERINGS.map(o => (
            // The whole 44px row is the target, not the 14px control: shadcn's
            // radio is 14x14 at SA's root size, which only passes 2.5.8 on the
            // spacing exception and only just.
            <label
              key={o}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-1 text-sm hover:bg-secondary"
            >
              <input
                type="radio"
                name="offering"
                value={o}
                checked={values.offering === o}
                onChange={() => set('offering', o as Offering)}
                className={`h-4 w-4 ${FIELD}`}
              />
              <span>{t.offeringLabels[o]}</span>
            </label>
          ))}
        </div>
        {errors.offering && <FieldError id="offering-error">{errors.offering}</FieldError>}
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-sm font-medium text-neutral-900">{t.aboutYou}</legend>

        <Field words={{ required: t.required, optional: t.optional }} label={t.fieldLabels.name} name="name" required error={errors.name}>
          <Input
            id="name"
            className={FIELD}
            value={values.name ?? ''}
            onChange={e => set('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field words={{ required: t.required, optional: t.optional }} label={t.fieldLabels.basedIn} name="basedIn" required error={errors.basedIn}>
          <Input
            id="basedIn"
            className={FIELD}
            placeholder={t.fieldPlaceholders.basedIn}
            value={values.basedIn ?? ''}
            onChange={e => set('basedIn', e.target.value)}
            aria-invalid={Boolean(errors.basedIn)}
            aria-describedby={errors.basedIn ? 'basedIn-error' : undefined}
          />
        </Field>

        <Field words={{ required: t.required, optional: t.optional }} label={t.fieldLabels.styleNote} name="styleNote" required error={errors.styleNote}>
          <Textarea
            id="styleNote"
            rows={4}
            className={FIELD}
            placeholder={t.fieldPlaceholders.styleNote}
            value={values.styleNote ?? ''}
            onChange={e => set('styleNote', e.target.value)}
            aria-invalid={Boolean(errors.styleNote)}
            aria-describedby={errors.styleNote ? 'styleNote-error' : undefined}
          />
        </Field>

        <Field words={{ required: t.required, optional: t.optional }} label={t.fieldLabels.whyFit} name="whyFit" required error={errors.whyFit}>
          <Textarea
            id="whyFit"
            rows={4}
            className={FIELD}
            placeholder={t.fieldPlaceholders.whyFit}
            value={values.whyFit ?? ''}
            onChange={e => set('whyFit', e.target.value)}
            aria-invalid={Boolean(errors.whyFit)}
            aria-describedby={errors.whyFit ? 'whyFit-error' : undefined}
          />
        </Field>

        <Field words={{ required: t.required, optional: t.optional }} label={t.fieldLabels.email} name="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            className={FIELD}
            placeholder={t.fieldPlaceholders.email}
            value={values.email ?? ''}
            onChange={e => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>
      </fieldset>

      <fieldset>
        {/* The requirement is "one of the two", so it sits on the legend and the
            error attaches here rather than to an arbitrary one of them. */}
        <legend className="text-sm font-medium text-neutral-900">{t.linksLegend}</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.linksHint} <span className="text-muted-foreground">{t.required}</span>
        </p>
        <div className="mt-3 space-y-4">
          <div>
            <Label htmlFor="website" className="text-sm">
              {t.fieldLabels.website}
            </Label>
            <Input
              id="website"
              className={`mt-1 ${FIELD}`}
              placeholder={t.fieldPlaceholders.website}
              value={values.website ?? ''}
              onChange={e => set('website', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="instagram" className="text-sm">
              {t.fieldLabels.instagram}
            </Label>
            <Input
              id="instagram"
              className={`mt-1 ${FIELD}`}
              placeholder={t.fieldPlaceholders.instagram}
              value={values.instagram ?? ''}
              onChange={e => set('instagram', e.target.value)}
            />
          </div>
        </div>
        {errors.links && <FieldError id="links-error">{errors.links}</FieldError>}
      </fieldset>

      <div>
        {/* Sets ScoutedArtist WAITING, which the store documents as "open door,
            revisit later". A real state rather than a sentiment. */}
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={values.keepOnFile ?? false}
            onChange={e => set('keepOnFile', e.target.checked)}
            className={`mt-0.5 h-4 w-4 ${FIELD}`}
          />
          <span>{t.keepOnFile}</span>
        </label>
        <p className="mt-4 max-w-prose text-sm text-muted-foreground">{t.privacy}</p>
      </div>

      {state === 'failed' && (
        <p role="alert" className="text-sm text-destructive">
          {t.sendFailed}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === 'sending'} className="w-full sm:w-auto">
        {state === 'sending' ? t.submitting : t.submit}
      </Button>
    </form>
  );
}

/** A label that always stays visible, plus a word marker rather than an
 *  asterisk. Placeholder contrast is 4.58:1, clearing 4.5:1 by 0.08, which is
 *  too thin a margin to let a placeholder carry a field's meaning. */
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
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={name} className="text-sm">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">
          {required ? words.required : words.optional}
        </span>
      </div>
      <div className="mt-1">{children}</div>
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {children}
    </p>
  );
}
