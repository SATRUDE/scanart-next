'use client';

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { helpGroups, HelpGroup } from '@/data/help';

interface HelpSectionsProps {
  /** Localised FAQ groups; defaults to the English data/help.ts content. */
  groups?: HelpGroup[];
}

// The grouped FAQ sections: each category is a heading (left) with its
// accordion (right) on SA's section grid. All rows closed by default
// (Accordion type="single" collapsible); one opens on click.
export const HelpSections: React.FC<HelpSectionsProps> = ({ groups = helpGroups }) => {
  return (
    <div className="container mx-auto px-8">
      <div className="space-y-16">
        {groups.map((group, gi) => (
          <section key={group.category} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-normal text-neutral-900">{group.category}</h2>
            </div>
            <div className="lg:col-span-2">
              <Accordion type="single" collapsible className="w-full border-t">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${gi}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
