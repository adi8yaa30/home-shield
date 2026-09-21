/**
 * Home Shield — single source of content data.
 *
 * All UI (home + products pages) is generated from these structures, so adding
 * a finish, application or system later means editing this file only.
 */
(function (global) {
  'use strict';

  var PRODUCTS_ROOT = 'assets/products-section';

  /**
   * Product collections.
   * Each finish carries the two supplied photos; `images[0]` is the primary.
   */
  var productCollections = [
    {
      id: 'white',
      title: 'White Color Profile',
      shortTitle: 'White Color Profile',
      folder: 'white-colored-profile',
      products: [
        {
          id: 'blush-white',
          name: 'Blush White',
          swatch: '#ffffff',
          images: ['color-1.webp', 'color-1-slide-2.webp']
        },
        {
          id: 'porcelain-white',
          name: 'Porcelain White',
          swatch: '#f1f7fc',
          images: ['color-2.webp', 'color-2-slide-2.webp']
        },
        {
          id: 'pure-white',
          name: 'Pure White',
          swatch: '#f7f8f0',
          images: ['color-3.webp', 'color-3-slide-2.webp']
        },
        {
          id: 'ivory-white',
          name: 'Ivory White',
          swatch: '#fbfbe3',
          images: ['color-4.webp', 'color-4-slide-2.webp']
        }
      ]
    },
    {
      id: 'colored',
      title: 'Full Color Profile',
      shortTitle: 'Full Colored Profile',
      folder: 'colored-profile',
      products: [
        {
          id: 'tt01-bronze',
          name: 'TT01 Bronze',
          swatch: '#7a4a17',
          images: ['color-1-slide-1.webp', 'color-1-slide-2.webp']
        },
        {
          id: 'tt02-deep-brown',
          name: 'TT02 Deep Brown',
          swatch: '#3b2c1e',
          images: ['color-2-slide-1.webp', 'color-2-slide-2.webp']
        },
        {
          id: 'tt03-deep-green',
          name: 'TT03 Deep Green',
          swatch: '#17351f',
          images: ['color-3-slide-1.webp', 'color-3-slide-2.webp']
        },
        {
          id: 'tt04-french-grey',
          name: 'TT04 French Grey',
          swatch: '#b4bab0',
          images: ['color-4-slide-1.webp', 'color-4-slide-2.webp']
        },
        {
          id: 'tt05-deep-grey',
          name: 'TT05 Deep Grey',
          swatch: '#47524f',
          images: ['color-5-slide-1.webp', 'color-5-slide-2.webp']
        },
        {
          id: 'tt06-black',
          name: 'TT06 Black',
          swatch: '#2c2320',
          images: ['color-6-slide-1.webp', 'color-6-slide-2.webp']
        }
      ]
    },
    {
      id: 'film',
      title: 'Film Series Profile',
      shortTitle: 'Film Series Profile',
      folder: 'textured-profile',
      products: [
        {
          id: 'series-1',
          name: 'Series 1',
          swatch: '#4a3327',
          images: ['texture-1-slide-1.webp', 'texture-1-slide-2.webp']
        },
        {
          id: 'series-2',
          name: 'Series 2',
          swatch: '#2e2019',
          images: ['texture-2-slide-1.webp', 'texture-2-slide-2.webp']
        },
        {
          id: 'series-3',
          name: 'Series 3',
          swatch: '#6b4526',
          images: ['texture-3-slide-1.webp', 'texture-3-slide-2.webp']
        },
        {
          id: 'series-4',
          name: 'Series 4',
          swatch: '#3a2a20',
          images: ['texture-4-slide-1.webp', 'texture-4-slide-2.webp']
        }
      ]
    }
  ];

  // Expand image filenames into full paths once, so the UI never builds paths.
  productCollections.forEach(function (collection) {
    collection.products.forEach(function (product) {
      product.collectionId = collection.id;
      product.collectionTitle = collection.title;
      product.images = product.images.map(function (file) {
        return PRODUCTS_ROOT + '/' + collection.folder + '/' + file;
      });
    });
  });

  var applications = [
    { id: 'windows', title: 'Windows', image: 'assets/applications-section/windows.webp' },
    { id: 'living-room', title: 'Living Room', image: 'assets/applications-section/living-room.webp' },
    { id: 'office', title: 'Office Spaces', image: 'assets/applications-section/office.webp' },
    { id: 'sliding-doors', title: 'Sliding Doors', image: 'assets/applications-section/sliding-doors.webp' },
    { id: 'study-room', title: 'Study Room', image: 'assets/applications-section/study-room.webp' },
    { id: 'bathroom', title: 'Bathrooms & Utility', image: 'assets/applications-section/bathroom.webp' }
  ];

  var compatibleSystems = [
    { id: 'arch', title: 'Arch', image: 'assets/compatible-systems-section/arch-image.webp' },
    { id: 'casement', title: 'Casement', image: 'assets/compatible-systems-section/casement-image.webp' },
    { id: 'tilt-turn', title: 'Tilt & Turn', image: 'assets/compatible-systems-section/tilt-turn-image.webp' },
    { id: 'villa', title: 'Villa', image: 'assets/compatible-systems-section/villa-image.webp' },
    { id: 'sliding', title: 'Sliding', image: 'assets/compatible-systems-section/sliding-image.webp' },
    { id: 'combination', title: 'Combination', image: 'assets/compatible-systems-section/combination-image.webp' }
  ];

  global.HomeShieldData = {
    productCollections: productCollections,
    applications: applications,
    compatibleSystems: compatibleSystems,
    /** Flat list of every finish, in collection order. */
    allProducts: productCollections.reduce(function (acc, collection) {
      return acc.concat(collection.products);
    }, [])
  };
})(window);
