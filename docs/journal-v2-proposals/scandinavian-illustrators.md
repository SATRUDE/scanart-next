# Scandinavian illustrators: the Nordic line, from trolls to now

Slug `scandinavian-illustrators` · PUBLISHED · Guide · proposal only, the store is untouched.
Third-highest click earner. 850 words now, 986 proposed. Title, excerpt, all H2s and every link are kept.

**Timing: this one has a live error, so part of it is urgent.** The piece says our illustration prints are "all by one artist ... in five pictures". That's already untrue on production today, because Hedvig Wallin's Small House Big Ocean is in the live Illustrations category (checked). At V2, Mikko Saarainen and Ishtar Bäcklund Dakhil add more. Their product and artist pages 404 on production until V2 ships, so there are two versions of the fix: the full V2 body below, and a short interim paragraph at the bottom that's safe to apply now.

## What I changed and why

1. **"Where our own prints sit", rewritten (fact fix).** Out: "are all by one artist, and they're the economy argument in five pictures" (untrue, and a print count). In: "come from several hands now, and between them they carry most of the habits above". The Wahlqvist sentences are kept word for word. Then one new paragraph links each new illustrator to one of the four habits the piece has just listed:
   - **Hedvig Wallin, pattern:** Small House Big Ocean, the whole sea built from parallel ink strokes.
   - **Mikko Saarainen, humour:** URF!, a knight losing an argument with a dragon.
   - **Ishtar Bäcklund Dakhil, nature and creatures:** Bird Above the Valley and Creature Among Blue Leaves.

   Every claim comes from `data/artists.ts` or the product descriptions in `products.json`: Gothenburg, "illustrating children's books at eighteen", Lahti, "children's author and comic artist", Konstfack. There are no counts and nothing about influences.
2. **Pull quote, after the opening.** "It was the medium that gave the region its shared pictures." That's the thesis the whole piece argues. It's lifted in place from paragraph two, not repeated.
3. **Numbered list for "What marks the Nordic line out".** The copy announces "Four things", then sets them as four bold-led paragraphs. They're now a 01 to 04 list, word for word. That's the passage a reader scans for, and the rewritten section refers back to it.
4. **Absolute links made relative.** All eleven `https://www.scandinavianart.co.uk/...` links now start at `/`, like every other article. Same destinations.
5. **Left alone.** No body figure: V2 already heads this article with the Eye Nose Eye room scene (`articleSceneSlugs`), so a second Wahlqvist room would be decoration. *Livet – illustrert* keeps its en dash because it's the real book title (flagged in August too).

## selectedArtworkIds

The block shows four Wahlqvist prints, but the section now names three other artists.

- Current: morgenstrekk, mean-snothing, eye-nose-eye, slingshot (as UUIDs)
- Proposed at V2: `["eye-nose-eye","morgenstrekk","mean-snothing","small-house-big-ocean","urf","bird-above-the-valley","creature-among-blue-leaves","slingshot"]`
- Interim, before V2: `["eye-nose-eye","morgenstrekk","mean-snothing","small-house-big-ocean","slingshot"]`

This also fills "The artists in this article" with all four illustrators, instead of Wahlqvist alone.

## Interim fix, safe to apply now (before V2)

Replace the section's first sentence, "Our [illustration prints](https://www.scandinavianart.co.uk/category/illustrations) are all by one artist, and they're the economy argument in five pictures. [Simen Wahlqvist](...) is an Oslo graphic designer...", with the V2 wording up to the end of the Mean Snothing sentence, then add only this paragraph after it:

> [Hedvig Wallin](/artist/hedvig-wallin), from Gothenburg, has illustrated children's books since she was eighteen, and [Small House Big Ocean](/product/small-house-big-ocean) is pattern doing the work: a little house on a rock, and a whole sea built from patient parallel strokes of ink.

Add the Mikko and Ishtar sentences when their pages go live.

## Proposed body (V2 launch)

```markdown
In 1883 Erik Werenskiold talked the folklorist Peter Christen Asbjørnsen into taking on a young unknown to help draw the Norwegian folktales. The unknown was Theodor Kittelsen, and between 1883 and 1887 the two of them illustrated the first three volumes of *Eventyrbog for Børn*. Their trolls, their Askeladden, their kings and princesses are still the pictures Norwegians see when they hear the stories, and Kittelsen kept drawing the tales for the best part of thirty years.

Start there and you notice something about how illustration sits in Scandinavia: it wasn't the junior partner to painting.

> It was the medium that gave the region its shared pictures.

## The folktale century

Sweden got its equivalent in John Bauer, who from 1907 illustrated the annual anthology *Bland tomtar och troll* (Among Gnomes and Trolls), returning to it almost every year until 1915. His trolls are heavy, mossy and oddly sympathetic, set in pine forest colder than anything in the painting of the period.

Denmark's contribution came from Kay Nielsen, who in 1914 published *East of the Sun and West of the Moon* in London: fifteen Norwegian tales collected by Asbjørnsen and Moe, drawn by a Dane in tall, spindly Art Nouveau plates. You can read [the whole 1922 edition at the Public Domain Review](https://publicdomainreview.org/collection/east-of-the-sun-and-west-of-the-moon-illustrated-by-kay-nielsen-1922-edition/). Late in his career Nielsen worked for Disney, and his hand is in the "Ave Maria" and "Night on Bald Mountain" sequences of *Fantasia*.

## Then it moved into the house

The other half of the tradition is domestic. Carl Larsson's *Ett hem* (A Home), published in 1899, was a set of watercolours of his own family's rooms, and it did more to fix the idea of the bright, plain, comfortable Swedish interior than any piece of furniture. Elsa Beskow broke through two years later with *Puttes äventyr i blåbärsskogen*, and is often credited with taking the Swedish picture book abroad.

In Helsinki, Tove Jansson wrote and drew the first Moomin book, *The Moomins and the Great Flood*, during the war, publishing it in 1945. And Ilon Wikland, who reached Sweden as a refugee from Estonia in 1944, walked into the publisher Raben & Sjögren in 1953, met Astrid Lindgren, and went on to illustrate more of Lindgren's books than anyone else across a forty-year collaboration: *Mio, My Son*, *Karlsson-on-the-Roof*, *The Brothers Lionheart*.

## What marks the Nordic line out

Four things, and they're all still there in the work being made now.

1. **Economy.** Say it in as few marks as the idea will allow, and stop.
2. **Flat colour and pattern.** Shapes laid down clean rather than modelled, with the folk instinct to fill a surface with repeats.
3. **Nature and creatures.** Birds, forests, animals and weather doing the work that other traditions give to people.
4. **A dry sense of humour.** Rarely a punchline, usually a straight face.

It didn't stay inside books, either. Olle Eksell, the first Swedish designer to call himself a graphic designer, drew a pair of cocoa eyes for the chocolate maker Mazetti in 1956; they went onto the packaging and became one of Sweden's best-known marks.

## Illustration as a profession

The trade is properly organised in the North. [Grafill](https://grafill.no/), the Norwegian association for design, illustration and visual communication, runs the annual Visuelt awards and a separate prize for the year's most beautiful illustrated books. [Oslo National Academy of the Arts](https://khio.no/en/study-programmes/bagi) teaches illustration alongside graphic design, at bachelor and master level.

Picture books are where the reputation sits now. Øyvind Torseter, who draws in line straight onto the page and keeps the accidents, has won a BolognaRagazzi Award and the Norwegian Book Art Prize, and was a finalist for the Hans Christian Andersen Award in 2014. Lisa Aisato, familiar to Norwegians from her illustrations in *Dagbladet*'s *Magasinet*, took the 2019 Norwegian Booksellers' Prize for *Livet – illustrert*, a book of pictures rather than prose.

## Where our own prints sit

Our [illustration prints](/category/illustrations) come from several hands now, and between them they carry most of the habits above. [Simen Wahlqvist](/artist/simen-wahlqvist) is the economy argument. He's an Oslo graphic designer and illustrator who tries to catch a moment, often just before it happens, in as few lines as possible, and reckons a drawing is finished when it makes him laugh. [Eye Nose Eye](/product/eye-nose-eye) draws a face as a Venn diagram. [Morgenstrekk](/product/morgenstrekk) has a man stretching for the sun with a charging cable still plugged into the skirting board. [Mean Snothing](/product/mean-snothing) gives a man a Newton's cradle for eyes and lets him keep a straight face about it.

[Hedvig Wallin](/artist/hedvig-wallin), from Gothenburg, has illustrated children's books since she was eighteen, and [Small House Big Ocean](/product/small-house-big-ocean) is pattern doing the work: a little house on a rock, and a whole sea built from patient parallel strokes of ink. [Mikko Saarainen](/artist/mikko-saarainen), a children's author and comic artist from Lahti in Finland, brings the humour. [URF!](/product/urf) is a whole comic page in one print, a knight losing an argument with a dragon across three panels, with a joke in almost every gap. And [Ishtar Bäcklund Dakhil](/artist/ishtar-backlund-dakhil), a Swedish artist who studied at Konstfack in Stockholm, is all nature and creatures: a white bird gliding over a green valley in [Bird Above the Valley](/product/bird-above-the-valley), a horned creature peering out of blue leaves in [Creature Among Blue Leaves](/product/creature-among-blue-leaves).

The tradition's other habits turn up elsewhere in the gallery. Helene Brox packs [Swallow Dive](/product/swallow-dive) so tightly with diving birds that it reads as pattern before it reads as birds. Ingunn Dybendal draws [Eltsjoen](/product/eltsjoen) and [Trysilkaffe](/product/trysilkaffe) in coloured pencil, turning a lake and a mug of flowers into folk motif. Sia Siamos, an illustrator in Bergen, paints [tables mid-meal](/category/botanical).

If you want the wider view, painting, design and folk art included, we've written that up separately in [what is Scandinavian art](/article/what-is-scandinavian-art). And if this has you wanting a drawn line of your own on the wall, the [full collection](/scandinavian-wall-art) is a short browse.
```
