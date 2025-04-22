// Cache DOM elements
const DOM = {
    scriptNavContainer: document.querySelector('.script-nav-container'),
    scriptCanvas: document.querySelector('.script-canvas'),
    scriptNavButtons: document.querySelectorAll('.script-nav-container .nav-btn'),
    scriptModules: document.querySelectorAll('.script-module'),
    subPages: document.querySelectorAll('.sub-page'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-action'),
    resetButton: document.querySelector('.global-script-reset'),
    agentInput: document.getElementById('user'),
    customerInput: document.getElementById('customer')
};

// Create search clear button element
const searchClearButton = document.createElement('button');
searchClearButton.id = 'search-clear';
searchClearButton.innerHTML = '<i class="fa-solid fa-times"></i>';
searchClearButton.style.display = 'none'; // Hidden by default
searchClearButton.classList.add('search-clear-btn');

// Add the clear button after the search input
if (DOM.searchInput && DOM.searchInput.parentNode) {
    DOM.searchInput.parentNode.insertBefore(searchClearButton, DOM.searchInput.nextSibling);
}

// State management
const state = {
    activeScriptNavButton: null
};

// Reset functionality for script canvas
const ResetManager = {
    init() {
        // Add event listener to reset button
        if (DOM.resetButton) {
            DOM.resetButton.addEventListener('click', () => this.resetAllManualEdits());
        }
    },

    // Reset all manual-edit elements to their default values
    resetAllManualEdits() {
        const manualEditElements = document.querySelectorAll('.manual-edit');
        const agentName = DOM.agentInput?.value || '';
        
        manualEditElements.forEach(element => {
            const defaultText = element.getAttribute('data-default-text');
            
            // Only reset if it has the manual-edit class
            if (defaultText) {
                // Special handling for Agent Name
                if (defaultText === '[Agent Name]' && agentName) {
                    element.textContent = agentName;
                } else {
                    element.textContent = defaultText;
                }
                
                // Remove any editing classes that might be present
                element.classList.remove('editing');
                
                // Trigger change event for synchronization with other components
                const event = new Event('input', { bubbles: true });
                element.dispatchEvent(event);
            }
        });
        
        // Also trigger sync-inputs.js to update its state if StateManager exists
        if (window.stateManager) {
            document.querySelectorAll('.manual-edit').forEach(field => {
                const defaultText = field.getAttribute('data-default-text');
                const content = field.textContent;
                window.stateManager.updateGroup(defaultText, content, null);
            });
        }
        
        console.log('All manual-edit elements have been reset to default values');
    }
};

const SearchManager = {
    isSearchActive: false, // Track if search is currently active

    // Reset all modules to inactive state
    resetModules() {
        DOM.scriptCanvas.querySelectorAll('.script-module').forEach(module => {
            module.classList.remove('active');
            module.querySelectorAll('.script-title').forEach(title => {
                title.classList.remove('active');
            });
            module.querySelectorAll('.script-card-sub').forEach(card => {
                card.classList.remove('active');
            });
        });
    },

    // Restore default state
    restoreDefaultState() {
        this.isSearchActive = false;
        this.resetModules();
        DOM.searchInput.value = ''; // Clear search input
        this.updateClearButtonVisibility(); // Hide clear button
        ScriptManager.updateScriptModule(); // Restore default module state
    },

    // Update clear button visibility based on search input
    updateClearButtonVisibility() {
        if (searchClearButton) {
            searchClearButton.style.display = DOM.searchInput.value ? 'block' : 'none';
        }
    },

    // Activate matching modules and their components
    activateModule(title) {
        const scriptModule = title.closest('.script-module');
        if (scriptModule) {
            scriptModule.classList.add('active');
            
            // Get corresponding card-sub for this title
            const cardSub = title.nextElementSibling;
            if (cardSub && cardSub.classList.contains('script-card-sub')) {
                cardSub.classList.add('active');
            }
            
            title.classList.add('active');
        }
    },

    // Extract text content from title element (including h4 and p)
    getTitleContent(titleElement) {
        const heading = titleElement.querySelector('h4');
        const paragraph = titleElement.querySelector('p');
        
        const headingText = heading ? heading.textContent.trim() : '';
        const paragraphText = paragraph ? paragraph.textContent.trim() : '';
        
        return {
            heading: headingText,
            paragraph: paragraphText,
            combined: `${headingText} ${paragraphText}`.trim()
        };
    },

    // Check if search terms match content (handles mixed up words)
    isMatch(content, searchTerms) {
        if (!content || !searchTerms.length) return false;
        
        // Convert content to lowercase and split into words
        const contentWords = content.toLowerCase().split(/\s+/);
        
        // Count how many search terms are found in the content
        const matchedTerms = searchTerms.filter(term => {
            return contentWords.some(word => word.includes(term));
        });
        
        // Return true if all search terms are found
        return matchedTerms.length === searchTerms.length;
    },

    // Search implementation
    performSearch(searchTerm) {
        searchTerm = searchTerm.trim();
        if (!searchTerm) {
            this.restoreDefaultState();
            return;
        }

        this.isSearchActive = true;
        this.resetModules();
        this.updateClearButtonVisibility();
        
        // Split search into individual terms and filter out empty strings
        const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        let hasResults = false;

        // Search within script-canvas only - using the new .script-title class
        DOM.scriptCanvas.querySelectorAll('.script-title').forEach(title => {
            const content = this.getTitleContent(title);
            
            // Check if any of our search terms match the title or paragraph
            if (
                this.isMatch(content.heading, searchTerms) || 
                this.isMatch(content.paragraph, searchTerms) || 
                this.isMatch(content.combined, searchTerms)
            ) {
                this.activateModule(title);
                hasResults = true;
            }
        });

        // Also search in card content (optional enhancement)
        if (!hasResults) {
            DOM.scriptCanvas.querySelectorAll('.card-module').forEach(card => {
                const cardContent = card.querySelector('.card-content')?.textContent.toLowerCase() || '';
                
                if (searchTerms.every(term => cardContent.includes(term))) {
                    // Find parent module and title
                    const parentModule = card.closest('.script-module');
                    const parentTitle = card.closest('.script-card-sub')?.previousElementSibling;
                    
                    if (parentModule && parentTitle) {
                        parentModule.classList.add('active');
                        parentTitle.classList.add('active');
                        card.closest('.script-card-sub')?.classList.add('active');
                        hasResults = true;
                    }
                }
            });
        }

        if (!hasResults) {
            console.log('No matching scripts found');
        }
    },

    // Initialize search events
    init() {
        // Search button click handler
        DOM.searchButton.addEventListener('click', () => {
            this.performSearch(DOM.searchInput.value);
        });

        // Search input enter key handler
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(DOM.searchInput.value);
            }
        });

        // Optional: Real-time search as user types (with debounce)
        let debounceTimer;
        DOM.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            this.updateClearButtonVisibility();
            debounceTimer = setTimeout(() => {
                this.performSearch(DOM.searchInput.value);
            }, 300);
        });

        // Clear button functionality
        if (searchClearButton) {
            searchClearButton.addEventListener('click', () => {
                DOM.searchInput.value = '';
                this.updateClearButtonVisibility();
                this.restoreDefaultState();
                DOM.searchInput.focus(); // Return focus to search input
            });
        }

        // Add state restoration to navigation events
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (this.isSearchActive) {
                    this.restoreDefaultState();
                }
            });
        });
    }
};

// Script module management
const ScriptManager = {
    updateScriptModule() {
        // Reset all script modules
        DOM.scriptModules.forEach(module => module.classList.remove('active'));
        
        // Find active script nav button
        const activeButton = DOM.scriptNavContainer.querySelector('.nav-btn.active');
        if (activeButton) {
            const moduleId = activeButton.id.replace('-nav', '');
            const targetModule = document.getElementById(moduleId);
            if (targetModule) targetModule.classList.add('active');
        }
    }
};

// Navigation management for script modules
const NavigationManager = {
    setActiveScriptButton(button) {
        // Only affect script nav buttons
        DOM.scriptNavContainer.querySelectorAll('.nav-btn').forEach(btn => 
            btn.classList.remove('active')
        );
        button.classList.add('active');
        state.activeScriptNavButton = button;
        ScriptManager.updateScriptModule();
    }
};

// Event listeners
function initializeEventListeners() {
    // Script Navigation buttons
    DOM.scriptNavContainer.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => 
            NavigationManager.setActiveScriptButton(button)
        );
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    
    // Initialize modules
    ScriptManager.updateScriptModule();
    SearchManager.init();
    ResetManager.init();
});