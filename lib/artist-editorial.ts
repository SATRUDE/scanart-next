// Per-artist editorial copy for the "About the work" section on artist detail
// pages (below the print grid). Written by Ken (Studio board, 2026-08-05) and
// wired verbatim; every biography claim was verified against data/artists.ts
// and every artwork claim against the catalogue descriptions, so edits here
// should keep that grounding. para2 may carry inline links in Markdown form
// ([text](/path)); the page renders them as <Link>s. Design: Stan's artist-page
// direction (SA Figma 219:162), the About page's editorial split reused.

export interface ArtistEditorial {
  heading: string;
  para1: string;
  para2: string;
}

export const artistEditorial: Record<string, ArtistEditorial> = {
  'helene-brox': {
    heading: 'Shape doing the talking',
    para1:
      "Helene Brox, an Oslo-based artist and illustrator, works in bold, flat shape: figures and birds cut down to silhouette, painted with the confidence of a papercut and set on a single ground colour. Across her five prints the same discipline holds whether the mood is calm or loud. Swallow Dive carries all its movement in one cobalt and one cream; Dancer catches a figure mid-stride with no face and no floor; Dragon dissolves a beast into ribbons of colour on black. Even IThinkIThink, the loudest print in the gallery, carries its confession in the same bold, cut-out shapes.",
    para2:
      "Which Brox suits a room depends on how much nerve the wall has. Tree Top Peach and Swallow Dive are the gentle ones, settling a bedroom or reading corner without disappearing into it; both sit comfortably among the calmer pieces in the [bedroom collection](/collection/bedroom). [Dragon](/product/dragon) and IThinkIThink want the room where people gather and talk. All five share the same cut-out language, so any two hang together naturally, one calm and one loud, and the pairing reads as deliberate rather than matched.",
  },
  'simen-wahlqvist': {
    heading: 'As few lines as possible',
    para1:
      "Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo, and his rule is simple: capture the moment, often just before it happens, with as few lines as possible. If a drawing makes him laugh, it is finished. That test explains all five of his prints here. Slingshot loads a contented figure into a peace sign turned catapult; Mean Snothing gives a man a Newton's cradle for eyes; Half Man splits a figure clean in two. Each is a handful of lines and two or three flat colours, with the joke carried entirely by the drawing.",
    para2:
      "Deadpan humour turns out to be excellent company at a desk. Wahlqvist's square prints are a natural fit for the [home office](/collection/home-office), where Mean Snothing earns its wall space better than any motivational poster and Slingshot keeps a proper glint in its eye. Morgenstrekk, his gentlest piece, suits a bedroom or the hallway you pass on the way out. If the spare, witty line is what draws you, his work anchors our [illustrations](/category/illustrations), and any two of these hang together like frames from the same strip.",
  },
  'renate-thor': {
    heading: 'One flock, four moods',
    para1:
      "Renate Thor is a screen printer first, and it shows. She builds her compositions with paper stencils and boldly coloured ink, chasing the unpredictability of layered printing, and her Birdie series is that method distilled: one tumbling flock of cream birds, packed edge to edge until it reads as pattern, printed across four different grounds. Petrol blue, dark chocolate, emerald and rose pink each change the temperature of the same drawing completely. Trondheim-born and Oslo-based, Thor trained at Westerdals and holds an MA in illustration from the Oslo National Academy of the Arts.",
    para2:
      "Choosing a Birdie is mostly a question of what the room already does. Birdie Blue is the coolest and most classically Scandinavian, at home in a [living room](/collection/living-room) that leans blue and grey; Birdie Brown warms to wood and leather; Birdie Green freshens a kitchen or hallway; [Birdie Pink](/product/birdie-pink) is soft enough for a bedroom or nursery. And because all four share one composition, they were made for hanging in pairs: two colourways side by side turn a single print into a small series.",
  },
  'ingunn-dybendal': {
    heading: 'Pattern all the way down',
    para1:
      "Ingunn Dybendal, an Oslo-based artist and illustrator, draws in coloured pencil with extraordinary patience, and her two prints are the most densely worked pieces in the gallery. Eltsjoen turns a Nordic lake landscape into ornament: clouds stretched into ribbons, forest turned to folk motifs, water pooling in pale rings around a bridge. Trysilkaffe crams a green mug with an impossible bouquet, every bloom a different invention above a diamond-check cloth. Both sit squarely in the Nordic folk tradition, pattern on pattern, built stroke by stroke rather than in broad shapes.",
    para2:
      "This is work that rewards proximity. Hang [Eltsjoen](/product/eltsjoen) where you actually sit, beside a reading chair or above a desk, and it keeps offering new corners to find; the hundredth look pays as well as the first. Trysilkaffe brings the same density with more cheek, a natural fit for a kitchen or hallway wall. Both hold their own alongside the quieter pieces in our [botanical collection](/category/botanical), where their detail plays off simpler silhouettes rather than competing with them.",
  },
  'sia-siamos': {
    heading: 'Pull up a chair',
    para1:
      "Athanasia Siamos, known as Sia, is a Greek and Norwegian illustrator living in Bergen, and her four prints are all versions of the same generous idea: the table with people around it. Painted loose and bold, each carries a Norwegian title that says exactly what it holds. Hummer og Vin looks down on a lobster dinner mid-toast; Morgenlevering is a breakfast table newly arrived; Hyttefrokost has the ease of a cabin holiday; Vinkveld, the moodiest of the four, is a wine evening with the cork already adrift.",
    para2:
      "Siamos belongs where food happens. A kitchen or dining wall is the obvious home, [Vinkveld](/product/vinkveld) especially, but Morgenlevering is bright enough to lift a hallway or a bedroom that catches the morning sun. The four scenes were painted as kin, so a pair works beautifully: breakfast on one wall, wine on the other, marking the day's two ends. They sit at the warmest edge of our [botanical prints](/category/botanical), full of tomatoes, grapes and cut flowers rather than leaves and branches.",
  },
};
