// Norwegian copy that the V2 rebuild added to the content pages (/no/inspire,
// /no/about, /no/help, /no/delivery). Everything those pages said before V2
// is still in lib/i18n/no.ts under the same page keys and still read from
// there; this file holds only the new V2 lines, beside it, so the rebuild
// does not rewrite a dictionary several page builds share.
//
// Same register as no.ts: plain, natural bokmål, meaning over word order, no
// em dashes, product and artist names as the catalogue writes them.

import type { InspireFilterStrings } from '@/lib/inspire-walls';

export const noV2 = {
  inspire: {
    lead: 'Innrammede nordiske trykk stylet i ekte rom. Start med veggfargen din eller et rom, og handle trykkene du ser i scenen.',
    filter: {
      wall: 'Vegg',
      room: 'Rom',
      all: 'Alle',
      allRooms: 'Alle rom',
      walls: { blue: 'Blå', yellow: 'Gul', peach: 'Fersken', green: 'Grønn', white: 'Hvit' },
      wallCaption: { blue: 'Blå vegg', yellow: 'Gul vegg', peach: 'Ferskenfarget vegg', green: 'Grønn vegg', white: 'Hvit vegg' },
      rooms: {
        'living-room': 'Stue',
        kitchen: 'Kjøkken',
        'dining-room': 'Spisestue',
        'home-office': 'Hjemmekontor',
        hallway: 'Gang',
        'childs-room': 'Barnerom',
      },
      countOne: '1 rom',
      countOther: '{n} rom',
      empty: 'Ingen rom passer begge deler ennå.',
      reset: 'Vis alle rom',
      featuring: 'Viser',
      by: 'av',
      and: 'og',
    } satisfies InspireFilterStrings,
  },

  about: {
    viewAllPrints: 'Se alle trykk',
    howItWorks: {
      heading: 'Slik fungerer butikken',
      rows: [
        { title: 'Valgt, ikke lagt ut', body: 'Hver kunstner er valgt av oss. Ingen melder seg på og laster opp selv.' },
        { title: 'Trykt på bestilling', body: 'Hvert trykk lages når du bestiller det, så ingenting ligger og venter på et lager.' },
        { title: 'Mer enn halvparten til kunstneren', body: 'Etter trykk og frakt går mer enn halvparten av det som er igjen til kunstneren. Et kjøp betaler den som laget verket.' },
      ],
    },
    whereHeading: 'Her jobber kunstnerne',
    /** City names as a Norwegian reader writes them. */
    cities: { Gothenburg: 'Göteborg' } as Record<string, string>,
    artistsHeading: 'Kunstnerne',
    allArtists: 'Alle kunstnerne',
    printOne: '1 trykk',
    printOther: '{n} trykk',
    cta: {
      heading: 'Er du kunstner?',
      body: 'Vi er et lite galleri og tar inn svært få, men et menneske leser alt som kommer inn. Fortell oss om arbeidet ditt.',
      button: 'Be om å bli vurdert',
    },
    /** "Tree Top Peach av Helene Brox" under the catalogue picture. */
    by: 'av',
  },

  help: {
    leadBefore: 'Svar på spørsmålene vi får oftest. Alt annet kan du sende til ',
    leadAfter: '.',
    countOne: '1 spørsmål',
    countOther: '{n} spørsmål',
    stillStuck: 'Står du fast?',
    stillStuckBefore: 'Send en e-post til ',
    stillStuckAfter: ', gjerne med ordrenummeret hvis du har det.',
    emailUs: 'Send oss en e-post',
  },

  delivery: {
    lead: 'Slik lages trykket ditt, slik kommer det frem uansett hvor i verden du bor, og dette skjer hvis du ombestemmer deg.',
    productionList: [
      'Lages på bestilling når du kjøper',
      'Produseres og sendes innen 1 til 4 virkedager',
      'Leveringstiden begynner etter at pakken er sendt, og du ser et estimat for adressen din i kassen',
    ],
    returnsHeading: 'Retur og refusjon',
    questions: {
      time: 'Hvor lang tid tar leveringen?',
      duties: 'Må jeg betale importavgifter?',
      cancel: 'Kan jeg avbestille?',
      damaged: 'Hva om trykket kommer frem skadet?',
    },
    contactIntro: 'Har du spørsmål? Send oss en e-post, eller les vilkårene som gjelder for alle bestillinger.',
    termsRow: 'Vilkår',
    privacyRow: 'Personvernerklæring',
    beforeYouWrite: 'Før du skriver',
    beforeList: ['Ordrenummeret ditt, fra bekreftelsen på e-post', 'Et bilde, hvis noe kom frem skadet'],
    emailUs: 'Send oss en e-post',
    by: 'av',
  },

  feedback: {
    /** The free-text field's word marker. */
    optional: 'Valgfritt',
  },
};
