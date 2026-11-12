# Rupya.com

India's free money toolkit: rupee calculators, live INR exchange rates, plain-English guides, a money quiz and a free money check-up.

Static site (HTML + CSS + vanilla JS, no build step). Hosted on GitHub Pages from the `main` branch, root folder.

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home |
| `calculators/` | 14 calculators driven by `assets/calc.js` |
| `currency.html` | Live INR converter, rate table, 90-day chart, amount-in-words (`assets/fx.js`) |
| `guides/` | Evergreen money guides |
| `glossary.html`, `videos.html` | Reference and video learning hub |
| `money-checkup.html` | Lead generation: 60-second money check-up |
| `support.html` | Donations, sponsorship, hiring |
| `contest.html` | Monthly money quiz and prize draw entry |
| `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html` | Trust and legal pages |
| `assets/site.js` | Header, footer, theme, cookie notice, form delivery |
| `data/` | `rates.json` (refreshed daily by GitHub Actions), `videos.json` |
| `ads.txt`, `robots.txt`, `sitemap.xml` | AdSense and crawler files |

## Operating notes

- **Forms** post through FormSubmit to the owner's inbox. The address is stored encoded in `assets/site.js` and is never printed on a page. The first submission triggers a one-time activation email that must be confirmed.
- **AdSense** loader is in the `<head>` of every page (Auto ads). `ads.txt` only counts when the site is served from the root of a domain.
- **Custom domain**: add a `CNAME` file containing `rupya.com` and point DNS at GitHub Pages. All internal links are relative, so the site works on both the project URL and the custom domain.
- **Videos**: add YouTube IDs to `data/videos.json` to turn a topic card into an embedded player.

## Disclosure

"Rupya" is used as a plain transliteration of the common Hindi word for rupee. This site is independent and is not affiliated with the Reserve Bank of India, the Government of India, NPCI/RuPay or any company with a similar name. Content is educational, not financial advice.
