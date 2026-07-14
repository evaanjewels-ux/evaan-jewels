# Razorpay E-commerce Setup

## Env vars (add to `.env.local`)

```env
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
```

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Dashboard → API Keys (server only)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same Key ID (safe for browser Checkout)
- `RAZORPAY_WEBHOOK_SECRET` — Dashboard → Webhooks → secret

Use **test** keys locally, **live** keys in production. Never commit secrets.

## Webhook

1. Razorpay Dashboard → **Webhooks** → Add
2. URL: `https://YOUR_DOMAIN/api/payments/razorpay/webhook`
3. Events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`

## Checkout flow

1. Customer adds products → cart → shipping address
2. Chooses **Razorpay** or **COD**
3. Server creates order, recomputes prices from DB (never trusts cart prices)
4. Razorpay: creates gateway order → Checkout.js → signature verify + webhook confirm
5. COD: order confirmed immediately; payment stays pending until delivery
6. Customer tracks via `/track-order` (order number + phone)
7. Admin updates status / tracking / payment at `/admin/orders/[id]`

## Related

See also `docs/Resend-Customer-Accounts.md` for customer login and transactional emails.
