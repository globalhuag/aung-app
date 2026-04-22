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

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, bypasses RLS — used by /api/auth/line

# LINE Login + LIFF
LINE_LOGIN_CHANNEL_ID=          # LINE Login channel (NOT the OA Messaging API channel)
LINE_LOGIN_CHANNEL_SECRET=      # server-only
NEXT_PUBLIC_LIFF_ID=            # LIFF app id, shape: <channelId>-<suffix>

# ChillPay
CHILLPAY_MERCHANT_CODE=
CHILLPAY_API_KEY=
CHILLPAY_MD5_KEY=
CHILLPAY_DIRECT_URL=
NEXT_PUBLIC_APP_URL=

# Google Vertex AI (suit generation)
# ...see src/app/api/suit/generate/route.ts
```

## Auth flow (LINE LIFF)

1. User enters via the LINE OA rich menu → LIFF URL `https://liff.line.me/<NEXT_PUBLIC_LIFF_ID>` → opens `/line-login`.
2. `/line-login` calls `liff.init()` and `liff.getIDToken()`, then POSTs the idToken to `/api/auth/line`.
3. `/api/auth/line` verifies the idToken against `https://api.line.me/oauth2/v2.1/verify` (confirms signature + that the token was issued for our `LINE_LOGIN_CHANNEL_ID`), then upserts the `users` row keyed by `line_user_id`.
4. The user row is stored in `localStorage.aung_user` (legacy session pattern; other pages read this).

Run `supabase-migration-line-login.sql` once against the existing DB to add the LINE columns.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
