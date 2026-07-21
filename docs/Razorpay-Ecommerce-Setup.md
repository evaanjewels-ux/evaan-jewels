# Razorpay E-commerce Setup

## Env vars (add to `.env.local` / production host)

```env
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
```

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Dashboard → API Keys (server only)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same Key ID (safe for browser Checkout)
- `RAZORPAY_WEBHOOK_SECRET` — Dashboard → Webhooks → secret (Live mode has its own)

Use **test** keys locally (`rzp_test_…`), **live** keys in production (`rzp_live_…`). Never commit secrets.

## Security (already in this codebase)

1. Prices recomputed server-side — cart prices never trusted
2. Razorpay Orders API with `payment_capture: true`
3. Checkout HMAC signature verified with timing-safe compare
4. Server fetches payment from Razorpay API and checks amount + status + order binding
5. Webhook HMAC verified on raw body; amount checked against order total
6. Capture handler is idempotent
7. Key secret / webhook secret stay server-only (`NEXT_PUBLIC_` only has Key ID)

## Webhook

1. Razorpay Dashboard → switch to **Live Mode** → **Webhooks** → Add
2. URL: `https://YOUR_DOMAIN/api/payments/razorpay/webhook`
3. Events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy the **Live** webhook secret into production `RAZORPAY_WEBHOOK_SECRET`

## Go live checklist

1. Finish KYC / activation on Razorpay (Live Mode enabled)
2. Generate **Live** API keys; put them in production env (Vercel/host)
3. Create a **Live** webhook (separate from Test) with the URL above
4. Confirm production site is HTTPS
5. Set auto-capture in Razorpay Dashboard (Orders API already requests capture)
6. Deploy, then make one small real payment and confirm: order → verified, money in Razorpay, email sent
7. Keep test keys only on local `.env.local` — never mix live keys into local checkout by accident

## Checkout flow

1. Customer adds products → cart → shipping address
2. Chooses **Razorpay** or **Bank Transfer**
3. Server creates order, recomputes prices from DB
4. Razorpay: creates gateway order → Checkout.js → signature verify + API amount check + webhook confirm
5. Bank transfer: pending until admin verifies proof
6. Customer tracks via `/track-order` (order number + phone)
7. Admin updates status / tracking / payment at `/admin/orders/[id]`

## Related

See also `docs/Resend-Customer-Accounts.md` for customer login and transactional emails.
