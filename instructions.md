# Home Shield uPVC Website --- Codex Build Specification

## 0. Project Context

Build the Home Shield uPVC website from the supplied Figma reference
designs and the existing assets.

This specification currently covers **two pages only**:

1.  `/` --- Home Page
2.  `/products` --- Products Page

The Figma reference images are in the project root:

-   `home-page-figma-design-image`
-   `product-page-figma-design`

All visual assets are inside the `assets/` directory. Each major section
has its own dedicated asset folder, as shown in the provided asset
structure:

``` text
assets/
├── applications-section/
├── compatible-systems-section/
├── hero-section/
├── products-section/
├── why-homeshield-upvc-section/
└── logo.png
```

Use the supplied assets rather than creating replacement graphics.

The Figma designs are the visual source of truth. Do not redesign the
layout unless required for responsive behavior, accessibility, or
technical implementation.

------------------------------------------------------------------------

# 1. Global Design System

## Fonts

Use:

-   **Plus Jakarta Sans** --- headings and display typography
-   **Inter** --- body copy, labels, buttons, navigation and UI text

Load both fonts properly and avoid browser/system fallbacks where
possible.

### Typography hierarchy

Use semantic HTML headings and responsive sizing.

Suggested desktop sizes:

  Element           Font                      Size     Weight
  ----------------- ------------------- ---------- ----------
  H1                Plus Jakarta Sans     48--56px   600--700
  H2                Plus Jakarta Sans     32--40px   600--700
  H3                Plus Jakarta Sans     24--28px        600
  H4                Plus Jakarta Sans     18--22px        600
  Body              Inter                 16--18px        400
  Small body        Inter                     14px        400
  Navigation        Inter                 12--14px        500
  Button            Inter                 11--14px   500--600
  Large statistic   Plus Jakarta Sans     48--64px   600--700

Use `clamp()` for responsive typography rather than hard-coded
desktop-only sizes.

Example principle:

``` css
font-size: clamp(min, preferred, max);
```

Do not use oversized text merely for visual appearance if it creates an
incorrect SEO heading hierarchy.

### SEO heading rules

-   Exactly **one H1 per page**.
-   Home page H1 should communicate the primary business/product
    proposition.
-   Products page H1 should communicate that this is the Home Shield
    uPVC profile collection/products page.
-   Section titles should use H2.
-   Card titles should generally use H3 or non-heading text depending on
    hierarchy.
-   Do not use heading tags simply to make text visually larger.

------------------------------------------------------------------------

# 2. Global Layout

The site should closely follow the Figma proportions and spacing.

General principles:

-   Clean white page background.
-   Home Shield blue used for major feature containers.
-   Rounded corners are a key visual language.
-   Avoid excessive shadows.
-   Keep content centered within a consistent max-width.
-   Maintain generous whitespace between major sections.
-   Preserve the compact, premium visual character shown in Figma.
-   Do not turn the design into a generic Bootstrap/card-grid website.

All major sections should be responsive.

### Responsive behavior

Desktop: - Follow Figma composition closely. - Preserve visual hierarchy
and large image areas.

Tablet: - Reduce section padding. - Reflow multi-column layouts where
necessary.

Mobile: - Stack content vertically. - Preserve image-to-content
hierarchy. - Product swatches remain usable/tappable. - Application
cards become a horizontally scrollable carousel or sensible stacked
layout. - Compatible systems become a touch slider. - Never allow
horizontal page overflow.

Use CSS media queries and responsive layout rather than separate
duplicated desktop/mobile pages.

------------------------------------------------------------------------

# 3. Global Animation Principles

Animations should be subtle and premium.

Do not over-animate the page.

Use:

-   opacity
-   transform
-   scale
-   slight image movement
-   number counting
-   swatch transitions
-   carousel movement

Avoid: - excessive bounce - long animations - distracting parallax -
animations that block content

Default animation duration should generally be around `300–700ms`,
depending on interaction.

Respect:

``` css
@media (prefers-reduced-motion: reduce)
```

When reduced motion is enabled: - Disable counting animations. - Disable
unnecessary transitions. - Keep content immediately visible. - Preserve
functional interactions.

------------------------------------------------------------------------

# 4. Header / Navigation

The header appears on both pages.

Match the Figma reference:

-   Home Shield logo on the left.
-   Navigation on the right.
-   Navigation items:
    -   Products
    -   Applications
    -   About Us
    -   Contact Us
-   Primary CTA:
    -   `BOOK A CONSULTATION`

Use semantic `<header>` and `<nav>`.

The logo should link to `/`.

Navigation should work on both desktop and mobile.

On mobile, use a compact menu rather than allowing the navigation to
overflow.

The CTA should be visually prominent but remain consistent with the
Figma design.

------------------------------------------------------------------------

# 5. HOME PAGE --- `/`

Page order must be:

1.  Hero
2.  Sub-Hero / Numbers
3.  Product Series
4.  Applications
5.  Compatible Systems
6.  Why Home Shield uPVCs?
7.  CTA
8.  Footer

------------------------------------------------------------------------

# 6. HOME --- Hero Section

## Visual reference

Use the `hero-section/` assets.

The hero consists of:

-   Large rounded-corner image card.
-   Text positioned over the image.
-   A small UV-resistant chip on the image.
-   Two CTA buttons positioned at the bottom/overlapping area of the
    hero image card.

The Figma design intentionally has the buttons visually sitting over the
image card.

Do NOT convert them into ordinary buttons below the image.

## Hero image

Use the supplied hero asset.

The image container must:

-   Have rounded corners matching Figma.
-   Use `overflow: hidden`.
-   Maintain the intended image crop.
-   Remain visually dominant.

Use responsive `object-fit: cover` behavior where required.

## Hero copy

Use the copy/content from the Figma design/assets.

Do not invent additional marketing claims.

The heading should be a semantic H1.

## Hero chip

The small chip should communicate:

`UV Resistant`

It should visually sit on top of the image.

The chip should be compact and pill-shaped.

## Hero CTA buttons

Two buttons:

-   `EXPLORE PRODUCTS`
-   `DOWNLOAD CATALOGUE`

The first button is the outlined/stroked button shown in Figma.

The visual stroke is a CSS border. Do not try to recreate the Figma
stroke as an image.

The buttons should overlap the lower edge of the hero image card exactly
as shown in the design.

Use a positioned wrapper around the hero card/button group rather than
breaking the document flow.

Example implementation concept:

``` text
hero
└── hero-image-card
    ├── image
    ├── overlay-content
    ├── uv-chip
    └── hero-actions
```

The buttons should remain accessible and keyboard-focusable.

------------------------------------------------------------------------

# 7. HOME --- Sub-Hero / Numbers Section

This section follows the hero.

## Layout

The Figma has:

-   Short heading at the top/left.
-   Supporting body text positioned toward the lower/right side.
-   Three statistic cards below.

Keep this asymmetric composition.

Do not center everything.

## Statistics

There are three cards.

The current Figma values/content are:

-   `40%`
-   `Zero.`
-   `50+`

Use the exact supporting copy from the Figma design.

Do not silently replace these figures with invented statistics.

## Number animation

The numbers should animate when the section enters the viewport.

Implementation:

-   Use `IntersectionObserver`.
-   Trigger once when approximately 20--30% of the section becomes
    visible.
-   Animate numeric values from their starting state to the final value.
-   Do not continuously restart the animation every time the user
    scrolls away/back.

For values such as `40%`:

``` text
0 → 40%
```

For `50+`:

``` text
0 → 50+
```

For `Zero.`: - Treat the word/value as a designed statistic. - Do not
force an inappropriate numeric animation.

Use a smooth easing function.

------------------------------------------------------------------------

# 8. HOME --- Rotating Feature Chip

The Figma currently shows a small chip:

`UV Resistant`

The chip should automatically cycle through additional feature messages.

Use three messages:

1.  `UV Resistant`
2.  `Noise Reduction`
3.  `Long Service Life`

The content should automatically change without requiring user
interaction.

Recommended behavior:

-   Change every 3--4 seconds.
-   Fade/slide the text smoothly.
-   Keep the chip dimensions stable so the layout does not jump.
-   Pause or reduce animation for `prefers-reduced-motion`.

The chip should be treated as a small supporting UI element, not a major
section.

Use only claims supported by the supplied design/content.

------------------------------------------------------------------------

# 9. HOME --- Product Series Section

Section heading:

`Our Product Series`

This is NOT an e-commerce product grid.

Home Shield is presenting one uPVC profile/product range with multiple
finish/color collections.

## Layout

Match Figma:

-   Blue rounded section container.
-   Large white product image card.
-   Three horizontal finish selector rows underneath.
-   Small CTA beneath.

## Product image

Use assets from:

``` text
assets/products-section/
```

The main product image should update when the user changes the selected
finish.

## Three collections

### White Color Profile

Current finishes:

-   Bluish White
-   Porcelain White
-   Pure White
-   Ivory White

### Full Colored Profile

Current finishes:

-   TT01 Bronze
-   TT02 Deep Brown
-   TT03 Deep Green
-   TT04 French Grey
-   TT05 Deep Grey
-   TT06 Black

If additional supplied assets exist for the remaining listed finishes,
include them. Do not invent names for assets.

### Film Series Profile

Current finishes:

-   Series 1
-   Series 2
-   Series 3
-   Series 4

Use the actual finish names from the supplied content/assets if
available.

------------------------------------------------------------------------

# 10. Product Swatch Interaction

Each finish has two product photos.

The naming convention supplied is:

``` text
color-1-slide-1.png
color-1-slide-2.png
```

Each series has its own dedicated folder:

``` text
white-color-profile/
colored-profile/
textured-profile/
```

Use the actual supplied folder/file names.

## Behavior

When a user selects a swatch:

1.  Selected swatch becomes visually active.
2.  Main product image updates to the corresponding selected color.
3.  The two photos belonging to that selected color are available.
4.  The product image transition should be animated.
5.  Do not abruptly replace the image without a transition.

Recommended transition:

``` text
current image
→ fade/scale slightly
→ new image
```

The transition should be short and subtle.

## Two product photos

Because each color has two photos, the implementation should support
both.

Possible interaction:

-   Main image displays slide 1.
-   Secondary image can be displayed through a small internal carousel,
    hover interaction, swipe, or subtle automatic transition depending
    on the final UI.

Do not invent a large second UI if it is not present in Figma.

The important requirement is that both supplied photos are usable.

## Data-driven implementation

Do not hard-code the product logic into separate components for every
color.

Create structured data similar to:

``` js
{
  name: "Bluish White",
  collection: "White Color Profile",
  folder: "white-color-profile",
  swatches: "...",
  images: [
    ".../color-1-slide-1.png",
    ".../color-1-slide-2.png"
  ]
}
```

Build the UI from the data.

This makes adding another finish later straightforward.

------------------------------------------------------------------------

# 11. HOME --- Applications Section

Section heading:

`Applications`

The design has three visible cards.

## Important interaction

The center card is larger than the side cards.

When the user changes the active application:

-   The selected card moves/becomes the center card.
-   The center card becomes larger.
-   The previous center card reduces to the side-card size.
-   The content/image transitions smoothly.

This should feel like a carousel rather than three independent static
cards.

## Multiple applications

All application images are in:

``` text
assets/applications-section/
```

The implementation must be data-driven.

If additional application images exist in the dedicated asset folder,
create corresponding application cards rather than hard-coding only the
three currently shown in the Figma.

Each application card should contain:

-   Image
-   Application title
-   Appropriate supplied label

Do not invent application names where the asset/content does not provide
one.

## Desktop behavior

Show:

``` text
small card | large active card | small card
```

The active card is always visually dominant.

## Mobile behavior

Convert this to a touch-friendly horizontal carousel.

The active card should remain larger.

------------------------------------------------------------------------

# 12. HOME --- Compatible Systems Section

## Visual source

Follow the supplied Figma/reference design completely for this section.

The section currently shows illustrated/graphic system types such as:

-   Arch
-   Casement
-   Tilt & Turn

Use the assets from:

``` text
assets/compatible-systems-section/
```

Do not redraw the supplied illustrations.

## Design

Use:

-   Blue rounded container.
-   Section heading.
-   Large/simple system illustrations.
-   System name below each illustration.
-   Small CTA/control below.

Maintain the clean visual style shown in the reference.

## Slider behavior

This is a horizontal slider/carousel.

The user must be able to understand that the cards can slide.

Use a subtle visual affordance:

-   partially visible next/previous item
-   drag cursor
-   touch swipe
-   small slider/progress indicator if appropriate

The slider itself should move as the user drags/swipes.

Recommended UX:

-   Drag/swipe enabled.
-   Previous/next controls optional if they fit the Figma design.
-   Snap each item into position.
-   Keep the active item visually clear.

Do not make the slider auto-advance aggressively.

------------------------------------------------------------------------

# 13. HOME --- Why Home Shield uPVCs?

Section heading:

`Why Home Shield uPVCs?`

Use the dedicated assets:

``` text
assets/why-homeshield-upvc-section/
```

The section is a bento-style five-feature layout.

## Layout

Four small feature cards:

-   UV Resistant
-   Low Maintenance
-   Noise Insulation
-   Weather Resistant

One larger image/feature card on the right.

Follow the Figma composition:

``` text
small | small | large
small | small | large
```

The large card contains the supplied image.

## Icons

Use the supplied icons from the dedicated folder.

Do not replace them with generic icon libraries if the correct supplied
icon exists.

## Animation

Use subtle entrance/hover animations.

Examples:

-   Icon slight upward movement.
-   Card content fade-up.
-   Large image slight scale on hover.
-   Very subtle image movement.

Keep it restrained.

------------------------------------------------------------------------

# 14. HOME --- CTA

The CTA follows the Why Home Shield section.

Use the Figma wording/layout.

Primary message:

`Explore Our Complete uPVC Profile Collection`

Supporting copy:

`Download the technical catalogue or get in touch with our team to find the right solution for your project.`

Two actions:

-   `CALL US`
-   `DOWNLOAD BROCHURE`

The CTA should be visually clean with substantial whitespace.

The catalogue/brochure button should point to the supplied catalogue
file if it exists in the project.

The call button should use a proper `tel:` link when the final phone
number is available.

Do not invent a phone number.

------------------------------------------------------------------------

# 15. HOME --- Footer

Match the Figma footer.

The footer is a large blue rounded container.

It contains:

1.  Home Shield logo/info block.
2.  Explore navigation.
3.  Social links.
4.  Map/location visual on the right.

## Explore links

Current structure:

-   Home
-   About Us
-   Products
-   Applications
-   Contact Us

## Social links

Current structure:

-   Instagram
-   Facebook
-   Email

Use actual URLs/contact information if supplied by the project.

Do not invent social URLs.

## Map

Use the supplied map/location asset if available.

If the Figma currently uses a placeholder and no final map asset is
supplied, preserve the placeholder area rather than inventing a
location.

------------------------------------------------------------------------

# 16. PRODUCTS PAGE --- `/products`

The Products page is intentionally simple.

Do not turn it into a conventional e-commerce catalogue.

It presents the same single Home Shield profile range through three
finish collections.

## Page order

1.  Header
2.  Page hero/title
3.  White Color Profile
4.  Full Color Profile
5.  Film Series Profile
6.  Technical Specifications CTA
7.  Footer

------------------------------------------------------------------------

# 17. PRODUCTS --- Page Header

Use:

H1:

`Our Products`

Supporting copy should follow the Figma design and supplied content.

Keep this short.

The H1 is the only H1 on the page.

------------------------------------------------------------------------

# 18. PRODUCTS --- White Color Profile

Use the same product interaction system as the Home page, but expanded.

## Layout

Blue rounded container.

Top:

`White Color Profile`

Below:

``` text
large product image | finish selector
```

Current finishes:

-   Bluish White
-   Porcelain White
-   Pure White
-   Ivory White

Each finish has:

-   swatch
-   finish name
-   `Enquire` CTA

The selected finish should update the large product image.

Use the same underlying data model as the Home page.

Do NOT duplicate product logic.

------------------------------------------------------------------------

# 19. PRODUCTS --- Full Color Profile

Same structure as White Color Profile.

Heading:

`Full Color Profile`

Current finishes:

-   TT01 Bronze
-   TT02 Deep Brown
-   TT03 Deep Green
-   TT04 French Grey
-   TT05 Deep Grey
-   TT06 Black

Use the supplied swatch colors/assets.

Each row contains:

-   swatch
-   name
-   `Enquire` CTA

Clicking the finish changes the main product image.

------------------------------------------------------------------------

# 20. PRODUCTS --- Film Series Profile

Same structure.

Heading:

`Film Series Profile`

Current finishes:

-   Series 1
-   Series 2
-   Series 3
-   Series 4

Use the actual supplied texture/film assets.

Each row contains:

-   texture swatch
-   series name
-   `Enquire` CTA

Clicking the row/swatch changes the main product image.

------------------------------------------------------------------------

# 21. PRODUCTS --- Enquire Interaction

Each product/finish row has an `Enquire` button.

The button should lead to the contact/enquiry flow.

Do not invent the final destination if a contact route is not yet
configured.

Possible final implementation:

``` text
/enquire
```

or scroll to the contact/enquiry section if that is the final site
architecture.

For now, make the CTA component reusable and easy to connect.

------------------------------------------------------------------------

# 22. PRODUCTS --- Technical Specifications CTA

After the three profile collections:

Heading:

`Need Technical Specifications?`

Supporting text:

`Download our complete catalogue or talk with our experts.`

Buttons:

-   `CALL US`
-   `DOWNLOAD BROCHURE`

Match the Figma spacing and typography.

------------------------------------------------------------------------

# 23. PRODUCTS --- Footer

Use the same footer component as the Home page.

Do not create a second footer design.

------------------------------------------------------------------------

# 24. Component Architecture

Build reusable components.

Suggested structure:

``` text
components/
├── Header
├── Footer
├── Button
├── Hero
├── StatsSection
├── FeatureChip
├── ProductSeries
├── ProductConfigurator
├── ProductCollection
├── ProductSwatch
├── ApplicationsCarousel
├── CompatibleSystemsSlider
├── WhyHomeShield
├── CTASection
└── ...
```

The Products page should reuse:

-   Header
-   Footer
-   ProductConfigurator / ProductCollection
-   ProductSwatch
-   CTA

Do not duplicate the same product logic in two pages.

------------------------------------------------------------------------

# 25. Product Data Architecture

Keep all finish information in structured data.

Example:

``` js
const productCollections = [
  {
    id: "white",
    title: "White Color Profile",
    slug: "white-color-profile",
    products: [
      {
        id: "bluish-white",
        name: "Bluish White",
        swatch: "...",
        images: [
          ".../color-1-slide-1.png",
          ".../color-1-slide-2.png"
        ]
      }
    ]
  }
]
```

Use the actual asset paths/names from the project.

The UI should be generated from this data.

This is important because the client may add/change finishes later.

------------------------------------------------------------------------

# 26. Asset Rules

Use assets from:

``` text
assets/
```

Do not:

-   redraw product images
-   replace supplied icons with random icons
-   use stock images when a supplied asset exists
-   create fake product photography
-   rename visual assets unnecessarily

If an asset is missing, keep the component prepared for the asset rather
than inventing a replacement.

All meaningful images need useful `alt` text.

Decorative images should use appropriate empty alt text.

------------------------------------------------------------------------

# 27. SEO Requirements

The website should be SEO-friendly from the beginning.

## Home page

Suggested title:

`Home Shield uPVC Profiles | Durable uPVC Solutions`

Use a better final title if official brand/product wording is supplied.

Meta description should naturally describe:

-   Home Shield
-   uPVC profiles
-   colours/finishes
-   applications
-   durability/performance

Do not keyword-stuff.

## Products page

Suggested title:

`uPVC Profile Colours & Finishes | Home Shield`

Again, refine based on final approved brand wording.

## Semantic HTML

Use:

``` html
<header>
<nav>
<main>
<section>
<article>
<footer>
```

Use proper heading hierarchy.

Buttons should be `<button>`.

Links should be `<a>`.

Do not use clickable `<div>` elements.

------------------------------------------------------------------------

# 28. Image SEO / Performance

All images should have:

-   descriptive filenames where practical
-   useful alt text
-   width/height attributes where possible
-   lazy loading below the fold

Hero image should NOT be lazy loaded if it is the primary LCP element.

Optimize supplied images for web delivery without visibly reducing
quality.

Prefer modern image formats when technically appropriate while retaining
fallbacks where necessary.

------------------------------------------------------------------------

# 29. Performance

The site should feel fast despite using multiple product/application
images.

Requirements:

-   Lazy load below-the-fold images.
-   Preload only the actual LCP hero image.
-   Avoid loading every product image immediately if not needed.
-   Load secondary product images intelligently.
-   Avoid large JavaScript libraries for simple interactions.
-   Use CSS transitions where possible.
-   Use IntersectionObserver for scroll-triggered effects.
-   Avoid layout shift when images load.
-   Set image dimensions/aspect ratios.
-   Keep animations GPU-friendly.

Do not sacrifice performance for unnecessary animation.

------------------------------------------------------------------------

# 30. Accessibility

Requirements:

-   Keyboard navigation for all interactive controls.
-   Visible focus states.
-   Sufficient color contrast.
-   Meaningful alt text.
-   Buttons/links must have accessible labels.
-   Carousels must be keyboard/touch accessible.
-   Swatches must have accessible names.
-   Do not communicate selection only through color.
-   Respect `prefers-reduced-motion`.

For swatches, expose names to assistive technology.

Example:

``` html
<button aria-label="Select Bluish White">
```

Selected state:

``` html
aria-pressed="true"
```

------------------------------------------------------------------------

# 31. Carousel / Slider UX

For Applications and Compatible Systems:

-   Support mouse drag.
-   Support touch swipe.
-   Support keyboard where practical.
-   Snap to cards.
-   Keep active item visually obvious.
-   Show a portion of adjacent content where the design permits.
-   Do not make the entire page horizontally scrollable.
-   Ensure the carousel has an accessible label.

------------------------------------------------------------------------

# 32. Interaction Priority

The most important interactions are:

### Hero

CTA buttons.

### Stats

Count-up animation.

### Feature chip

Automatic text rotation.

### Product Series

Finish selection → image change.

### Applications

Active center card changes.

### Compatible Systems

Horizontal drag/slide.

### Why Home Shield

Subtle entrance/hover animation.

Do not add unrelated interactions.

------------------------------------------------------------------------

# 33. Exact Visual Priority

When implementation conflicts with the Figma design, prioritize in this
order:

1.  Overall layout/composition
2.  Spacing and proportions
3.  Typography hierarchy
4.  Image sizing/cropping
5.  Colors
6.  Border radius
7.  Animation
8.  Micro-interactions

Do not prioritize animations over layout accuracy.

------------------------------------------------------------------------

# 34. Do Not Over-Engineer

This is a marketing/product showcase website, not an application
dashboard.

Avoid:

-   unnecessary state management libraries
-   unnecessary animation libraries
-   unnecessary UI component libraries
-   excessive dependencies
-   complicated CMS logic at this stage

Keep the implementation modular and easy to maintain.

------------------------------------------------------------------------

# 35. Final Acceptance Checklist

Before considering the build complete:

## Home

-   [ ] Hero matches Figma.
-   [ ] Hero image has rounded corners.
-   [ ] Hero CTAs overlap the image as shown.
-   [ ] First CTA uses the outlined/stroked treatment.
-   [ ] H1 is semantic.
-   [ ] Stats animate when entering viewport.
-   [ ] Feature chip automatically cycles between UV Resistant, Noise
    Reduction and Long Service Life.
-   [ ] Product image changes when a finish is selected.
-   [ ] Product image transition is smooth.
-   [ ] Both supplied product photos are supported.
-   [ ] Applications are data-driven.
-   [ ] Center application card is larger.
-   [ ] Application cards animate when changing position.
-   [ ] Compatible Systems follows the supplied reference design.
-   [ ] Compatible Systems can be dragged/swiped.
-   [ ] Slider has a visible UX affordance.
-   [ ] Why Home Shield uses supplied icons/assets.
-   [ ] Why Home Shield animation is subtle.
-   [ ] CTA matches Figma.
-   [ ] Footer matches Figma.

## Products

-   [ ] Page has one H1.
-   [ ] Three collection sections are vertically stacked.
-   [ ] White Color Profile works.
-   [ ] Full Color Profile works.
-   [ ] Film Series Profile works.
-   [ ] Swatches update product imagery.
-   [ ] Enquire buttons exist on each finish.
-   [ ] Technical Specifications CTA exists.
-   [ ] Footer is shared with Home page.

## Technical

-   [ ] Plus Jakarta Sans loaded for headings.
-   [ ] Inter loaded for body/UI.
-   [ ] Responsive desktop/tablet/mobile layouts.
-   [ ] No horizontal overflow.
-   [ ] Images have correct alt text.
-   [ ] Hero image is optimized for LCP.
-   [ ] Below-fold images lazy load.
-   [ ] Keyboard accessibility works.
-   [ ] Reduced-motion behavior works.
-   [ ] No console errors.
-   [ ] No broken asset paths.
-   [ ] No placeholder/fake content where the source does not provide
    information.

------------------------------------------------------------------------

# Final Instruction to Codex

Treat the supplied Figma screenshots as the visual source of truth and
the supplied asset folders as the content/asset source of truth.

Build the two pages as a polished, responsive, production-ready
marketing website.

Do not redesign the supplied layout.

Implement the interactions described above while preserving the exact
visual intent of the Figma design.

The website should communicate that Home Shield primarily supplies
**uPVC profiles with multiple colour/finish options**, rather than
presenting every finish as a separate manufactured product.

Keep the code modular so additional profile finishes, application
images, compatible systems and content can be added later without
rewriting the UI.
