import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, Sparkles } from 'lucide-react';

export default function DropZone({ onFilesSelected, isProcessing }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      filterAndEmitFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndEmitFiles(Array.from(e.target.files));
    }
  };

  /**
   * Chuyển nguyên danh sách lên trên. Trước đây chỗ này tự loại file sai định
   * dạng rồi im lặng, nên người dùng thả nhầm một tệp là nó biến mất không lời
   * giải thích. Việc loại và giải thích thuộc về bộ kiểm tra dùng chung.
   */
  const filterAndEmitFiles = (files) => {
    if (files.length > 0) onFilesSelected(files);
  };

  const handleClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`dropzone ${isDragActive ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className="dropzone-content">
        <div className="upload-icon-wrapper">
          <UploadCloud size={36} />
        </div>
        <div>
          <div className="dropzone-heading">Kéo & Thả tập tin ảnh vào đây</div>
          <div className="dropzone-subtext">hoặc nhấn để chọn ảnh từ máy tính của bạn</div>
        </div>
        <div className="supported-badge">
          <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Đã kiểm thử: PNG, JPG, JPEG, GIF (frame đầu), WEBP</span>
        </div>
      </div>
    </div>
  );
}
