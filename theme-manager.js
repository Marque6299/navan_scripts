/**
 * Theme Manager for Easy Customization
 * Manages themes, color schemes, and mode switching
 */
class ThemeManager {
    constructor(options = {}) {
      // Available themes configuration
      this.themes = {
        default: {
          name: 'Default',
          light: {
            primary: '#4361ee',           // More vibrant blue
            secondary: '#2b2d42',         // Kept dark navy
            background: '#f8f9fa',        // Kept light gray
            text: '#2d3748',              // Slightly darker for better readability
            accent: '#4cc9f0',            // Brighter accent blue
            success: '#2cb67d',           // Richer green
            warning: '#ff9e00',           // Warmer orange
            danger: '#e63946',            // Slightly deeper red
            card: '#ffffff',              // Kept white
            lightGray: '#edf2f7'          // Slightly cooler light gray
          },
          dark: {
            primary: '#4895ef',           // Bright blue that works well on dark
            secondary: '#131525',         // Deeper navy
            background: '#111827',        // Rich dark blue-gray
            text: '#e2e8f0',              // Off-white for better contrast
            accent: '#48bfe3',            // Vibrant cyan
            success: '#31c48d',           // Vibrant green with better dark mode visibility
            warning: '#f59e0b',           // Warm amber
            danger: '#f05252',            // Bright red with better visibility
            card: '#1f2937',              // Slate gray for cards
            lightGray: '#374151'          // Medium gray for subtle elements
          }
        },
        ocean: {
          name: 'Ocean',
          light: {
            primary: '#006d77',
            secondary: '#083d56',
            background: '#edf6f9',
            text: '#2c3e50',
            accent: '#48cae4',
            success: '#2a9d8f',
            warning: '#e9c46a',
            danger: '#e76f51',
            card: '#ffffff',
            lightGray: '#e0fbfc'
          },
          dark: {
            primary: '#00545c',
            secondary: '#05263a',
            background: '#0a1929',
            text: '#e0fbfc',
            accent: '#219ebc',
            success: '#1f766c',
            warning: '#bc8c4a',
            danger: '#bc5639',
            card: '#152232',
            lightGray: '#1c3041'
          }
        },
        sunset: {
          name: 'Sunset',
          light: {
            primary: '#fb8500',
            secondary: '#6a4c93',
            background: '#fff8f0',
            text: '#463f3a',
            accent: '#ffb703',
            success: '#52b788',
            warning: '#ffaa00',
            danger: '#d00000',
            card: '#ffffff',
            lightGray: '#f4f3ee'
          },
          dark: {
            primary: '#c96800',
            secondary: '#543c73',
            background: '#2f2d2c',
            text: '#f2e9e4',
            accent: '#cc9102',
            success: '#3d8a66',
            warning: '#cc8800',
            danger: '#9e0000',
            card: '#3a3735',
            lightGray: '#4a4846'
          }
        },
        minimal: {
          name: 'Minimal',
          light: {
            primary: '#5348c8',           // Rich purple
            secondary: '#292929',         // Almost black
            background: '#f5f7fa',        // Very light gray with slight blue
            text: '#1a202c',              // Very dark gray
            accent: '#9f7aea',            // Lavender
            success: '#38a169',           // Classic green
            warning: '#ed8936',           // Warm orange
            danger: '#e53e3e',            // Classic red
            card: '#ffffff',              // Pure white
            lightGray: '#edf2f7'          // Light gray
          },
          dark: {
            primary: '#805ad5',           // Bright purple
            secondary: '#1a202c',         // Very dark gray/blue
            background: '#0e141b',        // Very dark blue-gray
            text: '#f7fafc',              // Almost white
            accent: '#b794f4',            // Light purple
            success: '#48bb78',           // Bright green
            warning: '#f6ad55',           // Light orange
            danger: '#fc8181',            // Light red
            card: '#1e2533',              // Dark blue-gray
            lightGray: '#2d3748'          // Dark gray
          }
        }
      };
  
      // Module color mappings
      this.moduleColors = {
        'ETG/B.com UK': {
          light: '#c7d2fe',  // Light indigo
          dark: '#5a67d8'    // Medium indigo
        },
        'General Scripts': {
          light: '#bfdbfe',  // Light blue
          dark: '#3b82f6'    // Medium blue
        },
        // Default fallback colors
        default: {
          light: '#f9fafb',  // Very light gray
          dark: '#2d3748'    // Dark blue-gray
        }
      };
  
      // Initialize with default settings
      this.currentTheme = options.theme || 'default';
      this.currentMode = options.mode || 'light';
      
      // Initialize theme panel state
      this.isPanelOpen = false;
    }
  
    // Apply the current theme and mode
    applyTheme() {
      const theme = this.themes[this.currentTheme][this.currentMode];
      const root = document.documentElement;
      
      // Set CSS variables based on the current theme and mode
      root.style.setProperty('--primary-color', theme.primary);
      root.style.setProperty('--secondary-color', theme.secondary);
      root.style.setProperty('--background-color', theme.background);
      root.style.setProperty('--text-color', theme.text);
      root.style.setProperty('--accent-color', theme.accent);
      root.style.setProperty('--success-color', theme.success);
      root.style.setProperty('--warning-color', theme.warning);
      root.style.setProperty('--danger-color', theme.danger);
      root.style.setProperty('--white', this.currentMode === 'light' ? '#ffffff' : '#2d3748');
      root.style.setProperty('--light-gray', theme.lightGray);
      
      // Toggle data-theme attribute for component-level styling
      document.body.setAttribute('data-theme', this.currentMode);
      document.body.setAttribute('data-theme-name', this.currentTheme);
      
      // Save settings to localStorage
      this.saveSettings();
      
      // Update module colors
      this.updateModuleColors();
    }
    
    // Change the color theme
    setTheme(themeName) {
      if (this.themes[themeName]) {
        this.currentTheme = themeName;
        this.applyTheme();
        return true;
      }
      return false;
    }
    
    // Toggle between light and dark mode
    toggleMode() {
      this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
      this.applyTheme();
      return this.currentMode;
    }
    
    // Set specific mode
    setMode(mode) {
      if (mode === 'light' || mode === 'dark') {
        this.currentMode = mode;
        this.applyTheme();
        return true;
      }
      return false;
    }
    
    // Save settings to localStorage
    saveSettings() {
      localStorage.setItem('app_theme', this.currentTheme);
      localStorage.setItem('app_mode', this.currentMode);
    }
    
    // Load settings from localStorage
    loadSettings() {
      const savedTheme = localStorage.getItem('app_theme');
      const savedMode = localStorage.getItem('app_mode');
      
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      }
      
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        this.currentMode = savedMode;
      }
      
      this.applyTheme();
    }
    
    // Update module colors based on current mode
    updateModuleColors() {
      document.querySelectorAll('.script-module').forEach(module => {
        const moduleId = module.id;
        const colorSet = this.moduleColors[moduleId] || this.moduleColors.default;
        const backgroundColor = colorSet[this.currentMode];
        
        // Apply colors to all card modules in this script module
        module.querySelectorAll('.card-module').forEach(card => {
          card.style.backgroundColor = backgroundColor;
        });
      });
    }
    
    // Create and insert the theme control panel
    createThemePanel() {
      // Remove existing panel if present
      const existingPanel = document.getElementById('theme-control-panel');
      if (existingPanel) {
        existingPanel.remove();
      }
      
      // Create panel container
      const panel = document.createElement('div');
      panel.id = 'theme-control-panel';
      panel.className = 'theme-panel';
      
      // Add toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'theme-panel-toggle';
      toggleBtn.className = 'theme-panel-toggle';
      toggleBtn.innerHTML = '<i class="fa-solid fa-palette"></i>';
      toggleBtn.addEventListener('click', () => this.togglePanel());
      
      // Create panel content
      const panelContent = document.createElement('div');
      panelContent.className = 'theme-panel-content';
      
      // Mode toggle section
      const modeSection = document.createElement('div');
      modeSection.className = 'panel-section';
      
      const modeTitle = document.createElement('h3');
      modeTitle.textContent = 'Mode';
      modeSection.appendChild(modeTitle);
      
      const modeToggle = document.createElement('button');
      modeToggle.className = 'mode-toggle';
      modeToggle.innerHTML = `<i class="fa-solid ${this.currentMode === 'light' ? 'fa-moon' : 'fa-sun'}"></i> ${this.currentMode === 'light' ? 'Dark Mode' : 'Light Mode'}`;
      modeToggle.addEventListener('click', () => {
        this.toggleMode();
        modeToggle.innerHTML = `<i class="fa-solid ${this.currentMode === 'light' ? 'fa-moon' : 'fa-sun'}"></i> ${this.currentMode === 'light' ? 'Dark Mode' : 'Light Mode'}`;
      });
      modeSection.appendChild(modeToggle);
      
      // Theme selection section
      const themeSection = document.createElement('div');
      themeSection.className = 'panel-section';
      
      const themeTitle = document.createElement('h3');
      themeTitle.textContent = 'Theme';
      themeSection.appendChild(themeTitle);
      
      const themeSelector = document.createElement('div');
      themeSelector.className = 'theme-selector';
      
      // Create theme options
      Object.keys(this.themes).forEach(themeName => {
        const theme = this.themes[themeName];
        const themeOption = document.createElement('button');
        themeOption.className = 'theme-option';
        themeOption.dataset.theme = themeName;
        if (themeName === this.currentTheme) {
          themeOption.classList.add('active');
        }
        
        // Theme color preview
        const colorPreview = document.createElement('span');
        colorPreview.className = 'color-preview';
        colorPreview.style.backgroundColor = theme[this.currentMode].primary;
        
        themeOption.appendChild(colorPreview);
        themeOption.appendChild(document.createTextNode(theme.name));
        
        themeOption.addEventListener('click', () => {
          document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
          themeOption.classList.add('active');
          this.setTheme(themeName);
          
          // Update all color previews when theme changes
          document.querySelectorAll('.color-preview').forEach(preview => {
            const themeKey = preview.parentNode.dataset.theme;
            preview.style.backgroundColor = this.themes[themeKey][this.currentMode].primary;
          });
        });
        
        themeSelector.appendChild(themeOption);
      });
      
      themeSection.appendChild(themeSelector);
      
      // Assemble the panel
      panelContent.appendChild(modeSection);
      panelContent.appendChild(themeSection);
      
      panel.appendChild(toggleBtn);
      panel.appendChild(panelContent);
      
      // Add panel to the DOM
      document.body.appendChild(panel);
      
      // Create panel styles if they don't exist
      this.createPanelStyles();
    }
    
    // Toggle the theme panel open/closed
    togglePanel() {
      this.isPanelOpen = !this.isPanelOpen;
      const panel = document.getElementById('theme-control-panel');
      if (panel) {
        panel.classList.toggle('open', this.isPanelOpen);
      }
    }
    
    // Create CSS styles for the theme panel
    createPanelStyles() {
      if (!document.getElementById('theme-panel-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'theme-panel-styles';
        styleEl.textContent = `
          .theme-panel {
            position: fixed;
            right: -250px;
            top: 70px;
            width: 250px;
            background: var(--white);
            border-radius: 8px 0 0 8px;
            box-shadow: -3px 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transition: right 0.3s ease;
          }
          
          .theme-panel.open {
            right: 0;
          }
          
          .theme-panel-toggle {
            position: absolute;
            left: -40px;
            top: 10px;
            width: 40px;
            height: 40px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px 0 0 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }
          
          .theme-panel-content {
            padding: 15px;
            color: var(--text-color);
          }
          
          .panel-section {
            margin-bottom: 20px;
          }
          
          .panel-section h3 {
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
          }
          
          .mode-toggle {
            background: var(--secondary-color);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 15px;
            width: 100%;
            text-align: center;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
          }
          
          .mode-toggle:hover {
            background: var(--primary-color);
          }
          
          .theme-selector {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .theme-option {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: var(--light-gray);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            color: var(--text-color);
            transition: all 0.2s;
            text-align: left;
          }
          
          .theme-option:hover {
            background: var(--primary-color);
            color: white;
          }
          
          .theme-option.active {
            background: var(--primary-color);
            color: white;
            font-weight: 600;
          }
          
          .color-preview {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 8px;
            border: 2px solid white;
          }
          
          @media (max-width: 768px) {
            .theme-panel {
              top: unset;
              bottom: -250px;
              right: 0;
              left: 0;
              width: 100%;
              height: 200px;
              border-radius: 8px 8px 0 0;
              transition: bottom 0.3s ease;
            }
            
            .theme-panel.open {
              bottom: 0;
              right: 0;
            }
            
            .theme-panel-toggle {
              top: -40px;
              left: 10px;
              border-radius: 8px 8px 0 0;
            }
            
            .theme-selector {
              flex-direction: row;
              flex-wrap: wrap;
              justify-content: space-between;
            }
            
            .theme-option {
              width: 48%;
            }
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
    
    // Initialize the theme manager
    init() {
      this.loadSettings();
      this.createThemePanel();
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.themeManager.init();
  });