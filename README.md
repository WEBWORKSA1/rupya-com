# Rupya.com

India's money toolkit: 45 rupee calculators, live INR exchange rates for 26 currencies, gold, silver and crypto prices in rupees, an IFSC finder, plain-English guides, a free advice desk, a monthly quiz and a support programme.

Static site: HTML, CSS and vanilla JavaScript with no build step. Hosted on GitHub Pages from the `main` branch root and served at https://rupya.com/ (see `CNAME`).

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home: smart search, live rate medallion and board, calculator directory, mini calculators |
| `calculators/` | 45 calculator pages plus a searchable index, all rendered by `assets/calc.js` |
| `currency.html`, `currency/` | Converter hub and 24 currency pair pages (20 currencies to INR, INR to USD, AED, EUR, GBP) |
| `rates.html` | RBI policy rates, small savings rates, EPF, tax and GST reference |
| `gold-rate-today.html`, `silver-rate-today.html`, `crypto-prices-inr.html` | Live price pages |
| `ifsc-code-finder.html`, `rupees-in-words.html` | Utility tools |
| `advisor.html` | Lead generation: three-step free advice request |
| `money-checkup.html` | Lead generation: 60-second money check-up |
| `support.html`, `contest.html` | Donations, sponsorship, hiring; monthly quiz and prize draw |
| `my-rupya.html` | Saved results and recent tools, stored only in the visitor's browser (noindex) |
| `guides/`, `glossary.html`, `videos.html` | Learning content |
| `about.html`, `editorial-policy.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html` | Trust and legal pages |

## Scripts

| File | Role |
|---|---|
| `assets/site.js` | Shared UI: header and mega menu, search palette (`/` or Ctrl+K), smart answers, footer, theme, cookie notice, forms, JSON-LD, live data helpers, charts, guilloche engraving |
| `assets/calc.js` | Calculator engine: inputs, results, charts, year tables, compare, save, share link, CSV, print, lead prompts |
| `assets/fx.js` | Currency converter, rate tables, history charts, pair pages, gold, silver, crypto, IFSC and amount-in-words widgets |
| `sw.js`, `manifest.webmanifest` | Offline support (network first) and install metadata |

## Live data

Fetched in the visitor's browser, so pages stay current without a server:

- Exchange rates: open.er-api.com, falling back to `data/rates.json`
- Rate history: Frankfurter (ECB reference rates); Gulf currencies derived from their US dollar pegs
- Gold and silver: gold-api.com, converted at the live USD/INR rate with India's 15% import duty, shown before 3% GST
- Crypto: CoinGecko
- IFSC: Razorpay's public IFSC API

Policy figures (repo rate, small savings rates, EPF rate, tax slabs) are set in `assets/calc.js`, `assets/site.js` and `rates.html`; update them when the RBI or government announces changes.

## Operating notes

- **Forms** post through FormSubmit to the owner's inbox. The address is stored encoded in `assets/site.js` and never appears on a page. The first submission triggers a one-time activation email that must be confirmed.
- **AdSense** loader is in the `<head>` of every page (Auto ads). `ads.txt` is at the domain root. Turn on Google's consent message for visitors from the EEA, UK and Switzerland in the AdSense Privacy and messaging section.
- **Rates snapshot**: `data/rates.json` is the offline fallback. A scheduled GitHub Action can refresh it daily; workflow files have to be added from the GitHub website because the publishing token cannot write to `.github/workflows`.
- **Videos**: add YouTube IDs to `data/videos.json` to turn a topic card into an embedded player.
- **Donations**: add a payment link (UPI, Razorpay or similar) to `support.html` when ready; pledges arrive by email until then.

## Disclosure

"Rupya" is used as a plain transliteration of रुपया, the common Hindi word for rupee. This site is independent and is not affiliated with the Reserve Bank of India, the Government of India, NPCI or RuPay, or any company with a similar name. Content is educational, not financial advice.
