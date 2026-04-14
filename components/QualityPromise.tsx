import React from 'react';

export const QualityPromise: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="w-full h-px bg-[rgba(236,236,240,0.3)] mb-16"></div>
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-neutral-900 mb-4">High Quality Promise</h2>
          <p className="text-lg text-neutral-600 leading-relaxed">We take pride in offering artwork that meets the highest standards.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { title: 'Curated', desc: 'We hand-pick all our artists.', h: 'min-h-[160px]' },
            { title: 'Quality', desc: 'We only print on museum quality paper.', h: 'min-h-[160px]' },
            { title: 'Worldwide', desc: 'Available to buy worldwide.', h: 'min-h-[160px]' },
            { title: 'Expert Framing', desc: 'Professional framing services available for all prints.', h: 'min-h-[200px]' },
            { title: 'Authenticity', desc: 'Each piece is sourced directly from Scandinavian artists — supporting local talent and creative communities.', h: 'min-h-[200px]' },
            { title: 'Satisfaction', desc: '30-day return policy on all purchases.', h: 'min-h-[200px]' },
          ].map(f => (
            <div key={f.title} className={`bg-[rgba(236,236,240,0.3)] rounded p-6 flex flex-col justify-between ${f.h}`}>
              <h3 className="text-xl text-neutral-900 mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
