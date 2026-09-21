# Lead capture — Google Sheets + email

Every form on the site posts to one Google Apps Script web app. It appends the
submission to a tab in a Google Sheet and emails a notification.

No server, no monthly cost, and the sheet is the client's to keep.

## Setup (about ten minutes, once)

1. **Create the sheet.** In Google Drive, new Google Sheet, name it
   `Home Shield — leads`. The tabs create themselves on the first submission.

2. **Open the script editor.** In that sheet: *Extensions → Apps Script*.
   Delete whatever is in `Code.gs` and paste the contents of this folder's
   `Code.gs`.

3. **Set who gets notified.** At the top of the script, edit `NOTIFY_EMAIL`.
   Comma-separate for several people.

4. **Deploy.** *Deploy → New deployment → Select type → Web app*, then:
   - *Description*: `Home Shield lead capture`
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**

   "Anyone" is required — visitors are not signed in to Google. It lets anyone
   POST, which is why the script has an origin check and a honeypot field.

5. **Authorise.** Google will warn that the script is unverified: *Advanced →
   Go to (project name)*. It needs permission to edit the sheet and send mail
   as you.

6. **Copy the web app URL.** It looks like
   `https://script.google.com/macros/s/AKfy.../exec`.

7. **Paste it into the site.** In `js/ui.js`, near the top:

   ```js
   var LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
   ```

   Then bump the `?v=` on `js/ui.js` in all five pages, or browsers will keep
   serving the old copy with the blank endpoint.

   Leave it blank and the forms still validate and behave — they just tell the
   visitor nothing was sent, exactly as they did before this existed.

   To point a staging copy at a different script without editing this file,
   set `window.HOME_SHIELD_ENDPOINT` before `ui.js` loads; it takes precedence.

8. **Test.** Submit each form on the live site and confirm a row lands in the
   sheet and the email arrives.

## What gets recorded

| Tab | From | Columns |
|---|---|---|
| Catalogue downloads | The download gate | Received, Name, Phone, Email, Page, Source |
| Consultation requests | Book a Consultation, and product Enquire | Received, Name, Phone, Email, City, Enquiring as, Product, Details, Page, Source |
| Contact enquiries | The contact page form | Received, Name, Phone, Email, Enquiring as, Details, Page, Source |
| Errors | Anything that threw | Received, Error, Payload |

`Product` is filled when the enquiry came from a specific finish on the
Products page, so you can see which colour someone was looking at.

Replies to a notification go to the person who submitted, not to Google.

## After changing the script

Apps Script serves the version you deployed, not the one in the editor. After
editing: *Deploy → Manage deployments → edit (pencil) → Version: New version →
Deploy*. The URL stays the same.

## Things worth knowing

- **The catalogue download never waits on this.** If the script is down or
  slow, the PDF still downloads. A lost lead is bad; a broken download in front
  of a customer is worse.
- **Quotas.** A free Gmail account sends 100 emails/day via Apps Script; Google
  Workspace, 1,500. Sheet writes are effectively unlimited at this volume.
- **Spam.** The honeypot catches simple bots. If junk starts arriving, the next
  step is a reCAPTCHA key rather than tightening the validation, which would
  only turn real people away.
- **The origin check is a filter, not a lock.** Anyone can post to the URL with
  a forged origin. It keeps casual noise out; it is not authentication.
