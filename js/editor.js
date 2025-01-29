require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.33.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
    // Initialize variables
    let editors = [];
    let currentEditorIndex = 0;
    const files = JSON.parse(localStorage.getItem('files')) || {};
    const fileList = document.getElementById('file-list');
    const filenameInput = document.getElementById('filename-input');
    const tabsContainer = document.getElementById('tabs');

    // Initialize Monaco Editor
    function createEditor(language = 'python') {
        const editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: `// Write your ${language} code here`,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            lineNumbers: 'on',
        });
        editors.push(editor);
        return editor;
    }

    // Render file list
    function renderFileList() {
        fileList.innerHTML = '';
        Object.keys(files).forEach(filename => {
            const li = document.createElement('li');
            li.textContent = filename;
            li.addEventListener('click', () => {
                const fileContent = files[filename];
                editors[currentEditorIndex].setValue(fileContent);
            });
            fileList.appendChild(li);
        });
    }

    // Render tabs
    function renderTabs() {
        tabsContainer.innerHTML = '';
        editors.forEach((editor, index) => {
            const tab = document.createElement('div');
            tab.className = `tab ${index === currentEditorIndex ? 'active' : ''}`;
            tab.textContent = `Tab ${index + 1}`;
            tab.addEventListener('click', () => {
                currentEditorIndex = index;
                editors.forEach((e, i) => {
                    e.getDomNode().style.display = i === index ? 'block' : 'none';
                });
                renderTabs();
            });
            tabsContainer.appendChild(tab);
        });
    }

    // Create new tab
    document.getElementById('new-tab-btn').addEventListener('click', () => {
        const language = document.getElementById('language-selector').value;
        createEditor(language);
        renderTabs();
    });

    // Create new file
    document.getElementById('create-file-btn').addEventListener('click', () => {
        const filename = filenameInput.value.trim();
        if (filename && !files[filename]) {
            files[filename] = '';
            localStorage.setItem('files', JSON.stringify(files));
            renderFileList();
            filenameInput.value = '';
        }
    });

    // Save current file
    document.getElementById('save-file-btn').addEventListener('click', () => {
        const filename = filenameInput.value.trim();
        if (filename) {
            files[filename] = editors[currentEditorIndex].getValue();
            localStorage.setItem('files', JSON.stringify(files));
            renderFileList();
        }
    });

    // Download code
    document.getElementById('download-btn').addEventListener('click', () => {
        const code = editors[currentEditorIndex].getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${document.getElementById('language-selector').value}`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Toggle theme
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = editors[currentEditorIndex].getOption(monaco.editor.EditorOption.theme);
        const newTheme = currentTheme === 'vs-dark' ? 'vs-light' : 'vs-dark';
        editors.forEach(editor => editor.updateOptions({ theme: newTheme }));
        document.body.style.backgroundColor = newTheme === 'vs-dark' ? '#1e1e1e' : '#ffffff';
        document.body.style.color = newTheme === 'vs-dark' ? '#ffffff' : '#000000';
    });

    // Clear output
    document.getElementById('clear-output-btn').addEventListener('click', () => {
        document.getElementById('output').textContent = '';
    });

    // Handle run button click
    document.getElementById('run-btn').addEventListener('click', async () => {
        const code = editors[currentEditorIndex].getValue();
        const language = document.getElementById('language-selector').value;

        // Map language to Piston's recognized name and version
        let pistonLang = language;
        let pistonVersion = 'latest';

        if (language === 'python') {
            pistonLang = 'python3';
            pistonVersion = '3.10.0';
        } else if (language === 'javascript') {
            pistonLang = 'node';
            pistonVersion = '14.17.0';
        } else if (language === 'c') {
            pistonLang = 'c';
            pistonVersion = '10.2.0';
        }

        try {
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: pistonLang,
                    version: pistonVersion,
                    files: [{ content: code }],
                }),
            });

            const result = await response.json();
            const output = result.run.output || result.run.stderr || 'No output';
            document.getElementById('output').textContent = output;
        } catch (error) {
            document.getElementById('output').textContent = 'Error: Failed to execute code';
        }
    });

    // Initial setup
    createEditor();
    renderFileList();
    renderTabs();
});