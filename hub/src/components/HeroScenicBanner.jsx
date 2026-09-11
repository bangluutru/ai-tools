import React from 'react';
import ScenicLandscapeIllustration from '../assets/illustrations/ScenicLandscapeIllustration';

/**
 * HeroScenicBanner — Khu vực chào mừng nghệ thuật mặt tiền của Toolio Hub
 * Kết hợp bức tranh phong cảnh Á Đông (Núi Phú Sĩ, Chùa 5 tầng, Hoa Sakura, Mascot Ninja bay)
 * cùng khối tiêu đề trung tâm truyền cảm hứng.
 */

export default function HeroScenicBanner({ displayLang = 'vi' }) {
  const content = {
    vi: {
      title: 'Công cụ hữu ích cho cuộc sống thực tế',
      subtitle: 'Tính toán, kiểm tra, chuẩn bị và tìm hiểu — tất cả trong một nơi.',
    },
    en: {
      title: 'Useful tools for real-life tasks',
      subtitle: 'Calculate, verify, prepare, and discover — all in one unified workspace.',
    },
    ja: {
      title: '実際の生活に役立つ実用ツール',
      subtitle: '計算、確認、準備、手続き — すべてをひとつの場所で。',
    },
  };

  const current = content[displayLang] || content.vi;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface-subtle/50 via-surface-canvas to-surface-canvas border border-border-subtle/60 shadow-xs transition-all duration-300">
      {/* 1. Artwork phong cảnh toàn cảnh sắc nét */}
      <div className="w-full relative z-0">
        <ScenicLandscapeIllustration displayLang={displayLang} />
      </div>

      {/* 2. Khối tiêu đề và phụ đề trung tâm */}
      <div className="relative z-10 px-4 sm:px-8 pb-7 pt-1 sm:pt-2 text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="font-title-lg text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-on-surface tracking-tight leading-snug">
          {current.title}
        </h1>
        <p className="font-body-sm text-xs sm:text-sm lg:text-[15px] text-on-surface-variant font-normal leading-relaxed max-w-xl mx-auto">
          {current.subtitle}
        </p>
      </div>

      {/* Gradient mờ chân hero tạo chuyển tiếp mềm mại xuống các thẻ danh mục */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface-canvas to-transparent pointer-events-none" />
    </section>
  );
}
