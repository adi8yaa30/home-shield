/**
 * Home Shield — shared wiring for the static content pages.
 * About, Applications and Contact are plain markup; they only need the shared
 * behaviours, plus the interim handling for the not-yet-connected form.
 */
(function (global) {
  'use strict';

  var UI = global.HomeShieldUI;

  document.addEventListener('DOMContentLoaded', function () {
    UI.initNavigation();
    UI.initReveal();
    UI.initFilms();
    UI.initConsultDialog();
    UI.initCatalogueGate();
    UI.initCounters();
    UI.initPendingForms();
  });
})(window);
