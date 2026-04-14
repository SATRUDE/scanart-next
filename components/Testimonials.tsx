import React from 'react';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl text-neutral-900 mb-2 text-[26px]">Customer Stories</h2>
          <p className="text-neutral-600 text-[15px]">Hear from those who have transformed their spaces</p>
        </div>
        <div className="text-center">
          <blockquote className="text-xl md:text-2xl leading-relaxed text-neutral-900 mb-12 font-light max-w-3xl mx-auto">
            &ldquo;I bought a print for my home, and I will definitely buy more in the future. Thank you for making my apartment more beautiful with your art!&rdquo;
          </blockquote>
          <div className="text-center">
            <cite className="text-neutral-600 not-italic">David Steel</cite>
            <p className="text-sm text-neutral-500 mt-1">London, England</p>
          </div>
        </div>
      </div>
    </section>
  );
};
