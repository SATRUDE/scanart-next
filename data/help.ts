// Help-page content, grouped. Single source for the page and its FAQPage
// structured data. Facts verified against the codebase (frame options, sizes,
// shipping config, Stripe, returns) 2026-07-12.
export interface HelpItem {
  q: string;
  a: string;
}

export interface HelpGroup {
  category: string;
  items: HelpItem[];
}

export const helpGroups: HelpGroup[] = [
  {
    category: 'Orders & payment',
    items: [
      {
        q: 'How do I place an order?',
        a: "Browse the shop, choose your print (with a size, and a frame if you'd like one), add it to your basket and check out. You'll receive a confirmation email once your order is placed.",
      },
      {
        q: 'Which payment methods can I use?',
        a: 'All major debit and credit cards, processed securely by Stripe. Your card details are handled by Stripe and are never stored by us.',
      },
      {
        q: 'What currency will I pay in?',
        a: 'Prices are shown in your selected currency, change it from the menu at the top of the site (we support GBP, NOK, USD, DKK and SEK). All prices include any applicable taxes; delivery is added at checkout.',
      },
      {
        q: 'Can I add a frame?',
        a: 'Yes. Every print can be ordered unframed, or with a Wood, Black or White frame. The frame price depends on the size of the print and is shown in your currency on the product page. Choose your frame before adding the print to your basket.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'Because each print is made to order, please email hello@scandinavianart.co.uk as soon as possible. We can usually make changes before your order goes into production. See also Returns & refunds below.',
      },
    ],
  },
  {
    category: 'Shipping & delivery',
    items: [
      { q: 'Where do you ship?', a: 'Worldwide.' },
      {
        q: 'How long will my order take?',
        a: 'Each print is made to order, so allow 1 to 4 business days for production, plus delivery for your region: United Kingdom 2-3 business days; Norway, Denmark and Sweden 3-5; United States 5-7; rest of world 7-14.',
      },
      {
        q: 'How much does delivery cost?',
        a: 'Delivery is shown in your selected currency at checkout. As a guide, in GBP: UK £5.99, Norway and Denmark £6.59, Sweden £7.33, United States £10.39, rest of world £15.99.',
      },
      {
        q: 'Will I pay customs or import duties?',
        a: "Orders within Norway have nothing extra to pay. For orders delivered elsewhere, import duties, customs charges or local taxes may apply on arrival and are the buyer's responsibility.",
      },
      {
        q: 'How are your prints made?',
        a: 'Your print is produced on demand by our print partner, at a facility close to your delivery address wherever possible. This keeps quality high and shipping distances short.',
      },
    ],
  },
  {
    category: 'Returns & refunds',
    items: [
      {
        q: 'Can I return my order?',
        a: "You have the right to cancel within 14 days of receiving your order. Because prints are made to order, you don't need to send anything back, just email hello@scandinavianart.co.uk within 14 days and we'll refund you.",
      },
      {
        q: 'My order arrived damaged, faulty or incorrect.',
        a: "We'll put it right. Email hello@scandinavianart.co.uk within 30 days of delivery with your order number and a photo, and we'll arrange a free replacement or a refund.",
      },
      {
        q: "My order hasn't arrived.",
        a: "If it hasn't arrived within the estimated time, email us within 30 days of the estimated delivery date and we'll send a replacement.",
      },
      {
        q: 'How long do refunds take?',
        a: 'Refunds go back to your original payment method, normally within 14 days.',
      },
    ],
  },
  {
    category: 'Products & prints',
    items: [
      {
        q: 'What are your prints made of?',
        a: 'Our prints are made on museum-quality archival paper for rich colour and long life.',
      },
      {
        q: 'What sizes are available?',
        a: 'Sizes vary by artwork and are shown on each product page. Common sizes are A3, A2, A1, 50x50cm and 50x70cm.',
      },
      {
        q: 'Are these original artworks?',
        a: 'They are high-quality prints of work by the Scandinavian and Nordic artists we represent. You can read about each artist on their page.',
      },
    ],
  },
];
