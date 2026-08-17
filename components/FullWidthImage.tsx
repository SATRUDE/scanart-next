import React from 'react';
import Image from 'next/image';

// The banner scene is inspire-09 (Birdie Blue by Renate Thor, a real
// catalogue print) baked from socialagent's 2x-upscaled source (3052x2512).
// object-[33%_4%] is measured, not decorative: the framed print occupies
// x 353-624, y 39-503 in the 1526x1256 geometry, and this position keeps it
// whole at every crop the section produces on real devices, from a 2.54:1
// desktop letterbox down to a 0.63:1 phone. Past ~3.19:1 no position can
// hold a 476px-tall print, so min-h-[32vw] stops the aspect getting there
// on full-screen ultrawides. Re-derive the numbers before swapping the
// image; they are properties of this scene, not of the layout.
export const FullWidthImage: React.FC = () => {
  return (
    <section className="w-full mb-0">
      <div className="relative w-full h-[60vh] md:h-[70vh] min-h-[32vw] overflow-hidden">
        <Image
          src="/images/homepage/birdie-blue-dining.jpg"
          alt="Birdie Blue by Renate Thor above a light oak dining table in a soft blue room"
          fill
          sizes="100vw"
          className="object-cover object-[33%_4%]"
        />
      </div>
    </section>
  );
};
