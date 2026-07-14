# Evaan Jewels — Conversion Tracking Guide

**Website:** [evaanjewels.com](https://evaanjewels.com)  
**Prepared for:** Evaan Jewels Marketing Team  
**Purpose:** Step-by-step guide to track ad conversions on Google Ads and Meta (Facebook / Instagram)  
**Status:** Tracking tags are live on the website — ad platform setup is required on your side

---

## 1. Overview

Your website already has **Google Tags** and **Meta Pixel** installed. When visitors browse products, click WhatsApp, or call your shop, the website automatically sends data to Google and Meta.

**What is still needed:** Tell Google Ads and Meta Ads which actions count as a **conversion** (a successful result from your ads). Once configured, your ad campaigns can optimize toward people who are more likely to enquire on WhatsApp or call you.

### How it works (simple flow)

```
Customer sees your ad
        ↓
Clicks and lands on evaanjewels.com
        ↓
Browses products / clicks WhatsApp or Call
        ↓
Website sends a tracking event to Google & Meta
        ↓
Ad platforms count it as a conversion
        ↓
Ads improve over time toward more enquiries
```

---

## 2. What Counts as a Conversion for Evaan Jewels

For a jewelry business like Evaan Jewels, the most valuable conversions are **enquiries**, not just page visits.

| Customer action | Business meaning | Recommended use |
|---|---|---|
| **WhatsApp click** | Strong purchase intent — customer wants to enquire | **Primary conversion** (optimize ads for this) |
| **Phone call click** | Direct enquiry | Secondary conversion |
| **Product page view** | Interest only — not yet an enquiry | Use for remarketing, not main optimization |
| **Wishlist add** | Interest — may buy later | Remarketing only |
| **Online order placed** | Completed purchase | Can be added later (see Section 7) |

---

## 3. What Is Already Tracked on the Website

The following events are **already firing** from the live website. No additional website changes are needed for basic conversion tracking.

### 3.1 Meta (Facebook / Instagram) Events

| Event name | When it fires |
|---|---|
| `PageView` | Every page load |
| `ViewContent` | Customer opens a product page |
| `Lead` | Customer clicks **WhatsApp** (any WhatsApp button on the site) |
| `Contact` | Customer clicks **Call** or **WhatsApp** |
| `AddToWishlist` | Customer adds a product to wishlist |

### 3.2 Google Events

| Event name | When it fires |
|---|---|
| `view_item` | Customer opens a product page |
| `contact` | Customer clicks **WhatsApp** or **Call** |
| `add_to_wishlist` | Customer adds a product to wishlist |

### 3.3 Where tracking is active

Tracking fires on:

- Product pages (WhatsApp enquiry, call, wishlist)
- Header and footer (call, WhatsApp)
- Floating WhatsApp button
- Mobile bottom navigation
- Contact page
- Checkout page (WhatsApp support link)

---

## 4. Meta Ads — Setup Steps

### Step 1: Verify the Pixel is receiving events

1. Log in to [Meta Business Suite](https://business.facebook.com)
2. Go to **Events Manager** → select your Pixel
3. Open **Overview** or **Test Events**
4. Visit [evaanjewels.com](https://evaanjewels.com) on your phone
5. Open any product and click **Enquire on WhatsApp**
6. You should see these events appear within a few minutes:
   - `Contact`
   - `Lead`

**Optional tool:** Install the **Meta Pixel Helper** browser extension (Chrome) for instant verification while browsing the site.

### Step 2: Choose your main conversion event

For Evaan Jewels, we recommend:

- **Primary conversion:** `Lead` (WhatsApp enquiry)
- **Secondary conversion:** `Contact` (phone calls)

Do **not** optimize campaigns for `PageView` alone — that measures traffic, not enquiries.

### Step 3: Configure your ad campaign

1. Open **Meta Ads Manager**
2. Edit your active campaign (or create a new one)
3. At **Campaign** level:
   - Objective: **Leads** or **Sales** (with website conversions)
4. At **Ad Set** level:
   - Conversion location: **Website**
   - Performance goal: optimize for **Lead** event
   - Pixel: select your Evaan Jewels pixel
5. Save changes

### Step 4: (Optional) Create a Custom Conversion for clearer reporting

1. Events Manager → **Custom Conversions** → **Create**
2. Name: `WhatsApp Enquiry`
3. Rule: Event equals **Lead**
4. Save

This gives you a clearly labelled conversion in reports.

### Step 5: Review results

- **Events Manager → Overview:** Check daily `Lead` count
- **Ads Manager → Campaigns:** Check the **Results** column for leads
- Allow **24–48 hours** after setup for data to populate reliably

---

## 5. Google Ads — Setup Steps

### Step 1: Confirm tags are active

Your website loads Google tags when these are configured on the server:

- `NEXT_PUBLIC_GOOGLE_ADS_ID` (format: `AW-XXXXXXXXX`)
- `NEXT_PUBLIC_GOOGLE_TAG_ID` (format: `G-XXXXXXXXX`) — optional but recommended

**Quick check:** Visit the live site → right-click → **Inspect** → **Network** tab → filter by `google`. You should see requests to `googletagmanager.com`.

### Step 2: Link Google Ads with Google Analytics (recommended)

If you have a GA4 property (`G-XXXXXXXXX`):

1. Google Ads → **Tools & Settings** (wrench icon) → **Linked accounts**
2. Link **Google Analytics (GA4)**
3. In GA4 → **Reports → Realtime**, verify events like `contact` appear when you click WhatsApp on the site

Linking GA4 makes conversion setup easier and gives better reporting.

### Step 3: Create a conversion action

**Option A — Import from Google Analytics 4 (recommended)**

1. Google Ads → **Goals** → **Conversions** → **New conversion action**
2. Select **Website**
3. Choose **Import from Google Analytics 4**
4. Select the event: **`contact`**
5. Name it: `WhatsApp / Phone Enquiry`
6. Category: **Lead** or **Contact**
7. Save

**Option B — Create manually in Google Ads**

1. Google Ads → **Goals** → **Conversions** → **New conversion action**
2. Select **Website** → follow the setup wizard
3. Set the conversion to track the **`contact`** event
4. Name it: `WhatsApp / Phone Enquiry`
5. Save

### Step 4: Assign conversion to your campaign

**Important:** Only one or two conversions should be **Primary**. Others should be **Secondary**.

1. Open your active Google Ads campaign
2. Go to **Settings** → **Conversions**
3. Set **`WhatsApp / Phone Enquiry`** as **Primary**
4. Set `view_item` (product views) as **Secondary** or turn off for optimization

This ensures Google optimizes for enquiries, not just page visits.

### Step 5: Test and verify

1. Click a WhatsApp button on [evaanjewels.com](https://evaanjewels.com)
2. Check Google Ads → **Goals → Conversions** → your conversion action
3. Status should change to show recent activity (may take a few hours)
4. Use GA4 **Realtime** report for faster confirmation

---

## 6. Recommended Conversion Strategy

### For Meta (Facebook / Instagram)

| Priority | Event | Use |
|---|---|---|
| **Primary** | `Lead` | Main campaign optimization — WhatsApp enquiries |
| Secondary | `Contact` | Phone call enquiries |
| Remarketing only | `ViewContent` | Retarget people who viewed products |
| Remarketing only | `AddToWishlist` | Retarget wishlist users |

### For Google Ads

| Priority | Event | Use |
|---|---|---|
| **Primary** | `contact` | Main campaign optimization — WhatsApp + calls |
| Secondary | `view_item` | Remarketing audiences |
| Secondary | `add_to_wishlist` | Remarketing audiences |

---

## 7. Testing Checklist

Complete this checklist once after setup, and again whenever you change campaigns.

- [ ] Visit [evaanjewels.com](https://evaanjewels.com) on mobile
- [ ] Open a category (e.g. Nose Pin) → open a product
- [ ] Click **Enquire on WhatsApp**
- [ ] Confirm in **Meta Events Manager:** `Lead` and `Contact` events received
- [ ] Confirm in **GA4 Realtime** (if linked): `contact` event received
- [ ] Click **Call** button → confirm `Contact` / `contact` events
- [ ] Wait 24–48 hours → check **Results** in Meta Ads Manager and Google Ads

---

## 8. Expected Timeline

| When | What to expect |
|---|---|
| **Immediately** | Events visible in Meta Events Manager and GA4 Realtime |
| **Within 24 hours** | Conversion data starts appearing in ad dashboards |
| **Within 7 days** | Enough data for ad platforms to begin optimizing delivery |
| **Within 2–4 weeks** | Meaningful improvement in cost per enquiry (if budget allows) |

> **Note:** Conversion tracking does not guarantee lower ad costs immediately. It gives the ad platforms the data they need to show ads to people more likely to enquire. Performance improves as more conversion data is collected.

---

## 9. Future Enhancement — Online Order Tracking

The website supports online checkout (UPI, bank transfer, COD). **Purchase conversion tracking** can be added so that completed orders are also counted as conversions in Meta and Google.

This is useful if you want to optimize ads for direct online orders in addition to WhatsApp enquiries. This requires a small website update on the order confirmation step and can be implemented on request.

---

## 10. Quick Reference

### Meta — Main conversion to optimize for

```
Event: Lead
Trigger: WhatsApp button click
Where to set: Ads Manager → Ad Set → Conversion event → Lead
```

### Google — Main conversion to optimize for

```
Event: contact
Trigger: WhatsApp or Call button click
Where to set: Google Ads → Conversions → Import/create → contact event
```

### Support contacts for ad platforms

- **Meta Business Help:** [business.facebook.com/business/help](https://www.facebook.com/business/help)
- **Google Ads Help:** [support.google.com/google-ads](https://support.google.com/google-ads)

---

## 11. Summary

| Item | Status |
|---|---|
| Google Tag installed on website | Done |
| Meta Pixel installed on website | Done |
| Product view tracking | Done |
| WhatsApp enquiry tracking (`Lead`) | Done |
| Phone call tracking (`Contact`) | Done |
| Wishlist tracking | Done |
| Meta campaign conversion setup | **Action required — client / marketing team** |
| Google Ads conversion setup | **Action required — client / marketing team** |
| Online purchase conversion | Available on request |

**Bottom line:** The website is sending the right data. The next step is to log in to Meta Ads Manager and Google Ads, set **Lead** (Meta) and **contact** (Google) as your primary conversions, and let the campaigns optimize from there.

---

*Document version 1.0 — Evaan Jewels Website Conversion Tracking*
