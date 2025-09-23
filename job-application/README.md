# Job Application Assistant

A browser extension that automatically fills job application forms with your saved personal and professional information. Compatible with LinkedIn, Indeed, JobStreet, and many other job application websites.

## Features

- **Personal Data Management**: Store all your personal information in one place
- **Automatic Form Filling**: Click a button to auto-fill job application forms
- **Multi-Site Support**: Works with LinkedIn, Indeed, JobStreet, and generic job sites
- **Local Storage**: Your data is stored locally and securely in your browser
- **Easy to Use**: Simple popup interface for managing your profile

## Installation

### For Chrome/Chromium Browsers

1. **Enable Developer Mode**:
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

2. **Load the Extension**:
   - Click "Load unpacked" button
   - Select the `job-application` folder from your browser-extension directory
   - The extension should now appear in your extensions list

3. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in your toolbar
   - Find "Job Application Assistant" and click the pin icon

## How to Use

### 1. Set Up Your Profile

1. Click the Job Application Assistant icon in your browser toolbar
2. Fill in all your personal information:
   - Personal details (name, email, phone, address)
   - Professional information (job title, company, experience, skills)
   - Education background
   - Additional information (cover letter template, portfolio, salary expectations)
3. Click "Save Profile" to store your information

### 2. Fill Job Applications

1. Navigate to any job application page (LinkedIn, Indeed, JobStreet, etc.)
2. Fill out the application form as usual
3. Click the Job Application Assistant icon
4. Click the "Fill Current Form" button
5. The extension will automatically populate all matching fields

### 3. Update Your Information

- Click the extension icon anytime to update your saved information
- Changes are saved automatically when you click "Save Profile"
- Use "Clear All Data" to reset everything (with confirmation)

## Supported Fields

The extension can fill these types of fields:

- **Personal Information**: First name, last name, email, phone, address
- **Location**: City, country
- **Professional**: Job title, current company, years of experience, skills
- **Education**: Degree level, university/school, graduation year
- **Additional**: Cover letter text areas, portfolio URLs, salary expectations

## Supported Websites

- **LinkedIn** (`linkedin.com`)
- **Indeed** (`indeed.com`)
- **JobStreet** (`jobstreet.com`)
- **Generic Sites**: Works with most job application forms using standard field names

## Privacy & Security

- All your data is stored locally in your browser's storage
- No data is sent to external servers
- Your information never leaves your device
- The extension only has access to the websites you explicitly grant permissions to

## Troubleshooting

### Extension Not Working?
1. Make sure you're on a supported job application website
2. Check that the form fields have standard names/IDs
3. Try refreshing the page and clicking "Fill Current Form" again

### Form Not Filling Completely?
- Some job sites use custom field names that may not match our selectors
- You may need to fill some fields manually
- Consider suggesting improvements to the field mappings

### Can't Save Profile?
- Check that all required fields (marked with *) are filled
- Make sure you have write permissions for browser storage

## Development

To modify or extend the extension:

1. Edit the files in the `job-application` directory
2. Go to `chrome://extensions/`
3. Click the refresh button on the Job Application Assistant extension
4. Test your changes

### File Structure

```
job-application/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # Popup functionality
├── popup.css             # Styling
├── content.js            # Form filling logic
└── icons/                # Extension icons
    ├── icon16.svg
    ├── icon32.svg
    ├── icon48.svg
    └── icon128.svg
```

## Contributing

Feel free to suggest improvements or report issues. You can:

1. Modify the field selectors in `content.js` for better website compatibility
2. Add support for new job websites
3. Improve the user interface
4. Add new features

## License

This project is open source and available under the MIT License.

---

**Note**: This extension is designed to save you time when applying to jobs. Always review the filled information before submitting applications to ensure accuracy.
