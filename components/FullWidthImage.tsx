import React from 'react';
import Image from 'next/image';

export const FullWidthImage: React.FC = () => {
  return (
    <section className="w-full mb-0">
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
        <Image src="/images/homepage/scandinavian-living-room.png" alt="Modern Scandinavian living room with leather furniture, abstract art, and natural light" fill sizes="100vw" className="object-cover" />
      </div>
    </section>
  );
};
