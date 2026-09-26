// The V2 print listing (Figma: Prints · desktop 153:241) is one continuous list
// in three columns: each tile sits 64 under the one above, with no row gaps, and
// the three columns end on about the same line (layout.md, rule 13). A plain CSS
// grid can't do that with mixed ratios (a square next to a tall print leaves a
// hole), and `grid-template-rows: masonry` isn't shipped anywhere yet.
//
// So the split happens here, in plain data, and each column is a flex stack.
// The split is CONTIGUOUS: column one holds prints 1..k, column two k+1..m and
// so on. That keeps the DOM in list order, so on mobile, where the columns
// simply stack, the visual order, the reading order, the tab order and the
// ItemList order in the JSON-LD are all the same list. On desktop the list reads
// down each column in turn, like a newspaper. (A round-robin split would read
// across the rows on desktop but give a screen reader 1, 4, 7 on mobile.)

/** Height of a tile's image relative to its width, from the print's first size. */
export function tileHeightRatio(size: string | undefined): number {
  if (!size) return 7 / 5;
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  if (m) return Number(m[2]) / Number(m[1]);
  // A sizes are ISO 216, 1 : √2, and the tile shows them Tall 5:7.
  return 7 / 5;
}

/**
 * Caption plus the 64 gap below a tile, as a fraction of a 405 px column
 * (8 + 30 + 18 caption lines, then 64): what a tile costs beyond its image.
 */
const TILE_OVERHEAD = (8 + 48 + 64) / 405;

/**
 * Split `items` into `count` contiguous columns whose heights are as even as
 * possible (minimises the tallest column). Returns the columns in order; empty
 * columns are dropped when there are fewer items than columns.
 */
export function splitIntoColumns<T>(items: T[], heightOf: (item: T) => number, count = 3): T[][] {
  const n = items.length;
  if (n === 0) return [];
  const k = Math.min(count, n);
  const h = items.map(i => heightOf(i) + TILE_OVERHEAD);
  const prefix = [0];
  for (const x of h) prefix.push(prefix[prefix.length - 1] + x);
  const sum = (a: number, b: number) => prefix[b] - prefix[a];

  // best[j][i]: the smallest possible tallest column when the first i items
  // fill j columns; spread[j][i] breaks ties towards the most even split (the
  // smallest sum of squared heights), and a remaining tie goes to the earlier
  // columns, so ten equal prints split 4 / 3 / 3 rather than 4 / 4 / 2.
  const best: number[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(Infinity));
  const spread: number[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(Infinity));
  const cut: number[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(0));
  best[0][0] = 0;
  spread[0][0] = 0;
  const EPS = 1e-9;
  for (let j = 1; j <= k; j++) {
    for (let i = j; i <= n; i++) {
      for (let p = j - 1; p < i; p++) {
        const col = sum(p, i);
        const v = Math.max(best[j - 1][p], col);
        const sq = spread[j - 1][p] + col * col;
        const better = v < best[j][i] - EPS || (Math.abs(v - best[j][i]) <= EPS && sq < spread[j][i] - EPS) ||
          (Math.abs(v - best[j][i]) <= EPS && Math.abs(sq - spread[j][i]) <= EPS && p > cut[j][i]);
        if (better) {
          best[j][i] = v;
          spread[j][i] = sq;
          cut[j][i] = p;
        }
      }
    }
  }

  const columns: T[][] = [];
  let end = n;
  for (let j = k; j >= 1; j--) {
    const start = cut[j][end];
    columns.unshift(items.slice(start, end));
    end = start;
  }
  return columns;
}
