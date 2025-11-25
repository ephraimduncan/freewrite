const FONT_SIZES = [16, 18, 20, 22, 24, 26];

const PLACEHOLDER_OPTIONS = [
    'Begin writing',
    'Pick a thought and go',
    'Start typing',
    'What\'s on your mind',
    'Just start',
    'Type your first thought',
    'Start with one sentence',
    'Just say it'
];

export class EditorManager {
    constructor(editorElement) {
        this.editorElement = editorElement;
        this.quill = null;
        this.currentFont = 'Lato';
        this.currentSize = 18;
        this.currentRandomFont = '';
        this.onChangeCallback = null;
        this.isUpdating = false;

        this.init();
    }

    init() {
        if (typeof Quill === 'undefined') {
            console.error('Quill library not loaded');
            alert('Editor library not loaded. Please refresh the page.');
            return;
        }

        const randomPlaceholder = PLACEHOLDER_OPTIONS[Math.floor(Math.random() * PLACEHOLDER_OPTIONS.length)];

        this.quill = new Quill(this.editorElement, {
            modules: {
                toolbar: false,
                history: {
                    delay: 1000,
                    maxStack: 100,
                    userOnly: true
                },
                clipboard: {
                    matchVisual: false
                }
            },
            formats: [],
            placeholder: randomPlaceholder,
            theme: 'snow'
        });

        this.updateEditorFont();

        this.quill.on('text-change', (delta, oldDelta, source) => {
            this.handleTextChange(source);
        });
    }

    handleTextChange(source) {
        if (this.isUpdating) return;

        if (source === 'user' && this.onChangeCallback) {
            this.onChangeCallback(this.getContent());
        }
    }

    getContent() {
        return this.quill.getText() || '';
    }

    setContent(content) {
        this.isUpdating = true;
        this.quill.setText(content || '', 'api');
        this.isUpdating = false;
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    moveCursorToEnd() {
        const length = this.quill.getLength();
        this.quill.setSelection(length, 0);
    }

    setFont(fontName) {
        this.currentFont = fontName;
        this.currentRandomFont = '';
        this.updateEditorFont();
    }

    setRandomFont() {
        const systemFonts = [
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Courier New', 'Monaco',
            'Lucida Console', 'Verdana', 'Helvetica', 'Tahoma', 'Century Gothic'
        ];

        const randomFont = systemFonts[Math.floor(Math.random() * systemFonts.length)];
        this.currentFont = randomFont;
        this.currentRandomFont = randomFont;
        this.updateEditorFont();
    }

    getRandomFontName() {
        return this.currentRandomFont ? `Random [${this.currentRandomFont}]` : 'Random';
    }

    setFontSize(size) {
        if (FONT_SIZES.includes(size)) {
            this.currentSize = size;
            this.updateEditorFont();
        }
    }

    cycleFontSize() {
        const currentIndex = FONT_SIZES.indexOf(this.currentSize);
        const nextIndex = (currentIndex + 1) % FONT_SIZES.length;
        this.currentSize = FONT_SIZES[nextIndex];
        this.updateEditorFont();
        return this.currentSize;
    }

    updateEditorFont() {
        const editor = this.quill.root;

        editor.style.fontFamily = this.currentFont;
        editor.style.fontSize = `${this.currentSize}px`;

        this.updateLineHeight();
    }

    updateLineHeight() {
        const lineHeight = this.currentSize * 1.5;
        const editor = this.quill.root;
        editor.style.lineHeight = `${lineHeight}px`;
    }

    getFontSize() {
        return this.currentSize;
    }

    getFont() {
        return this.currentFont;
    }

    clear() {
        this.setContent('');

        const randomPlaceholder = PLACEHOLDER_OPTIONS[Math.floor(Math.random() * PLACEHOLDER_OPTIONS.length)];
        this.quill.root.dataset.placeholder = randomPlaceholder;
    }

    focus() {
        this.quill.focus();
        this.moveCursorToEnd();
    }
}
