/**
 * Thinklens — Google Sheets sync
 * =============================================================================
 * Appends every careers application and candidate-tracker submission to a tab
 * in the Sheet this script is bound to.
 *
 * INSTALL
 *   1. Create a Google Sheet (or open an existing one).
 *   2. Extensions → Apps Script. Delete the placeholder, paste this file.
 *   3. Change TOKEN below to a long random string.
 *   4. Run setup() once from the editor and accept the permission prompt.
 *      This creates both tabs with their header rows.
 *   5. Deploy → New deployment → Web app
 *        Description:     Thinklens form sync
 *        Execute as:      Me
 *        Who has access:  Anyone          ← required; the site posts anonymously
 *      Copy the /exec URL it gives you.
 *   6. In src/main.js set SHEET_SYNC.endpoint to that URL and SHEET_SYNC.token
 *      to the SAME string as TOKEN, then run: node build.js
 *
 * REDEPLOYING AFTER AN EDIT
 *   Apps Script serves the last *deployed* version, not the last saved one.
 *   After changing this file: Deploy → Manage deployments → edit (pencil) →
 *   Version: New version → Deploy. The /exec URL stays the same.
 *
 * SECURITY
 *   "Who has access: Anyone" means anyone who finds the URL can POST to it —
 *   it sits in public client-side JS, so assume it will be found. TOKEN blocks
 *   drive-by bots, nothing more. The sheet is append-only and never publicly
 *   readable unless you share it. Formspree email remains the trustworthy copy.
 *
 * PRIVACY
 *   These rows hold candidate personal data — name, email, phone, LinkedIn,
 *   and (on the tracker) UAN, which is a government-linked identifier. Keep
 *   the Sheet restricted to people who need it, and set yourself a retention
 *   rule; under India's DPDP Act and GDPR this is personal data you are
 *   accountable for.
 * =============================================================================
 */

var TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

/** Column order per sheet: [Header shown in row 1, form field name].
 *  '_ts' is the server-side receive time, not a form field.
 *  Field names must match the `name="…"` attributes in the built HTML. */
var SHEETS = {
  applications: {
    tab: 'Applications',
    columns: [
      ['Received',        '_ts'],
      ['Role',            'role'],
      ['Full name',       'full_name'],
      ['Email',           'email'],
      ['Phone',           'phone'],
      ['Experience (yrs)','experience_years'],
      ['Current location','current_location'],
      ['Notice period',   'notice_period'],
      ['LinkedIn',        'linkedin'],
      ['Résumé (upload)', 'resume_file_url'],
      ['Résumé (link)',   'resume_link'],
      ['Cover note',      'cover_note'],
    ],
  },
  candidates: {
    tab: 'Candidate Tracker',
    columns: [
      ['Received',          '_ts'],
      ['Date',              'date'],
      ['Candidate name',    'candidate_name'],
      ['Technology',        'technology'],
      ['Experience (yrs)',  'experience_years'],
      ['Budget',            'budget'],
      ['Vendor company',    'vendor_company'],
      ['Submitted by',      'submitted_by'],
      ['Email',             'email'],
      ['Contact number',    'contact_number'],
      ['LinkedIn',          'linkedin'],
      ['UAN',               'uan'],
      ['Current location',  'current_location'],
      ['Preferred location','preferred_location'],
      ['Screening avail.',  'screening_availability'],
      ['Notice period',     'notice_period'],
      ['Notes',             'notes'],
    ],
  },
};

function doPost(e) {
  // A lock stops two simultaneous submissions from writing to the same row.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var p = (e && e.parameter) || {};
    if (p.token !== TOKEN) return reply('forbidden');
    if (p._gotcha) return reply('ignored');           // honeypot tripped → bot

    var cfg = SHEETS[p._sheet];
    if (!cfg) return reply('unknown sheet: ' + p._sheet);

    var sheet = ensureTab(cfg);
    var row = cfg.columns.map(function (c) {
      return c[1] === '_ts' ? new Date() : (p[c[1]] || '');
    });
    sheet.appendRow(row);
    return reply('ok');
  } catch (err) {
    return reply('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

/** Browsers and uptime checks hit the URL with GET; answer without leaking. */
function doGet() {
  return reply('Thinklens form sync — POST only.');
}

/** The only thing a web app may return. Plain text keeps it readable when you
 *  open the /exec URL in a browser to check the deployment is live. */
function reply(message) {
  return ContentService
    .createTextOutput(String(message))
    .setMimeType(ContentService.MimeType.TEXT);
}

function ensureTab(cfg) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(cfg.tab) || ss.insertSheet(cfg.tab);
  if (sheet.getLastRow() === 0) {
    var headers = cfg.columns.map(function (c) { return c[0]; });
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

/** Run once from the editor to create both tabs and trigger the auth prompt. */
function setup() {
  Object.keys(SHEETS).forEach(function (k) { ensureTab(SHEETS[k]); });
  SpreadsheetApp.getActiveSpreadsheet().toast('Tabs ready — now deploy as a web app.');
}

/** Optional: run once to get an email whenever a row is added.
 *  Apps Script cannot trigger on appendRow from a web app, so this is a
 *  time-driven digest instead — remove if Formspree email is enough. */
function installHourlyDigest() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'hourlyDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('hourlyDigest').timeBased().everyHours(1).create();
}

function hourlyDigest() {
  var since = new Date(Date.now() - 60 * 60 * 1000);
  var lines = [];
  Object.keys(SHEETS).forEach(function (k) {
    var cfg = SHEETS[k];
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.tab);
    if (!sheet || sheet.getLastRow() < 2) return;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, cfg.columns.length).getValues();
    var fresh = values.filter(function (r) { return r[0] instanceof Date && r[0] > since; });
    if (fresh.length) lines.push(fresh.length + ' new in ' + cfg.tab);
  });
  if (!lines.length) return;
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Thinklens — ' + lines.join(', '),
    body: lines.join('\n') + '\n\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  });
}
