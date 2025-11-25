import { StorageManager } from './storage.js';
import { EditorManager } from './editor.js';
import { TimerManager } from './timer.js';
import { SidebarManager } from './sidebar.js';
import { PDFExporter } from './pdf.js';
import { AIChatManager } from './ai-chat.js';

class FreewriteApp {
    constructor() {
        this.storage = new StorageManager();
        this.editor = null;
        this.timer = null;
        this.sidebar = null;
        this.pdfExporter = new PDFExporter();
        this.aiChat = null;

        this.currentEntry = null;
        this.entries = [];
        this.theme = 'light';
        this.saveTimeout = null;

        this.init();
    }

    async init() {
        try {
            await this.storage.init();

            this.initializeManagers();

            this.setupEventListeners();

            await this.loadEntries();

            this.loadTheme();

            console.log('Freewrite app initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Error initializing app. Please refresh the page.');
        }
    }

    initializeManagers() {
        const editorElement = document.getElementById('editor');
        this.editor = new EditorManager(editorElement);

        const timerButton = document.getElementById('timer-btn');
        const bottomNav = document.getElementById('bottom-nav');
        this.timer = new TimerManager(timerButton, bottomNav);

        const sidebarElement = document.getElementById('sidebar');
        const entriesListElement = document.getElementById('entries-list');
        this.sidebar = new SidebarManager(sidebarElement, entriesListElement);

        const chatPopover = document.getElementById('chat-popover');
        const chatContent = document.getElementById('chat-content');
        this.aiChat = new AIChatManager(chatPopover, chatContent);

        this.editor.onChange((content) => {
            this.handleEditorChange(content);
        });

        this.sidebar.onSelectEntry((entry) => {
            this.switchToEntry(entry);
        });

        this.sidebar.onDeleteEntry((entry) => {
            this.deleteEntry(entry);
        });

        this.sidebar.onExportEntry((entry) => {
            this.exportEntry(entry);
        });

        this.timer.onCompletion(() => {
            console.log('Timer completed!');
        });
    }

    setupEventListeners() {
        document.getElementById('font-size-btn').addEventListener('click', () => {
            const newSize = this.editor.cycleFontSize();
            document.getElementById('font-size-btn').textContent = `${newSize}px`;
            this.saveFontSettings();
        });

        document.getElementById('font-lato').addEventListener('click', () => {
            this.editor.setFont('Lato');
            this.saveFontSettings();
        });

        document.getElementById('font-arial').addEventListener('click', () => {
            this.editor.setFont('Arial');
            this.saveFontSettings();
        });

        document.getElementById('font-system').addEventListener('click', () => {
            this.editor.setFont('system-ui');
            this.saveFontSettings();
        });

        document.getElementById('font-serif').addEventListener('click', () => {
            this.editor.setFont('Times New Roman');
            this.saveFontSettings();
        });

        document.getElementById('font-random').addEventListener('click', () => {
            this.editor.setRandomFont();
            const randomBtn = document.getElementById('font-random');
            randomBtn.textContent = this.editor.getRandomFontName();
            this.saveFontSettings();
        });

        document.getElementById('chat-btn').addEventListener('click', () => {
            const content = this.editor.getContent();
            this.aiChat.toggle(content);
        });

        document.addEventListener('click', (e) => {
            const chatBtn = document.getElementById('chat-btn');
            const chatPopover = document.getElementById('chat-popover');

            if (!chatBtn.contains(e.target) && !chatPopover.contains(e.target)) {
                this.aiChat.hide();
            }
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('new-entry-btn').addEventListener('click', () => {
            this.createNewEntry();
        });

        document.getElementById('theme-btn').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('history-btn').addEventListener('click', () => {
            this.sidebar.toggle();
        });

        document.querySelector('.sidebar-header').addEventListener('click', () => {
            alert('Entries are stored in your browser\'s IndexedDB.\n\nTo backup your entries, export them as PDFs or copy the text manually.');
        });

        const bottomNav = document.getElementById('bottom-nav');
        bottomNav.addEventListener('mouseenter', () => {
            this.timer.setNavHoverState(true);
        });

        bottomNav.addEventListener('mouseleave', () => {
            this.timer.setNavHoverState(false);
        });

        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton();
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewEntry();
            }
        });
    }

    async loadEntries() {
        try {
            this.entries = await this.storage.getAllEntries();
            console.log(`Loaded ${this.entries.length} entries`);

            this.sidebar.setEntries(this.entries);

            if (this.entries.length === 0) {
                await this.createWelcomeEntry();
            } else {
                const lastEntryId = localStorage.getItem('lastViewedEntryId');
                let entryToLoad = null;

                if (lastEntryId) {
                    entryToLoad = this.entries.find(e => e.id === lastEntryId);
                }

                if (!entryToLoad) {
                    entryToLoad = this.entries[0];
                }

                this.currentEntry = entryToLoad;
                this.editor.setContent(this.currentEntry.content);

                if (this.currentEntry.fontFamily) {
                    this.editor.setFont(this.currentEntry.fontFamily);
                }
                if (this.currentEntry.fontSize) {
                    this.editor.setFontSize(this.currentEntry.fontSize);
                    document.getElementById('font-size-btn').textContent = `${this.currentEntry.fontSize}px`;
                }

                this.sidebar.setSelectedEntry(this.currentEntry.id);

                localStorage.setItem('lastViewedEntryId', this.currentEntry.id);
            }

            this.editor.focus();
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    }

    async createWelcomeEntry() {
        try {
            const response = await fetch('assets/default.md');
            let welcomeText = 'Welcome to Freewrite :).\n\nPlease check the GitHub repo for the full guide.';

            if (response.ok) {
                welcomeText = await response.text();
            }

            const newEntry = this.storage.createEntry(
                welcomeText,
                this.editor.getFont(),
                this.editor.getFontSize()
            );
            await this.storage.saveEntry(newEntry);

            this.entries.unshift(newEntry);
            this.currentEntry = newEntry;

            this.editor.setContent(newEntry.content);
            this.sidebar.addEntry(newEntry);
            this.sidebar.setSelectedEntry(newEntry.id);

            localStorage.setItem('lastViewedEntryId', newEntry.id);

            console.log('Welcome entry created');
        } catch (error) {
            console.error('Error creating welcome entry:', error);
            await this.createNewEntry();
        }
    }

    async createNewEntry() {
        try {
            if (this.currentEntry) {
                await this.saveCurrentEntry();
            }

            const newEntry = this.storage.createEntry(
                '',
                this.editor.getFont(),
                this.editor.getFontSize()
            );
            await this.storage.saveEntry(newEntry);

            this.entries.unshift(newEntry);
            this.currentEntry = newEntry;

            this.editor.clear();
            this.sidebar.addEntry(newEntry);
            this.sidebar.setSelectedEntry(newEntry.id);
            this.editor.focus();

            localStorage.setItem('lastViewedEntryId', newEntry.id);

            console.log('New entry created');
        } catch (error) {
            console.error('Error creating new entry:', error);
        }
    }

    async switchToEntry(entry) {
        try {
            if (this.currentEntry && this.currentEntry.id === entry.id) {
                return;
            }

            if (this.currentEntry) {
                await this.saveCurrentEntry();
            }

            this.currentEntry = entry;
            this.editor.setContent(entry.content);

            if (entry.fontFamily) {
                this.editor.setFont(entry.fontFamily);
            }
            if (entry.fontSize) {
                this.editor.setFontSize(entry.fontSize);
                document.getElementById('font-size-btn').textContent = `${entry.fontSize}px`;
            }

            this.sidebar.setSelectedEntry(entry.id);
            this.editor.focus();

            localStorage.setItem('lastViewedEntryId', entry.id);

            console.log('Switched to entry:', entry.id);
        } catch (error) {
            console.error('Error switching entry:', error);
        }
    }

    async deleteEntry(entry) {
        try {
            await this.storage.deleteEntry(entry.id);

            this.entries = this.entries.filter(e => e.id !== entry.id);

            this.sidebar.removeEntry(entry.id);

            const lastEntryId = localStorage.getItem('lastViewedEntryId');
            if (lastEntryId === entry.id) {
                localStorage.removeItem('lastViewedEntryId');
            }

            if (this.currentEntry && this.currentEntry.id === entry.id) {
                if (this.entries.length > 0) {
                    await this.switchToEntry(this.entries[0]);
                } else {
                    await this.createNewEntry();
                }
            }

            console.log('Entry deleted:', entry.id);
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    }

    async exportEntry(entry) {
        try {
            if (this.currentEntry && this.currentEntry.id === entry.id) {
                await this.saveCurrentEntry();
                entry = await this.storage.loadEntry(entry.id);
            }

            const fontSize = this.editor.getFontSize();
            const fontFamily = this.editor.getFont();
            await this.pdfExporter.exportEntry(entry, fontSize, fontFamily);

            console.log('Entry exported as PDF');
        } catch (error) {
            console.error('Error exporting entry:', error);
        }
    }

    handleEditorChange(content) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.autoSave(content);
        }, 1000);
    }

    async autoSave(content) {
        if (!this.currentEntry) return;

        try {
            this.currentEntry.content = content;
            this.currentEntry.fontFamily = this.editor.getFont();
            this.currentEntry.fontSize = this.editor.getFontSize();

            await this.storage.saveEntry(this.currentEntry);

            this.sidebar.updateEntry(this.currentEntry);

            console.log('Auto-saved entry');
        } catch (error) {
            console.error('Error auto-saving:', error);
        }
    }

    async saveCurrentEntry() {
        if (!this.currentEntry) return;

        try {
            const content = this.editor.getContent();
            this.currentEntry.content = content;
            this.currentEntry.fontFamily = this.editor.getFont();
            this.currentEntry.fontSize = this.editor.getFontSize();
            await this.storage.saveEntry(this.currentEntry);
            this.sidebar.updateEntry(this.currentEntry);
            console.log('Current entry saved');
        } catch (error) {
            console.error('Error saving current entry:', error);
        }
    }

    async saveFontSettings() {
        if (!this.currentEntry) return;

        try {
            this.currentEntry.fontFamily = this.editor.getFont();
            this.currentEntry.fontSize = this.editor.getFontSize();
            await this.storage.saveEntry(this.currentEntry);
            console.log('Font settings saved');
        } catch (error) {
            console.error('Error saving font settings:', error);
        }
    }

    toggleFullscreen() {
        const app = document.getElementById('app');

        if (!document.fullscreenElement) {
            app.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateFullscreenButton() {
        const btn = document.getElementById('fullscreen-btn');
        if (document.fullscreenElement) {
            btn.textContent = 'Minimize';
        } else {
            btn.textContent = 'Fullscreen';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    applyTheme() {
        const root = document.documentElement;
        const themeIcon = document.querySelector('.theme-icon');

        if (this.theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀';
        } else {
            root.setAttribute('data-theme', 'light');
            themeIcon.textContent = '☾';
        }
    }

    loadTheme() {
        const saved = localStorage.getItem('colorScheme');
        if (saved) {
            this.theme = saved;
        }
        this.applyTheme();
    }

    saveTheme() {
        localStorage.setItem('colorScheme', this.theme);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FreewriteApp();
    });
} else {
    new FreewriteApp();
}
