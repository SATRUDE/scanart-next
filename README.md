This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Adding an artist

One command takes a new artist from their files to the catalogue:

```bash
npm run add-artist -- scripts/artists/<slug>.json
```

The manifest holds the artist (id, name, slug, location, bio, photo, and the
Norwegian and editorial copy) and their prints (print file, category, sizes,
price category, descriptions). `scripts/artists/hedvig-wallin.json` is the
worked example. The script renders each print into the framed product shot,
crops the avatar, and appends the artist and prints to `data/artists.ts`,
`public/notion-data/products.json`, `lib/i18n/no.ts` and
`lib/artist-editorial.ts`. It is safe to re-run. PDF input needs poppler
(`brew install poppler`).

It finishes by listing what still needs a person: the room scene for each
print (required by the Merchant Center feed) and the landing-page sentences
that count the artists.
