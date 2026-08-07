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
      { title: 'Fornøydgaranti', desc: '30 dagers returrett på alle kjøp.' },
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
    lastUpdated: '12. juli 2026',
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
        // Rendered around an <em> on "etter" by the page, mirroring the
        // English page's emphasis.
        bodyBefore: 'Bestillinger produseres og sendes vanligvis innen 1 til 4 virkedager. Leveringsestimatene nedenfor gjelder tiden ',
        bodyEm: 'etter',
        bodyAfter:
          ' at pakken er sendt, så den totale ventetiden er produksjonstid pluss leveringstid. Du ser et estimat for din adresse i kassen.',
      },
      times: {
        heading: 'Leveringstider og kostnader',
        note: 'Kostnadene vises i valutaen du har valgt; bytt valuta fra menyen øverst på siden.',
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
            a: 'Ja. Hvert trykk kan bestilles uten ramme, eller med ramme i tre, sort eller hvitt for £25 ekstra (vist i din valuta på produktsiden). Velg rammen før du legger trykket i handlekurven.',
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
            a: 'Størrelsene varierer fra verk til verk og vises på hver produktside. Vanlige størrelser er A3, A2, A1, 50x50 cm og 50x70 cm.',
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
      title: 'Botaniske kunsttrykk',
      description:
        'Skandinaviske botaniske trykk: folkelige blomstermotiver, mønstrede nordiske landskap og fargesterke stilleben fra uavhengige norske kunstnere. Innramming og levering til hele verden.',
      heading: 'Botaniske trykk',
      intro:
        'Botanisk betyr mer enn blomster i en vase i dette galleriet, selv om Ingunn Dybendals Trysilkaffe gir deg akkurat det: et krus med vilt mønstrede blomster i glade, folkelige farger. Det betyr naturen slik nordiske kunstnere faktisk lever med den. Dybendals Eltsjoen gjør fjell, vann og skog om til et tett, juvelklart mønster; Helene Brox’ Tree Top Peach fyller rammen med fugler blant grener i en myk papirklippstil; og Sia Siamos maler det som skjer når naturen når frem til bordet: hyttefrokoster, modne tomater og druer, en karaffel med vann mot grønne kjøkkenfliser.',
      intro2:
        'Den bredden gjør botaniske trykk til en av de enkleste veiene inn i kunsten for et hjem i skandinavisk stil. Hvite vegger og lyst treverk er en palett som venter på nettopp denne typen varme, og et botanisk verk gir rommet det uten at det tipper over i rot. Alle tre er uavhengige kunstnere som arbeider i Norge, og hvert verk i kategorien produseres i museumskvalitet.',
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
      title: 'Nordisk abstrakt veggkunst',
      description:
        'Nordisk abstrakt veggkunst fra uavhengige norske kunstnere: rendyrkede figurer og djerve fuglemotiver i trygge, flate farger. Innramming og levering til hele verden.',
      heading: 'Abstrakte trykk',
      intro:
        'Abstrakt kunst i den nordiske tradisjonen heller mot klarhet snarere enn kaos: former skrelles ned til bare den essensielle silhuetten står igjen, og én eller to flate farger gjør jobben til ti. Trykkene i denne samlingen bærer den holdningen. Helene Brox maler løse, papirklippaktige figurer i kremhvitt på én fargeflate, en danser midt i steget, en svale fanget i stupet, mens Renate Thors Birdie-serie, med røtter i silketrykkpraksisen hennes, gjør en fugleflokk om til et djervt, rytmisk mønster i fire fargevarianter. Begge er uavhengige norske kunstnere som arbeider i Oslo.',
      intro2:
        'Moderne skandinavisk veggkunst av dette slaget passer i rom som allerede nærmer seg ro. Hvis rommet ditt heller mot det minimalistiske, lyst treverk, rolige tekstiler, rikelig med lys, gir et abstrakt trykk øyet ett trygt sted å lande uten å rope over rommet. Og fordi komposisjonene er enkle, leses de like godt fra andre siden av rommet som på nært hold.',
      stylingHeading: 'Slik bruker du abstrakte trykk',
      stylingBody:
        'Ett stort abstrakt verk kan bære en vegg alene; heng det med midten av verket omtrent 145 til 150 cm fra gulvet. Birdie-trykkene er laget for å grupperes: et par eller en rekke på tre leses som én bevisst gest, fordi hver fargevariant deler samme komposisjon. Velg et trykk der bunnfargen speiler noe som allerede finnes i rommet, en pute, et teppe, en rad bokrygger, så faller veggen på plass.',
      faqs: [
        {
          question: 'Hva gjør abstrakt kunst skandinavisk?',
          answer:
            'Mest av alt tilbakeholdenhet. Der mye abstrakt kunst legger på tekstur og store gester, forenkler den nordiske retningen: flate farger, rene silhuetter, og former som kan spores tilbake til naturen, fugler, kropper, vann. Hvert abstrakte trykk her er laget av en uavhengig norsk kunstner.',
        },
        {
          question: 'Hvilke størrelser finnes de abstrakte trykkene i?',
          answer:
            'Renate Thors Birdie-trykk finnes i A3, A2 og A1; Helene Brox’ verk trykkes i 50 x 70 cm. Som en tommelfingerregel: velg A1 eller 50 x 70 cm over en sofa eller seng, og A3 til hyller og mindre vegger.',
        },
        {
          question: 'Kan jeg kjøpe abstrakte trykk med ramme?',
          answer:
            'Ja. Hvert trykk kan bestilles uten ramme eller med ramme i tre, sort eller hvitt, valgt på produktsiden. Vi leverer til hele verden, med fraktkostnadene vist i kassen.',
        },
      ],
    },
    illustrations: {
      title: 'Skandinaviske illustrasjoner',
      description:
        'Karakterfulle skandinaviske illustrasjonstrykk av Oslo-illustratøren Simen Wahlqvist: få streker, tørr humor, rene farger. Innramming og levering til hele verden.',
      heading: 'Illustrasjoner',
      intro:
        'Hvert illustrasjonstrykk her er, foreløpig, arbeidet til én kunstner: Simen Wahlqvist, en grafisk designer og illustratør fra Oslo som prøver å fange et øyeblikk, ofte rett før det skjer, med så få streker som mulig. Regelen hans er enkel: får en tegning ham til å le, er den ferdig. Og det synes. Morgenstrekk fanger dagens aller første helkroppsstrekk, og de kvadratiske trykkene rundt bærer den samme tørre humoren, hvert av dem bygget av en håndfull trygge streker og én eller to farger.',
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
      bio: 'Helene Brox er kunstner og illustratør bosatt i Oslo.',
    },
    'simen-wahlqvist': {
      location: 'Oslo, Norge',
      bio: 'Simen Wahlqvist er en norsk grafisk designer og illustratør bosatt i Oslo. I arbeidet sitt prøver han å fange øyeblikk, ofte før de skjer, med så få streker som mulig. Får en illustrasjon ham selv til å le, er den ferdig!',
    },
    'renate-thor': {
      location: 'Trondheim, Norge',
      bio: 'Renate Thor er en illustratør, kunstner og grafiker født i Trondheim og bosatt i Oslo. Hun er kjent for lekne kunstverk og illustrasjoner med djerve farger og komposisjoner. Hun drives av prosessen i håndverket sitt, og lar den lede henne frem til resultatet gjennom fri og leken eksperimentering. Kunstverkene lager hun med silketrykk, med papirsjablonger og kraftig farget trykkfarge, i uvanlige komposisjoner. Hun elsker uforutsigbarheten i lagene og blandingene i silketrykket, og etterligner noen av de samme prinsippene i illustrasjonsarbeidet sitt. Renate er utdannet ved Westerdals og har en master i illustrasjon fra Kunsthøgskolen i Oslo.',
    },
    'ingunn-dybendal': {
      location: 'Oslo, Norge',
      bio: 'Ingunn Dybendal er kunstner og illustratør bosatt i Oslo.',
    },
    'sia-siamos': {
      location: 'Bergen, Norge',
      bio: 'Athanasia Siamos er en gresk-norsk illustratør bosatt i Bergen.',
    },
    'nils-andersson': {
      location: 'Malmö, Sverige',
      bio: 'En samtidskunstner som bygger bro mellom tradisjonelt skandinavisk håndverk og et moderne estetisk uttrykk. Verkene hans forteller historier om arv og fornyelse.',
    },
  } as Record<string, ArtistCopy>,

  // Norwegian versions of lib/artist-editorial.ts, keyed by slug. para2 keeps
  // the same inline Markdown-link form; links point into the /no tree where a
  // Norwegian page exists, otherwise to the English route.
  artistEditorial: {
    'helene-brox': {
      heading: 'Formen får snakke',
      para1:
        'Helene Brox, kunstner og illustratør bosatt i Oslo, arbeider i djerve, flate former: figurer og fugler skåret ned til silhuett, malt med papirklippets selvsikkerhet og satt på én bunnfarge. Gjennom de fem trykkene hennes holder den samme disiplinen, enten stemningen er rolig eller høylytt. Swallow Dive bærer all bevegelsen sin i én koboltblå og én kremhvit; Dancer fanger en figur midt i steget, uten ansikt og uten gulv; Dragon løser et fabeldyr opp i bånd av farge mot sort. Selv IThinkIThink, det mest høylytte trykket i galleriet, bærer bekjennelsen sin i de samme djerve, utklippede formene.',
      para2:
        'Hvilken Brox som passer i et rom, avhenger av hvor mye mot veggen har. Tree Top Peach og Swallow Dive er de milde; de faller til ro på et soverom eller i en lesekrok uten å forsvinne i det, og begge trives blant de roligere verkene i [soveromssamlingen](/collection/bedroom). [Dragon](/product/dragon) og IThinkIThink vil ha rommet der folk samles og prater. Alle fem deler det samme utklippsspråket, så to av dem henger naturlig sammen, ett rolig og ett høylytt, og paret leses som bevisst snarere enn matchet.',
    },
    'simen-wahlqvist': {
      heading: 'Så få streker som mulig',
      para1:
        'Simen Wahlqvist er en norsk grafisk designer og illustratør bosatt i Oslo, og regelen hans er enkel: fang øyeblikket, ofte rett før det skjer, med så få streker som mulig. Får en tegning ham til å le, er den ferdig. Den testen forklarer alle de fem trykkene hans her. Slingshot lader en tilfreds figur inn i et fredstegn gjort om til sprettert; Mean Snothing gir en mann en Newton-pendel til øyne; Half Man deler en figur rent i to. Hvert av dem er en håndfull streker og to eller tre flate farger, der tegningen bærer hele vitsen.',
      para2:
        'Tørr humor viser seg å være utmerket selskap ved et skrivebord. Wahlqvists kvadratiske trykk passer naturlig på [hjemmekontoret](/collection/home-office), der Mean Snothing gjør seg fortjent til veggplassen bedre enn noen motivasjonsplakat, og Slingshot beholder et ordentlig glimt i øyet. Morgenstrekk, det mildeste verket hans, passer på et soverom eller i gangen du passerer på vei ut. Er det den sparsomme, vittige streken som treffer deg, er det arbeidet hans som bærer [illustrasjonene](/no/category/illustrations) våre, og to av disse henger sammen som ruter fra samme tegneseriestripe.',
    },
    'renate-thor': {
      heading: 'Én flokk, fire stemninger',
      para1:
        'Renate Thor er silketrykker først og fremst, og det synes. Hun bygger komposisjonene sine med papirsjablonger og kraftig farget trykkfarge, på jakt etter uforutsigbarheten i lagvis trykking, og Birdie-serien er den metoden destillert: én tumlende flokk kremhvite fugler, pakket kant til kant til den leses som mønster, trykket på fire ulike bunnfarger. Petroleumsblå, mørk sjokolade, smaragdgrønn og rosa endrer temperaturen i den samme tegningen fullstendig. Thor er født i Trondheim og bosatt i Oslo, utdannet ved Westerdals og med en master i illustrasjon fra Kunsthøgskolen i Oslo.',
      para2:
        'Å velge en Birdie er mest et spørsmål om hva rommet allerede gjør. Birdie Blue er den kjøligste og mest klassisk skandinaviske, hjemme i en [stue](/collection/living-room) som heller mot blått og grått; Birdie Brown varmes opp av treverk og lær; Birdie Green frisker opp et kjøkken eller en gang; [Birdie Pink](/product/birdie-pink) er myk nok for et soverom eller barnerom. Og fordi alle fire deler én komposisjon, er de laget for å henge i par: to fargevarianter side om side gjør ett enkelt trykk om til en liten serie.',
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
