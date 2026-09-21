/**
 * Home Shield — shared UI behaviour.
 *
 * Everything here is used by both pages: navigation, the product image stage
 * (used by the home Product Series section and all three Products page
 * collections), the draggable carousel, and scroll-triggered helpers.
 */
(function (global) {
  'use strict';

  var reduceMotion = global.matchMedia('(prefers-reduced-motion: reduce)');

  /** Interrupted play() calls are retried this many times before giving up. */
  var MAX_PLAY_RETRIES = 4;

  function prefersReducedMotion() {
    return reduceMotion.matches;
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
    }
    return node;
  }

  /* ------------------------------------------------------------------ *
   * Header navigation
   * ------------------------------------------------------------------ */

  function initNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    global.matchMedia('(min-width: 900px)').addEventListener('change', function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * Reveal on scroll
   * ------------------------------------------------------------------ */

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in global)) {
      targets.forEach(function (node) { node.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px' });

    targets.forEach(function (node) { observer.observe(node); });
  }

  /* ------------------------------------------------------------------ *
   * Count-up statistics
   * ------------------------------------------------------------------ */

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(node, to, prefix, suffix, duration) {
    var start = null;
    function frame(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      node.textContent = prefix + Math.round(easeOutCubic(progress) * to) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /**
   * Animates every `[data-count-to]` inside `root` once it scrolls into view.
   * Non-numeric statistics (e.g. "Zero.") simply carry no `data-count-to` and
   * are left exactly as authored.
   */
  function initCounters(root) {
    var section = root || document;
    var counters = section.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    function run(node) {
      var to = parseFloat(node.getAttribute('data-count-to'));
      var prefix = node.getAttribute('data-count-prefix') || '';
      var suffix = node.getAttribute('data-count-suffix') || '';
      if (prefersReducedMotion()) {
        node.textContent = prefix + to + suffix;
        return;
      }
      countUp(node, to, prefix, suffix, 1400);
    }

    if (!('IntersectionObserver' in global)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    counters.forEach(function (node) { observer.observe(node); });
  }

  /* ------------------------------------------------------------------ *
   * Rotating feature chip
   * ------------------------------------------------------------------ */

  /**
   * `messages` is a list of { label, icon } pairs — `icon` being a sprite
   * fragment id such as '#icon-uv'. The icon swaps with the label so the two
   * never drift out of sync.
   */
  function initFeatureChip(chip, messages, interval) {
    if (!chip) return;
    var label = chip.querySelector('[data-chip-label]');
    var icon = chip.querySelector('[data-chip-icon] use');
    if (!label || messages.length < 2) return;

    var index = 0;
    var delay = interval || 3500;

    function paint() {
      label.textContent = messages[index].label;
      if (icon && messages[index].icon) {
        icon.setAttribute('href', messages[index].icon);
      }
    }

    function next() {
      index = (index + 1) % messages.length;
      if (prefersReducedMotion()) {
        paint();
        return;
      }
      chip.classList.add('is-swapping');
      global.setTimeout(function () {
        paint();
        chip.classList.remove('is-swapping');
      }, 220);
    }

    global.setInterval(next, delay);
  }

  /* ------------------------------------------------------------------ *
   * Trackpad horizontal swipe
   * ------------------------------------------------------------------ */

  /**
   * Calls `onStep(direction)` once per two-finger horizontal swipe.
   *
   * A trackpad keeps emitting wheel events after the fingers lift (momentum),
   * so a step must not be fired again for that tail. Momentum can run for
   * roughly a second, which is why a timer alone cannot end the gesture — it
   * would still be counting down when the next real swipe arrives and would
   * swallow it.
   *
   * Momentum has one reliable property instead: it only decays. So the stream
   * is watched against its own peak. Growth on its own is not enough to mean a
   * new swipe — the start of any swipe ramps up as the fingers accelerate. But
   * once the stream has decayed well below its peak the gesture is spent, and
   * deltas that grow after that are fingers back on the glass. A reversal or a
   * real pause also ends it.
   *
   * @param {HTMLElement} target
   * @param {function(): number} thresholdFor  travel needed to commit a step
   * @param {function(number)} onStep          receives +1 (left) or -1 (right)
   */
  function onSwipeHorizontal(target, thresholdFor, onStep) {
    var accumulated = 0;
    var locked = false;
    var lastMagnitude = 0;
    var lastSign = 0;
    var lastTime = 0;
    var peak = 0;

    target.addEventListener('wheel', function (event) {
      var dx = event.deltaX;
      if (Math.abs(dx) <= Math.abs(event.deltaY)) return; // vertical: let the page scroll
      event.preventDefault();

      var magnitude = Math.abs(dx);
      var sign = dx > 0 ? 1 : -1;
      var gap = event.timeStamp - lastTime;
      var spent = magnitude < peak * 0.4; // decayed well below the stream's peak

      lastTime = event.timeStamp;
      peak = Math.max(peak, magnitude);

      var freshGesture = gap > 120 ||
        sign !== lastSign ||
        (spent && magnitude > lastMagnitude + 1);

      lastMagnitude = magnitude;
      lastSign = sign;

      if (locked) {
        if (!freshGesture) return;
        locked = false;
        accumulated = 0;
        peak = magnitude;
      }

      accumulated += dx;
      if (Math.abs(accumulated) >= thresholdFor()) {
        onStep(accumulated > 0 ? 1 : -1);
        accumulated = 0;
        locked = true;
      }
    }, { passive: false });
  }

  /* ------------------------------------------------------------------ *
   * Autoplay
   * ------------------------------------------------------------------ */

  /**
   * Advances a slider on its own so nothing has to be dragged to be seen,
   * while staying out of the way the moment the viewer takes over.
   *
   * These sliders are all hand-draggable, so a timer that kept firing would
   * fight the hand on the track. Autoplay is therefore held whenever the
   * pointer is over the section, something inside it has keyboard focus, the
   * tab is in the background, or the section is scrolled off screen — an
   * unwatched slider should not be burning through its slides.
   *
   * A manual move does not switch autoplay off for good; `defer()` parks it
   * and it resumes after `resumeDelay` of quiet, from wherever the viewer
   * left it. Reduced-motion users get no rotation at all.
   *
   * @param {HTMLElement} root       section the rotation belongs to
   * @param {function()} step        advances one slide
   * @param {Object} [options]       { interval, resumeDelay }
   */
  function createAutoplay(root, step, options) {
    var opts = options || {};
    var interval = opts.interval || 5000;
    var resumeDelay = opts.resumeDelay || 3000;
    var timer = null;
    var deferTimer = null;
    var holds = 0;          // pointer over / focus within
    var visible = !document.hidden;
    var onScreen = !('IntersectionObserver' in global);
    var deferred = false;

    function shouldRun() {
      return holds === 0 && visible && onScreen && !deferred && !prefersReducedMotion();
    }

    function sync() {
      if (shouldRun()) {
        if (!timer) timer = global.setInterval(step, interval);
      } else if (timer) {
        global.clearInterval(timer);
        timer = null;
      }
    }

    function defer() {
      deferred = true;
      sync();
      global.clearTimeout(deferTimer);
      deferTimer = global.setTimeout(function () {
        deferred = false;
        sync();
      }, resumeDelay);
    }

    function hold() { holds++; sync(); }
    function release() { holds = Math.max(0, holds - 1); sync(); }

    root.addEventListener('pointerenter', hold);
    root.addEventListener('pointerleave', release);
    root.addEventListener('focusin', hold);
    root.addEventListener('focusout', release);

    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      sync();
    });

    reduceMotion.addEventListener('change', sync);

    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(root);
    }

    sync();
    return { defer: defer, sync: sync };
  }

  /* ------------------------------------------------------------------ *
   * Product image stage — shared by home + products pages
   * ------------------------------------------------------------------ */

  /**
   * Renders a single product photo stage with crossfade between finishes and
   * a small internal pager for the two supplied photos of each finish.
   *
   * @param {HTMLElement} mount  container element
   * @param {Object} options     { eager: boolean }
   */
  function createProductStage(mount, options) {
    var opts = options || {};
    var figure = el('div', 'product-stage__frame');
    var pager = el('div', 'product-stage__pager', { role: 'tablist', 'aria-label': 'Product photo' });
    var layers = [];
    var current = null;
    var slideIndex = 0;

    // Transparent 1×1 keeps both layers valid images before the first paint.
    var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    for (var i = 0; i < 2; i++) {
      var img = el('img', 'product-stage__img', {
        src: BLANK,
        alt: '',
        width: '1000',
        height: '1000',
        decoding: 'async',
        // Never lazy: the crossfade waits on the load event, and a deferred
        // load would leave the stage blank until the browser got around to it.
        fetchpriority: opts.eager ? 'high' : 'low'
      });
      figure.appendChild(img);
      layers.push(img);
    }

    mount.classList.add('product-stage');
    mount.appendChild(figure);
    mount.appendChild(pager);

    var active = 0; // index of the visible layer
    var autoplay = null;

    /** A slide the viewer asked for: parks the rotation before moving. */
    function userShowSlide(index) {
      if (autoplay) autoplay.defer();
      showSlide(index);
    }

    function paint(src, alt) {
      var incoming = layers[1 - active];
      incoming.src = src;
      incoming.alt = alt;
      var apply = function () {
        incoming.classList.add('is-visible');
        layers[active].classList.remove('is-visible');
        active = 1 - active;
      };
      if (incoming.complete) apply();
      else incoming.addEventListener('load', apply, { once: true });
    }

    function renderPager() {
      pager.innerHTML = '';
      if (!current || current.images.length < 2) return;
      current.images.forEach(function (_, index) {
        var dot = el('button', 'product-stage__dot', {
          type: 'button',
          role: 'tab',
          'aria-selected': String(index === slideIndex),
          'aria-label': 'Photo ' + (index + 1) + ' of ' + current.name
        });
        dot.classList.toggle('is-active', index === slideIndex);
        dot.addEventListener('click', function () { userShowSlide(index); });
        pager.appendChild(dot);
      });
    }

    function showSlide(index) {
      if (!current) return;
      slideIndex = (index + current.images.length) % current.images.length;
      paint(current.images[slideIndex], current.name + ' uPVC profile, photo ' + (slideIndex + 1));
      renderPager();
    }

    function setProduct(product, keepSlide) {
      if (autoplay) autoplay.defer();
      current = product;
      slideIndex = keepSlide ? Math.min(slideIndex, product.images.length - 1) : 0;
      paint(product.images[slideIndex], product.name + ' uPVC profile');
      renderPager();
      // Warm the second photo so the pager feels instant without blocking load.
      if (product.images[1]) {
        var warm = new Image();
        warm.src = product.images[1];
      }
    }

    // Swipe / drag between the two photos of the current finish. A short flick
    // counts as well as a long drag, so the gesture does not need to travel far.
    var startX = null;
    var startY = null;
    var startTime = 0;
    var horizontal = false;

    // The photos are real <img> elements; without this the browser starts its
    // own image drag and we never see pointerup.
    figure.addEventListener('dragstart', function (event) { event.preventDefault(); });

    figure.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      startTime = event.timeStamp;
      horizontal = false;
      if (figure.setPointerCapture) figure.setPointerCapture(event.pointerId);
    });

    figure.addEventListener('pointermove', function (event) {
      if (startX === null || horizontal) return;
      // Once the gesture reads as horizontal, keep it — vertical scrolling on
      // touch is still free until then.
      if (Math.abs(event.clientX - startX) > 8 &&
          Math.abs(event.clientX - startX) > Math.abs(event.clientY - startY)) {
        horizontal = true;
      }
    });

    function endPhotoSwipe(event) {
      if (startX === null) return;
      var delta = event.clientX - startX;
      var elapsed = Math.max(1, event.timeStamp - startTime);
      var velocity = Math.abs(delta) / elapsed; // px per ms
      startX = null;
      if (!horizontal) return;
      if (Math.abs(delta) > 45 || (velocity > 0.55 && Math.abs(delta) > 15)) {
        userShowSlide(slideIndex + (delta < 0 ? 1 : -1));
      }
    }

    figure.addEventListener('pointerup', endPhotoSwipe);
    figure.addEventListener('pointercancel', function () { startX = null; });

    // Trackpad: a two-finger horizontal swipe flips the photo, so a laptop user
    // does not have to press and drag.
    onSwipeHorizontal(figure, function () { return 45; }, function (direction) {
      if (!current || current.images.length < 2) return;
      userShowSlide(slideIndex + direction);
    });

    // Rotate through the photos of the current finish on their own. Picking a
    // different finish counts as an interaction, so the new photo is given a
    // moment to be looked at before the pager starts moving again.
    if (opts.autoplay !== false) {
      autoplay = createAutoplay(mount, function () {
        if (!current || current.images.length < 2) return;
        showSlide(slideIndex + 1);
      }, { interval: opts.interval || 1500 });
    }

    return { setProduct: setProduct, showSlide: userShowSlide };
  }

  /* ------------------------------------------------------------------ *
   * Draggable, snapping carousel
   * ------------------------------------------------------------------ */

  /**
   * Centers the active item of a horizontal track and supports pointer drag,
   * touch swipe and keyboard. Item widths may differ (the active card is
   * larger), so offsets are measured from the DOM rather than assumed.
   */
  function createCarousel(viewport, track, options) {
    var opts = options || {};
    var index = opts.startIndex || 0;
    var items = [];
    var autoplay = null;
    var dragging = false;
    var dragStart = 0;
    var dragOffset = 0;
    var baseOffset = 0;

    function measure() {
      items = Array.prototype.slice.call(track.children);
    }

    function offsetForIndex(i) {
      if (!items[i]) return 0;
      var item = items[i];
      return viewport.clientWidth / 2 - (item.offsetLeft + item.offsetWidth / 2);
    }

    function apply(animate) {
      track.style.transition = animate && !prefersReducedMotion()
        ? 'transform 380ms cubic-bezier(0.22, 0.7, 0.3, 1)'
        : 'none';
      track.style.transform = 'translate3d(' + (baseOffset + dragOffset) + 'px, 0, 0)';
    }

    function update(animate) {
      measure();
      index = Math.max(0, Math.min(index, items.length - 1));
      items.forEach(function (item, i) {
        item.classList.toggle('is-active', i === index);
        item.setAttribute('aria-hidden', String(Math.abs(i - index) > 1));
        var focusable = item.querySelector('button, a');
        if (focusable) focusable.tabIndex = i === index ? 0 : -1;
      });
      baseOffset = offsetForIndex(index);
      apply(animate !== false);
      if (opts.onChange) opts.onChange(index, items.length);
    }

    function goTo(i, animate) {
      index = i;
      update(animate);
    }

    /** A move the viewer asked for: parks the rotation before travelling. */
    function userGoTo(i, animate) {
      if (autoplay) autoplay.defer();
      goTo(i, animate);
    }

    /** Typical item pitch, used to turn a drag distance into a step count. */
    function itemPitch() {
      if (items.length < 2) return viewport.clientWidth || 1;
      var span = items[items.length - 1].offsetLeft - items[0].offsetLeft;
      return Math.max(1, span / (items.length - 1));
    }

    var dragStartTime = 0;
    var lastX = 0;
    var lastTime = 0;
    var velocity = 0; // px per ms, signed

    // Cards contain images; suppress the browser's native drag so the pointer
    // stream stays ours for the whole gesture.
    viewport.addEventListener('dragstart', function (event) { event.preventDefault(); });

    viewport.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      dragStart = event.clientX;
      lastX = event.clientX;
      dragStartTime = lastTime = event.timeStamp;
      velocity = 0;
      dragOffset = 0;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var dt = event.timeStamp - lastTime;
      if (dt > 0) {
        // Smoothed so one jittery sample cannot decide the flick.
        velocity = 0.7 * ((event.clientX - lastX) / dt) + 0.3 * velocity;
        lastX = event.clientX;
        lastTime = event.timeStamp;
      }
      dragOffset = event.clientX - dragStart;
      apply(false);
    });

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      var moved = dragOffset;
      dragOffset = 0;

      var pitch = itemPitch();
      // Distance decides how many cards to travel; a quick flick counts as one
      // card on its own, so a short fast gesture still lands somewhere.
      var steps = Math.round(-moved / pitch);
      var stale = event && (event.timeStamp - lastTime) > 120;
      var flick = !stale && Math.abs(velocity) > 0.55 && Math.abs(moved) > 12;

      if (flick) {
        // A flick is a "next card" gesture, never a jump — however fast it was.
        steps = velocity < 0 ? 1 : -1;
      } else if (steps === 0 && Math.abs(moved) > pitch * 0.3) {
        steps = moved < 0 ? 1 : -1;
      }

      // A deliberate long drag may cross two cards; past that the motion reads
      // as a blur rather than a slide.
      steps = Math.max(-2, Math.min(2, steps));

      if (steps !== 0) userGoTo(index + steps);
      else { if (autoplay) autoplay.defer(); update(true); }
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);

    // Trackpad: a two-finger horizontal swipe moves one card.
    onSwipeHorizontal(
      viewport,
      function () { return Math.min(70, itemPitch() * 0.22); },
      function (direction) { userGoTo(index + direction); }
    );

    viewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); userGoTo(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); userGoTo(index - 1); }
    });

    var resizeTimer;
    global.addEventListener('resize', function () {
      global.clearTimeout(resizeTimer);
      resizeTimer = global.setTimeout(function () { update(false); }, 120);
    });

    // Cycle the cards unattended. Unlike a keyboard or drag step this wraps —
    // an unattended slider that stopped on the last card would just look stuck.
    if (opts.autoplay) {
      autoplay = createAutoplay(viewport, function () {
        measure();
        if (items.length < 2) return;
        goTo(index + 1 >= items.length ? 0 : index + 1);
      }, { interval: opts.interval });
    }

    return {
      goTo: userGoTo,
      update: update,
      get index() { return index; }
    };
  }

  /* ------------------------------------------------------------------ *
   * Films
   * ------------------------------------------------------------------ */

  /**
   * Background films (hero, factory, process animation).
   *
   * The <source> elements ship with `data-src` rather than `src`, so nothing
   * downloads until this runs. That buys two things a plain autoplaying
   * <video> cannot: a phone is handed the 960px cut instead of the 1080p one,
   * and a visitor who asked for reduced motion is given the poster and a play
   * button instead of several megabytes of motion they did not want.
   *
   * All three files are encoded without an audio track, so there is nothing to
   * unmute; `muted` is still set because iOS and Chrome require it to autoplay.
   */
  /** Run after the page has finished loading, and only when the main thread is free. */
  function whenIdle(fn) {
    function go() {
      if (global.requestIdleCallback) global.requestIdleCallback(fn, { timeout: 1500 });
      else global.setTimeout(fn, 200);
    }
    if (document.readyState === 'complete') go();
    else global.addEventListener('load', go, { once: true });
  }

  /**
   * Point a film's <source> elements at the cut that suits this viewport.
   * Returns false when there is nothing to load, so callers can bail out.
   */
  function selectFilmSources(film) {
    var sources = film.querySelectorAll('source[data-src]');
    if (!sources.length) return false;

    var small = global.matchMedia('(max-width: 900px)').matches;

    Array.prototype.forEach.call(sources, function (source) {
      var mobile = source.getAttribute('data-src-mobile');
      source.setAttribute('src', small && mobile ? mobile : source.getAttribute('data-src'));
    });

    return true;
  }

  /**
   * Start a film, allowing for the two ways a browser can refuse.
   *
   * A silent video in a background tab is paused to save power — that is not a
   * refusal, so wait for the tab to come forward and try again rather than
   * stranding the visitor on a poster. Anything else (Low Power Mode, a
   * data-saver setting) is a real refusal: give them a control instead.
   */
  function attemptPlay(film, attempt) {
    var played = film.play();
    if (!played || !played.catch) return;

    played.catch(function (err) {
      // A silent video in a background tab is paused to save power. That is not
      // a refusal, so wait for the tab to come forward rather than giving up.
      if (document.hidden) {
        document.addEventListener('visibilitychange', function retry() {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', retry);
          attemptPlay(film);
        });
        return;
      }

      // Only a policy refusal earns a play button: Low Power Mode, data-saver,
      // a per-site autoplay block. Anything else — an AbortError because the
      // request was interrupted or the element stalled while buffering — is
      // transient, and showing controls for it strands the film behind a play
      // button it never needed.
      if (err && err.name === 'NotAllowedError') {
        film.setAttribute('controls', '');
        return;
      }

      var next = (attempt || 0) + 1;
      if (next > MAX_PLAY_RETRIES) {
        film.setAttribute('controls', '');
        return;
      }

      global.setTimeout(function () {
        if (film.paused) attemptPlay(film, next);
      }, 250 * next);
    });
  }

  function initFilms() {
    var films = document.querySelectorAll('[data-film]');
    if (!films.length) return;

    var reduced = prefersReducedMotion();

    Array.prototype.forEach.call(films, function (film) {
      if (!selectFilmSources(film)) return;

      if (reduced) {
        // Poster only. The file is still reachable on demand via the controls.
        film.removeAttribute('loop');
        film.setAttribute('preload', 'none');
        film.setAttribute('controls', '');
        film.load();
        return;
      }

      film.setAttribute('preload', 'metadata');
      // The attribute (not just the play() call below) is what lets the browser
      // resume the film on its own after it pauses a silent video offscreen or
      // in a background tab.
      film.setAttribute('autoplay', '');
      film.load();

      // If autoplay was allowed but the browser paused the film for being out
      // of view, playback should pick up again when it scrolls back — and a
      // film that starts late no longer needs the controls it was given.
      film.addEventListener('playing', function () { film.removeAttribute('controls'); });

      if ('IntersectionObserver' in global) {
        // The observer is the only thing that starts these. A film below the
        // fold then costs nothing until it is scrolled to, which keeps its
        // bytes out of the way of the page's own load.
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            // Only metadata was fetched up to now, so ask for the rest before
            // asking it to play — otherwise the first request stalls on an
            // empty buffer and has to be retried.
            film.setAttribute('preload', 'auto');
            attemptPlay(film);
          } else {
            film.pause();
          }
        }, { threshold: 0.25 }).observe(film);
      } else {
        attemptPlay(film);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Hero slideshow
   * ------------------------------------------------------------------ */

  /**
   * Two slides behind the hero copy: the still first, then the film.
   *
   * The still is marked active in the markup so it is what paints on first
   * frame — the film is never the thing a visitor waits for. The film then
   * plays once per cycle rather than looping, because its own fade-out is what
   * hands the hero back to the still.
   *
   * Either slide can also be reached by swiping the card — touch and pen by
   * pointer, trackpad through the same two-finger helper the product carousel
   * uses. The vertical axis is left to the page throughout.
   *
   * Under reduced motion the hero holds on the still and the film is not
   * fetched, so those visitors download none of it unless they swipe to it.
   */
  function initHeroSlides() {
    var root = document.querySelector('[data-hero-slides]');
    if (!root) return;

    var slides = root.querySelectorAll('[data-hero-slide]');
    var film = root.querySelector('video[data-hero-slide]');
    if (slides.length < 2 || !film) return;

    var card = root.closest('.hero__card') || root;

    var STILL_HOLD = 6000;   // long enough to read the headline over it
    var FADE = 900;          // matches the .hero__slide transition

    var MAX_REFUSALS = 3;
    var MAX_RETRIES = 2;   // for interrupted play() calls, not refused ones

    var index = 0;
    var timer = null;
    var fadeTimer = null;
    var refusals = 0;
    var retries = 0;
    var stopped = false;
    var visible = !document.hidden;
    var onScreen = true;

    /* Dots are built here rather than written into the markup: without this
       script there is no slideshow, and a control that cannot do anything is
       worse than no control. They double as the affordance that tells people
       the hero can be swiped at all. */
    var dots = [];
    var dotList = el('div', 'hero__dots');
    dotList.setAttribute('role', 'tablist');
    dotList.setAttribute('aria-label', 'Hero slides');

    Array.prototype.forEach.call(slides, function (slide, n) {
      var dot = el('button', 'hero__dot', {
        type: 'button',
        role: 'tab',
        'aria-label': slide.getAttribute('data-hero-label') || ('Slide ' + (n + 1))
      });
      dot.addEventListener('click', function () { goTo(n, true); });
      dotList.appendChild(dot);
      dots.push(dot);
    });

    card.appendChild(dotList);

    function show(i) {
      index = i;
      Array.prototype.forEach.call(slides, function (slide, n) {
        slide.classList.toggle('is-active', n === i);
      });
      dots.forEach(function (dot, n) {
        dot.classList.toggle('is-active', n === i);
        dot.setAttribute('aria-selected', String(n === i));
      });

      // The film carries its own captions, so the hero's copy steps aside for
      // it. Hidden visually rather than removed: the h1 stays in the document
      // for search engines and screen readers either way.
      card.classList.toggle('is-film', i === 1);
    }

    /**
     * Move to a slide. A deliberate swipe counts as a user gesture, which is
     * exactly what an autoplay policy wants to see — so a film that was
     * refused earlier is given another chance rather than staying shut out.
     */
    function goTo(target, viaUser) {
      global.clearTimeout(timer);

      if (viaUser && target === 1) {
        stopped = false;
        refusals = 0;

        // Under reduced motion the film is never fetched up front — but a
        // deliberate swipe is the visitor asking for it, so honour that and
        // load it now. The rotation itself stays off.
        if (!film.currentSrc && selectFilmSources(film)) {
          film.setAttribute('preload', 'auto');
          film.load();
        } else if (film.getAttribute('preload') !== 'auto') {
          // Swiped before the idle prime got to it: stop holding the file back.
          film.setAttribute('preload', 'auto');
        }
      }

      if (target === 1) toFilm(viaUser);
      else toStill();
    }

    /** Swipes only ever toggle: two slides, so either direction wraps. */
    function step(direction) {
      goTo((index + direction + slides.length) % slides.length, true);
    }

    function toStill() {
      show(0);
      // Let the crossfade finish on moving video before freezing it.
      global.clearTimeout(fadeTimer);
      fadeTimer = global.setTimeout(function () {
        film.pause();
        film.currentTime = 0;
      }, FADE);
      schedule();
    }

    /**
     * Cross to the film.
     *
     * The two callers want different things from a refused play(). The timer
     * is unattended, so it waits for playback to actually start — showing the
     * slide first would park a frozen frame on the hero for as long as the
     * promise took to reject. A swipe is someone asking for this slide now, so
     * it lands immediately and the film catches up if it can; a browser that
     * refuses leaves them on the poster, which is still a frame of the film,
     * rather than on a hero that ignored the gesture.
     */
    function toFilm(viaUser) {
      // toStill() leaves a timer pending that pauses the film once its
      // crossfade is done. Crossing back inside that window — swipe away, then
      // straight back — used to let that stale timer fire on top of the film
      // that had just started, freezing it on frame zero.
      global.clearTimeout(fadeTimer);

      // No rewind here on purpose. Seeking immediately before play() stalls the
      // element and the request is aborted — measured: seek-then-play leaves it
      // paused on frame zero, play-without-seek runs. The rewind happens on the
      // way out instead (toStill, once the film is hidden), so the film is
      // already at zero by the time it comes back. Cross back mid-fade and it
      // simply carries on, which is what that gesture should feel like.

      if (viaUser) show(1);

      var played = film.play();
      if (!played || !played.then) { show(1); return; }   // pre-promise browsers

      played.then(function () {
        refusals = 0;
        retries = 0;
        show(1);
      }).catch(function (err) {
        if (document.hidden) return;   // resume() will try again

        // Two very different failures arrive here. NotAllowedError is the
        // browser refusing on policy — Low Power Mode, data-saver, a per-site
        // autoplay block. Anything else (AbortError, typically) means the
        // request was interrupted mid-flight, which is a retry, not a refusal:
        // counting it would have us give up over our own transitions.
        if (!err || err.name !== 'NotAllowedError') {
          if (index === 1 && retries < MAX_RETRIES) {
            retries++;
            global.setTimeout(function () {
              if (index === 1 && film.paused) attemptPlay(film);
            }, 150);
          }
          return;
        }

        refusals++;
        if (refusals >= MAX_REFUSALS) stopped = true;

        // A swipe already moved the hero here, so hand it back after the usual
        // dwell instead of leaving it parked on a film that will not play.
        if (viaUser && index === 1) {
          global.clearTimeout(timer);
          timer = global.setTimeout(toStill, STILL_HOLD);
          return;
        }

        schedule();
      });
    }

    function schedule() {
      global.clearTimeout(timer);
      if (stopped || !visible || !onScreen || prefersReducedMotion()) return;
      timer = global.setTimeout(toFilm, STILL_HOLD);
    }

    function pause() {
      global.clearTimeout(timer);
      timer = null;
      if (index === 1) film.pause();
    }

    function resume() {
      if (stopped || !visible || !onScreen) return;
      if (index === 1) attemptPlay(film);   // already crossed; just restart it
      else schedule();
    }

    /* --- Swipe ------------------------------------------------------- *
     * Touch and pen drag directly; the trackpad's two-finger swipe comes from
     * the same helper the product carousel uses, so both read the same.
     * `touch-action: pan-y` in the stylesheet keeps vertical scrolling with
     * the page while the horizontal axis stays ours. */

    // The hero copy sits above the slides rather than inside them, so the whole
    // card is the gesture surface — otherwise a swipe over the headline, which
    // is most of the card, would never reach the slides.
    var surface = card;

    var dragging = false;
    var startX = 0;
    var startY = 0;
    var moved = 0;
    var axisLocked = false;

    function swipeThreshold() {
      return Math.min(80, surface.getBoundingClientRect().width * 0.12);
    }

    surface.addEventListener('dragstart', function (event) { event.preventDefault(); });

    surface.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      axisLocked = false;
      moved = 0;
      startX = event.clientX;
      startY = event.clientY;
      surface.classList.add('is-swiping');
      surface.setPointerCapture(event.pointerId);
    });

    surface.addEventListener('pointermove', function (event) {
      if (!dragging || axisLocked) return;

      var dx = event.clientX - startX;
      var dy = event.clientY - startY;

      // A mostly vertical gesture belongs to the page, not to us.
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        axisLocked = true;
        endDrag();
        return;
      }

      moved = dx;
    });

    /**
     * The swipe is decided here rather than mid-drag, and that matters for
     * more than tidiness: pointerup is an activation-triggering event and
     * pointermove is not. A browser that gates autoplay (Safari, or Chrome
     * where the site's autoplay is blocked) refuses a play() call that comes
     * from a pointermove, which left the film sitting on its poster. Called
     * from pointerup it counts as a user gesture and starts. It also matches
     * the product carousel, which settles its drag on release too.
     */
    surface.addEventListener('pointerup', function () {
      if (!dragging) return;
      var distance = moved;
      endDrag();
      if (Math.abs(distance) >= swipeThreshold()) step(distance < 0 ? 1 : -1);
    });

    function endDrag() {
      dragging = false;
      moved = 0;
      surface.classList.remove('is-swiping');
    }
    surface.addEventListener('pointercancel', endDrag);
    surface.addEventListener('lostpointercapture', endDrag);

    onSwipeHorizontal(surface, swipeThreshold, function (direction) { step(direction); });

    film.addEventListener('ended', toStill);
    // A decode failure should not strand the hero on a black frame.
    film.addEventListener('error', function () { stopped = true; toStill(); });

    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      if (visible) resume(); else pause();
    });

    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) resume(); else pause();
      }, { threshold: 0.2 }).observe(root);
    }

    reduceMotion.addEventListener('change', function () {
      if (prefersReducedMotion()) { pause(); toStill(); }
      else if (selectFilmSources(film)) { film.load(); schedule(); }
    });

    show(0);   // sync the dots with the slide the markup starts on

    if (prefersReducedMotion()) return;   // still only; no film bytes fetched
    if (!selectFilmSources(film)) return;

    // Buffered ahead of the swap rather than on demand, so the film is moving
    // the moment it appears instead of showing its poster while it loads.
    // Once there are real frames to paint, the poster has done its job. Drop it
    // so that any paused moment shows the film's own opening frame rather than
    // a still from six seconds in — the mismatch is what reads as "a thumbnail
    // is stuck here" when a browser refuses to start playback.
    film.addEventListener('loadeddata', function () { film.removeAttribute('poster'); });

    // Buffered ahead of the swap so the film is moving the moment it appears —
    // but only after the page has loaded, so a couple of megabytes of video
    // never compete with the still that is the hero's LCP element. The first
    // swap is six seconds out, which is ample time to be ready.
    whenIdle(function () {
      film.setAttribute('preload', 'auto');
      film.load();
    });

    schedule();
  }

  /* ------------------------------------------------------------------ *
   * Form validation
   * ------------------------------------------------------------------ */

  // Deliberately permissive: one @, a dot in the domain, no spaces. Anything
  // stricter starts rejecting addresses that are perfectly deliverable.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /**
   * Phone check sized for the audience. An Indian mobile is ten digits
   * starting 6-9, with or without a +91 or 0 in front. Anything written with
   * a leading + is treated as international and only checked for a sane
   * length, so an overseas architect is not turned away.
   */
  function validPhone(value) {
    var digits = value.replace(/[^\d+]/g, '');

    if (digits.charAt(0) === '+') {
      var international = digits.slice(1);
      if (international.indexOf('91') === 0 && international.length === 12) {
        return /^[6-9]\d{9}$/.test(international.slice(2));
      }
      return /^\d{8,15}$/.test(international);
    }

    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    else if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);

    return /^[6-9]\d{9}$/.test(digits);
  }

  /** The message for one field, or '' when it is fine. */
  function fieldError(input) {
    var value = input.value.trim();
    var kind = input.getAttribute('data-validate');

    if (!value) {
      if (!input.hasAttribute('required')) return '';
      if (kind === 'name') return 'Please enter your full name.';
      if (kind === 'email') return 'Please enter your email address.';
      if (kind === 'tel') return 'Please enter your phone number.';
      return 'This field is required.';
    }

    // A filled optional field still has to make sense.
    if (kind === 'name' && value.length < 2) return 'Please enter your full name.';
    if (kind === 'email' && !EMAIL_RE.test(value)) return 'Please enter a valid email address, like name@example.com.';
    if (kind === 'tel' && !validPhone(value)) return 'Please enter a valid phone number, like 98765 43210.';

    return '';
  }

  function showError(input, message) {
    var box = document.getElementById(input.getAttribute('aria-describedby'));
    if (box) box.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /**
   * Validate every field in a form, mark them up, and return the first one
   * that failed so the caller can move focus there.
   */
  function validateForm(form) {
    var fields = form.querySelectorAll('[data-validate]');
    var firstBad = null;

    Array.prototype.forEach.call(fields, function (input) {
      var message = fieldError(input);
      showError(input, message);
      if (message && !firstBad) firstBad = input;
    });

    return firstBad;
  }

  /**
   * Once someone has tried to submit, re-check each field as they fix it —
   * so an error clears the moment it is corrected, rather than lingering
   * until the next submit.
   */
  function watchFields(form) {
    var fields = form.querySelectorAll('[data-validate]');

    Array.prototype.forEach.call(fields, function (input) {
      input.addEventListener('blur', function () {
        if (form.hasAttribute('data-submitted')) showError(input, fieldError(input));
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') showError(input, fieldError(input));
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Forms with no endpoint yet
   * ------------------------------------------------------------------ */

  /**
   * Neither form is wired to an inbox. Rather than let a submit reload the
   * page and silently lose what was typed, hold the submit and say so.
   * Delete this once `action` points at a real handler.
   */
  function initPendingForms() {
    var forms = document.querySelectorAll('[data-pending-form]');

    Array.prototype.forEach.call(forms, function (form) {
      var notice = form.querySelector('[data-form-notice]');
      watchFields(form);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        form.setAttribute('data-submitted', '');

        var firstBad = validateForm(form);
        if (firstBad) {
          if (notice) {
            notice.textContent = 'Please check the highlighted fields.';
            notice.classList.add('is-error');
          }
          firstBad.focus();
          return;
        }

        if (!notice) return;
        notice.classList.remove('is-error');
        notice.textContent = 'Thanks — this form is not connected to an inbox yet, ' +
          'so nothing has been sent. Please call us in the meantime.';
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Dialogs
   * ------------------------------------------------------------------ */

  /**
   * Shared open/close wiring for a <dialog>: backdrop click, the close
   * button, and returning focus to whatever opened it. The browser handles
   * Esc and the focus trap on its own.
   */
  function setupDialog(dialog) {
    var lastFocused = null;

    var closer = dialog.querySelector('[data-modal-close]');
    if (closer) closer.addEventListener('click', function () { dialog.close(); });

    // The panel swallows its own clicks, so only presses that land on the
    // backdrop itself reach this.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    });

    return {
      open: function () {
        lastFocused = document.activeElement;
        dialog.showModal();
        var first = dialog.querySelector('input, select, textarea');
        if (first) first.focus();
      }
    };
  }

  /**
   * "Book a Consultation" opens the form in place rather than sending people
   * to another page. The links keep their href, so a browser without
   * <dialog> (or without JS) still lands on the contact form instead of a
   * button that does nothing.
   */
  function initConsultDialog() {
    var dialog = document.getElementById('consult-dialog');
    var openers = document.querySelectorAll('[data-consult-open]');
    if (!dialog || !openers.length || typeof dialog.showModal !== 'function') return;

    var modal = setupDialog(dialog);

    Array.prototype.forEach.call(openers, function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        modal.open();
      });
    });
  }

  /**
   * The catalogue download asks who is downloading before it hands the file
   * over. The links keep their href and download attributes, so without this
   * script — or without <dialog> — the PDF is still one click away; the gate
   * is an enhancement, never the only route to the file.
   */
  function initCatalogueGate() {
    var dialog = document.getElementById('catalogue-dialog');
    var buttons = document.querySelectorAll('[data-catalogue-open]');
    if (!dialog || !buttons.length) return;

    var form = dialog.querySelector('[data-catalogue-form]');
    if (!form) return;

    var modal = setupDialog(dialog);
    var notice = dialog.querySelector('[data-form-notice]');

    watchFields(form);

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener('click', function () {
        if (notice) {
          notice.textContent = '';
          notice.classList.remove('is-error');
        }

        // No <dialog> support: fall back to handing over the file rather than
        // leaving a button that does nothing.
        if (typeof dialog.showModal !== 'function') {
          startDownload();
          return;
        }

        modal.open();
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      form.setAttribute('data-submitted', '');

      var firstBad = validateForm(form);
      if (firstBad) {
        if (notice) {
          notice.textContent = 'Please check the highlighted fields.';
          notice.classList.add('is-error');
        }
        firstBad.focus();
        return;
      }

      // TODO: post these details to the enquiry endpoint once there is one.
      // The download is deliberately not gated on that request succeeding —
      // someone who filled the form in should get the file either way.
      startDownload();

      if (notice) {
        notice.classList.remove('is-error');
        notice.textContent = 'Thanks — your download is starting.';
      }
    });
  }

  /**
   * Hand over the catalogue. The path lives here rather than in an href so the
   * gate cannot be skipped by right-clicking the button and saving the link.
   *
   * This is a deterrent, not protection: the file sits at a fixed URL on a
   * static host, and anyone who opens this script can read the path. Requiring
   * the form for real means serving the file from an endpoint that checks.
   */
  var CATALOGUE = {
    url: 'assets/home-shield-catalogue.pdf',
    filename: 'Home-Shield-uPVC-Catalogue.pdf'
  };

  /** Called straight out of a click or submit, so it counts as a user gesture. */
  function startDownload() {
    var a = document.createElement('a');
    a.href = CATALOGUE.url;
    a.setAttribute('download', CATALOGUE.filename);
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  global.HomeShieldUI = {
    el: el,
    prefersReducedMotion: prefersReducedMotion,
    initNavigation: initNavigation,
    initReveal: initReveal,
    initCounters: initCounters,
    initFeatureChip: initFeatureChip,
    initFilms: initFilms,
    initPendingForms: initPendingForms,
    initConsultDialog: initConsultDialog,
    initCatalogueGate: initCatalogueGate,
    initHeroSlides: initHeroSlides,
    createAutoplay: createAutoplay,
    createProductStage: createProductStage,
    createCarousel: createCarousel
  };
})(window);
