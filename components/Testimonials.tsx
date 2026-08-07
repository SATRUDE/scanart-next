import React from 'react';
import type { TestimonialsStrings } from '@/lib/i18n';

// English defaults so existing callers render identically with no props.
const DEFAULT_STRINGS: TestimonialsStrings = {
  heading: 'Customer Stories',
  sub: 'Hear from those who have transformed their spaces',
  quote: 'I bought a print for my home, and I will definitely buy more in the future. Thank you for making my apartment more beautiful with your art!',
  name: 'David Steel',
  location: 'London, England',
};

interface TestimonialsProps {
  /** Localised copy; defaults to the English strings. */
  strings?: TestimonialsStrings;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ strings = DEFAULT_STRINGS }) => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl text-neutral-900 mb-2 text-[26px]">{strings.heading}</h2>
          <p className="text-neutral-600 text-[15px]">{strings.sub}</p>
        </div>
        <div className="text-center">
          <blockquote className="text-xl md:text-2xl leading-relaxed text-neutral-900 mb-12 font-light max-w-3xl mx-auto">
            &ldquo;{strings.quote}&rdquo;
          </blockquote>
          <div className="text-center">
            <cite className="text-neutral-600 not-italic">{strings.name}</cite>
            <p className="text-sm text-neutral-500 mt-1">{strings.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
