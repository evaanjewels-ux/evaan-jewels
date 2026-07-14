# Resend + Customer Accounts

## Env vars (add to `.env.local`)

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Evaan Jewels <orders@yourdomain.com>
```

- Create API key at [resend.com](https://resend.com)
- Verify your domain, then set `RESEND_FROM_EMAIL` to an address on that domain
- Until domain is verified, Resend only delivers to your own signup email (use `onboarding@resend.dev` as from for testing)

## Emails sent automatically

| Event | Email |
|-------|--------|
| Customer registers | Welcome |
| Order placed (COD or Razorpay) | Order received + receipt summary |
| Razorpay payment verified / webhook captured | Payment confirmed |
| Razorpay payment failed | Payment unsuccessful |
| Admin marks payment verified | Payment confirmed (if not already sent) |
| Admin changes order status | Status update (incl. tracking when shipped) |

Idempotency flags on the order (`emailsSent`) prevent duplicate payment emails from verify + webhook.

## Customer accounts

- Register: `/account/register`
- Login: `/account/login`
- Account + orders: `/account`
- Admin login stays at `/login` (pass `accountType: admin`)

Orders link to the logged-in user (or matching email account).
