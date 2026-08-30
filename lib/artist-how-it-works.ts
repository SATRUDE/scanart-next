// The artist-facing "how selling with us works" copy.
//
// This is the page Mark sends an artist a link to instead of writing the same
// long email again. It is NOT a public page: the routes set robots noindex,
// nothing links to it, and it is absent from app/sitemap.ts. Discovery is Mark
// sending the link, nothing else. (Deliberately NOT disallowed in robots.txt:
// a blocked page can't be crawled, so the noindex directive never gets read.)
//
// Every fact below comes from one of two places and nowhere else:
//   - the Artist Agreement (Mark, 30 Aug 2026): the 60% share, monthly payment
//     by the 15th, the 14-day clearance, the monthly report, non-exclusivity,
//     the artist keeping their IP, no price without consent, the 20% discount
//     latitude, withdrawal at any time, 30 days' notice, who carries returns,
//     the marketing licence, and promotional prints paid at the same rate.
//   - the live site's own published copy: Gelato, made to order near the
//     buyer, museum-quality archival paper, 50x70cm as the common size, the
//     three frame options, worldwide shipping (data/help.ts, app/delivery).
//
// Three things the agreement does NOT settle, so they are deliberately absent
// rather than guessed at: file formats and resolution, how many pieces an
// artist starts with, and how long we take to reply. Section 10 says we will
// come back on the first two rather than inventing an answer.

export interface HowItWorksSection {
  heading: string;
  /** One paragraph per entry. */
  body: string[];
}

/** Bumped by hand whenever the terms below change, so Mark can tell which
 *  version of the terms an artist was shown when a question comes back. */
export const LAST_UPDATED = '30 August 2026';

export const INTRO =
  "We're a small gallery selling Scandinavian and Nordic art prints, and we take on very few artists. If you're weighing up whether to get in touch, here's exactly how it works: what it costs you, what you earn, who does the printing, and what you keep. We'd rather you knew all of it now than found it out later.";

export const SECTIONS: HowItWorksSection[] = [
  {
    heading: 'Who we take on',
    body: [
      "We're deliberately small. There's only a handful of artists on the site, and each one is here because the work sits well beside the others, not because they filled a gap in a catalogue.",
      "That's most of the offer, really. Your prints aren't one listing among thousands. Someone can see everyone we represent in a single scroll, and that's the point.",
    ],
  },
  {
    heading: 'What it costs you',
    body: [
      "Nothing. Listing your work is free. You don't pay to be on the site, you don't pay for printing, and you don't pay to have anything framed, packed or shipped. We carry all of it, and we only make money when you do.",
    ],
  },
  {
    heading: 'What you earn',
    body: [
      "When a print sells, the cost of printing it and getting it to the customer comes out of the sale first. What's left is split, and 60% of it is yours.",
      "Promotional prints work the same way. If we want to send a print to a stylist or a magazine, we'll ask you first, and you're paid on it exactly as though somebody had bought it.",
    ],
  },
  {
    heading: 'When you get paid',
    body: [
      "Monthly. A sale counts as final once the customer's 14-day return window has closed, and everything that cleared during a month is paid to you by the 15th of the next one.",
      "You also get a monthly sales report: what sold, how many, and at what price. You shouldn't have to ask us how you're doing.",
    ],
  },
  {
    heading: 'How the prints are made',
    body: [
      "Every print is made to order by our print partner, Gelato, at a facility as close to the customer as we can get, so the work doesn't travel further than it has to. It's printed on museum-quality archival paper. Most prints are 50x70cm, ordered either unframed or in a wood, black or white frame, and we ship worldwide.",
      "If a print turns up damaged or faulty, that's ours to fix and ours to pay for. If a customer simply changes their mind inside 30 days, we cover the delivery on that too. Neither comes off your share.",
    ],
  },
  {
    heading: 'Your work stays yours',
    body: [
      "You keep every intellectual property right in your work. We're licensed to reproduce it for the prints we sell and to use it in our own marketing for the gallery, and that's the whole of it. We can't sell it on, license it to anyone else, or use it for anything that isn't promoting the prints.",
      "None of it is exclusive, either. You're free to sell the same image through your own shop, another gallery or anywhere else at the same time. We'd never ask you to choose.",
    ],
  },
  {
    heading: 'You agree every price',
    body: [
      "No print of yours goes on sale at a price you haven't agreed to. We'll suggest one, you say yes or you don't, and nothing is listed until you have.",
      "The one bit of latitude we take is discounting. We can run a sale of up to 20% off without coming back to you every time. Anything deeper than that, we ask.",
    ],
  },
  {
    heading: 'You can take work down, and you can leave',
    body: [
      "You can withdraw any piece from the site at any time, and you don't have to give us a reason. We take it off sale.",
      "Ending the arrangement altogether takes 30 days' written notice, from either side. There's no tie-in, no minimum term and nothing to pay.",
    ],
  },
  {
    heading: 'What you get on the site',
    body: [
      "Your own artist page: your portrait, a proper bio and your prints together in one place, linked from every print of yours we sell.",
      "We market the work too, and we try to do that evenly across everyone we represent. If it ever looks to you like we aren't, say so. That's a conversation, not a complaint.",
    ],
  },
  {
    heading: 'How to start',
    body: [
      "Send us the form and tell us where you're based, what you make and why you think it fits. A person reads every one of them.",
      "If it's a yes, we'll come back to you about which pieces to start with and what files we need, and you'll see the full agreement in writing before you commit to anything.",
    ],
  },
];
