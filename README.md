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

`/auth/confirm` looks the token up without spending it (`lib/magic-link.ts`), so
the link survives every accidental open. That also makes it safe to print the URL
as copyable plain text in the email body alongside the button. Dead links
(expired, or already signed someone in) land on the same page, which offers a
fresh one without retyping the address; failures that reach the callback anyway
are routed to `/login?error=…` by `pages.error`.

Nothing on that page may prefetch or auto-follow the callback URL — that is what
makes the whole arrangement work, and one hop was not enough on its own. The
button used to be an anchor pointing straight at the callback, and enterprise
mail filters detonate links two hops deep: they fetch the emailed link, then
follow the links on the page it returns. That completed the sign-in by itself —
an account and a live session with nobody having clicked. So the page now
contains no link to the callback at all; the button POSTs to
`/api/auth/confirm`, which hands the callback URL back only then. Link-following
does not POST.

The send side is rate limited in the `signIn` callback in `lib/auth.ts`, which
Auth.js runs before it mints a token or calls the mailer: one link per address
per minute, five a day, and fifteen an hour from one source
(`lib/signin-rate-limit.ts`). The login form is public and will mail whoever is
typed into it — that is what a magic link is — so without this it is an open
relay for that one message, and address-bombing campaigns find those. Attempts
are recorded in the `EmailSendAttempt` model (mapped to the existing
`SignInAttempt` table) and pruned by the daily cron.

Guide metadata lives in `lib/guides.ts` (index page, sitemap, per-page `<title>`);
each guide's prose lives in its own route file. Adding a guide means an entry in the
registry plus a `app/(content)/guides/<slug>/page.tsx`.

Optional env var: `NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT` renders an explicit in-article
unit below each guide. Leave it unset to rely on Auto ads.

`/admin` shows aggregate usage — creator and poll counts, growth, vote-through
rate, delivery health — computed from planit's own tables. It is not analytics
or tracking of visitors; nothing is sent to a third party, matching the privacy
policy. Gated by `ADMIN_EMAIL`: set it to the operator's sign-in address, case
insensitive. Leave it unset and the route 404s for everyone, admin included —
same fail-closed default as `CRON_SECRET`.

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

## Database migrations and deployment

Production builds no longer mutate the database. A controlled deployment should
apply committed migrations before releasing application code:

```bash
npm run deploy:build
```

Keep preview builds on `npm run build`; they must not migrate a shared database.

The first migration is a baseline for databases previously managed by
`prisma db push`. For an existing planit database, mark that baseline as
already applied once, then run the feature migration:

```bash
npx prisma migrate resolve --applied 20260827000000_baseline
npm run db:migrate
```

Do not resolve the baseline on a new, empty database; `prisma migrate deploy`
will create the complete schema there. Pull requests run lint, TypeScript,
unit tests, Prisma generation, and the production Next.js build in GitHub
Actions.

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
