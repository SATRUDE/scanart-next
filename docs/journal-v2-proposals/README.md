# Journal V2 proposals: the most-read articles

Ken, 26 September 2026. Mark's commission: go through the most-read articles and add the new V2 components where they feel right. The seven are the top of 90-day Search Console.

The bodies were read live from the socialagent `"Article"` store. **Nothing in the store has changed.** All seven are PUBLISHED, and each file below holds the full proposed body for Mark to approve. Titles, excerpts, query-matched H2s and existing links are all kept.

| Article | Components added | Fact fixes | selectedArtworkIds | Timing |
|---|---|---|---|---|
| [scandinavian-wall-decor-ideas](scandinavian-wall-decor-ideas.md) | 2 figures (Tree Top Peach + Massa Äpplen kitchen, Dancer above a sofa), 1 pull quote | "A1 print" (we don't sell A1) becomes a 50x70 or a pair; 18 links restored to the guides and prints it already names | Add eltsjoen, tree-top-peach, massa-applen, mean-snothing | Safe now |
| [nordic-art-and-design-books](nordic-art-and-design-books.md) | 1 pull quote ("They train the eye.") | None | No change | Safe now |
| [scandinavian-illustrators](scandinavian-illustrators.md) | 1 pull quote, "Four things" as a numbered list | **"All by one artist ... five pictures" is live and untrue.** Section rewritten to cover Wallin, Saarainen and Bäcklund Dakhil; absolute links made relative | Add the new illustrators | **Interim fix now**, full version at V2 |
| [best-scandinavian-art-prints](best-scandinavian-art-prints.md) | 2 figures (Eltsjoen reading corner, Trysilkaffe kitchen) | "four table scenes" becomes "several"; "most detailed" becomes "one of the most detailed"; one line on the two new artists | No change (the seven picks) | Safe now except the new-artists line (V2) |
| [what-is-scandinavian-art](what-is-scandinavian-art.md) | 1 pull quote, "four things" as a numbered list | "Norwegian artists" becomes "Nordic" | No change | Safe now |
| [nordic-design-and-architecture-books](nordic-design-and-architecture-books.md) | None | None | No change | Nothing to apply |
| [contemporary-nordic-art-books](contemporary-nordic-art-books.md) | 1 figure (Swallow Dive in the hall, as the opening line describes) | "Norwegian painters and printmakers" becomes "Nordic illustrators and painters" | No change | Safe now |

## How I chose

- **Pull quotes** are always a real line from the article, **lifted in place rather than repeated**, so no copy is cut or doubled. I haven't made a quote from any paraphrase (Wegner's chair line) or from anyone's words that aren't quoted in the piece.
- **Figures** only go where the room scene shows the exact point the paragraph makes. Every image already exists at `/images/products/` (the 23 Sep scenes from `lib/shop-scenes.ts`), and each is used once across the set. None is new or generated. Captions name the print and artist; they double as alt text (`markdownToBlocks`), so they describe the picture.
- **Numbered lists** go only where the copy already counts its items out ("four things").
- The paper, the artist's share and the artist and print counts are now clear everywhere. No article carried "archival" or "museum-quality".

## Left alone, and why

- **nordic-design-and-architecture-books:** there's nothing untrue in it, nothing to pull (its best candidate is a paraphrase), and no room scene that shows a chair or a building.
- **The wall decor H2 "2. A gallery wall with breathing room"** must stay word for word, because the gallery wall planner is anchored to it (`lib/article-enhancements.ts`). I checked that the proposed body still triggers it.
- **The illustrators hero** is already a room scene on V2, so I haven't added a body figure there.

## Timing: V2-only links

Mikko Saarainen's and Ishtar Bäcklund Dakhil's product and artist pages **404 on production today**. They only exist on the V2 branch. Only two passages depend on them: the illustrators section and one best-prints sentence. The illustrators file includes an interim paragraph that's safe to apply now. Production's converter already renders `>` quotes and `![caption](url)` figures, so the rest would work before V2, just in V1 styling.

## Noticed along the way, not mine to fix

- **What-is and the two books pieces get impressions but few clicks.** That's a title and snippet problem, and this brief rules out touching titles and excerpts. It's worth a Peggy ticket if Mark wants CTR work.
- **Stale copy in `lib/article-browse.ts`.** The `art-in-oslo-july-2026` label says "the Oslo-based artists we represent", which stopped being true with Hedvig Wallin. The `create-an-art-wall` code comment also still describes Birdie prints in that body.
- **The V2 snapshot `public/notion-data/articles.json` is behind the store.** It shows `best-nordic-art-prints` unpublished, but the store has it PUBLISHED since 29 Aug and it's 200 live. The next sync fixes it.
