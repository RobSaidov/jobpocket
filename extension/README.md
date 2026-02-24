# JobPocket Chrome Extension

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `/extension` folder

## Files

```
extension/
  manifest.json           MV3 manifest
  popup/
    popup.html            Extension popup UI
    popup.js              Popup logic (vanilla JS)
  content/
    content.js            Injected into LinkedIn job pages
  background/
    background.js         Service worker — handles ADD_TO_JOBPOCKET
```

## How it works

1. Open any LinkedIn job page (`linkedin.com/jobs/...`)
2. Click the JobPocket icon
3. The popup reads job title + company from the page DOM
4. Blocker keywords are scanned instantly (no API call)
5. Select tier (Hot/Warm/Cold), enter contact name/title
6. Click **Generate Outreach** → calls deployed Vercel API
7. Click **+ Add to JobPocket** → opens dashboard with pre-filled data

## Notes

- No build step required — pure vanilla JS
- AI calls go to the deployed Vercel app
- Resume stored in `chrome.storage.local` under `jobpocket_resume`
  (auto-synced from web app's localStorage on next popup open if you add that bridge)
