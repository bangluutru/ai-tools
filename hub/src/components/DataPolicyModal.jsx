import { ShieldCheck, X } from 'lucide-react';

export default function DataPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-policy-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="data-policy-title" className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck className="text-emerald-400" size={20} />
              Chính sách xử lý dữ liệu hiện tại
            </h2>
            <p className="mt-1 text-sm text-slate-400">Áp dụng cho build production đang hiển thị.</p>
          </div>
          <button onClick={onClose} aria-label="Đóng chính sách dữ liệu" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
          <p><strong className="text-white">Công cụ xử lý trên trình duyệt:</strong> file được đọc trong phiên trình duyệt và không được portal gửi lên server.</p>
          <p><strong className="text-white">Công cụ cần backend/Antigravity:</strong> bị khóa khi runtime hoặc cơ chế xác thực chưa được phê duyệt. Portal không tự chuyển sang API model khác.</p>
          <p><strong className="text-white">Lưu giữ:</strong> production hiện không có kho lưu file phía server. Nếu backend upload được bật sau này, file tạm phải được xóa khi request kết thúc và chính sách retention phải được công bố tại đây.</p>
          <p><strong className="text-white">Đầu ra tài chính/pháp lý:</strong> chỉ mang tính tham khảo; người có thẩm quyền phải đối chiếu chứng từ nguồn trước khi sử dụng.</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Đã hiểu</button>
        </div>
      </section>
    </div>
  );
}
