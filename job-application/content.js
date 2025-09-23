// Job Application Assistant - Content Script

class FormFiller {
    constructor() {
        this.profileData = {};
        this.init();
    }

    init() {
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'fillForm') {
                this.profileData = request.data;
                this.fillForm();
                sendResponse({ success: true });
            }
        });
    }

    fillForm() {
        const currentUrl = window.location.href;
        this.showNotification('Filling form with your saved data...');

        try {
            if (currentUrl.includes('linkedin.com')) {
                this.fillLinkedInForm();
            } else if (currentUrl.includes('indeed.com')) {
                this.fillIndeedForm();
            } else if (currentUrl.includes('jobstreet.com')) {
                this.fillJobStreetForm();
            } else {
                this.fillGenericForm();
            }
        } catch (error) {
            console.error('Error filling form:', error);
            this.showNotification('Error filling form. Please fill manually.', 'error');
        }
    }

    fillLinkedInForm() {
        // LinkedIn specific field selectors - enhanced
        const fieldMappings = {
            firstName: 'input[name*="firstName"], input[placeholder*="first" i], input[id*="first"], input[autocomplete*="given-name"]',
            lastName: 'input[name*="lastName"], input[placeholder*="last" i], input[id*="last"], input[autocomplete*="family-name"]',
            email: 'input[type="email"], input[name*="email" i], input[autocomplete*="email"]',
            phone: 'input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i], input[autocomplete*="tel"]',
            address: 'input[name*="address" i], input[placeholder*="address" i], input[autocomplete*="address-line1"]',
            city: 'input[name*="city" i], input[placeholder*="city" i], input[autocomplete*="address-level2"]',
            country: 'select[name*="country" i], input[name*="country" i], input[autocomplete*="country"]',
            jobTitle: 'input[name*="title" i], input[placeholder*="title" i], input[name*="position" i], input[autocomplete*="organization-title"]',
            company: 'input[name*="company" i], input[placeholder*="company" i], input[autocomplete*="organization"]',
            experience: 'input[name*="experience" i], select[name*="experience" i], input[name*="years" i]',
            skills: 'input[name*="skill" i], textarea[name*="skill" i], input[name*="keywords" i]',
            degree: 'select[name*="degree" i], input[name*="degree" i], select[name*="education" i]',
            university: 'input[name*="school" i], input[name*="university" i], input[name*="institution" i], input[autocomplete*="organization"]',
            coverLetter: 'textarea[name*="cover" i], textarea[name*="letter" i], textarea[name*="message" i]',
            portfolio: 'input[name*="portfolio" i], input[name*="linkedin" i], input[name*="website" i], input[type="url"]',
            salary: 'input[name*="salary" i], input[name*="compensation" i], input[name*="pay" i]'
        };

        const baseFilled = this.fillFieldsWithMapping(fieldMappings);
        const expFilled = this.fillExperienceQuestions();
        this.showNotification(`LinkedIn form filled - ${baseFilled + expFilled} fields updated!`);
    }

    fillIndeedForm() {
        // Indeed specific field selectors - enhanced
        const fieldMappings = {
            firstName: 'input[name*="first" i], input[placeholder*="first" i], input[data-testid*="first"]',
            lastName: 'input[name*="last" i], input[placeholder*="last" i], input[data-testid*="last"]',
            email: 'input[type="email"], input[name*="email" i], input[data-testid*="email"]',
            phone: 'input[type="tel"], input[name*="phone" i], input[data-testid*="phone"]',
            address: 'input[name*="address" i], textarea[name*="address" i]',
            city: 'input[name*="city" i], input[placeholder*="city" i]',
            country: 'select[name*="country" i], input[name*="country" i]',
            jobTitle: 'input[name*="title" i], input[name*="position" i], input[placeholder*="title" i]',
            company: 'input[name*="company" i], input[placeholder*="company" i]',
            experience: 'select[name*="experience" i], input[name*="experience" i], input[name*="years" i]',
            skills: 'textarea[name*="skill" i], input[name*="skill" i]',
            degree: 'select[name*="degree" i], input[name*="degree" i]',
            university: 'input[name*="school" i], input[name*="university" i]',
            graduationYear: 'input[name*="year" i], select[name*="year" i]',
            coverLetter: 'textarea[name*="cover" i], textarea[name*="letter" i]',
            portfolio: 'input[name*="portfolio" i], input[type="url"]',
            salary: 'input[name*="salary" i], input[name*="compensation" i]'
        };

        const baseFilled = this.fillFieldsWithMapping(fieldMappings);
        const expFilled = this.fillExperienceQuestions();
        this.showNotification(`Indeed form filled - ${baseFilled + expFilled} fields updated!`);
    }

    fillJobStreetForm() {
        // JobStreet specific field selectors - enhanced
        const fieldMappings = {
            firstName: 'input[name*="first" i], input[placeholder*="first" i]',
            lastName: 'input[name*="last" i], input[placeholder*="last" i]',
            email: 'input[type="email"], input[name*="email" i]',
            phone: 'input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i]',
            address: 'input[name*="address" i], textarea[name*="address" i]',
            city: 'input[name*="city" i], input[placeholder*="city" i]',
            country: 'select[name*="country" i], input[name*="country" i]',
            jobTitle: 'input[name*="title" i], input[name*="position" i], input[placeholder*="title" i]',
            company: 'input[name*="company" i], input[placeholder*="company" i]',
            experience: 'select[name*="experience" i], input[name*="experience" i]',
            skills: 'textarea[name*="skill" i], input[name*="skill" i]',
            degree: 'select[name*="degree" i], input[name*="degree" i]',
            university: 'input[name*="school" i], input[name*="university" i]',
            graduationYear: 'input[name*="year" i], select[name*="year" i]',
            coverLetter: 'textarea[name*="cover" i], textarea[name*="letter" i]',
            portfolio: 'input[name*="portfolio" i], input[type="url"]',
            salary: 'input[name*="salary" i], input[name*="compensation" i]'
        };

        const baseFilled = this.fillFieldsWithMapping(fieldMappings);
        const expFilled = this.fillExperienceQuestions();
        this.showNotification(`JobStreet form filled - ${baseFilled + expFilled} fields updated!`);
    }

    fillGenericForm() {
        // Generic form filling for other job sites - comprehensive
        const fieldMappings = {
            firstName: 'input[name*="first" i], input[placeholder*="first" i], input[id*="first" i], input[autocomplete*="given-name"]',
            lastName: 'input[name*="last" i], input[placeholder*="last" i], input[id*="last" i], input[autocomplete*="family-name"]',
            email: 'input[type="email"], input[name*="email" i], input[placeholder*="email" i], input[autocomplete*="email"]',
            phone: 'input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i], input[autocomplete*="tel"]',
            address: 'input[name*="address" i], input[placeholder*="address" i], input[autocomplete*="address-line1"]',
            city: 'input[name*="city" i], input[placeholder*="city" i], input[autocomplete*="address-level2"]',
            country: 'select[name*="country" i], input[name*="country" i], input[autocomplete*="country"]',
            jobTitle: 'input[name*="title" i], input[placeholder*="title" i], input[name*="position" i], input[autocomplete*="job-title"]',
            company: 'input[name*="company" i], input[placeholder*="company" i], input[autocomplete*="organization"]',
            experience: 'select[name*="experience" i], input[name*="experience" i], input[name*="years" i], select[name*="years"]',
            skills: 'textarea[name*="skill" i], input[name*="skill" i], textarea[name*="keywords" i]',
            degree: 'select[name*="degree" i], input[name*="degree" i], select[name*="education" i]',
            university: 'input[name*="school" i], input[name*="university" i], input[name*="college" i], input[autocomplete*="organization"]',
            graduationYear: 'input[name*="year" i], select[name*="year" i], input[name*="graduation" i]',
            coverLetter: 'textarea[name*="cover" i], textarea[name*="letter" i], textarea[name*="message" i], textarea[placeholder*="cover" i]',
            portfolio: 'input[name*="portfolio" i], input[name*="website" i], input[name*="linkedin" i], input[type="url"]',
            salary: 'input[name*="salary" i], input[name*="compensation" i], input[name*="pay" i], input[name*="income" i]'
        };

        const filled = this.fillFieldsWithMapping(fieldMappings);
        this.showNotification(`Generic form filled - ${filled} fields updated!`);
    }

    fillFieldsWithMapping(fieldMappings) {
        let filledCount = 0;
        
        Object.entries(fieldMappings).forEach(([key, selector]) => {
            if (this.profileData[key]) {
                const elements = document.querySelectorAll(selector);
                console.log(`Looking for ${key}: found ${elements.length} elements with selector: ${selector}`);
                
                elements.forEach(element => {
                    if (this.isEditableField(element)) {
                        element.value = this.profileData[key];
                        this.triggerEvent(element, 'input');
                        this.triggerEvent(element, 'change');
                        this.triggerEvent(element, 'blur');
                        filledCount++;
                        console.log(`Filled ${key} with: ${this.profileData[key]}`);
                    }
                });
            }
        });
        
        console.log(`Total fields filled: ${filledCount}`);
        return filledCount;
    }

    // Try to fill inputs that ask: "How many years of X experience do you have?"
    fillExperienceQuestions() {
        const skills = Array.isArray(this.profileData.skillsExperience) ? this.profileData.skillsExperience : [];
        if (!skills.length) return 0;

        const inputs = Array.from(document.querySelectorAll('input[type="number"], input[type="text"], select'));
        let filled = 0;

        inputs.forEach(input => {
            if (!this.isEditableField(input)) return;

            const labelText = this.getAssociatedLabelText(input).toLowerCase();
            if (!labelText) return;

            // Only target questions about years/experience
            const looksLikeYearsQuestion = /years?/i.test(labelText) && /(experience|exp|worked)/i.test(labelText);
            if (!looksLikeYearsQuestion) return;

            for (const { skill, years } of skills) {
                if (!skill && years === undefined) continue;
                const normalizedSkill = (skill || '').toString().toLowerCase();
                if (!normalizedSkill) continue;

                // Match whole or partial word (e.g., 'Java', 'Frontend', 'Mobile')
                if (labelText.includes(normalizedSkill)) {
                    input.value = years;
                    this.triggerEvent(input, 'input');
                    this.triggerEvent(input, 'change');
                    this.triggerEvent(input, 'blur');
                    filled++;
                    break;
                }
            }
        });

        return filled;
    }

    // Try to extract label text associated with an input
    getAssociatedLabelText(input) {
        // 1) Explicit label using for attribute
        if (input.id) {
            const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            if (lbl && lbl.textContent) return lbl.textContent.trim();
        }
        // 2) Parent label element
        let parent = input.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
            if (parent.tagName === 'LABEL' && parent.textContent) return parent.textContent.trim();
            const labelChild = parent.querySelector('label');
            if (labelChild && labelChild.textContent) return labelChild.textContent.trim();
            parent = parent.parentElement;
        }
        // 3) aria-label, placeholder
        if (input.getAttribute('aria-label')) return input.getAttribute('aria-label');
        if (input.placeholder) return input.placeholder;
        // 4) Nearby question text (search previous siblings)
        let node = input;
        for (let i = 0; i < 4 && node && node.previousElementSibling; i++) {
            node = node.previousElementSibling;
            const txt = node.textContent?.trim();
            if (txt && txt.length > 0) return txt;
        }
        // 5) As a last resort, search up to two ancestors for heading/question-like text
        let ancestor = input.parentElement;
        for (let i = 0; i < 2 && ancestor; i++) {
            const headings = ancestor.querySelectorAll('h1,h2,h3,h4,h5,h6,p');
            for (const h of headings) {
                const t = h.textContent?.trim();
                if (t && t.length > 0) return t;
            }
            ancestor = ancestor.parentElement;
        }
        return '';
    }

    isEditableField(element) {
        return element &&
               (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') &&
               !element.disabled &&
               !element.readOnly &&
               element.type !== 'hidden' &&
               element.type !== 'submit' &&
               element.type !== 'button';
    }

    triggerEvent(element, eventType) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.job-assistant-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `job-assistant-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the form filler when the content script loads
const formFiller = new FormFiller();
