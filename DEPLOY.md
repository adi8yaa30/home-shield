# Launch checklist

## 1. Domain

Every canonical, Open Graph URL, JSON-LD `@id`, `robots.txt` and `sitemap.xml`
points at `https://homeshieldofficial.in`.

Three things to line up when DNS is configured:

- **Serve that exact host.** The canonicals name `homeshieldofficial.in` with
  no `www`. Point `www.homeshieldofficial.in` at a 301 redirect to the bare
  domain, so only one host ever answers.
- **HTTPS.** Every canonical is `https://`; make sure plain `http://` redirects
  there rather than serving the site twice.
- **The origin allowlist.** `backend/Code.gs` only accepts form posts from
  `homeshieldofficial.in` and its `www`. If you change the domain again, change
  `ALLOWED_ORIGINS` with it and redeploy the Apps Script, or every form will
  start failing silently.

### If thehomeshield.in was ever live

The site previously named `thehomeshield.in`. If that domain was only ever
registered — never served, never indexed — ignore this and just point the new
one at the host.

If it did serve the site, treat this as a domain move rather than a swap:

1. Keep the old domain registered and pointed at the host.
2. 301-redirect every path on it to the same path on the new domain, not all
   to the home page — `/products.html` to `/products.html`.
3. Add both properties in Google Search Console and use **Change of address**
   on the old one. Without it the new domain starts from nothing.
4. Leave the redirects up for at least a year. They are what carries the
   ranking across; removing them early throws it away.
5. Update the Google Business Profile, and anywhere else the old URL was
   published.

## 2. Clean URLs (only if your host does them)

Canonicals and the sitemap use real file paths (`/about.html`) so they always
resolve. Netlify, Vercel and Cloudflare Pages also serve `/about` — if you're on
one of those, drop the suffixes in `sitemap.xml` and in each page's
`rel="canonical"`, and pick one form so the two never disagree.

## 3. The 404 page

`404.html` exists and matches the site. Most static hosts serve it for unknown
paths automatically (Netlify, Vercel, Cloudflare Pages, GitHub Pages); Apache
needs `ErrorDocument 404 /404.html` and nginx needs `error_page 404 /404.html`.

Whatever you use, it must return a real **404 status**, not 200 with the page
body — a 200 makes it a soft 404 and Google indexes the dead URL. The page is
`noindex`, carries no canonical, and is deliberately absent from the sitemap.
Its asset paths are absolute (`/css/...`) because it is served at whatever URL
the visitor mistyped, so relative paths would resolve against that and break.

## 4. Cache headers (biggest remaining win)

Assets are fingerprinted by `?v=` query strings, so they can be cached hard:

```
/assets/*   Cache-Control: public, max-age=31536000, immutable
/css/*      Cache-Control: public, max-age=31536000, immutable
/js/*       Cache-Control: public, max-age=31536000, immutable
/*.html     Cache-Control: public, max-age=0, must-revalidate
```

Enable Brotli or gzip for HTML, CSS and JS. WebP and WebM are already compressed —
don't re-compress them.

## 5. After going live

- Submit `sitemap.xml` in Google Search Console.
- Re-test Core Web Vitals on the real host (PageSpeed Insights). Local numbers
  don't include network latency, TLS, or CDN behaviour.
- Fill in the Instagram and Facebook links — search for `data-pending-asset`
  to find them. (Phone, email, address and the catalogue PDF are done.) When
  you have the real URLs, add them to the `sameAs` array in the `Organization`
  block in `index.html` too, so search engines tie the accounts to the brand.
- Confirm the 404 returns a 404 status: `curl -I https://homeshieldofficial.in/nope`.

## 6. Connect the forms — one step left

The code is done. What is missing is the endpoint it posts to.

| Form | Where | Lands in |
|---|---|---|
| Enquiry | Contact page | Contact enquiries |
| Book a Consultation | Modal, every page | Consultation requests |
| Product enquiry | Enquire, per finish | Consultation requests, with the finish named |
| Catalogue download gate | Modal, home + products | Catalogue downloads |

Follow `backend/README.md`: create the sheet, paste `backend/Code.gs`, deploy
it as a web app, then paste the URL into `LEAD_ENDPOINT` in `js/ui.js` and bump
that file's `?v=`.

Until that URL is set, every form still validates and responds — it just tells
the visitor nothing was sent and gives them the phone number.

**The download gate is a deterrent, not protection.** The catalogue URL is kept
in `js/ui.js` rather than in a link, so it cannot be saved by right-clicking the
button, and `robots.txt` keeps it out of search results. But the file still sits
at a fixed URL on a static host: anyone who opens the script can read the path.
Requiring the form for real means serving the PDF from an endpoint that checks
the submission first, which needs a backend.
