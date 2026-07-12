// Business identity used across the legal pages (Privacy, Terms, Delivery).
//
// DRAFT: the company is not yet registered in Norway. Fill these three in and
// remove the `draftNotice` on each legal page before publishing. Distance-
// selling law requires the trader's registered name + organisation number, and
// a contact address (use the REGISTERED BUSINESS address here, not a home
// address).
export const COMPANY = {
  // TODO_LEGAL: registered trading name (Norwegian ENK/AS)
  name: '[Registered trading name — to be confirmed]',
  // TODO_LEGAL: Norwegian organisation number (org.nr)
  orgNr: '[Norwegian org.nr — to be confirmed]',
  // TODO_LEGAL: registered business address (not a home address)
  address: '[Registered business address — to be confirmed]',
  email: 'hello@scandinavianart.co.uk',
  country: 'Norway',
} as const;
