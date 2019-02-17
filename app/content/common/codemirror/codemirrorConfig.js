'use strict';

class CodemirrorConfig {
    constructor() {
        this.editor = null;
        this.config = {
            onLoad: (editor) => {
                this.editor = editor;
                if(this.isInput) this.editor.display.wrapper.className += ' code-mirror-input';
            },
            indentWithTabs: true,
            smartIndent: true,
            autofocus: true,
            mode: 'text/x-sql',
            lineNumbers: true,
            lineWrapping: true,
            viewportMargin: Infinity,
            autoClearEmptyLines: false,
            extraKeys: {
                "Ctrl-Space": "autocomplete"
            },
            hint: CodeMirror.hint.sql,
            hintOptions: {
                disableKeywords: false,
                tables: []
            }
        };
    }

    get() {
        return this.config;
    }

    disableKeywords() {
        this.config.hintOptions.disableKeywords = true;
    }
    
    removeHighlighting() {
        delete this.config.mode;
    }

    convertToInput() {
        this.isInput = true;

        this.config.lineNumbers = false;
        this.config.autofocus = false;
        this.config.smartIndent = false;
        this.config.indentWithTabs = false;
        this.config.autoClearEmptyLines = true;

    }

    setTables(tables) {
        this.config.hintOptions.tables = tables;

        this.editor && this.editor.setOption('hintOptions', this.config.hintOptions);
    }

    setTheme(theme) {
        this.config.theme = theme;
    }

}

export default CodemirrorConfig;
