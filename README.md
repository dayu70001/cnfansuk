# CNFans UK

CNFans UK Clothing is a local Next.js App Router prototype for a GBP-priced clothing retail flow.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4000` after the dev server starts.

## Current Stage

- Uses mock product data in `data/products.ts`.
- Uses `localStorage` for cart items and submitted mock orders.
- Includes customer checkout, fixed UK delivery fee and local admin order viewing.
- No real payment provider is connected.
- No Cloudflare Worker, D1 or R2 integration is connected.
- No Vercel deployment has been performed.

## Later Integration Notes

Future stages can connect a Worker API, D1 for orders and products, R2 for product imagery, and Telegram Bot / Resend notifications.
