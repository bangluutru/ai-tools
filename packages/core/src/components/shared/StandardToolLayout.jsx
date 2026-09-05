import React from 'react';
import {
  ShieldCheck,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUp,
  Trash2,
  Lock,
  Cpu,
  FileCheck,
  Download,
  RotateCcw,
  Printer
} from 'lucide-react';

/**
 * Standard Breadcrumb component for tool pages
 */
export function ToolBreadcrumb({ category = 'Công cụ', categoryHref = '#', toolName }) {
  return (
    <nav className="flex items-center gap-space-2 text-on-surface-variant mb-space-4 font-body-sm text-body-sm">
      <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
        Trang chủ
      </a>
      <ChevronRight className="w-3.5 h-3.5 text-outline shrink-0" />
      <a href={categoryHref} className="hover:text-primary transition-colors">
        {category}
      </a>
      <ChevronRight className="w-3.5 h-3.5 text-outline shrink-0" />
      <span className="text-on-surface font-title-sm text-label-md">
        {toolName}
      </span>
    </nav>
  );
}

/**
 * Standard Status & Tag Badge
 */
export function StatusBadge({ children, variant = 'default', className = '' }) {
  const variantClasses = {
    default: 'bg-surface-subtle text-outline border-border-subtle',
    primary: 'bg-primary-container/20 text-brand-cyan-bright border-primary-container/30',
    priority: 'bg-secondary-container/20 text-secondary border-secondary/20',
    cyan: 'bg-primary-container/20 text-brand-cyan-bright border-primary-container/30',
    warning: 'bg-tertiary-container/20 text-tertiary border-tertiary/20',
    error: 'bg-error-container/20 text-error border-error-container/30',
  }[variant] || 'bg-surface-subtle text-outline border-border-subtle';

  return (
    <span
      className={`inline-flex items-center gap-1 px-space-2 py-[2px] rounded font-label-sm text-label-sm border ${variantClasses} ${className}`}
    >
      {variant === 'priority' && (
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
      )}
      {children}
    </span>
  );
}

/**
 * Standard Privacy & Security Shield Pill (Subtle 1-line indicator)
 */
export function PrivacyShieldPill({
  title,
  subtitle,
  message,
  icon = ShieldCheck,
}) {
  const Icon = icon;
  const text = message || (title && subtitle ? `${title} — ${subtitle}` : title || subtitle || 'Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.');
  return (
    <div className="self-start lg:self-center flex items-center gap-1.5 text-xs text-outline shrink-0">
      <Icon className="w-4 h-4 text-secondary shrink-0" />
      <span>{text}</span>
    </div>
  );
}

/**
 * Standard Tool Header Section
 */
export function ToolHeader({
  icon,
  title,
  badges = [],
  description,
  showPrivacy = true,
  privacyTitle,
  privacySubtitle,
  privacyMessage,
  privacyIcon,
}) {
  const Icon = icon;
  return (
    <section className="bg-surface-container rounded-xl p-space-5 mb-space-5 border border-border-subtle shadow-sm relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-4 relative z-10">
        <div className="flex items-start gap-space-3.5 max-w-3xl">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-sm">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-space-2">
              <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
                {title}
              </h1>
              {badges.map((b, i) => (
                <StatusBadge key={i} variant={b.variant || 'default'}>
                  {b.text}
                </StatusBadge>
              ))}
            </div>
            {description && (
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {showPrivacy && (
          <PrivacyShieldPill
            title={privacyTitle}
            subtitle={privacySubtitle}
            message={privacyMessage}
            icon={privacyIcon}
          />
        )}
      </div>
    </section>
  );
}

/**
 * Standard Section Card (Steps 1, 2, Output container)
 */
export function SectionCard({
  stepNumber,
  title,
  subtitle,
  badge,
  children,
  className = '',
}) {
  return (
    <div
      className={`bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-2">
          {stepNumber && (
            <span className="w-6 h-6 rounded bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center font-label-sm text-label-sm font-bold">
              {stepNumber}
            </span>
          )}
          <h2 className="font-title-sm text-title-sm text-on-surface">{title}</h2>
        </div>
        {badge && (
          <span className="font-label-sm text-label-sm text-outline">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * Standard 2-Column Tool Workspace Container
 */
export function ToolWorkspace({
  children,
  leftContent,
  rightContent,
  leftSpan = 'lg:col-span-5',
  rightSpan = 'lg:col-span-7',
}) {
  if (leftContent && rightContent) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 items-start mb-space-8">
        <div className={`${leftSpan} space-y-space-6`}>{leftContent}</div>
        <div className={`${rightSpan} space-y-space-6`}>{rightContent}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-space-6 mb-space-8">
      {children}
    </div>
  );
}

/**
 * Standard Drag & Drop File Upload Component
 */
export function FileUploader({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSizeMB = 50,
  hint = 'Kéo thả tệp vào đây hoặc bấm để chọn tệp',
  subHint = 'Hỗ trợ định dạng chuẩn',
  files = [],
  onRemoveFile,
  onMoveUp,
  onClearAll,
}) {
  const inputRef = React.useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-space-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="bg-surface-subtle/50 hover:bg-surface-subtle border-2 border-dashed border-border-subtle hover:border-primary-container rounded-xl p-space-6 text-center cursor-pointer transition-all group shadow-sm"
      >
        <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center text-brand-cyan-bright mx-auto mb-space-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="font-title-sm text-body-md text-on-surface mb-1">
          {hint}
        </p>
        <p className="font-body-sm text-body-sm text-outline">
          {subHint} {maxSizeMB ? `(Tối đa ${maxSizeMB} MB)` : ''}
        </p>
      </div>

      {files && files.length > 0 && (
        <div className="space-y-space-2 mt-space-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-surface-subtle rounded-lg p-space-3 flex items-center justify-between gap-space-3 border border-border-subtle/60 hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-space-3 min-w-0">
                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body-md text-body-md text-on-surface truncate font-semibold">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-space-2 text-outline font-label-sm text-label-sm">
                    <span>{formatSize(file.size)}</span>
                    {file.status && (
                      <>
                        <span>•</span>
                        <span className="text-secondary">{file.status}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onMoveUp && index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(index);
                    }}
                    className="p-space-1 text-on-surface-variant hover:text-on-surface transition-colors"
                    title="Di chuyển lên"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                    className="p-space-1 text-on-surface-variant hover:text-error transition-colors"
                    title="Xóa tệp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {onClearAll && files.length > 1 && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClearAll}
                className="text-error hover:underline font-label-sm text-label-sm flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Standard Technical Assurance Cards (Bottom 3 pillars)
 */
export function AssuranceCards({
  card1 = {
    icon: Cpu,
    title: 'Xử Lý WebAssembly & Trình Duyệt',
    desc: 'Biên dịch thuật toán chuyên sâu trực tiếp tại máy tính người dùng. Xử lý cực nhanh mà không phụ thuộc hạ tầng mạng.',
  },
  card2 = {
    icon: Lock,
    title: 'Không Giới Hạn & Riêng Tư Tuyệt Đối',
    desc: 'Dữ liệu không bao giờ rời khỏi trình duyệt của bạn. Không ghi nhận nhật ký, không lưu trữ tạm trên đám mây.',
  },
  card3 = {
    icon: ShieldCheck,
    title: 'Đảm Bảo Độ Chuẩn Xác Kỹ Thuật',
    desc: 'Giữ trọn vẹn siêu dữ liệu, phông chữ, cấu trúc trang theo chuẩn kỹ thuật quốc tế và quy định hiện hành.',
  },
}) {
  const cards = [card1, card2, card3];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 my-space-8">
      {cards.map((c, i) => {
        const Icon = c.icon || ShieldCheck;
        return (
          <div
            key={i}
            className="p-space-5 rounded-xl bg-surface-container border border-border-subtle shadow-sm space-y-space-2"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-subtle text-brand-cyan-bright flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-title-sm text-title-sm text-on-surface">
              {c.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {c.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Standard Result / Output Panel
 */
export function ResultCard({
  title = 'Kết Quả Xử Lý & Xuất Tệp',
  badge = 'SẴN SÀNG TẢI VỀ',
  metrics = [],
  primaryAction,
  secondaryActions = [],
  children,
}) {
  return (
    <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-2">
          <CheckCircle2 className="w-5 h-5 text-secondary" />
          <h2 className="font-title-sm text-title-sm text-on-surface">{title}</h2>
        </div>
        {badge && (
          <span className="px-space-2 py-[2px] rounded bg-secondary/10 text-secondary font-label-sm text-label-sm border border-secondary/20">
            • {badge}
          </span>
        )}
      </div>

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-3">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="bg-surface-subtle rounded-lg p-space-3 border border-border-subtle"
            >
              <span className="font-label-sm text-label-sm text-outline block uppercase">
                {m.label}
              </span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5 block">
                {m.value}
              </span>
              {m.subtext && (
                <span className="text-[11px] text-secondary block mt-0.5">
                  {m.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {children}

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="w-full py-space-3 px-space-4 rounded-lg bg-secondary hover:bg-secondary/90 text-surface-canvas font-title-sm text-body-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface-canvas"
        >
          {primaryAction.icon || <Download className="w-4 h-4" />}
          <span>{primaryAction.label}</span>
        </button>
      )}

      {secondaryActions && secondaryActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-space-2 pt-space-2 border-t border-border-subtle">
          {secondaryActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={action.onClick}
              className="flex items-center gap-1.5 px-space-3 py-space-2 rounded-lg bg-surface-subtle hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors border border-border-subtle"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Standard Tool Page Layout Component
 */
export function StandardToolLayout({
  breadcrumb,
  header,
  children,
  assuranceCards = false,
  className = '',
}) {
  return (
    <div className={`max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface ${className}`}>
      {breadcrumb && <ToolBreadcrumb {...breadcrumb} />}
      {header && <ToolHeader {...header} />}
      <main className="flex-1 w-full">{children}</main>
      {assuranceCards === true && <AssuranceCards />}
      {typeof assuranceCards === 'object' && assuranceCards !== null && <AssuranceCards {...assuranceCards} />}
    </div>
  );
}

export default StandardToolLayout;
