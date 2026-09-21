# Home Shield — uPVC Profiles website

Static marketing site for Home Shield uPVC window and door profile systems.
Five pages, no build step, no dependencies — plain HTML, CSS and JavaScript.

## Running it locally

Any static server will do; the site uses relative paths throughout.

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Layout

```
index.html            Home
about.html            About Home Shield
products.html         Profile colours and finishes
applications.html     Where the profiles are used
contact.html          Enquiry form, details, map

css/styles.css        All styling, one file
js/ui.js              Shared behaviour: nav, carousels, films, dialogs, validation
js/data.js            Product, application and system data used by the pages
js/home.js            Home page wiring
js/products.js        Products page wiring
js/page.js            About / Applications / Contact wiring

assets/               Images (.webp), video (assets/video/), catalogue PDF
robots.txt            Crawler rules
sitemap.xml           Five URLs
DEPLOY.md             Launch checklist — read this before going live
```

Cache busting is manual: CSS and JS are referenced with `?v=NN`. Bump the
number in every page when you change one of those files, or browsers will
keep serving the old copy.

## Images and video

Images ship as WebP, sized to what the page actually displays. Video ships as
WebM with an MP4 fallback, in a full-size and a 960px cut; the script picks
the cut that suits the viewport and loads it after the page has finished
loading, so video never competes with the first paint.

The superseded PNGs were deleted once WebP replaced them. The Figma exports
and the master video files (the originals, with audio) are tracked here on
purpose: they are the only copies, so the repo doubles as their backup. They
are not used by any page.

## Before this goes live

`DEPLOY.md` has the full checklist. The one that still blocks launch:

**Set the lead-capture endpoint.** Every form posts to a Google Apps Script web
app that writes to a Google Sheet and emails a notification. Follow
`backend/README.md`, then paste the deployment URL into `LEAD_ENDPOINT` in
`js/ui.js`. Until that is set the forms validate and respond, but nothing is
recorded.

The site is set up for `https://thehomeshield.in` (no `www`). Serve that exact
host and redirect `www` and plain `http` to it, so only one URL ever answers.

Still outstanding beyond that: the email address and the social links.
