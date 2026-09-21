/**
 * Home Shield — products page wiring.
 * Renders one configurator per collection, reusing the shared product stage.
 */
(function (global) {
  'use strict';

  var UI = global.HomeShieldUI;
  var DATA = global.HomeShieldData;
  var el = UI.el;

  /**
   * Where an "Enquire" CTA should lead — the enquiry form on the contact page.
   * Every enquiry CTA reads this one value.
   */
  var ENQUIRY_HREF = 'contact.html#enquiry';

  function buildCollection(collection, index) {
    var section = el('section', 'collection', { id: collection.folder, 'data-reveal': '' });
    var panel = el('div', 'collection__panel');

    var heading = el('h2', 'collection__title');
    heading.textContent = collection.title;
    panel.appendChild(heading);

    var layout = el('div', 'collection__layout');

    var stageWrap = el('div', 'collection__stage');
    layout.appendChild(stageWrap);

    var list = el('ul', 'finish-list');
    var rows = [];
    var stage = UI.createProductStage(stageWrap, { eager: index === 0 });

    function select(product) {
      stage.setProduct(product);
      rows.forEach(function (row) {
        var isActive = row.dataset.productId === product.id;
        row.classList.toggle('is-active', isActive);
        row.querySelector('.finish-item__select').setAttribute('aria-pressed', String(isActive));
      });
    }

    collection.products.forEach(function (product) {
      var item = el('li', 'finish-item');
      item.dataset.productId = product.id;

      var select_ = el('button', 'finish-item__select', {
        type: 'button',
        'aria-pressed': 'false',
        'aria-label': 'Show ' + product.name + ' profile'
      });
      var chip = el('span', 'finish-item__swatch');
      chip.style.background = product.swatch;
      var name = el('span', 'finish-item__name');
      name.textContent = product.name;
      select_.appendChild(chip);
      select_.appendChild(name);
      select_.addEventListener('click', function () { select(product); });

      var enquire = el('a', 'btn btn--enquire', {
        href: ENQUIRY_HREF,
        'aria-label': 'Enquire about ' + product.name
      });
      enquire.appendChild(document.createTextNode('Enquire'));
      enquire.appendChild(el('span', 'btn__arrow', { 'aria-hidden': 'true' }));

      item.appendChild(select_);
      item.appendChild(enquire);
      list.appendChild(item);
      rows.push(item);
    });

    layout.appendChild(list);
    panel.appendChild(layout);
    section.appendChild(panel);

    select(collection.products[0]);
    return section;
  }

  document.addEventListener('DOMContentLoaded', function () {
    UI.initNavigation();

    var mount = document.querySelector('[data-collections]');
    if (mount) {
      DATA.productCollections.forEach(function (collection, index) {
        mount.appendChild(buildCollection(collection, index));
      });
    }

    UI.initReveal();
    UI.initFilms();
    UI.initConsultDialog();
    UI.initCatalogueGate();
    UI.initPendingForms();
  });
})(window);
