# What is Scandinavian art?

Slug `what-is-scandinavian-art` · PUBLISHED · Guide · T-0531 · proposal only, the store is untouched.
727 words now, about 1,350 proposed. The H1 ("What is Scandinavian art?") and the excerpt stay as they are; the Google title and description change in `lib/article-meta.ts` in this PR.

This supersedes `docs/journal-v2-proposals/what-is-scandinavian-art.md` (26 Sep, never applied). Its three changes are folded in: "Norwegian" artists becomes Nordic (still wrong on the live page), the four things become a numbered list, and the "same instinct in different clothes" line becomes a pull quote.

## What I changed and why

Search Console, 28 days: "scandinavian art" 350 impressions, this article at about 10.8 with 212 impressions and 3 clicks. Page one is explainers: Wikipedia's Nordic art, encyclopedia entries, a Mixtiles "What is Scandinavian art" piece. Between them they cover four things this article skipped or only touched:

1. **Which countries count** (Mixtiles has it as an FAQ, Wikipedia defines Scandinavian as a subset of Nordic). New H2 "Which countries count as Scandinavian?", answered through the history (Finland in the Swedish realm until 1809, Iceland settled from Norway) so it doesn't repeat the /nordic-art page, which answers the same question through register. Our own roster is the worked example: Norway, Sweden and Denmark, plus Mikko Saarainen in Finland.
2. **Viking-age roots** (Wikipedia and Mixtiles both open the history there). New opening paragraphs for the history section: the Jelling stone and Urnes, tied forward to folk art and to Ingunn Dybendal's pattern.
3. **Munch and the other key figures.** Munch gets a fuller paragraph (what he painted, where the Screams hang), plus a short paragraph naming Larsson, af Klint and Kittelsen that hands off to `famous-scandinavian-artists` and `scandinavian-painting-landscape` rather than duplicating them.
4. **What modern Scandinavian art looks like.** "Where it lives now" becomes "What does modern Scandinavian art look like?": Olafur Eliasson for the contemporary art world, then four of our artists, each tied to a habit named earlier in the piece, with links to their artist pages and one print each. Hands off to `modern-scandinavian-art` for the movement itself.

Also: "we" becomes "I" throughout (Scandinavian Art is Mark writing as "I"), and the closing links point at /artists and /products as well as the books.

## Facts checked

- Jelling: the larger stone was raised by Harald Bluetooth around 965 and carries a great beast entwined with a snake. Urnes stave church, western Norway: its carved animal panels are the last Viking-age style (named after it) and are older than the present church (c. 1130); UNESCO World Heritage since 1979.
- The Scream: the 1893 painting is in the National Museum, Oslo; MUNCH holds the later painted version (dated 1910?), a pastel and the lithographs (munch.no, "Where can I see The Scream?").
- Finland was part of the Swedish realm until 1809; Iceland was settled largely from Norway from the late 800s. Nordic = Denmark, Finland, Iceland, Norway, Sweden, plus the Faroe Islands, Greenland and Åland.
- Olafur Eliasson's The weather project, Tate Modern Turbine Hall, 2003.
- Artist facts are from `data/artists.ts` bios only; print descriptions from the catalogue. Every internal link returned 200 on production on 18 Nov 2026.

## selectedArtworkIds

Now: Eltsjoen, Hummer og Vin, Half Man. Proposed: add Trysilkaffe (`25933fb2-2b5f-8066-83d3-ce953cc0fab9`) and Pines Under Starlight (`6d0903b6-ec66-5a65-9eba-29da564da7f9`), both named in the new copy.

## Proposed body

In 1995, Norway's public broadcaster asked the nation to vote for its national painting. The winner was Harald Sohlberg's Winter Night in the Mountains (1914): snow-covered peaks under a blue-black sky, a single bright star between two summits, and not a person in sight. If you want to understand Scandinavian art, that vote is a good place to start. Not a movement or a manifesto, but a landscape, a very particular light, and the nerve to leave everything else out.

Strictly, Scandinavian art means the art of Denmark, Norway and Sweden, though the term usually stretches to the Nordic neighbours, Finland and Iceland. It's never been one style with one name. It's closer to a sensibility, formed by living somewhere the sun barely sets in June and barely rises in January, and it runs from Viking carving to nineteenth-century landscape painting to the chair you might be sitting on now.

## Which countries count as Scandinavian?

Three, if you're being strict: Denmark, Norway and Sweden. Nordic is the wider word. It adds Finland and Iceland, along with the Faroe Islands, Greenland and Åland. The line blurs in practice because the history does. Finland was part of the Swedish realm until 1809, and Iceland was settled largely from Norway in the Viking age, so the art travelled with the people long before anyone drew today's borders. Most people who say Scandinavian art mean the whole region, and most of this piece does too. When I mean the wider family I say Nordic, and there's a [page on Nordic art](/nordic-art) for that.

My own gallery shows the overlap. Most of the artists I work with come from Norway, Sweden and Denmark, which is Scandinavian in the strict sense. [Mikko Saarainen](/artist/mikko-saarainen) draws in Lahti, which makes him Nordic but, strictly, not Scandinavian. Nobody from Iceland yet.

## Where did Scandinavian art come from?

Long before anyone painted a fjord, the North was carving. Viking-age art is almost all ornament: animals stretched, knotted and wound into one another across wood, metal and stone. The larger Jelling stone, raised by King Harald Bluetooth in Denmark around 965, carries a great beast tangled up with a snake. The last of the Viking styles takes its name from Urnes in western Norway, where the stave church still wears carved panels of slender, interlocking animals that are older than the church itself. That habit of turning a living thing into pattern never really went away.

Painting came later, and for centuries the region imported it from the south. That changed in the early 1800s, when Johan Christian Dahl, often called the father of Norwegian landscape painting, began treating his homeland's mountains and fjords with the seriousness other painters reserved for Italian ruins. Landscape became identity, and Scandinavian art has never fully let go of it.

From the late 1870s a group of Danish, Norwegian and Swedish painters gathered each summer in Skagen, the fishing village at Denmark's northernmost tip, to paint outdoors in its strange silvery evening light. The Skagen painters, P.S. Krøyer and Anna Ancher chief among them, gave the region its first famous school. Krøyer's beach scene at the top of this page is its best-loved image, and its real subject is the light itself.

Around the turn of the century came the individualists. Edvard Munch is the one everybody knows. He turned inward and painted feeling itself, love, jealousy, illness and dread, and The Scream (1893) made him the North's most famous artist and a forerunner of Expressionism. There's more than one Scream: the 1893 painting hangs in the National Museum in Oslo, and MUNCH, the museum on the city's waterfront, holds a later painted version, a pastel and the lithographs. Vilhelm Hammershøi went the other way, spending a decade painting the quiet grey rooms of his Copenhagen flat, often with a single figure turned away. And Sohlberg painted that winter night.

That's only the short list. Carl Larsson made his family's house at Sundborn the subject of a lifetime, Hilma af Klint was painting abstraction in Stockholm before it had a name, and Theodor Kittelsen gave Norway its trolls. I've written up the [famous Scandinavian artists](/article/famous-scandinavian-artists) properly, and the [landscape painters](/article/scandinavian-painting-landscape) who came before them.

## What does Scandinavian art look like?

Ask what marks Scandinavian art out and four things keep surfacing.

1. **Light.** Not sunshine, light: the low sun, the long dusk, the blue of a winter afternoon. The Skagen painters chased it along the beach; Hammershøi let it fall across a bare wall and called that the picture.
2. **Nature.** The landscape is never just a backdrop. Mountains, forest, sea and sky carry the emotional weight that other traditions hand to gods and kings.
3. **Restraint.** Muted palettes, empty space, and the confidence not to fill it. The silence in a Hammershøi room isn't a lack of content; it's the content.
4. **Usefulness.** A standing belief that beauty belongs in ordinary life. Which is where the story leaves the canvas.

## The functional tradition

In the twentieth century the same sensibility moved into the home. When the exhibition Design in Scandinavia began touring the United States and Canada in 1954, it fixed "Scandinavian design" in the world's vocabulary: simple forms, natural materials, everyday objects made carefully and made for everyone. If you've ever admired a pale wooden chair with clean lines, you've met the tradition.

> Painting and design are usually told as separate stories; in Scandinavia they're the same instinct in different clothes.

If the chair sends you to the bookshelf, I've picked out [five Nordic design and architecture books](/article/nordic-design-and-architecture-books) that tell that story properly, and [modern Scandinavian art](/article/modern-scandinavian-art) follows the movement from af Klint to the museums that keep it.

## And Scandinavian folk art?

It sits between the Vikings and the painters, and it never needed a museum. From the 1700s, rural Norwegian painters covered walls, bowls and chests in rosemaling, a flowing, flowery decorative style that spread valley by valley. In Sweden's Dalarna, farmers carved small wooden horses through the winter and painted them in the swirling kurbits style; the red Dala horse is still Sweden's favourite souvenir. Folk art is the tradition's root system: make the everyday beautiful, whoever you are.

It's also the root you can see most plainly in work made now. [Ingunn Dybendal](/artist/ingunn-dybendal) fills a green mug with folk flowers in [Trysilkaffe](/product/trysilkaffe), every bloom a different invention drawn petal by petal in coloured pencil, and in [Eltsjoen](/product/eltsjoen) she turns a whole lake, its forest and its clouds into ornament. A Viking carver would recognise the instinct.

## What does modern Scandinavian art look like?

Less like one style than ever. The best-known contemporary names work at a scale the Skagen painters couldn't have imagined: the Danish-Icelandic artist Olafur Eliasson hung an enormous artificial sun in the Turbine Hall at Tate Modern in 2003 and people lay on the floor beneath it. But the old habits keep turning up, and you don't need a museum to find them. They're in the work of the [independent Nordic artists I work with](/artists).

- **The light and the landscape.** [Markus Naarttijärvi](/artist/markus-naarttijarvi) photographs northern Sweden. [Pines Under Starlight](/product/pines-under-starlight) is snow-laden pines under a clear winter sky, which is Sohlberg's star and snow made with a camera.
- **Restraint.** [Simen Wahlqvist](/artist/simen-wahlqvist) in Oslo tries to catch a moment with as few lines as possible. If a drawing makes him laugh, it's done.
- **Ordinary life taken seriously.** [Sia Siamos](/artist/sia-siamos) in Bergen paints the table mid-meal. [Morgenlevering](/product/morgenlevering) is a breakfast of cafetière coffee and croissants with pink carnations in a red vase, Larsson's subject with the plates still warm.
- **The folk line.** [Hedvig Wallin](/artist/hedvig-wallin) in Gothenburg borrows from naive art: simple shapes, a wonky perspective and something new each time you look, as in the breakfast table of [Sunday Brunch](/product/sunday-brunch).

If this has you wanting to look longer, I've picked out the [Nordic art and design books worth owning](/article/nordic-art-and-design-books) and the [artist monographs worth sitting with](/article/nordic-artist-monographs). And if it has you looking at your own walls, [every print in the gallery](/products) is on one page, and the [living room collection](/collection/living-room) is a good place to start.
