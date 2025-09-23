// Job Application Assistant - Standalone Version
// Works without Chrome extension APIs using localStorage

class StandaloneJobAssistant {
    constructor() {
        this.profileData = {};
        this.currentTab = 'profile';
        this.hasProfileData = false;
        this.skillRowIdCounter = 0;
        this.init();
    }

    init() {
        this.loadProfileData();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupCopyButtons();
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

    setupCopyButtons() {
        // Copy full profile button
        const copyProfileBtn = document.getElementById('copyProfileBtn');
        if (copyProfileBtn) {
            copyProfileBtn.addEventListener('click', () => {
                this.copyProfileToClipboard();
            });
        }

        // Copy basic info button
        const copyBasicBtn = document.getElementById('copyBasicBtn');
        if (copyBasicBtn) {
            copyBasicBtn.addEventListener('click', () => {
                this.copyBasicInfoToClipboard();
            });
        }
    }

    loadProfileData() {
        try {
            const savedData = localStorage.getItem('jobApplicationProfile');
            if (savedData) {
                this.profileData = JSON.parse(savedData);
                this.hasProfileData = Object.keys(this.profileData).length > 0;
                
                if (this.hasProfileData) {
                    this.showProfileView();
                    this.updateProfileDisplay();
                    this.updateFormFields();
                    this.renderSkillsExperience();
                } else {
                    this.showInitialForm();
                    this.renderSkillsExperience(true);
                }
            } else {
                this.hasProfileData = false;
                this.showInitialForm();
                this.renderSkillsExperience(true);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.hasProfileData = false;
            this.showInitialForm();
            this.renderSkillsExperience(true);
        }
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

        try {
            localStorage.setItem('jobApplicationProfile', JSON.stringify(this.profileData));
            this.hasProfileData = true;
            this.showProfileView();
            this.updateProfileDisplay();
            this.renderSkillsExperience();
            this.showStatus('Profile saved successfully!', 'success');
            
            // Switch to profile tab if we just saved
            if (isInitial) {
                this.switchToTab('profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showStatus('Error saving profile. Please try again.', 'error');
        }
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

    copyProfileToClipboard() {
        if (!this.hasProfileData) {
            this.showStatus('No profile data to copy!', 'error');
            return;
        }

        const profileText = this.formatProfileForClipboard();
        this.copyToClipboard(profileText, 'Full profile copied to clipboard!');
    }

    copyBasicInfoToClipboard() {
        if (!this.hasProfileData) {
            this.showStatus('No profile data to copy!', 'error');
            return;
        }

        const basicInfo = this.formatBasicInfoForClipboard();
        this.copyToClipboard(basicInfo, 'Basic info copied to clipboard!');
    }

    formatProfileForClipboard() {
        const data = this.profileData;
        let text = '';
        
        // Basic Info
        text += `Name: ${data.firstName || ''} ${data.lastName || ''}\n`;
        text += `Email: ${data.email || ''}\n`;
        text += `Phone: ${data.phone || ''}\n`;
        
        if (data.address || data.city || data.country) {
            text += `Address: ${[data.address, data.city, data.country].filter(Boolean).join(', ')}\n`;
        }
        
        text += `\nProfessional:\n`;
        text += `Job Title: ${data.jobTitle || ''}\n`;
        text += `Company: ${data.company || ''}\n`;
        text += `Experience: ${data.experience ? data.experience + ' years' : ''}\n`;
        text += `Skills: ${data.skills || ''}\n`;
        
        if (data.degree || data.university || data.graduationYear) {
            text += `\nEducation:\n`;
            text += `Degree: ${data.degree || ''}\n`;
            text += `University: ${data.university || ''}\n`;
            text += `Graduation Year: ${data.graduationYear || ''}\n`;
        }
        
        if (data.portfolio) {
            text += `\nPortfolio/LinkedIn: ${data.portfolio}\n`;
        }
        
        if (data.salary) {
            text += `\nExpected Salary: ${data.salary}\n`;
        }
        
        if (data.coverLetter) {
            text += `\nCover Letter:\n${data.coverLetter}\n`;
        }
        
        return text;
    }

    formatBasicInfoForClipboard() {
        const data = this.profileData;
        return `Name: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || ''}
Phone: ${data.phone || ''}
Location: ${this.getLocationString()}
Job Title: ${data.jobTitle || ''}
Experience: ${data.experience ? data.experience + ' years' : ''}`;
    }

    async copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            this.showStatus(successMessage, 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showStatus(successMessage, 'success');
            } catch (fallbackError) {
                this.showStatus('Failed to copy to clipboard', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all your saved data? This action cannot be undone.')) {
            try {
                localStorage.removeItem('jobApplicationProfile');
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
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
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

    // Public method for tab switching (called from HTML onclick)
    switchToTabGlobal(tabName) {
        this.switchToTab(tabName);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jobAssistant = new StandaloneJobAssistant();
    
    // Add clear data button to profile tab
    const profileTab = document.getElementById('profileTab');
    if (profileTab) {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Clear All Data';
        clearBtn.className = 'btn-secondary';
        clearBtn.style.marginTop = '16px';
        clearBtn.style.width = '100%';
        clearBtn.onclick = () => window.jobAssistant.clearAllData();
        
        // Add to profile tab instead of appending to end
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'form-actions';
        actionsDiv.style.marginTop = '24px';
        actionsDiv.appendChild(clearBtn);
        profileTab.appendChild(actionsDiv);
    }
});

// Make switchToTab globally available for onclick handlers
function switchToTab(tabName) {
    if (window.jobAssistant) {
        window.jobAssistant.switchToTab(tabName);
    }
}
