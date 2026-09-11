import React from 'react';
import ScenicLandscapeIllustration from '../assets/illustrations/ScenicLandscapeIllustration';

/**
 * HeroScenicBanner — Khu vực chào mừng nghệ thuật mặt tiền của Toolio Hub
 * Chiều cao tinh gọn ~140px - 160px (~2.5 lần Navbar)
 * Kết hợp phong cảnh Á Đông đối xứng:
 * - Cánh trái: Núi Phú Sĩ tuyết phủ & hoa anh đào Sakura (Đại diện cho Nhật Bản)
 * - Cánh phải: Chùa Một Cột vươn trên đài sen & rặng tre ngọc bích (Đại diện cho Việt Nam)
 * - Trung tâm: Tiêu đề "Công cụ hữu ích cho cuộc sống" trang trọng, hài hòa
 */

export default function HeroScenicBanner({ displayLang = 'vi' }) {
  const titles = {
    vi: 'Công cụ hữu ích cho cuộc sống',
    en: 'Useful tools for everyday life',
    ja: '暮らしに役立つ実用ツール',
  };

  const currentTitle = titles[displayLang] || titles.vi;

  return (
    <section className="relative overflow-hidden rounded-3xl h-[135px] sm:h-[150px] md:h-[160px] border border-border-subtle/70 shadow-xs transition-all duration-300 group">
      {/* 1. Artwork phong cảnh toàn cảnh sắc nét (Phú Sĩ bên trái, Chùa Một Cột bên phải) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <ScenicLandscapeIllustration />
      </div>

      {/* 2. Tiêu đề trung tâm trang nhã, cân đối */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4 sm:px-8 text-center pointer-events-none">
        <h1 className="font-title-lg text-xl sm:text-2xl md:text-[28px] lg:text-[30px] font-extrabold text-on-surface tracking-tight leading-snug drop-shadow-xs max-w-2xl">
          {currentTitle}
        </h1>
      </div>
    </section>
  );
}
