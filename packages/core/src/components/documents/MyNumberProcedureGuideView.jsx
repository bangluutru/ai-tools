/**
 * @file MyNumberProcedureGuideView.jsx
 * Comprehensive interactive guide for My Number Card Lifecycle & Electronic Certificates.
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  IdCard,
  ShieldAlert,
  AlertTriangle,
  KeyRound,
  PhoneCall,
  Calendar,
  Clock,
  Smartphone,
  CheckCircle2,
  Lock,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import {
  MYNUMBER_PROCEDURE_TYPES,
  CERTIFICATE_TYPES,
  getAllMyNumberProcedures,
  getMyNumberProcedureGuidance,
} from '../../documents/mynumber/mynumberGuideEngine.js';

export function MyNumberProcedureGuideView({ lang = 'vi' }) {
  const allProcedures = useMemo(() => getAllMyNumberProcedures(), []);
  const [activeProcedureId, setActiveProcedureId] = useState(
    MYNUMBER_PROCEDURE_TYPES.VISA_EXTENSION_RENEWAL
  );

  const selectedProcedure = useMemo(() => {
    return getMyNumberProcedureGuidance(activeProcedureId);
  }, [activeProcedureId]);

  const t = {
    title: {
      ja: 'マイナンバー手続きガイド',
      vi: 'Hướng dẫn thủ tục Thẻ My Number & Chứng thư số',
      en: 'My Number Procedures & Digital Certificates Guide',
    },
    subtitle: {
      ja: '有効期限の延長、電子証明書更新、暗証番号ロック解除、紛失時の緊急停止等を案内します。',
      vi: 'Hướng dẫn gia hạn thẻ khi đổi visa, mở khóa mã PIN, cập nhật địa chỉ và xử lý khẩn cấp khi mất thẻ.',
      en: 'Comprehensive guide for card renewal with visa extension, PIN reset, certificate updates, and lost card actions.',
    },
    dualCertsHeading: {
      ja: '知っておくべき2種類の「電子証明書」の違い',
      vi: 'Phân biệt 2 loại Chứng thư số tích hợp trên thẻ',
      en: 'Two Types of Electronic Certificates on Card',
    },
    procedureSelectHeading: {
      ja: '手続・お困りごとを選択',
      vi: 'Chọn thủ tục hoặc tình huống cần xử lý',
      en: 'Select procedure or issue',
    },
    hotlineBannerHeading: {
      ja: '【緊急】紛失・盗難時の24時間フリーダイヤル',
      vi: '【Khẩn cấp】Tổng đài khóa thẻ 24/7 (Miễn phí cước)',
      en: '【Emergency】24/7 Lost/Stolen Hotline',
    },
    urgentBadge: {
      ja: '要緊急対応',
      vi: 'Rất khẩn cấp',
      en: 'Urgent',
    },
    actionPlanHeading: {
      ja: '具体的な手続きの流れ',
      vi: 'Quy trình thực hiện cụ thể',
      en: 'Action Procedure',
    },
    requiredItemsHeading: {
      ja: '手続きに必要な持ち物',
      vi: 'Hồ sơ, giấy tờ cần mang theo',
      en: 'Required Items to Bring',
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="IdCard"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Urgent Lost Card Alert Banner */}
        <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <PhoneCall className="w-6 h-6 text-error flex-shrink-0 mt-1" />
            <div>
              <span className="text-xs font-bold text-error uppercase tracking-wide">
                {t.hotlineBannerHeading[lang] || t.hotlineBannerHeading.vi}
              </span>
              <h3 className="text-xl font-black text-on-surface mt-0.5 tracking-tight">
                0120-95-0178
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tổng đài hỗ trợ đa ngôn ngữ tiếp nhận 24/7/365 để tạm khóa thẻ ngay lập tức khi đánh rơi hoặc bị mất cắp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveProcedureId(MYNUMBER_PROCEDURE_TYPES.LOST_OR_STOLEN)}
            className="px-4 py-2 bg-error text-on-error rounded-xl text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>Xem hướng dẫn xử lý mất thẻ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Educational Section: The 2 Electronic Certificate Types */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t.dualCertsHeading[lang] || t.dualCertsHeading.vi}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Signature Cert */}
            <div className="bg-surface rounded-xl p-5 border border-outline-variant/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Ký số điện tử
                </span>
                <span className="text-xs text-error font-medium">Bị khóa sau 5 lần sai</span>
              </div>
              <h4 className="text-sm font-bold text-on-surface">
                {CERTIFICATE_TYPES.SIGNATURE_CERT.nameJa}
              </h4>
              <p className="text-xs text-on-surface-variant">
                {CERTIFICATE_TYPES.SIGNATURE_CERT.nameI18n[lang] ||
                  CERTIFICATE_TYPES.SIGNATURE_CERT.nameI18n.vi}
              </p>
              <div className="pt-2 border-t border-outline-variant/40 text-xs space-y-1">
                <p className="text-on-surface">
                  <span className="font-semibold">Định dạng PIN: </span>
                  {CERTIFICATE_TYPES.SIGNATURE_CERT.pinFormatI18n[lang] ||
                    CERTIFICATE_TYPES.SIGNATURE_CERT.pinFormatI18n.vi}
                </p>
                <p className="text-error font-medium">
                  ⚠ Tự động BỊ HỦY khi chuyển nhà hoặc đổi họ tên! Cần làm lại tại Tòa thị chính.
                </p>
              </div>
            </div>

            {/* User Auth Cert */}
            <div className="bg-surface rounded-xl p-5 border border-outline-variant/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                  Xác thực danh tính
                </span>
                <span className="text-xs text-error font-medium">Bị khóa sau 3 lần sai</span>
              </div>
              <h4 className="text-sm font-bold text-on-surface">
                {CERTIFICATE_TYPES.USER_AUTH_CERT.nameJa}
              </h4>
              <p className="text-xs text-on-surface-variant">
                {CERTIFICATE_TYPES.USER_AUTH_CERT.nameI18n[lang] ||
                  CERTIFICATE_TYPES.USER_AUTH_CERT.nameI18n.vi}
              </p>
              <div className="pt-2 border-t border-outline-variant/40 text-xs space-y-1">
                <p className="text-on-surface">
                  <span className="font-semibold">Định dạng PIN: </span>
                  {CERTIFICATE_TYPES.USER_AUTH_CERT.pinFormatI18n[lang] ||
                    CERTIFICATE_TYPES.USER_AUTH_CERT.pinFormatI18n.vi}
                </p>
                <p className="text-secondary font-medium">
                  ✓ Không bị hủy khi chuyển nhà, dùng để đăng nhập MynaPortal & in giấy tờ ở Combini.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Procedure Grid / Selector */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            {t.procedureSelectHeading[lang] || t.procedureSelectHeading.vi}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allProcedures.map((proc) => {
              const isSelected = activeProcedureId === proc.id;
              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => setActiveProcedureId(proc.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                      : 'bg-surface border-outline-variant text-on-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold">
                      {proc.urgencyLevel === 'critical' && (
                        <span className="text-error">🚨 {t.urgentBadge[lang] || t.urgentBadge.vi}</span>
                      )}
                      {proc.urgencyLevel === 'high' && (
                        <span className="text-warning-strong">⚠️ Chú ý hạn chót</span>
                      )}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>

                  <h5 className="text-sm font-bold mt-2">
                    {proc.titleJa}
                  </h5>
                  <p className="text-xs text-on-surface-variant font-normal mt-1">
                    {proc.titleI18n[lang] || proc.titleI18n.vi}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Detailed Selected Procedure Guidance */}
        {selectedProcedure && (
          <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface">
                {selectedProcedure.titleJa}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {selectedProcedure.titleI18n[lang] || selectedProcedure.titleI18n.vi}
              </p>
            </div>

            {/* Warning / Critical Banner */}
            {selectedProcedure.warningNoticeI18n && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-xs text-error font-medium leading-relaxed">
                {selectedProcedure.warningNoticeI18n[lang] || selectedProcedure.warningNoticeI18n.vi}
              </div>
            )}

            {/* Invalidation warning for address change */}
            {selectedProcedure.invalidationWarningJa && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning-strong font-medium leading-relaxed">
                {selectedProcedure.invalidationWarningJa}
              </div>
            )}

            {/* Grace period rule */}
            {selectedProcedure.gracePeriodRuleJa && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 text-xs text-primary font-medium leading-relaxed">
                {selectedProcedure.gracePeriodRuleJa}
              </div>
            )}

            {/* Required items */}
            {selectedProcedure.requiredItemsI18n && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide">
                  {t.requiredItemsHeading[lang] || t.requiredItemsHeading.vi}:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(selectedProcedure.requiredItemsI18n[lang] || selectedProcedure.requiredItemsI18n.vi).map(
                    (item, idx) => (
                      <li
                        key={idx}
                        className="bg-surface p-2.5 rounded-lg border border-outline-variant/60 flex items-center gap-2 text-on-surface"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Steps */}
            {selectedProcedure.stepsJa && (
              <div className="space-y-3 pt-4 border-t border-outline-variant/60">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide">
                  {t.actionPlanHeading[lang] || t.actionPlanHeading.vi}:
                </h4>
                <div className="space-y-2">
                  {selectedProcedure.stepsJa.map((stepText, idx) => (
                    <div
                      key={idx}
                      className="bg-surface p-3.5 rounded-xl border border-outline-variant/60 flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        {stepText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery Channels for PIN */}
            {selectedProcedure.recoveryChannelsJa && (
              <div className="space-y-2 pt-4 border-t border-outline-variant/60 text-xs">
                <h4 className="font-bold text-on-surface">Kênh thực hiện đặt lại mã PIN:</h4>
                {selectedProcedure.recoveryChannelsJa.map((ch, idx) => (
                  <p key={idx} className="bg-surface p-3 rounded-lg border border-outline-variant/60 text-on-surface-variant">
                    {ch}
                  </p>
                ))}
              </div>
            )}

            {/* Smartphone differences */}
            {selectedProcedure.platformDifferencesJa && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/60 text-xs">
                <div className="bg-surface p-4 rounded-xl border border-outline-variant/60 space-y-1">
                  <span className="font-bold text-primary">Android</span>
                  <p className="text-on-surface-variant leading-relaxed">
                    {selectedProcedure.platformDifferencesJa.android}
                  </p>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-outline-variant/60 space-y-1">
                  <span className="font-bold text-primary">iPhone (iOS)</span>
                  <p className="text-on-surface-variant leading-relaxed">
                    {selectedProcedure.platformDifferencesJa.iphone}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </StandardToolLayout>
  );
}

export default MyNumberProcedureGuideView;
