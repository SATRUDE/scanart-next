import React from 'react';
import type { QualityPromiseStrings } from '@/lib/i18n';

// English defaults so existing callers render identically with no props. The
// per-feature card heights stay layout concerns here, zipped with the copy.
const DEFAULT_STRINGS: QualityPromiseStrings = {
  heading: 'High Quality Promise',
  sub: 'We take pride in offering artwork that meets the highest standards.',
  features: [
    { title: 'Curated', desc: 'We hand-pick all our artists.' },
    { title: 'Quality', desc: 'We only print on museum quality paper.' },
    { title: 'Worldwide', desc: 'Available to buy worldwide.' },
    { title: 'Expert Framing', desc: 'Professional framing services available for all prints.' },
    { title: 'Authenticity', desc: 'Each piece is sourced directly from Scandinavian artists — supporting local talent and creative communities.' },
    { title: 'Satisfaction', desc: '14 days to change your mind on any order.' },
  ],
};

const FEATURE_HEIGHTS = ['min-h-[160px]', 'min-h-[160px]', 'min-h-[160px]', 'min-h-[200px]', 'min-h-[200px]', 'min-h-[200px]'];

interface QualityPromiseProps {
  /** Localised copy; defaults to the English strings. */
  strings?: QualityPromiseStrings;
}

export const QualityPromise: React.FC<QualityPromiseProps> = ({ strings = DEFAULT_STRINGS }) => {
  return (
    <section className="py-16 bg-white">
      <div className="w-full h-px bg-[rgba(236,236,240,0.3)] mb-16"></div>
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-neutral-900 mb-4">{strings.heading}</h2>
          <p className="text-lg text-neutral-600 leading-relaxed">{strings.sub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {strings.features.map((f, i) => (
            <div key={f.title} className={`bg-[rgba(236,236,240,0.3)] rounded p-6 flex flex-col justify-between ${FEATURE_HEIGHTS[i] ?? 'min-h-[200px]'}`}>
              <h3 className="text-xl text-neutral-900 mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
