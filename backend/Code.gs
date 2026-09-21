/**
 * Home Shield — lead capture backend.
 *
 * A Google Apps Script web app that receives form submissions from the site,
 * appends each one to a tab in a Google Sheet, and emails a notification.
 *
 * Setup lives in backend/README.md. Nothing here needs editing except the
 * CONFIG block directly below.
 */

var CONFIG = {
  // Where notifications go. Comma-separate for several recipients.
  NOTIFY_EMAIL: 'globaltradegroupghy@gmail.com',

  // Leave blank to use the sheet this script is bound to. Set it to a sheet
  // ID if you deploy the script standalone instead.
  SHEET_ID: '',

  // Only these origins may post. Requests are still accepted if the browser
  // sends no Origin header (some do not); the check is a filter, not a lock.
  ALLOWED_ORIGINS: [
    'https://thehomeshield.in',
    'https://www.thehomeshield.in'
  ],

  // Set false to stop the emails but keep writing to the sheet.
  SEND_EMAIL: true
};

/** One tab per form, so each keeps its own columns. */
var FORMS = {
  catalogue: {
    tab: 'Catalogue downloads',
    subject: 'Catalogue downloaded',
    columns: ['Received', 'Name', 'Phone', 'Email', 'Page', 'Source']
  },
  consultation: {
    tab: 'Consultation requests',
    subject: 'New consultation request',
    columns: ['Received', 'Name', 'Phone', 'Email', 'City', 'Enquiring as', 'Product', 'Details', 'Page', 'Source']
  },
  enquiry: {
    tab: 'Contact enquiries',
    subject: 'New website enquiry',
    columns: ['Received', 'Name', 'Phone', 'Email', 'Enquiring as', 'Details', 'Page', 'Source']
  }
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respond({ ok: false, error: 'empty request' });
    }

    var data = JSON.parse(e.postData.contents);
    var form = FORMS[data.form] ? data.form : 'enquiry';
    var spec = FORMS[form];

    // A bot filling every field is the usual signature; the honeypot is a
    // field no human sees, so anything in it is discarded quietly.
    if (data.company) {
      return respond({ ok: true, skipped: 'honeypot' });
    }

    if (!originAllowed(data.origin)) {
      return respond({ ok: false, error: 'origin not allowed' });
    }

    var row = buildRow(form, data);
    sheetFor(spec).appendRow(row);

    if (CONFIG.SEND_EMAIL) {
      notify(spec, form, data);
    }

    return respond({ ok: true });
  } catch (err) {
    // Never fail loudly at the browser: the visitor has already been told
    // their details went through, and the download must not depend on this.
    logFailure(err, e);
    return respond({ ok: false, error: String(err) });
  }
}

/** A browser opening the URL gets something human-readable rather than an error. */
function doGet() {
  return respond({ ok: true, service: 'Home Shield lead capture' });
}

function buildRow(form, data) {
  var when = new Date();
  var page = data.page || '';
  var source = data.source || '';

  if (form === 'catalogue') {
    return [when, data.name || '', data.phone || '', data.email || '', page, source];
  }
  if (form === 'consultation') {
    return [when, data.name || '', data.phone || '', data.email || '', data.city || '',
            data.enquiryType || '', data.product || '', data.message || '', page, source];
  }
  return [when, data.name || '', data.phone || '', data.email || '',
          data.enquiryType || '', data.message || '', page, source];
}

/** Returns the tab, creating it with a frozen header row the first time. */
function sheetFor(spec) {
  var book = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  var sheet = book.getSheetByName(spec.tab);
  if (!sheet) {
    sheet = book.insertSheet(spec.tab);
    sheet.appendRow(spec.columns);
    sheet.getRange(1, 1, 1, spec.columns.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notify(spec, form, data) {
  var lines = [
    'Name:  ' + (data.name || '—'),
    'Phone: ' + (data.phone || '—'),
    'Email: ' + (data.email || '—')
  ];

  if (data.city) lines.push('City:  ' + data.city);
  if (data.enquiryType) lines.push('They are a: ' + data.enquiryType);
  if (data.product) lines.push('Product: ' + data.product);
  if (data.message) lines.push('', 'Details:', data.message);

  lines.push('', 'Page: ' + (data.page || '—'));
  lines.push('Received: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  var who = data.name ? ' — ' + data.name : '';

  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: '[Home Shield] ' + spec.subject + who,
    body: lines.join('\n'),
    // Replying goes straight to the person who filled the form in.
    replyTo: isEmail(data.email) ? data.email : undefined,
    name: 'Home Shield website'
  });
}

function originAllowed(origin) {
  if (!origin) return true;                       // some browsers send none
  return CONFIG.ALLOWED_ORIGINS.indexOf(origin) !== -1;
}

function isEmail(value) {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Keeps a record of anything that threw, so a lost lead is traceable. */
function logFailure(err, e) {
  try {
    var book = CONFIG.SHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = book.getSheetByName('Errors') || book.insertSheet('Errors');
    sheet.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : '']);
  } catch (ignored) {
    // Nothing more can be done from here.
  }
}

/**
 * Apps Script cannot set CORS headers. The site posts as text/plain, which is
 * a "simple" request and needs no preflight, so a plain JSON reply is enough.
 */
function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
