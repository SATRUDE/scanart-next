// The gallery's public name and registered seller, shared by the legal pages,
// footer and organisation structured data. The organisation number is not a VAT number.
export const COMPANY = {
  name: 'Scandinavian Art',
  legalName: 'Diffey AS',
  email: 'hello@scandinavianart.co.uk',
  country: 'Norway',
  countryNo: 'Norge',
  orgNr: '938 787 425',
  address: 'Motbakkene 2A, 0687 Oslo',
} as const;

/** Facts about the legal entity behind the gallery, not a replacement brand name. */
export const COMPANY_IDENTITY = {
  legalName: COMPANY.legalName,
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'Norwegian organisation number',
    value: COMPANY.orgNr.replaceAll(' ', ''),
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Motbakkene 2A',
    postalCode: '0687',
    addressLocality: 'Oslo',
    addressCountry: 'NO',
  },
};

export function companyIdentification(locale: 'en' | 'no'): string {
  return locale === 'no'
    ? `${COMPANY.name} drives av ${COMPANY.legalName} (org.nr. ${COMPANY.orgNr}). Registrert adresse: ${COMPANY.address}, ${COMPANY.countryNo}.`
    : `${COMPANY.name} is operated by ${COMPANY.legalName} (organisation number ${COMPANY.orgNr}). Registered address: ${COMPANY.address}, ${COMPANY.country}.`;
}
