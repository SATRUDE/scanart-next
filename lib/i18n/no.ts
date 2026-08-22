// The Norwegian (bokmål) dictionary for phase 1 of the Norwegian site: every
// string the /no pages render, organised per page/component. Imported only by
// server components under app/no/, so none of this ships in the client bundle.
// The chrome strings (header, footer, banner) live in lib/i18n.ts because the
// client-rendered Header/Footer need them on every page.
//
// Register: the site's warm, plain British English carried over into equally
// plain, natural bokmål. Translate meaning, never word for word. No em dashes.
// Product names (Eltsjoen, Tree Top Peach, Morgenstrekk...) and the brand name
// stay as they are in the catalogue.

import type {
  HeroStrings,
  QualityPromiseStrings,
  TestimonialsStrings,
  CrossLinksStrings,
  CategoryLandingCopy,
  CollectionLandingCopy,
  ArtistCopy,
  ArtistEditorialCopy,
  HelpGroupCopy,
} from '@/lib/i18n';

export const no = {
  shared: {
    readMore: 'Les mer',
    readLess: 'Les mindre',
    backToProducts: 'Tilbake til produktene',
    printsSrHeading: 'Trykk',
    /** "n trykk" reads the same in singular and plural. */
    printOne: 'trykk',
    printOther: 'trykk',
    commonQuestions: 'Vanlige spørsmål',
    /** Prefix on the collection pages' link out to a related journal piece.
     *  The article itself is English: journal articles stay untranslated in
     *  phase 1, so this is a deliberate crossing out of the /no tree. */
    readMoreArticle: 'Les mer',
    outOfStock: 'Utsolgt',
    home: 'Hjem',
    artists: 'Kunstnere',
    viewAllArtists: 'Se alle kunstnerne',
    moreArtists: 'Flere kunstnere',
    /** Catalogue category value -> visible Norwegian label. */
    categoryLabels: {
      Botanical: 'Botanisk',
      Abstract: 'Abstrakt',
      Illustrations: 'Illustrasjoner',
    } as Record<string, string>,
  },

  crossLinks: {
    heading: 'Utforsk mer',
    allPrints: 'Alle trykk',
    wallArt: 'Skandinavisk veggkunst',
    meetTheArtists: 'Møt kunstnerne',
    categoryLabels: {
      botanical: 'Botaniske trykk',
      abstract: 'Abstrakte trykk',
      illustrations: 'Illustrasjoner',
    },
    // The English chipLabels translated. Rooms read as the plain room name in
    // Norwegian; "Birds & Animals" needs the "og" rather than an ampersand.
    collectionLabels: {
      'living-room': 'Stue',
      bedroom: 'Soverom',
      'home-office': 'Hjemmekontor',
      kitchen: 'Kjøkken',
      'birds-and-animals': 'Fugler og dyr',
    } as Record<string, string>,
  } satisfies CrossLinksStrings,

  home: {
    meta: {
      title: 'Scandinavian Art Gallery | Innrammede nordiske kunsttrykk',
      description:
        'Kuraterte skandinaviske og nordiske kunsttrykk fra uavhengige kunstnere. Kjøp veggkunst med eller uten ramme, levert til hele verden. Utforsk samlingen.',
    },
    hero: {
      badge: 'Startet i Norge',
      heading: 'Utforsk en kuratert samling av samtidskunst fra Skandinavia',
      sub: 'Nøye utvalgt for å vise frem mangfoldet, dybden og skjønnheten i Norden',
      cta: 'Se trykkene',
    } satisfies HeroStrings,
    exploreHeading: 'Utforsk kategoriene',
    exploreIntro:
      'Nøye utvalgte kunstverk fra talentfulle skandinaviske kunstnere, som bringer ekte nordisk minimalisme og tidløs design inn i hjemmet ditt.',
    allCategories: 'Alle kategorier',
    categoryTiles: {
      Botanical: {
        name: 'Botanisk',
        desc: 'Oppdag naturinspirerte verk som gir rommet organisk skjønnhet og ro.',
      },
      Illustrations: {
        name: 'Illustrasjoner',
        desc: 'Lekne, karakterfulle og fulle av sjarm. Illustrasjonene våre kombinerer skandinavisk humor med et friskt, moderne uttrykk.',
      },
      Abstract: {
        name: 'Abstrakt',
        desc: 'Utforsk moderne abstrakt kunst som gir hjemmet et raffinert, samtidig preg.',
      },
    } as Record<string, { name: string; desc: string }>,
    viewAllProducts: 'Se alle produkter',
    meetTheArtists: 'Møt kunstnerne',
    viewAllArtists: 'Se alle kunstnerne',
    fromTheJournal: 'Fra journalen',
    readTheJournal: 'Les journalen',
    jsonLdDescription:
      'Et kuratert utvalg av utsøkt nordisk kunst og trykk fra talentfulle skandinaviske kunstnere.',
  },

  qualityPromise: {
    heading: 'Vårt kvalitetsløfte',
    sub: 'Vi er stolte av å tilby kunst som holder høyeste standard.',
    features: [
      { title: 'Kuratert', desc: 'Vi håndplukker alle kunstnerne våre.' },
      { title: 'Kvalitet', desc: 'Vi trykker kun på papir av museumskvalitet.' },
      { title: 'Hele verden', desc: 'Kan kjøpes fra hele verden.' },
      { title: 'Profesjonell innramming', desc: 'Profesjonell innramming tilgjengelig for alle trykk.' },
      {
        title: 'Ekthet',
        desc: 'Hvert verk kommer direkte fra skandinaviske kunstnere, og støtter lokale talenter og kreative miljøer.',
      },
      { title: 'Fornøydgaranti', desc: '14 dager til å ombestemme deg på alle kjøp.' },
    ],
  } satisfies QualityPromiseStrings,

  testimonials: {
    heading: 'Kundehistorier',
    sub: 'Hør fra dem som har forvandlet hjemmene sine',
    quote:
      'Jeg kjøpte et trykk til hjemmet mitt, og jeg kommer helt sikkert til å kjøpe flere. Takk for at dere gjør leiligheten min vakrere med kunsten deres!',
    name: 'David Steel',
    location: 'London, England',
  } satisfies TestimonialsStrings,

  about: {
    meta: {
      title: 'Om oss',
      description:
        'Historien om Scandinavian Art: et nettgalleri som samarbeider direkte med skandinaviske kunstnere for å bringe ekte nordiske kunsttrykk inn i hjem over hele verden.',
    },
    heroTitle: 'Skandinavisk kunst til hjem over hele verden',
    heroSub:
      'Et nettgalleri som samarbeider direkte med skandinaviske kunstnere for å gjøre ekte nordiske kunsttrykk tilgjengelige for flere.',
    heroImageAlt: 'Et innrammet skandinavisk kunsttrykk i et lyst, nordisk interiør',
    heroCta: 'Utforsk samlingen',
    aboutHeading: 'Om Scandinavian Art',
    aboutPara1:
      'Scandinavian Art finnes for å bringe den særegne skandinaviske estetikken inn i hjem over hele verden, og for å gi kunstnerne bak den muligheten til å nå et større publikum.',
    aboutPara2:
      'Ideen kom fra en samtale med en venn, en kunstner bosatt i Oslo. Vi innså hvor lite skandinavisk kunst som nådde resten av verden, og bestemte oss for å lage et sted der disse talentfulle kunstnerne kunne vise arbeidet sitt til flere.',
    aboutPara3:
      'I bunn og grunn feirer skandinavisk design naturlige materialer, rene linjer og tanken om lagom, akkurat passe. Trykkene vi kuraterer bærer den ånden: rolige, gjennomtenkte og tidløse.',
    viewAllProducts: 'Se alle produkter',
    artistsHeading: 'Samarbeid med kunstnerne',
    artistsPara1:
      'Vi samarbeider direkte med lokale kunstnere og lener oss på kunnskapen deres for å velge de mest ekte verkene, slik at samlingen holder seg frisk, variert og av høyeste kvalitet. Hvert trykk produseres på papir av museumskvalitet med førsteklasses trykkteknikker, og profesjonell innramming er tilgjengelig.',
    artistsPara2:
      'Hvert kjøp støtter kunstneren bak verket direkte, og hjelper dem å få anerkjennelsen de fortjener og fortsette å skape. Når du velger Scandinavian Art, får du en bit av Skandinavia hjem til deg og støtter menneskene som lager den.',
    readTheJournal: 'Les journalen',
    jsonLdName: 'Om Scandinavian Art',
  },

  delivery: {
    meta: {
      title: 'Levering og retur',
      description:
        'Slik lages og sendes trykkene fra Scandinavian Art til hele verden, og slik fungerer retur og refusjon.',
    },
    pageTitle: 'Levering og retur',
    lastUpdated: '18. august 2026',
    lastUpdatedLabel: 'Sist oppdatert:',
    breadcrumbHome: 'Hjem',
    sections: {
      made: {
        heading: 'Slik lages bestillingen din',
        body:
          'Hvert trykk lages på bestilling gjennom trykkpartneren vår, Gelato, og produseres så nært leveringsadressen din som mulig. Det holder kvaliteten høy og fraktavstandene korte.',
      },
      production: {
        heading: 'Produksjonstid',
        bodyBefore: 'Bestillinger produseres og sendes vanligvis innen 1 til 4 virkedager. Leveringstiden begynner ',
        bodyEm: 'etter',
        bodyAfter:
          ' at pakken er sendt og varierer etter leveringssted. Du ser et estimat for adressen din i kassen.',
      },
      times: {
        heading: 'Leveringstider og kostnader',
        body:
          'Leveringskostnaden avhenger av leveringsstedet og størrelsen, rammen og antallet i handlekurven. Vi beregner den fra den gjeldende leveringskostnaden og viser det nøyaktige beløpet før du betaler i kassen.',
      },
      worldwide: {
        heading: 'Frakt til hele verden og importavgifter',
        // {country} is filled in by the page from COMPANY.country.
        body:
          'Vi sender til hele verden. For bestillinger som leveres utenfor {country}, kan importavgifter, toll eller lokale skatter påløpe ved ankomst, og disse er kjøperens ansvar.',
      },
      cancellations: {
        heading: 'Angrerett og retur ved ombestemmelse',
        // {email} is filled in by the page from COMPANY.email.
        body:
          'Du kan avbestille innen 14 dager etter at du har mottatt bestillingen. Fordi hvert trykk lages på bestilling, trenger du ikke sende noe tilbake. Send oss en e-post på {email} innen fristen, så refunderer vi deg.',
      },
      faulty: {
        heading: 'Feil, skadde, uriktige eller tapte varer',
        body:
          'Hvis bestillingen kommer frem med feil eller skader, er feil vare, eller ikke kommer frem i det hele tatt, send en e-post til {email} innen 30 dager etter levering (eller etter estimert leveringsdato for en tapt pakke). Vi ordner en kostnadsfri erstatning eller refusjon.',
      },
      refunds: {
        heading: 'Slik refunderes du',
        body:
          'Refusjoner går tilbake til den opprinnelige betalingsmåten din via Stripe, normalt innen 14 dager etter avbestillingen eller etter at vi har avtalt en refusjon.',
      },
      contact: {
        heading: 'Kontakt',
        bodyBefore: 'Har du spørsmål? Send en e-post til {email}, eller se ',
        termsLabel: 'vilkårene våre',
        bodyBetween: ' og ',
        privacyLabel: 'personvernerklæringen',
        bodyAfter: '.',
      },
    },
  },

  help: {
    meta: {
      title: 'Hjelp',
      description:
        'Svar på vanlige spørsmål om bestilling, levering, retur og trykkene våre hos Scandinavian Art.',
    },
    pageTitle: 'Hjelp',
    intro:
      'Alt du trenger å vite om bestilling, levering og retur. Finner du ikke svaret her, er det bare å sende oss en e-post, så hjelper vi deg gjerne.',
    stillNeedHelp: 'Trenger du fortsatt hjelp?',
    emailUsBefore: 'Send oss en e-post på ',
    emailUsAfter: ', så hjelper vi deg gjerne. Du finner oss også på Instagram og Facebook.',
    seeAlso: 'Se også',
    deliveryLabel: 'Levering og retur',
    termsLabel: 'Vilkår',
    privacyLabel: 'Personvernerklæring',
    groups: [
      {
        category: 'Bestilling og betaling',
        items: [
          {
            q: 'Hvordan bestiller jeg?',
            a: 'Se deg rundt i butikken, velg trykket ditt (med størrelse, og ramme hvis du vil ha en), legg det i handlekurven og gå til kassen. Du får en ordrebekreftelse på e-post når bestillingen er lagt inn.',
          },
          {
            q: 'Hvilke betalingsmåter kan jeg bruke?',
            a: 'Alle vanlige debet- og kredittkort, behandlet trygt av Stripe. Kortopplysningene dine håndteres av Stripe og lagres aldri hos oss.',
          },
          {
            q: 'Hvilken valuta betaler jeg i?',
            a: 'Prisene vises i valutaen du har valgt; bytt fra menyen øverst på siden (vi støtter GBP, NOK, USD, DKK og SEK). Alle priser inkluderer eventuelle avgifter; frakt kommer i tillegg i kassen.',
          },
          {
            q: 'Kan jeg legge til en ramme?',
            a: 'Ja. Hvert trykk kan bestilles uten ramme, eller med ramme i tre, sort eller hvitt. Prisen på rammen avhenger av størrelsen på trykket, og vises i din valuta på produktsiden. Velg rammen før du legger trykket i handlekurven.',
          },
          {
            q: 'Kan jeg endre eller avbestille bestillingen min?',
            a: 'Fordi hvert trykk lages på bestilling, send en e-post til hello@scandinavianart.co.uk så snart som mulig. Vi kan som regel gjøre endringer før bestillingen går i produksjon. Se også Retur og refusjon nedenfor.',
          },
        ],
      },
      {
        category: 'Frakt og levering',
        items: [
          { q: 'Hvor sender dere?', a: 'Til hele verden.' },
          {
            q: 'Hvor lang tid tar bestillingen min?',
            a: 'Hvert trykk lages på bestilling, så beregn 1 til 4 virkedager til produksjon, pluss levering for din region: Storbritannia 2-3 virkedager; Norge, Danmark og Sverige 3-5; USA 5-7; resten av verden 7-14.',
          },
          {
            q: 'Hva koster frakten?',
            a: 'Frakten vises i valutaen du har valgt i kassen. Som en pekepinn, i GBP: Storbritannia £5,99, Norge og Danmark £6,59, Sverige £7,33, USA £10,39, resten av verden £15,99.',
          },
          {
            q: 'Må jeg betale toll eller importavgifter?',
            a: 'Bestillinger innenfor Norge har ingenting ekstra å betale. For bestillinger som leveres andre steder, kan importavgifter, toll eller lokale skatter påløpe ved ankomst, og disse er kjøperens ansvar.',
          },
          {
            q: 'Hvordan lages trykkene deres?',
            a: 'Trykket ditt produseres på bestilling av trykkpartneren vår, så nært leveringsadressen din som mulig. Det holder kvaliteten høy og fraktavstandene korte.',
          },
        ],
      },
      {
        category: 'Retur og refusjon',
        items: [
          {
            q: 'Kan jeg returnere bestillingen min?',
            a: 'Du har rett til å angre innen 14 dager etter at du har mottatt bestillingen. Fordi trykkene lages på bestilling, trenger du ikke sende noe tilbake. Send en e-post til hello@scandinavianart.co.uk innen 14 dager, så refunderer vi deg.',
          },
          {
            q: 'Bestillingen min kom frem skadet, med feil eller var feil vare.',
            a: 'Det ordner vi. Send en e-post til hello@scandinavianart.co.uk innen 30 dager etter levering med ordrenummeret ditt og et bilde, så ordner vi en kostnadsfri erstatning eller refusjon.',
          },
          {
            q: 'Bestillingen min har ikke kommet frem.',
            a: 'Hvis den ikke har kommet frem innen estimert tid, send oss en e-post innen 30 dager etter estimert leveringsdato, så sender vi en erstatning.',
          },
          {
            q: 'Hvor lang tid tar en refusjon?',
            a: 'Refusjoner går tilbake til den opprinnelige betalingsmåten din, normalt innen 14 dager.',
          },
        ],
      },
      {
        category: 'Produkter og trykk',
        items: [
          {
            q: 'Hva er trykkene deres laget av?',
            a: 'Trykkene våre lages på arkivbestandig papir av museumskvalitet, for rike farger og lang levetid.',
          },
          {
            q: 'Hvilke størrelser finnes?',
            a: 'Størrelsene varierer fra verk til verk og vises på hver produktside. De fleste trykkene er 50x70 cm, og Simen Wahlqvists kvadratiske illustrasjoner er 50x50 cm.',
          },
          {
            q: 'Er dette originale kunstverk?',
            a: 'Det er høykvalitetstrykk av verk fra de skandinaviske og nordiske kunstnerne vi representerer. Du kan lese om hver kunstner på kunstnerens egen side.',
          },
        ],
      },
    ] satisfies HelpGroupCopy[],
  },

  categories: {
    botanical: {
      title: 'Botaniske trykk og kunstplakater',
      description:
        'Botaniske trykk og kunstplakater fra norske kunstnere: blomstermotiver, nordiske landskap og fargerike stilleben. Alle i 50x70 cm, med eller uten ramme.',
      heading: 'Botaniske trykk',
      intro:
        'Botaniske trykk er en av de enkleste veiene inn i kunsten for et hjem i skandinavisk stil, og her spenner de fra blomster til dekkede bord. Ingunn Dybendal tegner folkelige blomstermotiver og et mønstret nordisk landskap, Helene Brox fyller rammen med fugler blant grener i en myk papirklippstil, og Sia Siamos maler fargerike stilleben fra kjøkkenbordet. Hvert botanisk kunsttrykk lages på bestilling i 50x70 cm, med eller uten ramme.',
      intro2:
        'Hvite vegger og lyst treverk er en palett som venter på nettopp denne typen varme, og en botanisk plakat gir rommet det uten at det tipper over i rot. Alle tre er uavhengige kunstnere som arbeider i Norge, og hvert verk i kategorien produseres i museumskvalitet.',
      stylingHeading: 'Slik bruker du botaniske trykk',
      stylingBody:
        'Kjøkken og spiseplasser er det naturlige hjemmet for Sia Siamos’ bordscener; heng en der du faktisk spiser, så gjør den nytte for seg hver dag. De mildere verkene, spesielt Tree Top Peach, passer på soverom og i lesekroker, mens det tette mønsteret i Eltsjoen belønner en vegg du passerer langsomt, en gang eller en trappeavsats. Alt her deler samme format på 50 x 70 cm, så par kommer lett: prøv en Dybendal ved siden av en Siamos og la fargene snakke sammen.',
      faqs: [
        {
          question: 'Er botaniske trykk bare blomster?',
          answer:
            'Ikke her. Ved siden av blomstermotivene finner du et mønstret nordisk landskap, fugler blant grener og fargesterke stilleben fra kjøkkenbordet. Det som samler kategorien er motivet, naturen og livet som leves rundt den, snarere enn ett bestemt uttrykk.',
        },
        {
          question: 'Hvilken størrelse har de botaniske trykkene?',
          answer:
            'Alle trykk i denne kategorien er 50 x 70 cm, en tilgivende størrelse som fungerer alene over en kommode, eller i par over en sofa eller et spisebord. Sentrer verkene i øyehøyde, omtrent 145 til 150 cm fra gulvet.',
        },
        {
          question: 'Kan jeg bestille et botanisk trykk med ramme?',
          answer:
            'Ja. Velg uten ramme, eller en ramme i tre, sort eller hvitt, på hver produktside. Trykkene lages på bestilling og leveres til hele verden, med fraktkostnadene vist i kassen.',
        },
      ],
    },
    abstract: {
      title: 'Abstrakte trykk og kunstplakater',
      description:
        'Abstrakte trykk og kunstplakater fra norske kunstnere: rene silhuetter og djerve fuglemotiver i flate farger. I 50 x 70 cm, med eller uten ramme.',
      heading: 'Abstrakte trykk',
      intro:
        'Leter du etter abstrakt kunst som plakat eller trykk, er dette den rolige, nordiske enden av sjangeren: former skrelles ned til bare den essensielle silhuetten står igjen, og én eller to flate farger gjør jobben til ti. Helene Brox maler løse, papirklippaktige figurer i kremhvitt på én fargeflate, og skjærer en stupende svale ned til selve vingekastet. Hun er en uavhengig norsk kunstner, og hvert trykk kan bestilles med eller uten ramme, i 50 x 70 cm.',
      intro2:
        'Abstrakt veggkunst av dette slaget passer i stuer og soverom som allerede nærmer seg ro. Hvis rommet ditt heller mot det minimalistiske, lyst treverk, rolige tekstiler, rikelig med lys, gir et abstrakt trykk øyet ett trygt sted å lande uten å rope over rommet. Og fordi komposisjonene er enkle, leses de like godt fra andre siden av rommet som på nært hold.',
      stylingHeading: 'Slik bruker du abstrakte trykk',
      stylingBody:
        'Ett stort abstrakt verk kan bære en vegg alene; heng det med midten av verket omtrent 145 til 150 cm fra gulvet. Disse fire deler samme flatfargespråk, så to av dem side om side leses som én bevisst gest snarere enn to trykk uten sammenheng. Velg et trykk der bunnfargen speiler noe som allerede finnes i rommet, en pute, et teppe, en rad bokrygger, så faller veggen på plass.',
      faqs: [
        {
          question: 'Hva gjør abstrakt kunst skandinavisk?',
          answer:
            'Mest av alt tilbakeholdenhet. Der mye abstrakt kunst legger på tekstur og store gester, forenkler den nordiske retningen: flate farger, rene silhuetter, og former som kan spores tilbake til naturen, fugler, kropper, vann. Hvert abstrakte trykk her er laget av en uavhengig norsk kunstner.',
        },
        {
          question: 'Hvilke størrelser finnes de abstrakte trykkene i?',
          answer:
            'Helene Brox’ verk trykkes alle i 50 x 70 cm, som er et romslig format for ett enkelt trykk. Som en tommelfingerregel bærer 50 x 70 cm en sofa- eller sengevegg alene, og to av dem fyller en bredere vegg uten at du trenger et tredje.',
        },
        {
          question: 'Kan jeg kjøpe abstrakte trykk med ramme?',
          answer:
            'Ja. Hvert trykk kan bestilles uten ramme eller med ramme i tre, sort eller hvitt, valgt på produktsiden. Vi leverer til hele verden, med fraktkostnadene vist i kassen.',
        },
      ],
    },
    illustrations: {
      title: 'Illustrasjoner og morsomme plakater',
      description:
        'Morsomme plakater og illustrasjonstrykk av Oslo-illustratøren Simen Wahlqvist: få streker, tørr humor, rene farger. Til kontoret, med eller uten ramme.',
      heading: 'Illustrasjoner',
      intro:
        'Er du på jakt etter morsomme plakater med litt mer strek i, er dette stedet: hvert illustrasjonstrykk her er laget av Simen Wahlqvist, en grafisk designer og illustratør fra Oslo som fanger et øyeblikk, ofte rett før det skjer, med så få streker som mulig. Regelen hans er enkel: får en tegning ham til å le, er den ferdig. Morgenstrekk fanger dagens aller første helkroppsstrekk, og de kvadratiske trykkene rundt bærer den samme tørre humoren i én eller to farger.',
      intro2:
        'Dette er den rene, karakterfulle enden av skandinavisk kunst, og et enkelt første trykk å kjøpe. Det passer i ganger, på hjemmekontor og i ethvert rom som er blitt litt for smakfullt og trenger én ting med glimt i øyet. Simen er en av de uavhengige norske kunstnerne bak galleriet, og trykkene hans lages på arkivbestandig papir av museumskvalitet.',
      stylingHeading: 'Slik bruker du illustrasjonstrykk',
      stylingBody:
        'De fleste av disse trykkene er 50 x 50 cm, og det kvadratiske formatet er stillferdig nyttig: det sitter godt på en bildehylle, holder en smal vegg der et rektangel ville trengt seg på, og danner et ryddig par eller trio langs en gang. Morgenstrekk, i 50 x 70 cm, fungerer som ankeret i en gruppe med kvadratene rundt seg. Hold rammevalget likt gjennom et sett, alt i tre, alt i sort eller alt i hvitt, så leses miksen som tilsiktet.',
      faqs: [
        {
          question: 'Hva gjør disse illustrasjonene skandinaviske?',
          answer:
            'Økonomien. Nordisk illustrasjon foretrekker så få streker som nødvendig og ikke én mer, og lar luften og en begrenset palett gjøre tungløftet. Disse er tegnet i Oslo av en norsk illustratør, så merkelappen er bokstavelig så vel som stilistisk.',
        },
        {
          question: 'Hvilke størrelser finnes illustrasjonstrykkene i?',
          answer:
            'De fleste er kvadratiske 50 x 50 cm; Morgenstrekk er 50 x 70 cm. Kvadratene passer til hyller, ganger og grupperte vegger, mens det større verket kan holde en vegg alene.',
        },
        {
          question: 'Kan jeg få et illustrasjonstrykk innrammet og levert til utlandet?',
          answer:
            'Ja. Hvert trykk kan bestilles uten ramme eller med ramme i tre, sort eller hvitt, og vi leverer til hele verden. Fraktkostnadene vises i kassen.',
        },
      ],
    },
  } as Record<string, CategoryLandingCopy>,

  // Norwegian collection landings (phase 2, 2026-08-21). Same shape as the
  // English config in lib/collections.ts, copy only: productSlugs, the styling
  // card images and the related-article slugs all still come from there, so the
  // curation can never drift between the two languages.
  //
  // Deliberately NOT translated: the English copy's "museum quality" and
  // "museum-quality archival paper" claims (living room FAQ, bedroom intro,
  // home office intro and FAQ). Those claims are already open to question on the
  // board after the 200gsm uncoated decision, and minting fresh copies of a
  // doubtful claim in a second language would only widen the problem. The
  // Norwegian says made to order and leaves the paper out.
  collections: {
    'living-room': {
      title: 'Skandinavisk veggkunst til stua',
      description:
        'Utvalgt skandinavisk og nordisk veggkunst til stua: varme trykk med karakter fra uavhengige norske kunstnere. Velg med eller uten ramme, sendes over hele verden.',
      heading: 'Skandinavisk veggkunst til stua',
      intro:
        'Stueveggen er den gjestene faktisk ser på, så den fortjener et trykk du har valgt med vilje, ikke en plakat som fulgte med rammen. Dette utvalget samler den skandinaviske veggkunsten vår som har nok nærvær for en stue: Sia Siamos sine varme bordscener, Ingunn Dybendals mønstrede innsjølandskap og Helene Brox sine djerve, kremhvite figurer, blant andre. Hvert verk lages på bestilling og kan kjøpes med ramme i tre, svart eller hvitt, eller helt uten.',
      intro2:
        'Stua er også rommet der et trykk blir sett mest, både i morgenlys og i lampelys, så det lønner seg å velge noe du fortsatt liker ved hundrede blikk og ikke bare ved det første. Skandinavisk veggkunst til stua får den holdbarheten gjennom tilbakeholdenhet: trygg farge og ren form framfor travle detaljer. Start med ett verk du er sikker på, og bygg veggen rundt det. En gallerivegg blir sjelden god når alt kommer opp samtidig.',
      stylingHeading: 'Slik henger du kunst i stua',
      stylingTips: [
        'Heng midten av verket i øyehøyde, omtrent 145 til 150 cm over gulvet. Over en sofa bør du la det stå 15 til 25 cm mellom rammen og sofaryggen.',
        'Ett stort trykk gir en blikkfangervegg; et par eller en trio (Swallow Dive og Tree Top Peach går fint sammen) gir en enkel gallerivegg.',
        'Varme toner som Tree Top Peach myker opp et minimalistisk rom, mens et djervt abstrakt verk løfter en roligere palett.',
      ],
      stylingCards: [
        {
          label: 'Høyde',
          tip: 'Heng midten av verket i øyehøyde, omtrent 145 til 150 cm over gulvet. Over en sofa bør du la det stå 15 til 25 cm mellom rammen og sofaryggen.',
          alt: 'Innrammet skandinavisk veggkunst hengt over en grønn sofa i en rolig stue',
        },
        {
          label: 'Gruppering',
          tip: 'Ett stort trykk gir en blikkfangervegg; et par eller en trio (Swallow Dive og Tree Top Peach går fint sammen) gir en enkel gallerivegg.',
          alt: 'To innrammede skandinaviske trykk side om side over et skjenk i en stue',
        },
        {
          label: 'Tone',
          tip: 'Varme toner som Tree Top Peach myker opp et minimalistisk rom, mens et djervt abstrakt verk løfter en roligere palett.',
          alt: 'Ett djervt rødt kunsttrykk på en nøytral vegg i en skandinavisk stue',
        },
      ],
      relatedArticleLabel: 'Slik styler du skandinavisk veggkunst i stua',
      faqs: [
        {
          question: 'Hvilken veggkunst passer best i en skandinavisk stue?',
          answer:
            'Sikt mot ett verk med nok nærvær til å bære hovedveggen, og hold resten av rommet roligere rundt det. Et djervt, fargesterkt abstrakt verk løfter en lys, minimalistisk innredning, mens et rolig botanisk landskap demper et rom som allerede har mye farge og mønster. Trikset er å la én ting lede framfor å henge flere verk som konkurrerer.',
        },
        {
          question: 'Hvor stort bør et trykk over sofaen være?',
          answer:
            'Velg stort. Ett enkelt verk fungerer best når det dekker en god del av sofaens bredde, eller du kan henge et par eller en trio som dekker samme spenn. Størrelsene varierer med verket og står på hver produktside, og det største formatet, 50 x 70 cm, passer en sofavegg. Sentrer verket i øyehøyde, omtrent 145 til 150 cm over gulvet, og la det stå 15 til 25 cm mellom rammen og sofaryggen.',
        },
        {
          question: 'Kan jeg bestille et stuetrykk med ramme, og hvordan sendes det?',
          answer:
            'Ja. Alle trykk kan bestilles uten ramme, eller med ramme i tre, svart eller hvitt. Du velger på produktsiden før du legger det i kurven, og der ser du prisen for størrelsen du har valgt. Trykkene lages på bestilling og sendes over hele verden, med frakten oppgitt i kassen.',
        },
      ],
    },

    bedroom: {
      title: 'Skandinavisk veggkunst til soverommet',
      description:
        'Rolig skandinavisk og nordisk veggkunst til soverommet: dempede botaniske motiv og myke abstrakte verk fra uavhengige norske kunstnere. Med eller uten ramme, sendes over hele verden.',
      heading: 'Skandinavisk veggkunst til soverommet',
      intro:
        'Soverommet ber om ro, og disse trykkene lener seg inn i den. Dempede botaniske motiv, myke landskap og stille abstrakte verk i varsomme paletter, valgt for å hjelpe rommet med å roe ned framfor å konkurrere med det. Hvert verk lages på bestilling, i størrelser som passer veggen over en seng eller en stille lesekrok.',
      intro2:
        'I motsetning til rommene du viser fram, velges soverommet for et publikum på én, så stol på det som faktisk roer deg og ikke på det som ser riktig ut på et bilde. Den beste skandinaviske veggkunsten til soverommet er verket du liker å våkne til og det siste du ser om kvelden, og da betyr det oftest mykt framfor slående. Hold paletten nær veggene og sengetøyet, og la rommet holde seg lavt og hvilende.',
      stylingHeading: 'Slik henger du kunst på soverommet',
      stylingTips: [
        'Sentrer et verk over sengen, omtrent 15 til 20 cm over hodegavlen, og hold det innenfor sengens bredde så det føles forankret.',
        'Mykere, kjøligere toner roer et soverom. Spar de djerveste verkene til rommene du går gjennom, ikke dem du hviler i.',
        'Ett bredt trykk passer plassen over en hodegavl; et likt par fungerer på hver side av sengen eller over nattbordene.',
      ],
      stylingCards: [
        {
          label: 'Plassering',
          tip: 'Sentrer et verk over sengen, omtrent 15 til 20 cm over hodegavlen, og hold det innenfor sengens bredde så det føles forankret.',
          alt: 'Et innrammet skandinavisk trykk på veggen ved en oppredd seng',
        },
        {
          label: 'Palett',
          tip: 'Mykere, kjøligere toner roer et soverom. Spar de djerveste verkene til rommene du går gjennom, ikke dem du hviler i.',
          alt: 'Ett innrammet kunsttrykk i et rolig, grønntonet skandinavisk soverom',
        },
        {
          label: 'Parvis',
          tip: 'Ett bredt trykk passer plassen over en hodegavl; et likt par fungerer på hver side av sengen eller over nattbordene.',
          alt: 'To innrammede skandinaviske trykk på veggen over en seng',
        },
      ],
      relatedArticleLabel: 'En komplett guide til å velge størrelse på trykk',
      faqs: [
        {
          question: 'Hvilken kunst passer på et soverom?',
          answer:
            'Hold det mykt. Varsomme botaniske motiv, tilslørte landskap og stille abstrakte verk i dempede eller kjølige toner hjelper soverommet med å roe ned, der et djervt verk med sterke kontraster kan holde rommet våkent. Match paletten i trykket til veggene og sengetøyet, så veggen leses som en del av rommet framfor en kunngjøring.',
        },
        {
          question: 'Hvor bør jeg henge kunst over sengen?',
          answer:
            'Sentrer verket over sengen, omtrent 15 til 20 cm over hodegavlen, og hold det innenfor sengens bredde så det føles forankret. Ett bredt trykk passer plassen over en hodegavl, mens et likt par fungerer på hver side av sengen eller over nattbordene. Størrelsene varierer med verket og står på hver produktside.',
        },
        {
          question: 'Hva om trykket ikke passer i rommet når det først henger?',
          answer:
            'Du har 14 dager på å ombestemme deg, så det er rom for å leve med et verk før du bestemmer deg. Det hjelper å bestille den rammen som matcher de andre du har: uten ramme, eller ramme i tre, svart eller hvitt, alt valgt på produktsiden, der prisen for størrelsen du velger står. Trykkene lages på bestilling og sendes over hele verden, med frakten oppgitt i kassen.',
        },
      ],
    },

    'home-office': {
      title: 'Skandinavisk veggkunst til hjemmekontoret',
      description:
        'Skandinavisk og nordisk veggkunst til hjemmekontoret: illustrasjoner med karakter og djerve abstrakte verk fra uavhengige norske kunstnere. Med eller uten ramme, sendes over hele verden.',
      heading: 'Skandinavisk veggkunst til hjemmekontoret',
      intro:
        'Et godt hjemmekontor holder interessen din uten å stjele fokuset. Disse trykkene gir litt personlighet til veggen bak skrivebordet: håndtegnede illustrasjoner med karakter og djerve abstrakte verk med nok energi til å bære en arbeidsdag. Alle lages på bestilling, i størrelser fra ett enkelt trykk over pulten til en hel vegg bak deg på møter.',
      intro2:
        'Hjemmekontoret er ofte det ene hjørnet av huset du får innrede helt etter egen smak, uten andre å ta hensyn til, så det er verdt et verk med litt karakter. God skandinavisk veggkunst til hjemmekontoret gjør seg fortjent til plassen ved å løfte stemningen i rommet uten å kreve oppmerksomhet: en lun illustrasjon eller et trygt abstrakt verk som gjør pulten mindre lik en arbeidsstasjon. Velg farger som trives sammen med skjermen og skrivebordet framfor å slåss med dem.',
      stylingHeading: 'Slik henger du kunst på hjemmekontoret',
      stylingTips: [
        'Heng et verk i synsfeltet fra pulten, i eller rett over skjermhøyde, så det gir deg noe når du ser opp.',
        'Et lite rutenett av illustrasjoner passer en smal vegg ved pulten; ett djervt abstrakt verk bærer en større flate bak deg på møter.',
        'Grafiske verk med karakter holder en arbeidsplass fra å føles flat. Spar de roligste botaniske motivene til rommene du slapper av i.',
      ],
      stylingCards: [
        {
          label: 'Synslinje',
          tip: 'Heng et verk i synsfeltet fra pulten, i eller rett over skjermhøyde, så det gir deg noe når du ser opp.',
          alt: 'Et innrammet skandinavisk trykk hengt i øyehøyde over et skrivebord på et hjemmekontor',
        },
        {
          label: 'Oppsett',
          tip: 'Et lite rutenett av illustrasjoner passer en smal vegg ved pulten; ett djervt abstrakt verk bærer en større flate bak deg på møter.',
          alt: 'To innrammede skandinaviske kunsttrykk over et skrivebord på et hjemmekontor',
        },
        {
          label: 'Karakter',
          tip: 'Grafiske verk med karakter holder en arbeidsplass fra å føles flat. Spar de roligste botaniske motivene til rommene du slapper av i.',
          alt: 'Et djervt grafisk skandinavisk trykk over et skrivebord på et hjemmekontor',
        },
      ],
      relatedArticleLabel: 'Kunsten å velge kunst: en grundig guide',
      faqs: [
        {
          question: 'Hvilken kunst fungerer på et hjemmekontor?',
          answer:
            'Noe med personlighet som fortsatt lar deg konsentrere deg. Illustrasjoner med karakter og djerve, grafiske abstrakte verk holder en arbeidsplass fra å føles flat, mens de roligste botaniske motivene passer bedre i rommene du slapper av i. Sikt mot ett verk med et glimt i seg framfor en travel vegg som konkurrerer med skjermen.',
        },
        {
          question: 'Hvor bør jeg henge et trykk på hjemmekontoret?',
          answer:
            'Sett det i synsfeltet fra pulten, i eller rett over skjermhøyde, så det gir deg noe når du ser opp. Et lite rutenett av trykk passer en smal vegg ved pulten, mens ett større verk bærer flaten bak deg på møter. Størrelsene varierer med verket og står på hver produktside, fra ett enkelt trykk over pulten til et format som fyller veggen.',
        },
        {
          question: 'Kan jeg bestille et kontortrykk med ramme, og hvor raskt kommer det?',
          answer:
            'Ja. Velg uten ramme, eller ramme i tre, svart eller hvitt, på produktsiden før du legger det i kurven, der prisen for størrelsen du velger står. Hvert trykk lages på bestilling, normalt 1 til 4 virkedager i produksjon i tillegg til frakt til din region, med frakten oppgitt i kassen.',
        },
      ],
    },

    kitchen: {
      title: 'Skandinavisk veggkunst til kjøkkenet',
      description:
        'Veggkunst til kjøkkenet med skandinavisk karakter: fire mat- og bordstilleben av Bergensillustratøren Sia Siamos, med tips til hvordan du henger dem. Med eller uten ramme.',
      heading: 'Skandinavisk veggkunst til kjøkkenet',
      intro:
        'Fire trykk, og mellom seg en hel hummer, to karafler, en presskanne og flere tomater enn ett bord trenger. Alle fire er av Sia Siamos, en gresk og norsk illustratør bosatt i Bergen, som maler mat slik du faktisk møter den: midt i måltidet, med hender som strekker seg inn fra kanten og korken alt ute av flasken. På et kjøkken gjør de det et landskap ikke kan, nemlig å være enige med rommet. Hvert av dem kommer i én størrelse, 50 x 70 cm, med ramme i tre, svart eller hvitt, eller uten.',
      intro2:
        'Kjøkken er hardere mot et trykk enn noe annet rom, og det er verdt å vite før du henger noe du er glad i der. Damp, matsprut og en vegg med ettermiddagssol treffer alle her, så hold verket unna arbeidssonen mellom platetopp og vask, og unna direkte lys hvis rommet tillater det. Alt annet slapper av: et kjøkken tåler mer farge enn en stue gjør, fordi det alt finnes farge der, fliser og panner og frukt og resten. Disse fire er malt høyt nok til å holde stand mot alt det.',
      stylingHeading: 'Ideer til veggkunst på kjøkkenet',
      stylingTips: [
        'Heng det der du spiser, ikke der du lager mat. Veggen bak kjøkkenbordet, en frokostkrok eller spiseenden av rommet tar et trykk langt bedre enn stretchen over benken, og det er veggen du faktisk sitter og ser på.',
        'Ingen ledig vegg? Gå opp og bortover. Ett trykk over en døråpning, på enden av en innredningsrekke eller lent på en hylle mellom glassene fungerer alt, og et verk på 50 x 70 cm som står lent mot en tallerkenhylle ser bevisst ut framfor hjemløst.',
        'Heng to og la dem se på hverandre tvers over rommet: Vinkvelds mørke kveldsfliser mot Morgenleverings morgenlys. Det paret leses som en hel dag, som er en bedre grunn til å kjøpe to trykk enn symmetri er.',
        'Rammefargen gjør mer arbeid på et kjøkken enn andre steder. Svart skjerper en innredning i hvitt og lyst tre, en treramme varmer opp et kjøkken som har blitt litt klinisk, og hvit forsvinner nesten inn i en malt vegg.',
      ],
      relatedArticleLabel: 'De norske ordene bak trykkene',
      faqs: [
        {
          question: 'Hvilken veggkunst fungerer på et kjøkken?',
          answer:
            'Mat, hvis du vil ha det enkle svaret. En bordscene eller et stilleben hører hjemme på et kjøkken på en måte et portrett eller et landskap aldri helt gjør, og det tåler mer farge enn du ville hengt i et roligere rom. De fire trykkene her er nettopp det: en hummermiddag, en hyttefrokost, et morgenbord og en vinkveld, alle djerve nok til å konkurrere med fliser og åpne hyller.',
        },
        {
          question: 'Hvor bør jeg henge kunst på et lite kjøkken?',
          answer:
            'Se over øyehøyde og mot endene. Veggen over et lite bord, den flate enden av en innredningsrekke, plassen over en døråpning og gapet over en radiator er alle brukbare, og et trykk som står lent på en hylle eller tallerkenhylle trenger ingen vegg i det hele tatt. Det ene stedet du bør unngå, er arbeidsstrekket mellom platetopp og vask, der damp og sprut havner.',
        },
        {
          question: 'Hvilken størrelse har kjøkkentrykkene, og kan jeg bestille dem med ramme?',
          answer:
            'Alle fire kommer i én størrelse, 50 x 70 cm, som passer de fleste kjøkkenvegger uten at du trenger å måle opp. Velg uten ramme, eller ramme i tre, svart eller hvitt, på produktsiden før du legger det i kurven, der prisen for den størrelsen står. Trykkene lages på bestilling og sendes over hele verden med frakten oppgitt i kassen, og du har 14 dager fra levering på å ombestemme deg.',
        },
      ],
    },

    'birds-and-animals': {
      title: 'Skandinavisk fuglekunst og dyretrykk',
      description:
        'Nordisk fugle- og dyrekunst av den norske kunstneren Helene Brox: en stupende koboltblå svale, ferskenfargede grener som skjuler en flokk, og en drage i fargebånd.',
      heading: 'Fugle- og dyrekunst fra nordiske kunstnere',
      intro:
        'Hvert vesen her er en form før det er et vesen. Helene Brox arbeider flatt og uten dill: en koboltblå svale skåret ned til selve vingekastet, dusinvis av små silhuetter skjult i et ferskenfarget gitter av grener, og en drage som slynger seg over sort i bånd av hvitt, rødt og rosa. Det er dette som gjør at et dyretrykk sitter godt i et skandinavisk rom, mønster og silhuett framfor detaljer fra en feltguide. Alle tre kan kjøpes med ramme i tre, svart eller hvitt, eller uten.',
      intro2:
        'Tre trykk, tre nokså ulike stemninger. Swallow Dive er bare to farger, kobolt på kremhvitt, og den vil ha en vegg for seg selv der stupet har et sted å gå. Tree Top Peach er den mildeste av de tre, nærmere en folkelig papirklipp enn en illustrasjon, og den belønner å bli hengt der du faktisk sitter. Dragon er den høylytte, et fabeldyr sett i glimt på sort bunn, og den trenger en vegg som holder nervene i sjakk. Velg på bunnfargen framfor vesenet: kobolt går kjølig mot hvite vegger og lyst tre, fersken går varmt sammen med tre og jordnære tekstiler, og sort forankrer et helt rom. Få bakgrunnen riktig, så ordner resten seg selv.',
      stylingHeading: 'Slik henger du fugle- og dyretrykk',
      stylingTips: [
        'Ett enkelt dyretrykk gjør seg best med en vegg for seg selv. Sentrer det i øyehøyde, omtrent 145 til 150 cm over gulvet, og la plassen på hver side stå tom; bevegelsen i disse trykkene trenger et sted å gå.',
        'Match bunnfargen til rommet, ikke til fuglene. Kobolt trives på hvite vegger og lyst tre, mens Tree Top Peach vil ha varme rundt seg: tre, lær, jordnære tekstiler.',
        'Swallow Dive og Tree Top Peach henger godt sammen fordi ingen av dem roper. Samme størrelse, samme ramme, en jevn åpning på 5 til 8 cm, og de leses som et bevisst par framfor to trykk som tilfeldigvis begge har fugler i seg. Dragon gjør seg best alene.',
        'Vil du heller holde deg til én kunstner over en større vegg, sitter begge disse godt ved siden av de abstrakte verkene til Helene Brox, som deler samme flatfargespråk.',
      ],
      relatedArticleLabel: 'Slik lager du en kunstvegg med flere verk',
      faqs: [
        {
          question: 'Hva gjør at et dyretrykk føles skandinavisk?',
          answer:
            'Flat farge og silhuett, stort sett. Hvert trykk her behandler vesenet som en form framfor en studie: Swallow Dive bærer en hel stupende fugl i to farger, Tree Top Peach er nærmere en folkelig papirklipp enn en illustrasjon, og Dragon løser fabeldyret opp i ren rytme. Helene Brox er en uavhengig kunstner som arbeider i Oslo, og det er derfor disse leses som nordiske dyretrykk framfor noe fra tradisjonen med zoologiske plansjer.',
        },
        {
          question: 'Hvilke størrelser kommer disse trykkene i, og kan jeg få dem med ramme?',
          answer:
            'Alle tre kommer i én størrelse, 50 x 70 cm. Størrelsene står på hver produktside, der du også velger uten ramme eller ramme i tre, svart eller hvitt, med prisen for størrelsen du har valgt oppgitt før du legger det i kurven. Hvert trykk lages på bestilling og sendes over hele verden, med frakten oppgitt i kassen.',
        },
      ],
    },
  } as Record<string, CollectionLandingCopy>,

  artistsIndex: {
    meta: {
      title: 'Kunstnere',
      description:
        'Møt de skandinaviske kunstnerne bak samlingen, en liten gruppe illustratører og grafikere som arbeider i Norge og Sverige.',
    },
    heading: 'Kunstnere',
    /** {count} kunstnere */
    countLabel: 'kunstnere',
    intro:
      'Møt de skandinaviske kunstnerne bak samlingen, en liten gruppe illustratører og grafikere som arbeider i Norge og Sverige.',
    jsonLdDescription: 'De skandinaviske og nordiske kunstnerne bak samlingen.',
  },

  artistPage: {
    breadcrumbHome: 'Hjem',
    breadcrumbArtists: 'Kunstnere',
    /** "Trykk av {name}" */
    printsBy: 'Trykk av',
    moreArtists: 'Flere kunstnere',
    viewAllArtists: 'Se alle kunstnerne',
    /** Fallback meta description: "Kunsttrykk av {name} - Scandinavian Art Gallery" */
    metaDescriptionPrefix: 'Kunsttrykk av',
    /** JSON-LD: "Kunsttrykk av {name}, {location}, hos Scandinavian Art Gallery." */
    jobTitle: 'Kunstner',
  },

  // Norwegian versions of data/artists.ts bios and locations, keyed by slug.
  // Fall back to the English data for any artist missing here.
  artists: {
    'helene-brox': {
      location: 'Oslo, Norge',
      bio: 'Helene Brox er illustratør, veggmaler og arbeider med håndtegnede bokstaver, bosatt i Oslo, og en av grunnleggerne av illustrasjonsbyrået Heiaklubben. Bokomslagene hennes fikk sølv og diplom i Årets vakreste bøker i 2016, og hun finner opp helt urealistiske, podede planter som hun selger som trykk.',
    },
    'simen-wahlqvist': {
      location: 'Oslo, Norge',
      bio: 'Simen Wahlqvist er en norsk grafisk designer og illustratør bosatt i Oslo. I arbeidet sitt prøver han å fange øyeblikk, ofte før de skjer, med så få streker som mulig. Får en illustrasjon ham selv til å le, er den ferdig!',
    },
    'ingunn-dybendal': {
      location: 'Oslo, Norge',
      bio: 'Ingunn Dybendal er illustratør, bosatt og arbeidende i Oslo, med illustrasjonsutdanning fra Falmouth og en plass i kollektivet Heiaklubben. Arbeidene hennes strekker seg fra en Google Doodle til en vegg på 360 kvadratmeter på Hamar, og mottoet hennes er more is more is more is more.',
    },
    'sia-siamos': {
      location: 'Bergen, Norge',
      bio: 'Sia Siamos er en halvt gresk, halvt norsk illustratør bosatt i Bergen, med sansen for stilleben, mat og hverdagsøyeblikk. Hun kom til illustrasjonen fra grafisk design, tiltrukket av de stille detaljene som sier mest, og arbeider digitalt eller analogt alt etter hva motivet ber om.',
    },
  } as Record<string, ArtistCopy>,

  // Norwegian versions of lib/artist-editorial.ts, keyed by slug. para2 keeps
  // the same inline Markdown-link form; links point into the /no tree where a
  // Norwegian page exists, otherwise to the English route. Collection links
  // moved into /no on 2026-08-21 when the Norwegian collection pages landed
  // (PR #160); they had been left pointing at English because no twin existed
  // when this copy was written, which is exactly the kind of link that goes
  // stale silently when the tree grows.
  artistEditorial: {
    'helene-brox': {
      heading: 'Formen får snakke',
      para1:
        'Helene Brox, kunstner og illustratør bosatt i Oslo, arbeider i djerve, flate former: figurer og fugler skåret ned til silhuett, malt med papirklippets selvsikkerhet og satt på én bunnfarge. Gjennom de fem trykkene hennes holder den samme disiplinen, enten stemningen er rolig eller høylytt. Swallow Dive bærer all bevegelsen sin i én koboltblå og én kremhvit; Dancer fanger en figur midt i steget, uten ansikt og uten gulv; Dragon løser et fabeldyr opp i bånd av farge mot sort. Selv IThinkIThink, det mest høylytte trykket i galleriet, bærer bekjennelsen sin i de samme djerve, utklippede formene.',
      para2:
        'Hvilken Brox som passer i et rom, avhenger av hvor mye mot veggen har. Tree Top Peach og Swallow Dive er de milde; de faller til ro på et soverom eller i en lesekrok uten å forsvinne i det, og begge trives blant de roligere verkene i [soveromssamlingen](/no/collection/bedroom). [Dragon](/product/dragon) og IThinkIThink vil ha rommet der folk samles og prater. Alle fem deler det samme utklippsspråket, så to av dem henger naturlig sammen, ett rolig og ett høylytt, og paret leses som bevisst snarere enn matchet.',
    },
    'simen-wahlqvist': {
      heading: 'Så få streker som mulig',
      para1:
        'Simen Wahlqvist er en norsk grafisk designer og illustratør bosatt i Oslo, og regelen hans er enkel: fang øyeblikket, ofte rett før det skjer, med så få streker som mulig. Får en tegning ham til å le, er den ferdig. Den testen forklarer alle de fem trykkene hans her. Slingshot lader en tilfreds figur inn i et fredstegn gjort om til sprettert; Mean Snothing gir en mann en Newton-pendel til øyne; Half Man deler en figur rent i to. Hvert av dem er en håndfull streker og to eller tre flate farger, der tegningen bærer hele vitsen.',
      para2:
        'Tørr humor viser seg å være utmerket selskap ved et skrivebord. Wahlqvists kvadratiske trykk passer naturlig på [hjemmekontoret](/no/collection/home-office), der Mean Snothing gjør seg fortjent til veggplassen bedre enn noen motivasjonsplakat, og Slingshot beholder et ordentlig glimt i øyet. Morgenstrekk, det mildeste verket hans, passer på et soverom eller i gangen du passerer på vei ut. Er det den sparsomme, vittige streken som treffer deg, er det arbeidet hans som bærer [illustrasjonene](/no/category/illustrations) våre, og to av disse henger sammen som ruter fra samme tegneseriestripe.',
    },
    'ingunn-dybendal': {
      heading: 'Mønster hele veien ned',
      para1:
        'Ingunn Dybendal, kunstner og illustratør bosatt i Oslo, tegner med fargeblyant og en usedvanlig tålmodighet, og de to trykkene hennes er de tettest arbeidede verkene i galleriet. Eltsjoen gjør et nordisk innsjølandskap om til ornament: skyer strukket til bånd, skog gjort om til folkemotiver, vann som samler seg i bleke ringer rundt en bro. Trysilkaffe stapper et grønt krus med en umulig bukett, hver blomst sin egen oppfinnelse over en rutete duk. Begge står støtt i den nordiske folkekunsttradisjonen, mønster på mønster, bygget strøk for strøk snarere enn i store flater.',
      para2:
        'Dette er verk som belønner nærhet. Heng [Eltsjoen](/product/eltsjoen) der du faktisk sitter, ved siden av en lesestol eller over et skrivebord, så fortsetter det å by på nye hjørner å oppdage; det hundrede blikket betaler seg like godt som det første. Trysilkaffe har den samme tettheten med mer skøyerstrek, og finner seg naturlig til rette på en kjøkken- eller gangvegg. Begge står godt sammen med de roligere verkene blant de [botaniske trykkene](/no/category/botanical) våre, der detaljrikdommen spiller mot enklere silhuetter i stedet for å konkurrere med dem.',
    },
    'sia-siamos': {
      heading: 'Trekk frem en stol',
      para1:
        'Athanasia Siamos, kjent som Sia, er en gresk-norsk illustratør bosatt i Bergen, og de fire trykkene hennes er alle varianter av den samme rause ideen: bordet med mennesker rundt. De er malt løst og djervt, og hvert av dem bærer en norsk tittel som sier nøyaktig hva det rommer. Hummer og Vin ser ned på en hummermiddag midt i skålen; Morgenlevering er et frokostbord som nettopp har kommet på plass; Hyttefrokost har roen fra en hytteferie; Vinkveld, det mest stemningsfulle av de fire, er en vinkveld der korken allerede er på avveie.',
      para2:
        'Siamos hører hjemme der maten skjer. En kjøkken- eller spisestuevegg er det opplagte hjemmet, spesielt for [Vinkveld](/product/vinkveld), men Morgenlevering er lys nok til å løfte en gang eller et soverom som fanger morgensolen. De fire scenene er malt som søsken, så et par fungerer nydelig: frokost på én vegg, vin på den andre, som dagens to ender. De ligger i den varmeste enden av de [botaniske trykkene](/no/category/botanical) våre, fulle av tomater, druer og snittblomster snarere enn blader og grener.',
    },
  } as Record<string, ArtistEditorialCopy>,
};

export type NoDictionary = typeof no;
