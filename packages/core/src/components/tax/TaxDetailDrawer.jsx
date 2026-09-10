/**
 * @file packages/core/src/components/tax/TaxDetailDrawer.jsx
 * @description Modal Drawer hiển thị giải thích 3 cấp độ (Level 1, 2, 3) cho từng loại thuế/bảo hiểm xã hội.
 * - Cấp độ 1: Giải thích khái niệm ngắn gọn (Quick Explanation)
 * - Cấp độ 2: Công thức và diễn giải từng bước theo số liệu thực tế của người dùng (Step-by-Step Trace)
 * - Cấp độ 3: Điều luật căn cứ (e-Gov / Law Articles) và link tra cứu chính thức (NTA / Cơ quan công quyền)
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calculator,
  ExternalLink,
  Scale,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { TaxKnowledgeBase } from '../../utils/tax/knowledge/taxKnowledgeBase.js';

export default function TaxDetailDrawer({
  taxId,
  result,
  onClose,
  lang = 'ja',
  t,
}) {
  const [activeTab, setActiveTab] = useState('level2'); // 'level1' | 'level2' | 'level3'

  if (!taxId || !result) return null;

  const itemData = TaxKnowledgeBase[taxId];
  if (!itemData) return null;

  const title = itemData[`title_${lang}`] || itemData.title_ja;
  const level1Text = itemData.level1?.[lang] || itemData.level1?.ja;
  const level2Traces = itemData.getLevel2 ? itemData.getLevel2(result)[lang] || itemData.getLevel2(result).ja : [];
  const level3Articles = itemData.level3?.[`legalArticles_${lang}`] || itemData.level3?.legalArticles_ja;
  const officialLinks = itemData.level3?.links || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface border border-border-subtle rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-start justify-between bg-surface-container-low">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200/60 dark:border-rose-800/50 font-mono">
                {itemData.authority}
              </span>
              <span className="text-[11px] text-on-surface-variant font-mono">
                {itemData.category === 'national' ? '国税 / Thuế Quốc Gia' : '地方税・社会保障 / Địa phương & Xã hội'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-on-surface">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t?.closeDrawer || 'Đóng (Close)'}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Tabs */}
        <div className="flex border-b border-border-subtle bg-surface-container-lowest text-xs font-semibold px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('level1')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'level1'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t?.level1Tab || '① かんたん解説'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('level2')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'level2'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            {t?.level2Tab || '② あなたの場合の計算式'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('level3')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'level3'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {t?.level3Tab || '③ 根拠条文・公式情報'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* Tab 1: Level 1 Quick Summary */}
          {activeTab === 'level1' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle leading-relaxed text-on-surface">
                {level1Text}
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {lang === 'ja' ? '納付時期・納付方法の目安:' : lang === 'vi' ? 'Thời hạn & Phương thức nộp:' : 'Payment Timeline & Method:'}
                  </span>
                  <p className="mt-0.5 text-on-surface-variant">
                    {taxId === 'income_tax' && (lang === 'ja' ? '給与所得者は毎月天引き（源泉徴収）。自営業・副業等の確定申告分は翌年2月16日〜3月15日に納付。' : lang === 'vi' ? 'Người làm công ty được tự động khấu trừ trừ lương hàng tháng. Cá nhân kinh doanh/việc phụ nộp qua quyết toán từ 16/2 đến 15/3 năm sau.' : 'Salaried employees pay monthly via payroll withholding. Self-employed pay via tax return Feb 16 - Mar 15.')}
                    {taxId === 'resident_tax' && (lang === 'ja' ? '給与天引き（特別徴収: 6月〜翌年5月の12分割）または納付書・口座振替（普通徴収: 6月・8月・10月・翌年1月の年4回）。' : lang === 'vi' ? 'Trừ lương công ty (Tokubetsu Choshu: 12 tháng từ tháng 6 đến tháng 5 năm sau) hoặc giấy báo về nhà nộp 4 đợt (Futsu Choshu: tháng 6, 8, 10 và tháng 1).' : 'Payroll special collection (12 months June-May) or direct billing in 4 installments (June, August, October, January).')}
                    {taxId === 'enterprise_tax' && (lang === 'ja' ? '都道府県税事務所から毎年8月に納税通知書が届き、8月と11月の年2回分割納付。' : lang === 'vi' ? 'Sở thuế tỉnh gửi giấy báo vào tháng 8, nộp chia làm 2 đợt vào tháng 8 và tháng 11.' : 'Prefectural tax office sends bill in August, payable in 2 installments (August and November).')}
                    {taxId === 'consumption_tax' && (lang === 'ja' ? '個人事業者は翌年3月31日までに確定申告・納付。法人は決算期末から2ヶ月以内。' : lang === 'vi' ? 'Cá nhân nộp hạn chót 31/3 năm sau. Doanh nghiệp nộp trong vòng 2 tháng sau ngày khóa sổ tài chính.' : 'Sole proprietors file and pay by March 31 of next year. Corporations within 2 months of fiscal year-end.')}
                    {taxId === 'corporate_tax' && (lang === 'ja' ? '事業年度終了の日の翌日から2ヶ月以内に確定申告・納付。' : lang === 'vi' ? 'Kê khai và nộp trong vòng 2 tháng kể từ ngày kết thúc năm tài chính.' : 'File and pay within 2 months of fiscal year-end.')}
                    {taxId === 'social_insurance' && (lang === 'ja' ? '会社員は毎月の給与から労使折半で天引き。国民健康保険・国民年金は毎月納付書または口座振替。' : lang === 'vi' ? 'Người làm công ty được trừ trực tiếp qua lương 50/50. Bảo hiểm quốc dân đóng hàng tháng qua giấy báo hoặc trừ thẻ.' : 'Salaried employees pay 50% via payroll deduction. National insurance paid monthly via bank transfer or bills.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Level 2 Step-by-Step Trace */}
          {activeTab === 'level2' && (
            <div className="space-y-3">
              <div className="text-xs text-on-surface-variant font-medium">
                {lang === 'ja'
                  ? '入力された数値に基づく実際の計算過程と適用ルール:'
                  : lang === 'vi'
                  ? 'Quá trình tính toán chi tiết từng bước dựa trên đúng các con số bạn đã nhập:'
                  : 'Step-by-step formula trace dynamically generated from your inputs:'}
              </div>

              <div className="space-y-2 font-mono text-xs">
                {level2Traces.map((trace, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-start gap-2 text-on-surface"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{trace}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Level 3 Legal Basis & Links */}
          {activeTab === 'level3' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-on-surface mb-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  {lang === 'ja' ? '根拠法令・条文:' : lang === 'vi' ? 'Căn cứ luật định (Điều khoản luật Nhật Bản):' : 'Statutory Articles & Legal Basis:'}
                </h4>
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle text-xs text-on-surface leading-relaxed">
                  {level3Articles}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  {lang === 'ja' ? '国税庁・公的機関の公式解説リンク:' : lang === 'vi' ? 'Liên kết tra cứu chính thức của Cơ quan Quốc thuế (NTA):' : 'Official Links (National Tax Agency / e-Gov):'}
                </h4>
                <div className="space-y-2">
                  {officialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-border-subtle transition-colors text-xs font-medium text-blue-600 dark:text-blue-400 group"
                    >
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            {t?.closeDrawer || 'Đóng (閉じる)'}
          </button>
        </div>
      </div>
    </div>
  );
}
