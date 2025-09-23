# Job Application Assistant – Documentation

 A Chrome browser extension and optional standalone web app to speed up filling job application forms. It stores your profile locally and auto-fills forms on sites like LinkedIn, Indeed, and JobStreet. It also provides a skill-based experience system to answer questions such as “How many years of Java experience do you have?”.

 ---
 
 ## Overview

 - **Extension UI**: `job-application/popup.html`, `popup.css`, `popup.js`
 - **Auto-fill engine**: `job-application/content.js`
 - **Manifest**: `job-application/manifest.json` (MV3)
 - **Standalone UI (optional)**: `job-application/index.html`, `standalone.js`, `standalone.css`
 - **Icons**: `job-application/icons/`

 Data is stored locally:
 - Extension uses `chrome.storage.local`
 - Standalone uses `localStorage`

 ---
 
 ## Features

 - **Profile management**: Personal, professional, education, and additional info.
 - **Skill-based experience**: Add multiple skills/languages with years of experience. Used to auto-answer years-of-experience questions on job sites.
 - **Auto-fill**: One-click fill for common fields across supported sites and most generic forms.
 - **Site detection**: Displays the current site context (LinkedIn/Indeed/JobStreet/generic) in the popup.
 - **Copy to clipboard (standalone)**: Copy full profile or basic info for manual pasting.
 - **Local-only storage**: No external servers; your data remains on your device.

 ---
 
 ## Data Model

 Example of the stored profile object (extension: `chrome.storage.local`, key `jobApplicationProfile`; standalone: `localStorage`):

 ```json
 {
   "firstName": "Zack",
   "lastName": "Fajardo",
   "email": "example@mail.com",
   "phone": "+63 900 000 0000",
   "address": "...",
   "city": "...",
   "country": "...",
   "jobTitle": "Software Engineer",
   "company": "...",
   "experience": 5,
   "skills": "JavaScript, React, Node.js",
   "degree": "Bachelor",
   "university": "...",
   "graduationYear": 2020,
   "coverLetter": "...",
   "portfolio": "https://...",
   "salary": "...",
   "skillsExperience": [
     { "skill": "Java", "years": 3 },
     { "skill": "Frontend", "years": 4 },
     { "skill": "Mobile", "years": 2 }
   ]
 }
 ```

 The `skillsExperience` array powers “How many years of X experience” auto-fill detection.

 ---
 
 ## Installation (Extension)

 1. Open Chrome and visit `chrome://extensions/`.
 2. Enable Developer Mode.
 3. Click “Load unpacked” and select the `job-application` folder.
 4. Pin the extension from the toolbar for quick access.

 ---
 
 ## Usage (Extension)

 - Click the extension icon to open `popup.html`.
 - Go to the Edit tab and complete your profile.
 - In “Skill-based Experience”, click “+ Add Skill”, enter Skill/Language (e.g., Java, Frontend, Mobile) and Years (e.g., 3, 2.5). Save.
 - Navigate to a job application form and click “Fill Current Form”.
 - The extension will attempt to match form fields and fill them. “Years of X experience” questions are detected by scanning label/question text near inputs and matching against your `skillsExperience` entries.

 Tips for matching “years of experience” questions:
 - Use words likely to appear in questions, e.g., “Java”, “Frontend”, “Mobile”.
 - Add multiple variants if sites use different phrasing (e.g., “Front-end”, “Frontend”).

 ---
 
 ## Standalone Web App (Optional)

 - Open `job-application/index.html` directly in a browser.
 - Same profile fields; data saved in `localStorage`.
 - Use Copy buttons (full profile or basic info) for manual pasting.

 ---
 
 ## Architecture Notes

 - `popup.js`
   - Manages UI state, loads/saves profile, renders dynamic skill rows, triggers content script via `chrome.tabs.sendMessage` with `{ action: 'fillForm', data }`.
 - `content.js`
   - Receives profile data and fills forms using site-specific selectors and a generic fallback.
   - `fillExperienceQuestions()` scans labels/nearby text (`label[for]`, parent labels, aria-label, placeholder, nearby text) to match skill names and apply the years value.
   - Triggers `input`, `change`, and `blur` events after setting values.
 - `standalone.js`
   - Mirrors profile management and dynamic skill rows. Provides “copy-to-clipboard” flows.

 ---
 
 ## Privacy

 - All data is stored locally (Chrome storage or localStorage).
 - No network calls or external servers.
 - You can clear everything via the “Clear All Data” button.

 ---
 
 ## Troubleshooting

 - If fields don’t fill, ensure you’re on a job application page with standard form controls.
 - For “years of experience” questions, add matching keywords in `skillsExperience` (e.g., “Java”, “Mobile”).
 - Open the page’s DevTools Console to view debug logs from `content.js`.
 - Reload the extension from `chrome://extensions/` after making changes.

 ---
 
 ## Project Structure

 ```
 job-application/
 ├── manifest.json
 ├── popup.html
 ├── popup.css
 ├── popup.js
 ├── content.js
 ├── index.html           # Standalone (optional)
 ├── standalone.js        # Standalone (optional)
 ├── standalone.css       # Standalone (optional)
 └── icons/
 ```

 ---
 
 ## Folder Tree (job-application/)

 This is the current layout of `job-application/` on disk:

 ```
 job-application/
 ├── README.md
 ├── README_NEW.md
 ├── content.js
 ├── icons/
 │   ├── icon16.svg
 │   ├── icon32.svg
 │   ├── icon48.svg
 │   └── icon128.svg
 ├── index.html
 ├── manifest.json
 ├── popup.css
 ├── popup.html
 ├── popup.js
 ├── standalone.css
 └── standalone.js
 ```

 Note: We can remove `README_NEW.md` after confirming its content has been merged here.

 ---
 
 ## Data Management (Export / Import / Clear)

 - **Export JSON**: In Edit tab → Data Management → Export JSON. Downloads `job-profile-<timestamp>.json` with all fields including `skillsExperience`.
 - **Import JSON**: In Edit tab → Data Management → Import JSON. Select a previously exported file to load it.
 - **Clear All Data**: In Edit tab → Data Management → Clear All Data. Resets all stored fields. This is available in both extension and standalone.

 ---
 
 ## Roadmap / Next Extensions To Build

 - **Form mapping profiles per site**
   - Save per-domain overrides and custom selectors in storage for tricky sites.
 - **Resume/CV uploader**
   - Store multiple resume variants. Auto-select per application. Parse resume to prefill fields.
 - **Auto-cover letter generator**
   - Templates with placeholders (role, company). Quick copy or insert.
 - **Multi-profile support**
   - Switch between profiles (e.g., Frontend-focused vs Backend-focused) quickly.
 - **Export/Import profile**
   - JSON export and import to move data across devices.
 - **Site rules engine**
   - Small rule DSL to express “On domain X, for label containing Y, set Z with value from field A or skillsExperience[B]”.
 - **Keyboard shortcuts**
   - Trigger fill action with a shortcut while on a form.
 - **Auto-detect text questions**
   - For open-ended questions (e.g., “Describe your experience with React”), suggest snippets from your profile.
 - **Firefox support**
  - Port to Firefox (Manifest v3 compatibility via `browser.*` APIs and polyfills).

 Additional extension ideas to help a developer/user:

 - **Tab Session Saver**
   - Save/restore named tab groups and windows for work contexts (e.g., project A, research B).
 - **Snippet Inserter**
   - Store reusable code/text snippets; paste via popup or keyboard shortcut; per-site templates.
 - **Auto Time Tracker**
   - Detect active tabs/projects and log time; export timesheets.
 - **Issue/Ticket Quick Create**
   - Create GitHub/Jira issues from selected text with templates; capture URL/context.
 - **Documentation Finder**
   - Quick search across docs sites (MDN, React, Go, etc.) from omnibox/popup.
 - **Pull Request Checklist Helper**
   - Per-repo PR templates and checklists; preflight checks before opening PRs.
 - **Form Autofill Profiles (General)**
   - Multiple profiles for shipping/billing/dev accounts; quick switch.
 - **CSS Debug Overlay**
   - Toggle overlays for flex/grid boxes, spacing, and accessibility contrast.
 - **Keyboard Shortcuts Manager**
   - Global hotkeys to trigger extension actions (fill form, copy profile, toggle overlays).

 ---
 
 ## Maintenance & Cleanup

 - Keep only one README. If `README_NEW.md` exists, its content can be merged here and the file removed.
 - If you don’t need the standalone app, remove `index.html`, `standalone.js`, and `standalone.css`. Otherwise, keep them for mobile-friendly copy workflows.

 ---
 
 ## Credits

 Built by Zack (and Cascade assistant) for faster, more consistent job applications.