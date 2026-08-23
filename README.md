This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Route groups and where ads may appear

The `app/` directory is split into four groups, and the split is load-bearing for
AdSense policy compliance — Google-served ads are not permitted on screens without
publisher content (sign-in, app chrome, alerts, confirmations).

| Group        | Routes                                    | AdSense tag | Indexed |
| ------------ | ----------------------------------------- | ----------- | ------- |
| `(content)`  | `/`, `/guides/*`, `/faq`, `/about`        | yes         | yes     |
| `(legal)`    | `/privacy`, `/terms`                      | no          | yes     |
| `(auth)`     | `/login`, `/auth/confirm`                 | no          | no      |
| `(app)`      | `/dashboard`, `/groups/*`, `/polls/*`     | no          | no      |
| `vote/`      | `/vote/[token]/*`                         | no          | no      |

The tag is loaded by `AdSenseScript` in `app/(content)/layout.tsx` and nowhere else.
Do not move it to the root layout. `noindex` lives in each group's layout metadata;
`app/robots.ts` blocks only `/api/` and `/vote/`, so the `noindex` on the remaining
private routes stays readable by crawlers.

## Magic-link sign-in

The emailed link points at `/auth/confirm`, not at the Auth.js callback. Auth.js
spends a verification token on the *first* GET of `/api/auth/callback/resend` —
it deletes the row before rendering anything — so the callback URL is a one-shot
resource that anything merely touching it destroys: a long-press that fires
navigation, an inbox link scanner, a browser prefetch. Readers who tapped the
link to copy it were then pasting a link that was already dead.

`/auth/confirm` looks the token up without spending it (`lib/magic-link.ts`) and
only its button reaches the callback, so the link survives every accidental open.
That also makes it safe to print the URL as copyable plain text in the email body
alongside the button. Dead links (expired, or already signed someone in) land on
the same page, which offers a fresh one without retyping the address; failures
that reach the callback anyway are routed to `/login?error=…` by `pages.error`.

Nothing on that page may prefetch or auto-follow the callback URL — that is what
makes the whole arrangement work.

Guide metadata lives in `lib/guides.ts` (index page, sitemap, per-page `<title>`);
each guide's prose lives in its own route file. Adding a guide means an entry in the
registry plus a `app/(content)/guides/<slug>/page.tsx`.

Optional env var: `NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT` renders an explicit in-article
unit below each guide. Leave it unset to rely on Auto ads.

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
