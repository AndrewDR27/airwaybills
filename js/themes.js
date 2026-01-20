// Theme Management System
// Handles saving, loading, and applying UI themes

const THEME_STORAGE_KEY = 'awb_ui_theme';
const THEMES_STORAGE_KEY = 'awb_saved_themes';

// Available themes
const AVAILABLE_THEMES = {
    'windows98': {
        name: 'Windows 98',
        description: 'Classic Windows 98 retro theme',
        cssFile: 'styles.css',
        preview: '🪟'
    },
    'windows95': {
        name: 'Windows 95',
        description: 'Classic Windows 95 retro theme',
        cssFile: 'styles.css', // Same file, but could be different
        preview: '🪟'
    },
    'modern': {
        name: 'Modern',
        description: 'Modern gradient theme',
        cssFile: 'styles-modern.css',
        preview: '✨'
    }
};

// Get current theme
function getCurrentTheme() {
    try {
        const theme = localStorage.getItem(THEME_STORAGE_KEY);
        return theme ? JSON.parse(theme) : { name: 'windows98', custom: false };
    } catch (error) {
        console.warn('Could not read theme from localStorage:', error);
        return { name: 'windows98', custom: false };
    }
}

// Save current theme
function saveCurrentTheme(themeName, customStyles = null) {
    try {
        const themeData = {
            name: themeName,
            custom: !!customStyles,
            styles: customStyles,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeData));
        return true;
    } catch (error) {
        console.error('Could not save theme:', error);
        return false;
    }
}

// Apply theme
function applyTheme(themeName, customStyles = null) {
    const theme = AVAILABLE_THEMES[themeName];
    if (!theme && !customStyles) {
        console.warn(`Theme ${themeName} not found`);
        return false;
    }

    // If custom styles provided, inject them
    if (customStyles) {
        injectCustomStyles(customStyles);
    } else if (theme && theme.cssFile) {
        // Load theme CSS file
        loadThemeCSS(theme.cssFile);
    }

    // Save as current theme
    saveCurrentTheme(themeName, customStyles);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: themeName, custom: !!customStyles } 
    }));

    return true;
}

// Inject custom CSS styles
function injectCustomStyles(css) {
    // Remove existing custom theme styles
    const existingStyle = document.getElementById('custom-theme-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'custom-theme-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

// Load theme CSS file
function loadThemeCSS(cssFile) {
    // Remove existing theme link
    const existingLink = document.getElementById('theme-css-link');
    if (existingLink) {
        existingLink.remove();
    }

    // Create new link element
    const link = document.createElement('link');
    link.id = 'theme-css-link';
    link.rel = 'stylesheet';
    link.href = cssFile;
    document.head.appendChild(link);
}

// Save a custom theme with a name
function saveCustomTheme(themeName, description, css) {
    try {
        const savedThemes = getSavedThemes();
        const theme = {
            id: `custom_${Date.now()}`,
            name: themeName,
            description: description || '',
            css: css,
            createdAt: new Date().toISOString(),
            custom: true
        };
        savedThemes.push(theme);
        localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(savedThemes));
        return theme;
    } catch (error) {
        console.error('Could not save custom theme:', error);
        return null;
    }
}

// Get all saved themes (including custom ones)
function getSavedThemes() {
    try {
        const themes = localStorage.getItem(THEMES_STORAGE_KEY);
        return themes ? JSON.parse(themes) : [];
    } catch (error) {
        console.warn('Could not read saved themes:', error);
        return [];
    }
}

// Delete a saved custom theme
function deleteCustomTheme(themeId) {
    try {
        const savedThemes = getSavedThemes();
        const filtered = savedThemes.filter(t => t.id !== themeId);
        localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Could not delete theme:', error);
        return false;
    }
}

// Export current page styles as CSS
function exportCurrentStyles() {
    // Get all computed styles from the page
    const stylesheets = Array.from(document.styleSheets);
    let css = '';
    
    stylesheets.forEach(sheet => {
        try {
            if (sheet.href && sheet.href.includes('styles.css')) {
                // Try to get rules from stylesheet
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    css += rule.cssText + '\n';
                });
            }
        } catch (e) {
            // Cross-origin stylesheets can't be accessed
            console.warn('Could not access stylesheet:', e);
        }
    });

    // Also get inline styles
    const inlineStyle = document.getElementById('custom-theme-styles');
    if (inlineStyle) {
        css += inlineStyle.textContent + '\n';
    }

    return css;
}

// Initialize theme on page load
function initTheme() {
    const currentTheme = getCurrentTheme();
    if (currentTheme.custom && currentTheme.styles) {
        applyTheme(currentTheme.name, currentTheme.styles);
    } else if (currentTheme.name) {
        applyTheme(currentTheme.name);
    }
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    window.themeManager = {
        getCurrentTheme,
        saveCurrentTheme,
        applyTheme,
        saveCustomTheme,
        getSavedThemes,
        deleteCustomTheme,
        exportCurrentStyles,
        initTheme,
        AVAILABLE_THEMES
    };
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
