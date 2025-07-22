
// pdf_to_word_converter/frontend/editor.js
document.addEventListener('DOMContentLoaded', function() {
    // 初始化编辑器工具栏
    const editorToolbar = document.getElementById('editorToolbar');
    const previewContent = document.getElementById('previewContent');
    
    // 字体样式按钮事件
    document.querySelectorAll('#editorToolbar button[data-command]').forEach(button => {
        button.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            document.execCommand(command, false, null);
            previewContent.focus();
        });
    });

    // 字体选择器
    document.getElementById('fontFamily').addEventListener('change', function() {
        document.execCommand('fontName', false, this.value);
        previewContent.focus();
    });

    // 字号选择器
    document.getElementById('fontSize').addEventListener('change', function() {
        document.execCommand('fontSize', false, this.value);
        previewContent.focus();
    });

    // 段落对齐按钮
    const alignButtons = {
        'alignLeft': 'justifyLeft',
        'alignCenter': 'justifyCenter',
        'alignRight': 'justifyRight',
        'alignJustify': 'justifyFull'
    };
    
    Object.entries(alignButtons).forEach(([id, command]) => {
        const button = document.createElement('button');
        button.className = 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition';
        button.innerHTML = id === 'alignLeft' ? '左对齐' : 
                         id === 'alignCenter' ? '居中' : 
                         id === 'alignRight' ? '右对齐' : '两端对齐';
        button.dataset.command = command;
        button.addEventListener('click', function() {
            document.execCommand(command, false, null);
            previewContent.focus();
        });
        editorToolbar.appendChild(button);
    });

    // 文本颜色选择器
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'h-8 w-8 cursor-pointer';
    colorInput.addEventListener('input', function() {
        document.execCommand('foreColor', false, this.value);
        previewContent.focus();
    });
    editorToolbar.appendChild(colorInput);

    // 行高选择器
    const lineHeightSelect = document.createElement('select');
    lineHeightSelect.className = 'px-2 py-1 border rounded';
    lineHeightSelect.innerHTML = `
        <option value="1">单倍行距</option>
        <option value="1.5">1.5倍行距</option>
        <option value="2">双倍行距</option>
        <option value="2.5">2.5倍行距</option>
    `;
    lineHeightSelect.addEventListener('change', function() {
        previewContent.style.lineHeight = this.value;
    });
    editorToolbar.appendChild(lineHeightSelect);

    // 内容变化监听
    previewContent.addEventListener('input', function() {
        // 自动保存编辑内容到localStorage
        localStorage.setItem('editedContent', this.innerHTML);
    });

    // 初始化编辑内容
    if (localStorage.getItem('editedContent')) {
        previewContent.innerHTML = localStorage.getItem('editedContent');
    }

    // 导出编辑内容为HTML
    window.exportEditedContent = function() {
        const content = previewContent.innerHTML;
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edited_content.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    // 添加导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition ml-auto';
    exportBtn.innerHTML = '导出HTML';
    exportBtn.addEventListener('click', window.exportEditedContent);
    editorToolbar.appendChild(exportBtn);
});
