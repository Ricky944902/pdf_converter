
// pdf_to_word_converter/frontend/converter.js
document.addEventListener('DOMContentLoaded', function() {
    // 引入必要的CDN库
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.min.js';
    script1.onload = function() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';
        
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/docx/7.1.0/docx.min.js';
        document.head.appendChild(script2);
    };
    document.head.appendChild(script1);

    // 转换器主类
    class PDFToWordConverter {
        constructor() {
            this.files = [];
            this.convertedFiles = [];
            this.options = {
                format: 'docx',
                preserveFormatting: true
            };
        }

        // 初始化转换器
        init(options = {}) {
            this.options = { ...this.options, ...options };
            return this;
        }

        // 添加PDF文件
        addFiles(files) {
            this.files = [...this.files, ...Array.from(files)];
            return this;
        }

        // 清空文件列表
        clearFiles() {
            this.files = [];
            this.convertedFiles = [];
            return this;
        }

        // 转换单个PDF文件
        async convertFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const typedArray = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument(typedArray).promise;
                        
                        // 创建Word文档
                        const doc = new docx.Document();
                        const paragraphs = [];
                        
                        // 提取PDF文本和格式
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            
                            textContent.items.forEach(item => {
                                const paragraph = new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: item.str,
                                            bold: item.transform && item.transform[0] < 0,
                                            italics: item.transform && item.transform[1] !== 0,
                                            size: item.height * 2 + 'pt'
                                        })
                                    ],
                                    spacing: {
                                        after: 200
                                    }
                                });
                                paragraphs.push(paragraph);
                            });
                        }
                        
                        doc.addSection({
                            children: paragraphs
                        });
                        
                        // 生成Word文件
                        docx.Packer.toBlob(doc).then(blob => {
                            const convertedFile = new File(
                                [blob], 
                                file.name.replace('.pdf', `.${this.options.format}`), 
                                { type: this.getMimeType() }
                            );
                            resolve(convertedFile);
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }

        // 批量转换
        async convertAll() {
            if (this.files.length === 0) {
                throw new Error('没有可转换的文件');
            }

            this.convertedFiles = [];
            for (const file of this.files) {
                try {
                    const convertedFile = await this.convertFile(file);
                    this.convertedFiles.push(convertedFile);
                } catch (error) {
                    console.error(`转换文件 ${file.name} 失败:`, error);
                }
            }
            return this.convertedFiles;
        }

        // 获取MIME类型
        getMimeType() {
            return this.options.format === 'docx' 
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                : 'application/msword';
        }

        // 下载转换后的文件
        downloadAll() {
            if (this.convertedFiles.length === 0) {
                throw new Error('没有可下载的文件');
            }

            this.convertedFiles.forEach(file => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            });
        }
    }

    // 暴露全局接口
    window.PDFToWordConverter = new PDFToWordConverter();

    // 与界面交互
    document.getElementById('convertBtn').addEventListener('click', async function() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const preserveFormatting = document.querySelector('input[type="checkbox"]').checked;
        
        const files = document.getElementById('fileInput').files;
        if (files.length === 0) return;

        const converter = window.PDFToWordConverter.init({
            format,
            preserveFormatting
        }).addFiles(files);

        try {
            this.innerHTML = '<span class="animate-spin mr-2">⏳</span>转换中...';
            this.disabled = true;
            
            await converter.convertAll();
            converter.downloadAll();
            
            // 显示编辑工具栏
            document.getElementById('editorToolbar').classList.remove('hidden');
        } catch (error) {
            console.error('转换失败:', error);
            alert('转换失败: ' + error.message);
        } finally {
            this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>开始转换';
            this.disabled = false;
        }
    });
});
