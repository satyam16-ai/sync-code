// Configure Monaco Editor loader
require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs' }});

// Load Monaco Editor and initialize the IDE
require(['vs/editor/editor.main'], () => {
    let editors = [];
    let activeTabId = null;
    let currentTheme = 'vs-dark';

    // Initialize Xterm.js terminal
    const { Terminal } = window;
    const { FitAddon } = window;
    const terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(document.getElementById('terminal'));
    fitAddon.fit();

    // Handle terminal input
    terminal.onData((data) => {
        terminal.write(data); // Echo input (for now)
    });

    class Tab {
        constructor(id, language = 'python', content = '', filename = `Untitled-${id}`) {
            this.id = id;
            this.language = language;
            this.content = content;
            this.filename = filename;
            this.editor = null;
            this.element = null;
            this.initializeEditor();
        }

        initializeEditor() {
            const container = document.createElement('div');
            container.style.height = '100%';
            container.style.display = 'none';
            document.getElementById('editor-container').appendChild(container);

            this.editor = monaco.editor.create(container, {
                value: this.content,
                language: this.language,
                theme: currentTheme,
                automaticLayout: true,
                minimap: { enabled: false }
            });
        }

        createTabElement() {
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.innerHTML = `
                <span>${this.filename}.${this.getFileExtension()}</span>
                <span class="tab-close">×</span>
            `;
            
            tab.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });

            tab.addEventListener('click', () => this.activate());
            return tab;
        }

        activate() {
            editors.forEach(tab => {
                tab.editor.getContainerDomNode().style.display = 'none';
                tab.element.classList.remove('active');
            });
            this.editor.getContainerDomNode().style.display = 'block';
            this.element.classList.add('active');
            activeTabId = this.id;
            document.getElementById('language-selector').value = this.language;
        }

        close() {
            const index = editors.findIndex(t => t.id === this.id);
            editors.splice(index, 1);
            this.editor.dispose();
            this.element.remove();
            
            if (editors.length > 0) {
                editors[0].activate();
            }
        }

        save() {
            this.content = this.editor.getValue();
            localStorage.setItem('savedFiles', JSON.stringify(
                editors.map(tab => ({
                    content: tab.content,
                    language: tab.language,
                    filename: tab.filename
                }))
            ));
        }

        getFileExtension() {
            switch (this.language) {
                case 'python': return 'py';
                case 'javascript': return 'js';
                case 'html': return 'html';
                case 'css': return 'css';
                case 'c': return 'c';
                default: return 'txt';
            }
        }
    }

    // Initialize first tab
    function createNewTab() {
        const tabId = Date.now();
        const language = document.getElementById('language-selector').value;
        const newTab = new Tab(tabId, language);
        newTab.element = newTab.createTabElement();
        
        document.getElementById('tab-bar').appendChild(newTab.element);
        editors.push(newTab);
        newTab.activate();
    }

    // Control handlers
    document.getElementById('new-tab-btn').addEventListener('click', createNewTab);

    document.getElementById('language-selector').addEventListener('change', function() {
        const currentTab = editors.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.language = this.value;
            monaco.editor.setModelLanguage(
                currentTab.editor.getModel(),
                this.value
            );
            currentTab.element.querySelector('span').textContent = `${currentTab.filename}.${currentTab.getFileExtension()}`;
        }
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        currentTheme = currentTheme === 'vs-dark' ? 'vs-light' : 'vs-dark';
        editors.forEach(tab => {
            monaco.editor.setTheme(currentTheme);
        });
        document.body.style.backgroundColor = currentTheme === 'vs-dark' ? '#1e1e1e' : '#ffffff';
    });

    document.getElementById('save-file-btn').addEventListener('click', () => {
        const currentTab = editors.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.save();
        }
    });

    document.getElementById('download-btn').addEventListener('click', () => {
        const currentTab = editors.find(t => t.id === activeTabId);
        if (currentTab) {
            const code = currentTab.editor.getValue();
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTab.filename}.${currentTab.getFileExtension()}`;
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    document.getElementById('run-btn').addEventListener('click', async () => {
        const currentTab = editors.find(t => t.id === activeTabId);
        if (!currentTab) return;

        const code = currentTab.editor.getValue();
        const language = currentTab.language;

        try {
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language === 'python' ? 'python3' : language,
                    version: 'latest',
                    files: [{ content: code }]
                })
            });

            const result = await response.json();
            terminal.write(result.run.output || result.run.stderr);
        } catch (error) {
            terminal.write('Execution failed');
        }
    });

    // Load saved files
    const savedFiles = JSON.parse(localStorage.getItem('savedFiles')) || [];
    if (savedFiles.length > 0) {
        savedFiles.forEach(file => {
            createNewTab();
            const newTab = editors[editors.length - 1];
            newTab.editor.setValue(file.content);
            newTab.language = file.language;
            newTab.filename = file.filename;
            monaco.editor.setModelLanguage(newTab.editor.getModel(), file.language);
        });
    } else {
        createNewTab();
    }
});