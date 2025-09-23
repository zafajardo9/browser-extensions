// Job Application Assistant - Popup Script

class JobApplicationAssistant {
    constructor() {
        this.profileData = {};
        this.currentTab = 'profile';
        this.hasProfileData = false;
        this.skillRowIdCounter = 0;
        this.init();
    }

    init() {
        this.detectCurrentSite();
        this.loadProfileData();
        this.setupEventListeners();
        this.setupTabNavigation();
    }

    detectCurrentSite() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const url = tabs[0].url;
                const siteIndicator = document.getElementById('currentSite');
                
                if (url.includes('linkedin.com')) {
                    siteIndicator.textContent = '🔗 You are on LinkedIn';
                } else if (url.includes('indeed.com')) {
                    siteIndicator.textContent = '💼 You are on Indeed';
                } else if (url.includes('jobstreet.com')) {
                    siteIndicator.textContent = '🌐 You are on JobStreet';
                } else {
                    siteIndicator.textContent = '📄 You are on a job site';
                }
            }
        });
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                if (tabName && this.hasProfileData) {
                    this.switchToTab(tabName);
                }
            });
        });
    }

    setupEventListeners() {
        // Main profile form (for editing)
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileData();
            });
        }

        // Initial form (for first-time setup)
        const initialForm = document.getElementById('initialProfileForm');
        if (initialForm) {
            initialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileData(true);
            });
        }

        // Add Skill buttons (Edit and Initial forms)
        const addSkillBtn = document.getElementById('addSkillBtn');
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', () => this.addSkillRow('skillsExperienceList'));
        }
        const initialAddSkillBtn = document.getElementById('initialAddSkillBtn');
        if (initialAddSkillBtn) {
            initialAddSkillBtn.addEventListener('click', () => this.addSkillRow('initialSkillsExperienceList'));
        }

        // Fill form button
        const fillFormBtn = document.getElementById('fillFormBtn');
        if (fillFormBtn) {
            fillFormBtn.addEventListener('click', () => {
                this.fillCurrentForm();
            });
        }

        // Clear data functionality
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    loadProfileData() {
        chrome.storage.local.get(['jobApplicationProfile'], (result) => {
            if (result.jobApplicationProfile && Object.keys(result.jobApplicationProfile).length > 0) {
                this.profileData = result.jobApplicationProfile;
                this.hasProfileData = true;
                this.showProfileView();
                this.updateProfileDisplay();
                this.updateFormFields();
                this.renderSkillsExperience();
            } else {
                this.hasProfileData = false;
                this.showInitialForm();
                this.renderSkillsExperience(true);
            }
        });
    }

    showProfileView() {
        document.getElementById('profileView').style.display = 'flex';
        document.getElementById('initialForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'flex';
    }

    showInitialForm() {
        document.getElementById('profileView').style.display = 'none';
        document.getElementById('initialForm').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'flex';
    }

    switchToTab(tabName) {
        if (!this.hasProfileData) return;

        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab
        const selectedTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedTabBtn) {
            selectedTabBtn.classList.add('active');
        }

        // Show selected pane
        const selectedPane = document.getElementById(`${tabName}Tab`);
        if (selectedPane) {
            selectedPane.classList.add('active');
        }

        this.currentTab = tabName;
    }

    updateProfileDisplay() {
        if (!this.hasProfileData) return;

        // Update profile header
        const profileNameEl = document.getElementById('profileName');
        const profileTitleEl = document.getElementById('profileTitle');
        
        if (profileNameEl) {
            const firstName = this.profileData.firstName || '';
            const lastName = this.profileData.lastName || '';
            profileNameEl.textContent = `${firstName} ${lastName}`.trim() || 'Your Name';
        }
        
        if (profileTitleEl) {
            profileTitleEl.textContent = this.profileData.jobTitle || 'Your Job Title';
        }

        // Update summary information
        this.updateSummaryField('summaryEmail', this.profileData.email);
        this.updateSummaryField('summaryPhone', this.profileData.phone);
        this.updateSummaryField('summaryLocation', this.getLocationString());
        this.updateSummaryField('summaryExperience', this.profileData.experience ? `${this.profileData.experience} years` : 'Not specified');
        this.updateSummaryField('summarySkills', this.profileData.skills || 'Not specified');
    }

    updateSummaryField(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || 'Not specified';
        }
    }

    getLocationString() {
        const city = this.profileData.city || '';
        const country = this.profileData.country || '';
        if (city && country) {
            return `${city}, ${country}`;
        } else if (city) {
            return city;
        } else if (country) {
            return country;
        }
        return 'Not specified';
    }

    saveProfileData(isInitial = false) {
        const formId = isInitial ? 'initialProfileForm' : 'profileForm';
        const form = document.getElementById(formId);
        
        if (!form) return;

        const formData = new FormData(form);
        this.profileData = {};

        for (let [key, value] of formData.entries()) {
            if (value.trim() !== '') {
                this.profileData[key] = value;
            }
        }

        // Collect skill-based experience rows
        const listId = isInitial ? 'initialSkillsExperienceList' : 'skillsExperienceList';
        this.profileData.skillsExperience = this.getSkillsExperienceFromForm(listId);

        chrome.storage.local.set({ jobApplicationProfile: this.profileData }, () => {
            this.hasProfileData = true;
            this.showProfileView();
            this.updateProfileDisplay();
            this.renderSkillsExperience();
            this.showStatus('Profile saved successfully!', 'success');
            
            // Switch to profile tab if we just saved
            if (isInitial) {
                this.switchToTab('profile');
            }
        });
    }

    updateFormFields() {
        if (!this.hasProfileData) return;

        Object.keys(this.profileData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = this.profileData[key];
            }
        });

        // Populate skills experience rows in Edit form
        this.renderSkillsExperience();
    }

    fillCurrentForm() {
        if (!this.hasProfileData) {
            this.showStatus('Please fill in your profile data first!', 'error');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'fillForm',
                    data: this.profileData
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        this.showStatus('Please navigate to a job application page and try again!', 'error');
                    } else if (response && response.success) {
                        this.showStatus('Form filled successfully!', 'success');
                    } else {
                        this.showStatus('Could not fill form. Please make sure you\'re on a job application page.', 'error');
                    }
                });
            }
        });
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all your saved data? This action cannot be undone.')) {
            chrome.storage.local.remove(['jobApplicationProfile'], () => {
                this.profileData = {};
                this.hasProfileData = false;
                this.showInitialForm();
                
                // Reset forms
                const forms = ['profileForm', 'initialProfileForm'];
                forms.forEach(formId => {
                    const form = document.getElementById(formId);
                    if (form) form.reset();
                });
                
                this.showStatus('All data cleared successfully!', 'success');
            });
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';

        setTimeout(() => {
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }, 3000);
    }

    // ===== Skill-based Experience helpers =====
    normalizeSkillName(name) {
        return (name || '').toString().trim();
    }

    addSkillRow(listId, skill = '', years = '') {
        const list = document.getElementById(listId);
        if (!list) return;

        const rowId = `skillRow_${listId}_${++this.skillRowIdCounter}`;
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.id = rowId;
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '8px';

        row.innerHTML = `
            <div class="input-group" style="flex:2; margin-bottom:0;">
                <label style="margin-bottom:4px;">Skill/Language</label>
                <input type="text" class="skill-name" placeholder="e.g., Java" value="${skill ? this.escapeHtml(skill) : ''}">
            </div>
            <div class="input-group" style="flex:1; margin-bottom:0;">
                <label style="margin-bottom:4px;">Years</label>
                <input type="number" min="0" step="0.5" class="skill-years" placeholder="e.g., 3" value="${years !== undefined && years !== null ? years : ''}">
            </div>
            <button type="button" class="btn-secondary remove-skill" aria-label="Remove skill">Remove</button>
        `;

        list.appendChild(row);

        const removeBtn = row.querySelector('.remove-skill');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => row.remove());
        }
    }

    getSkillsExperienceFromForm(listId) {
        const list = document.getElementById(listId);
        if (!list) return [];
        const rows = Array.from(list.querySelectorAll('.skill-row'));
        const result = [];
        rows.forEach(r => {
            const name = this.normalizeSkillName(r.querySelector('.skill-name')?.value);
            const yearsStr = (r.querySelector('.skill-years')?.value || '').toString().trim();
            if (name && yearsStr !== '') {
                const years = Number(yearsStr);
                if (!Number.isNaN(years)) {
                    result.push({ skill: name, years });
                }
            }
        });
        return result;
    }

    renderSkillsExperience(isInitial = false) {
        const data = this.profileData?.skillsExperience || [];
        const editList = document.getElementById('skillsExperienceList');
        const initialList = document.getElementById('initialSkillsExperienceList');

        if (editList) editList.innerHTML = '';
        if (initialList) initialList.innerHTML = '';

        if (data.length > 0) {
            data.forEach(item => {
                if (editList) this.addSkillRow('skillsExperienceList', item.skill, item.years);
                if (initialList && isInitial) this.addSkillRow('initialSkillsExperienceList', item.skill, item.years);
            });
        } else {
            // Start with one empty row for convenience
            if (editList) this.addSkillRow('skillsExperienceList');
            if (initialList && isInitial) this.addSkillRow('initialSkillsExperienceList');
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Public method for tab switching (called from HTML onclick)
    switchToTabGlobal(tabName) {
        this.switchToTab(tabName);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jobAssistant = new JobApplicationAssistant();
});
