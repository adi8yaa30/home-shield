# Launch checklist

## 1. Domain — done

Every canonical, Open Graph URL, `robots.txt` and `sitemap.xml` points at
`https://thehomeshield.in`.

Two things to line up when DNS is configured:

- **Serve that exact host.** The canonicals name `thehomeshield.in` with no
  `www`. Point `www.thehomeshield.in` at a 301 redirect to the bare domain, so
  only one host ever answers.
- **HTTPS.** Every canonical is `https://`; make sure plain `http://` redirects
  there rather than serving the site twice.

## 2. Clean URLs (only if your host does them)

Canonicals and the sitemap use real file paths (`/about.html`) so they always
resolve. Netlify, Vercel and Cloudflare Pages also serve `/about` — if you're on
one of those, drop the suffixes in `sitemap.xml` and in each page's
`rel="canonical"`, and pick one form so the two never disagree.

## 3. Cache headers (biggest remaining win)

Assets are fingerprinted by `?v=` query strings, so they can be cached hard:

```
/assets/*   Cache-Control: public, max-age=31536000, immutable
/css/*      Cache-Control: public, max-age=31536000, immutable
/js/*       Cache-Control: public, max-age=31536000, immutable
/*.html     Cache-Control: public, max-age=0, must-revalidate
```

Enable Brotli or gzip for HTML, CSS and JS. WebP and WebM are already compressed —
don't re-compress them.

## 4. After going live

- Submit `sitemap.xml` in Google Search Console.
- Re-test Core Web Vitals on the real host (PageSpeed Insights). Local numbers
  don't include network latency, TLS, or CDN behaviour.
- Fill in the placeholder email and the social links — search for
  `data-pending-asset` to find every one. (Phone, address and the catalogue PDF
  are done.)

## 5. Connect the forms — one step left

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
