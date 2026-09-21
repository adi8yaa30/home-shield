/**
 * Home Shield — home page wiring.
 * Builds the Product Series selector, the Applications carousel and the
 * Compatible Systems slider from HomeShieldData.
 */
(function (global) {
  'use strict';

  var UI = global.HomeShieldUI;
  var DATA = global.HomeShieldData;
  var el = UI.el;

  /* ---------------------------- Product Series ---------------------------- */

  function initProductSeries() {
    var mount = document.querySelector('[data-product-stage]');
    var rowsMount = document.querySelector('[data-product-rows]');
    if (!mount || !rowsMount) return;

    var stage = UI.createProductStage(mount, { eager: false });
    var swatchButtons = [];
    var rows = [];

    function select(product) {
      stage.setProduct(product);
      swatchButtons.forEach(function (button) {
        var isActive = button.dataset.productId === product.id;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('is-active', isActive);
      });
      // The row is highlighted for the collection the finish belongs to —
      // set once per row, not once per swatch.
      rows.forEach(function (row) {
        row.classList.toggle('is-active', row.dataset.collectionId === product.collectionId);
      });
    }

    DATA.productCollections.forEach(function (collection) {
      var row = el('div', 'finish-row');
      row.dataset.collectionId = collection.id;
      rows.push(row);
      var label = el('h3', 'finish-row__label');
      label.textContent = collection.shortTitle;

      var list = el('div', 'finish-row__swatches', {
        role: 'group',
        'aria-label': collection.title + ' finishes'
      });

      collection.products.forEach(function (product) {
        var button = el('button', 'swatch', {
          type: 'button',
          'aria-pressed': 'false',
          'aria-label': 'Select ' + product.name + ' — ' + collection.title,
          title: product.name
        });
        button.dataset.productId = product.id;
        button.style.setProperty('--swatch-color', product.swatch);
        button.appendChild(el('span', 'swatch__chip'));
        button.appendChild(el('span', 'swatch__check'));
        button.addEventListener('click', function () { select(product); });
        swatchButtons.push(button);
        list.appendChild(button);
      });

      row.appendChild(label);
      row.appendChild(list);
      rowsMount.appendChild(row);
    });

    select(DATA.productCollections[0].products[0]);
  }

  /* ----------------------------- Applications ----------------------------- */

  function initApplications() {
    var viewport = document.querySelector('[data-applications-viewport]');
    var track = document.querySelector('[data-applications-track]');
    if (!viewport || !track) return;

    var carousel;

    DATA.applications.forEach(function (application, index) {
      var card = el('article', 'app-card');
      var inner = el('div', 'app-card__inner');
      var media = el('div', 'app-card__media');
      var img = el('img', null, {
        src: application.image,
        alt: application.title + ' fitted with Home Shield uPVC profiles',
        width: '700',
        height: '560',
        loading: index === 0 ? 'eager' : 'lazy',
        decoding: 'async'
      });
      media.appendChild(img);

      var footer = el('div', 'app-card__footer');
      var button = el('button', 'app-card__title', { type: 'button' });
      button.textContent = application.title;
      button.addEventListener('click', function () { carousel.goTo(index); });
      footer.appendChild(button);

      inner.appendChild(media);
      inner.appendChild(footer);
      card.appendChild(inner);
      track.appendChild(card);
    });

    carousel = UI.createCarousel(viewport, track, {
      startIndex: Math.floor(DATA.applications.length / 2),
      autoplay: true,
      interval: 1500
    });

    // Wait for layout before the first measurement.
    requestAnimationFrame(function () { carousel.update(false); });
    global.addEventListener('load', function () { carousel.update(false); });
  }

  /* -------------------------- Compatible Systems -------------------------- */

  function initCompatibleSystems() {
    var viewport = document.querySelector('[data-systems-viewport]');
    var track = document.querySelector('[data-systems-track]');
    var progress = document.querySelector('[data-systems-progress]');
    if (!viewport || !track) return;

    DATA.compatibleSystems.forEach(function (system) {
      var item = el('article', 'system-card');
      var media = el('div', 'system-card__media');
      media.appendChild(el('img', null, {
        src: system.image,
        alt: system.title + ' uPVC window system',
        width: '300',
        height: '300',
        loading: 'lazy',
        decoding: 'async'
      }));
      var title = el('h3', 'system-card__title');
      title.textContent = system.title;
      item.appendChild(media);
      item.appendChild(title);
      track.appendChild(item);
    });

    var carousel = UI.createCarousel(viewport, track, {
      startIndex: 1,
      autoplay: true,
      interval: 1500,
      onChange: function (index, total) {
        if (!progress) return;
        progress.style.setProperty('--progress', ((index + 1) / total) * 100 + '%');
        progress.setAttribute('aria-valuenow', String(index + 1));
        progress.setAttribute('aria-valuemax', String(total));
      }
    });

    requestAnimationFrame(function () { carousel.update(false); });
    global.addEventListener('load', function () { carousel.update(false); });
  }

  /* --------------------------------- Boot --------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    UI.initNavigation();
    UI.initReveal();
    UI.initFilms();
    UI.initConsultDialog();
    UI.initCatalogueGate();
    UI.initPendingForms();
    UI.initHeroSlides();
    UI.initCounters();
    UI.initFeatureChip(
      document.querySelector('[data-feature-chip]'),
      [
        { label: 'UV Resistant', icon: '#icon-uv' },
        { label: 'Noise Reduction', icon: '#icon-noise' },
        { label: 'Long Service Life', icon: '#icon-lifespan' }
      ],
      3500
    );
    initProductSeries();
    initApplications();
    initCompatibleSystems();
  });
})(window);
