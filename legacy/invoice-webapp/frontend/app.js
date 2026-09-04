document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileListSection = document.getElementById('file-list-section');
    const fileList = document.getElementById('file-list');
    const fileCount = document.getElementById('file-count');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const errorMessage = document.getElementById('error-message');

    let selectedFiles = [];

    // Trigger file input when clicking the dropzone or browse button
    dropzone.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        selectedFiles = [...selectedFiles, ...Array.from(files)];
        updateUI();
    }

    function updateUI() {
        if (selectedFiles.length > 0) {
            dropzone.style.display = 'none';
            fileListSection.style.display = 'block';
            fileCount.textContent = selectedFiles.length;
            
            fileList.innerHTML = '';
            selectedFiles.forEach(file => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.textContent = file.name;
                fileList.appendChild(div);
            });
            errorMessage.style.display = 'none';
        } else {
            resetUI();
        }
    }

    function resetUI() {
        selectedFiles = [];
        fileInput.value = '';
        dropzone.style.display = 'block';
        fileListSection.style.display = 'none';
        errorMessage.style.display = 'none';
        setLoading(false);
    }

    resetBtn.addEventListener('click', resetUI);

    submitBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);
        errorMessage.style.display = 'none';

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/generate-invoice', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Handle file download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Get filename from header if possible, else default
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'ĐNTT_auto_generated.xlsx';
                if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                    filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                
                // Reset UI after success
                setTimeout(resetUI, 1500);
            } else {
                // Handle error
                const errorData = await response.json().catch(() => ({ detail: 'Lỗi không xác định từ máy chủ' }));
                throw new Error(errorData.detail || 'Lỗi xử lý file');
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'block';
            resetBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
            resetBtn.disabled = false;
        }
    }
});
