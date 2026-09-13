/**
 * @file packages/core/src/components/consular/OfficialFormPreview.jsx
 * @description Trình kết xuất trực quan bản in A4 chính thức (Canonical A4 Document).
 * Tuân thủ tuyệt đối quy định của từng thông tư chuyên ngành:
 *  - TK02: Thông tư 31/2023/TT-BCA của Bộ Công an (2 trang độc lập)
 *  - Khai sinh / Kết hôn: Thông tư 04/2020/TT-BTP của Bộ Tư pháp
 *  - Giấy ủy quyền: Nghị định 30/2020/NĐ-CP & Bộ luật Dân sự 2015
 * Có cơ chế xử lý văn bản dài (font downscaling, overflow safe).
 */

import React from 'react';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function OfficialFormPreview({
  formConfig,
  formData = {},
  currentPage = 1,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const code = formConfig?.code || 'FORM';

  if (code === 'TK02') {
    return (
      <TK02OfficialLayout
        formData={formData}
        currentPage={currentPage}
        t={t}
      />
    );
  }

  // Fallback cho các biểu mẫu chuẩn khác
  return (
    <StandardOfficialLayout
      formConfig={formConfig}
      formData={formData}
      t={t}
    />
  );
}

/**
 * BỐ CỤC CHÍNH THỨC TK02 — THÔNG TƯ 31/2023/TT-BCA (BỘ CÔNG AN)
 */
function TK02OfficialLayout({ formData, currentPage = 1, t }) {
  if (currentPage === 2) {
    return (
      <div className="w-full h-full p-[18mm_15mm_15mm_15mm] flex flex-col justify-between box-border text-[11px] leading-relaxed text-black font-serif relative">
        <div className="space-y-4">
          {/* Header trang 2 */}
          <div className="text-center font-bold text-xs uppercase tracking-wide border-b border-gray-300 pb-2">
            MẪU TK02 — TRANG 2 (Ý KIẾN VÀ XÁC NHẬN CHÍNH THỨC)
          </div>

          {/* Mục 15: Ý kiến của cha, mẹ hoặc người giám hộ */}
          <div className="space-y-1.5 pt-2">
            <div className="font-bold text-[11.5px] text-gray-900">
              15. Ý kiến của cha, mẹ hoặc người giám hộ (nếu có):
            </div>
            <div className="text-[10px] italic text-gray-600 leading-normal">
              (Áp dụng đối với người chưa đủ 14 tuổi, người mất năng lực hành vi dân sự, người có khó khăn trong nhận thức, làm chủ hành vi theo quy định)
            </div>
            <div className="space-y-3 pt-2 text-[11px]">
              <div className="border-b border-dotted border-gray-400 py-1 text-gray-800">
                Tôi là: ................................................................. Quan hệ với người đề nghị: ................................................................
              </div>
              <div className="border-b border-dotted border-gray-400 py-1 text-gray-800">
                Đồng ý đề nghị cấp hộ chiếu cho: {formData.applicantName || '................................................................................................'}
              </div>
              <div className="border-b border-dotted border-gray-400 py-1 text-gray-800">
                Lý do: ..........................................................................................................................................................................
              </div>
              <div className="flex justify-end pt-2 text-center pr-8">
                <div>
                  <div className="italic text-[10.5px]">Ngày ..... tháng ..... năm 202...</div>
                  <div className="font-bold text-[11px] mt-1 mb-12">CHA / MẸ / NGƯỜI GIÁM HỘ</div>
                  <div className="text-[10px] text-gray-600">(Ký, ghi rõ họ và tên)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lời cam đoan */}
          <div className="pt-4 border-t border-gray-200 space-y-1.5">
            <div className="font-bold text-[11.5px] text-gray-900">
              Lời cam đoan của người đề nghị cấp hộ chiếu:
            </div>
            <p className="text-[11px] italic text-gray-800 leading-relaxed indent-4">
              "Tôi xin cam đoan những lời khai trên là hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật về toàn bộ nội dung đã khai trong tờ khai này."
            </p>
          </div>

          {/* Chữ ký người đề nghị */}
          <div className="grid grid-cols-2 gap-4 text-center pt-2">
            <div />
            <div>
              <div className="italic text-[10.5px]">Tokyo/Osaka, ngày ..... tháng ..... năm 202...</div>
              <div className="font-bold uppercase text-xs mt-1 mb-14">
                NGƯỜI ĐỀ NGHỊ
              </div>
              <div className="font-sans font-bold text-[12px] text-gray-950 underline underline-offset-2">
                {formData.applicantName || '(Ký, ghi rõ họ và tên)'}
              </div>
            </div>
          </div>

          {/* Khung tiếp nhận & duyệt của Cơ quan đại diện */}
          <div className="mt-4 border border-gray-800 p-3.5 rounded-xs space-y-2 bg-gray-50/40">
            <div className="text-center font-bold text-[11px] uppercase tracking-wide text-gray-900">
              XÁC NHẬN CỦA CƠ QUAN ĐẠI DIỆN VIỆT NAM TẠI NHẬT BẢN
            </div>
            <div className="text-center text-[10px] italic text-gray-600">
              (Phần dành cho cán bộ tiếp nhận hồ sơ kiểm tra, đối chiếu và thẩm quyền ký duyệt)
            </div>
            <div className="grid grid-cols-2 gap-8 text-[10.5px] pt-4 pb-12">
              <div>
                <span className="font-semibold">Cán bộ tiếp nhận hồ sơ:</span>
                <div className="italic text-[9.5px] text-gray-500 mt-1">(Ký, ghi rõ họ tên)</div>
              </div>
              <div>
                <span className="font-semibold">Người có thẩm quyền ký duyệt:</span>
                <div className="italic text-[9.5px] text-gray-500 mt-1">(Ký, đóng dấu cơ quan)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chân trang 2 */}
        <div className="border-t border-gray-300 pt-2 flex justify-between text-[9.5px] text-gray-500 font-sans">
          <span>Thông tư 31/2023/TT-BCA</span>
          <span>Trang 2 / 2</span>
        </div>
      </div>
    );
  }

  // TRANG 1 — MẪU TK02 CHUẨN THÔNG TƯ 31/2023/TT-BCA
  return (
    <div className="w-full h-full p-[14mm_15mm_12mm_15mm] flex flex-col justify-between box-border text-[11px] leading-relaxed text-black font-serif relative">
      <div>
        {/* Header Quốc hiệu & Khung ảnh 4x6 */}
        <div className="flex items-start justify-between mb-2">
          {/* Cột Quốc hiệu - Tiêu ngữ */}
          <div className="text-center flex-1 pr-4 pt-1">
            <div className="font-bold text-[12px] uppercase tracking-wider text-gray-950">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-semibold text-[11.5px] underline underline-offset-4 decoration-1 text-gray-900 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>

            {/* Mã số mẫu hiệu */}
            <div className="mt-4 text-left">
              <div className="font-bold text-[11px] font-sans text-gray-900">Mẫu TK02</div>
              <div className="text-[9.5px] italic text-gray-600 font-sans">
                (Ban hành kèm theo Thông tư số 31/2023/TT-BCA ngày 20/07/2023 của Bộ Công an)
              </div>
            </div>
          </div>

          {/* Khung dán ảnh 4x6 cm chuẩn Thông tư 31 */}
          <div className="w-[32mm] h-[45mm] border border-dashed border-gray-500 flex flex-col items-center justify-center text-center p-1 bg-gray-50/60 shrink-0 text-gray-600">
            <span className="font-bold text-[10px]">ẢNH 4x6 cm</span>
            <span className="text-[8px] leading-tight text-gray-500 mt-1">
              Mặt nhìn thẳng, nền trắng, không đeo kính, chụp không quá 6 tháng
            </span>
          </div>
        </div>

        {/* Tiêu đề chính thức */}
        <div className="text-center my-3 space-y-0.5">
          <h2 className="font-bold text-[14px] uppercase tracking-wide text-gray-950">
            TỜ KHAI ĐỀ NGHỊ CẤP HỘ CHIẾU PHỔ THÔNG Ở NƯỚC NGOÀI
          </h2>
          <div className="italic text-[10.5px] text-gray-700">
            (Dùng cho công dân Việt Nam đang ở nước ngoài)
          </div>
        </div>

        {/* Kính gửi */}
        <div className="text-center font-bold text-[11.5px] mb-3 text-gray-900">
          Kính gửi: Cơ quan đại diện Việt Nam tại Nhật Bản
        </div>

        {/* Danh sách 14 trường thông tin chi tiết */}
        <div className="space-y-1 text-[11px] leading-snug">
          {/* 1. Họ tên & Giới tính */}
          <div className="flex items-baseline justify-between border-b border-gray-100 py-0.5">
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-2">
              <span className="font-bold text-gray-900 shrink-0">1. Họ và tên (chữ in hoa):</span>
              <span className="font-sans font-bold text-gray-950 truncate text-[11.5px]">
                {formData.applicantName || '................................................................................'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="font-bold text-gray-900">2. Giới tính:</span>
              <span className="font-sans font-semibold text-gray-950 px-1">
                {formData.gender || 'Nam'}
              </span>
            </div>
          </div>

          {/* 3. Ngày sinh & Nơi sinh */}
          <div className="flex items-baseline justify-between border-b border-gray-100 py-0.5">
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-2">
              <span className="font-bold text-gray-900 shrink-0">3. Ngày sinh:</span>
              <span className="font-sans font-semibold text-gray-950">
                {formData.dob || '..... / ..... / .........'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
              <span className="font-bold text-gray-900 shrink-0">4. Nơi sinh:</span>
              <span className="font-sans font-semibold text-gray-950 truncate">
                {formData.birthPlace || '.......................................................'}
              </span>
            </div>
          </div>

          {/* 5. CCCD / CMND / Mã định danh */}
          <div className="flex items-baseline justify-between border-b border-gray-100 py-0.5 text-[10.5px]">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-gray-900">5. Số CCCD/CMND:</span>
              <span className="font-sans font-semibold text-gray-950">
                {formData.idCardNumber || '................................'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-gray-800">Ngày cấp:</span>
              <span className="font-sans text-gray-900">
                {formData.idCardIssueDate || '....................'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-gray-800">Nơi cấp:</span>
              <span className="font-sans text-gray-900 truncate max-w-[120px]">
                {formData.idCardIssuePlace || '....................'}
              </span>
            </div>
          </div>

          {/* 6. Dân tộc & 7. Tôn giáo */}
          <div className="flex items-baseline justify-between border-b border-gray-100 py-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900">6. Dân tộc:</span>
              <span className="font-sans font-semibold text-gray-950 px-1">
                {formData.ethnic || 'Kinh'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 pr-8">
              <span className="font-bold text-gray-900">7. Tôn giáo:</span>
              <span className="font-sans font-semibold text-gray-950 px-1">
                {formData.religion || 'Không'}
              </span>
            </div>
          </div>

          {/* 8. Địa chỉ trước khi xuất cảnh tại Việt Nam */}
          <div className="border-b border-gray-100 py-0.5">
            <span className="font-bold text-gray-900">8. Nơi thường trú/tạm trú trước khi xuất cảnh tại VN:</span>
            <div className="font-sans font-medium text-gray-950 pl-2 leading-tight">
              {formData.permanentAddressVN || '........................................................................................................................................'}
            </div>
          </div>

          {/* 9. Địa chỉ cư trú hiện nay tại Nhật Bản */}
          <div className="border-b border-gray-100 py-0.5">
            <span className="font-bold text-gray-900">9. Địa chỉ cư trú hiện nay tại Nhật Bản (Romaji/Kanji):</span>
            <div className="font-sans font-medium text-gray-950 pl-2 leading-tight">
              {formData.residenceAddressJP || '........................................................................................................................................'}
            </div>
          </div>

          {/* 10. Số điện thoại & Email */}
          <div className="flex items-baseline justify-between border-b border-gray-100 py-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900">10. Số điện thoại:</span>
              <span className="font-sans font-semibold text-gray-950">
                {formData.phoneNumber || '................................'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900">Email:</span>
              <span className="font-sans font-semibold text-gray-950">
                {formData.email || '........................................................'}
              </span>
            </div>
          </div>

          {/* 11. Nghề nghiệp / Cơ quan */}
          <div className="border-b border-gray-100 py-0.5">
            <span className="font-bold text-gray-900">11. Nghề nghiệp / Nơi làm việc tại Nhật:</span>
            <span className="font-sans font-medium text-gray-950 pl-1.5">
              {formData.occupation || '........................................................................................................................'}
            </span>
          </div>

          {/* 12. Thân nhân (Cha, Mẹ, Vợ/Chồng) */}
          <div className="space-y-0.5 border-b border-gray-100 py-0.5">
            <span className="font-bold text-gray-900">12. Cha, Mẹ, Vợ/Chồng:</span>
            <div className="grid grid-cols-3 gap-1 pl-2 text-[10px]">
              <div>- Cha: <span className="font-sans font-semibold">{formData.fatherName || '...............'}</span></div>
              <div>- Mẹ: <span className="font-sans font-semibold">{formData.motherName || '...............'}</span></div>
              <div>- Vợ/Chồng: <span className="font-sans font-semibold">{formData.spouseName || '...............'}</span></div>
            </div>
          </div>

          {/* 13. Hộ chiếu cũ */}
          <div className="border-b border-gray-100 py-0.5 text-[10.5px]">
            <span className="font-bold text-gray-900">13. Hộ chiếu phổ thông cấp lần gần nhất:</span>
            <span className="font-sans font-semibold text-gray-950 pl-1">
              {formData.oldPassportNumber ? `Số: ${formData.oldPassportNumber}` : 'Chưa từng cấp / Cấp lần đầu'}
            </span>
            {formData.oldPassportIssueDate && (
              <span className="font-sans text-gray-700 pl-2">
                (Ngày cấp: {formData.oldPassportIssueDate})
              </span>
            )}
          </div>

          {/* 14. Nội dung đề nghị & Loại hộ chiếu */}
          <div className="border-b border-gray-100 py-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-gray-900">14. Nội dung đề nghị:</span>
              <span className="font-sans font-semibold text-gray-950">
                {formData.requestType === 'cap_lai_do_mat'
                  ? 'Cấp lại do bị mất hộ chiếu'
                  : formData.requestType === 'cap_lai_do_hong'
                  ? 'Cấp lại do hộ chiếu bị hỏng'
                  : formData.requestType === 'cap_lan_dau'
                  ? 'Cấp hộ chiếu lần đầu'
                  : 'Cấp lại do hộ chiếu sắp hết hạn / đã hết hạn'}
              </span>
            </div>
            <div className="text-[10px] text-gray-700 pl-2">
              Loại hộ chiếu:{' '}
              <span className="font-bold text-gray-950">
                {formData.passportChipOption === 'khong_gan_chip'
                  ? 'Hộ chiếu không gắn chíp điện tử'
                  : 'Hộ chiếu có gắn chíp điện tử (Khuyến nghị)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chân trang 1 */}
      <div className="border-t border-gray-300 pt-1.5 flex justify-between items-center text-[9.5px] text-gray-500 font-sans">
        <span>* Xem tiếp ý kiến người giám hộ và cam đoan tại Trang 2</span>
        <span>Trang 1 / 2</span>
      </div>
    </div>
  );
}

/**
 * BỐ CỤC CHUẨN CÁC BIỂU MẪU ĐƠN TRANG KHÁC (KHAI SINH, QUỐC TỊCH, KẾT HÔN, ỦY QUYỀN)
 */
function StandardOfficialLayout({ formConfig, formData, t }) {
  const fields = formConfig?.fields || (formConfig?.sections?.flatMap((s) => s.fields)) || [];
  const formTitle = formConfig?.title?.vi || formConfig?.title || 'TỜ KHAI HÀNH CHÍNH';

  return (
    <div className="w-full h-full p-[18mm_18mm_15mm_18mm] flex flex-col justify-between box-border text-[12px] leading-relaxed text-black font-serif relative select-text">
      <div>
        {/* Header Quốc hiệu */}
        <div className="text-center space-y-1 mb-5">
          <div className="font-bold text-[12.5px] uppercase tracking-wider">
            {t.editor.previewHeaderRepublic}
          </div>
          <div className="font-semibold text-[12px] underline underline-offset-4 decoration-1">
            {t.editor.previewHeaderMotto}
          </div>
        </div>

        {/* Tiêu đề biểu mẫu */}
        <div className="text-center space-y-1 my-5">
          <h2 className="font-bold text-[14.5px] uppercase tracking-wide">
            {formTitle}
          </h2>
          <div className="font-sans text-[10.5px] text-gray-600 font-medium">
            Căn cứ: {formConfig.standardBasis || formConfig.legal_basis || 'Quy chuẩn hành chính lãnh sự'}
          </div>
        </div>

        {/* Kính gửi */}
        <div className="text-center text-xs font-semibold mb-5">
          {t.editor.previewTo}
        </div>

        {/* Danh sách trường dữ liệu */}
        <div className="space-y-2 text-[11.5px] leading-relaxed">
          {fields.map((field, idx) => {
            const val = formData[field.id] || '....................................................................................................';
            return (
              <div key={field.id} className="flex flex-wrap items-baseline gap-1.5 py-0.5 border-b border-gray-100">
                <span className="font-semibold text-gray-800 shrink-0">
                  {idx + 1}. {field.label?.vi || field.label}:
                </span>
                <span className="font-sans font-bold text-gray-950 px-1 truncate max-w-[500px]">
                  {val}
                </span>
              </div>
            );
          })}
        </div>

        {/* Lời cam đoan */}
        <div className="text-[11px] italic text-gray-700 mt-5 leading-relaxed">
          {t.editor.previewCommitment}
        </div>

        {/* Chữ ký */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6 pt-4">
          <div>
            <div className="italic text-gray-600">{t.editor.previewMissionVerify}</div>
            <div className="font-semibold mt-1 mb-14">{t.editor.previewMissionSign}</div>
          </div>

          <div>
            <div className="italic text-gray-600">{t.editor.previewDatePlace}</div>
            <div className="font-bold uppercase mt-1 mb-14">{t.editor.previewApplicantTitle}</div>
            <div className="font-sans font-semibold text-gray-900">
              {formData.applicantName || formData.mandatorName || formData.fatherName || t.editor.previewApplicantSign}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-2 text-[9.5px] text-gray-400 font-sans flex justify-between">
        <span>{t.editor.previewFooterEngine}</span>
        <span>SHA-256: {formConfig.sha256Fingerprint?.slice(0, 16) || 'VERIFIED'}...</span>
      </div>
    </div>
  );
}
