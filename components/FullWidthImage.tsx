import React from 'react';

export const FullWidthImage: React.FC = () => {
  return (
    <section className="w-full mb-0">
      <div className="w-full h-[60vh] md:h-[70vh] overflow-hidden">
        <img src="/images/homepage/scandinavian-living-room.png" alt="Modern Scandinavian living room with leather furniture, abstract art, and natural light" className="w-full h-full object-cover" />
      </div>
    </section>
  );
};
