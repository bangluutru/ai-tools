import React from 'react';
import { ShieldCheck, Infinity as InfinityIcon, Code2 } from 'lucide-react';

export default function HeroBanner({ displayLang = 'vi' }) {
  const content = {
    vi: {
      tag: 'Hạ Tầng Micro-Engine v2.4',
      storage: 'Zero Server Storage',
      titlePrefix: 'Bộ Công Cụ Xử Lý ',
      titleHighlight: 'PDF, Ảnh & Dữ Liệu',
      titleSuffix: ' Thông Minh',
      desc: 'Miniapp Hub với kiến trúc minh bạch nơi xử lý dữ liệu: công cụ client-side bảo mật tuyệt đối với WebAssembly và mô-đun AI backend phân loại rõ ràng.',
      trust1: 'Client-side 100% riêng tư',
      trust2: 'Không giới hạn dung lượng',
      trust3: 'Mã nguồn mở & Tự do',
    },
    en: {
      tag: 'Micro-Engine v2.4 Architecture',
      storage: 'Zero Server Storage',
      titlePrefix: 'Smart Utility Suite for ',
      titleHighlight: 'PDF, Images & Data',
      titleSuffix: '',
      desc: 'Miniapp Workspace with transparent execution architecture: client-side privacy via WebAssembly and classified AI cloud modules.',
      trust1: '100% Client-side Private',
      trust2: 'Unlimited File Size',
      trust3: 'Open Source & Freedom',
    },
    ja: {
      tag: 'マイクロエンジン v2.4 基盤',
      storage: 'サーバー保存ゼロ',
      titlePrefix: 'スマート ',
      titleHighlight: 'PDF・画像・データ',
      titleSuffix: ' 処理ツールスイート',
      desc: '処理先を明示した透明なワークスペース：WebAssemblyによる端末内ローカル処理とAIクラウドモジュールを明確に分類。',
      trust1: '100% 端末内プライベート',
      trust2: 'ファイル容量無制限',
      trust3: 'オープンソース＆自由',
    }
  }[displayLang] || content.vi;

  return (
    <div className="relative w-full pb-6 overflow-hidden">
      {/* Visual Scrim & Ambience */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[840px] h-[340px] bg-gradient-to-b from-primary-container/15 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2 pb-6">
        <div className="max-w-3xl space-y-3">
          {/* Micro-Engine Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase font-semibold">
              {content.tag}
            </span>
            <span className="text-outline text-xs">|</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              {content.storage}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-on-surface tracking-tight leading-tight sm:leading-[48px]">
            {content.titlePrefix}
            <span
              className="bg-gradient-to-r from-primary via-brand-cyan-bright to-secondary bg-clip-text text-transparent font-extrabold"
              style={{
                background: 'linear-gradient(90deg, #89ceff 0%, #38BDF8 50%, #4edea3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              {content.titleHighlight}
            </span>
            {content.titleSuffix}
          </h1>

          {/* Description */}
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
            {content.desc}
          </p>
        </div>

        {/* Live Trust Badges Pill Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm transition-colors">
            <ShieldCheck size={18} className="text-secondary shrink-0" />
            <span>{content.trust1}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm transition-colors">
            <InfinityIcon size={18} className="text-primary shrink-0" />
            <span>{content.trust2}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm transition-colors">
            <Code2 size={18} className="text-tertiary shrink-0" />
            <span>{content.trust3}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
