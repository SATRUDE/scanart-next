// Business identity used across the legal pages (Privacy, Terms, Delivery).
//
// This is the live v1. `orgNr` and `address` are intentionally blank until the
// Norwegian business is formally registered; the pages hide them while empty
// and show them automatically once set. When you register, fill both here (use
// the REGISTERED BUSINESS address, not a home address) and nothing else needs
// to change.
interface Company {
  name: string;
  email: string;
  country: string;
  orgNr: string;
  address: string;
}

export const COMPANY: Company = {
  name: 'Scandinavian Art',
  email: 'hello@scandinavianart.co.uk',
  country: 'Norway',
  orgNr: '',
  address: '',
};
