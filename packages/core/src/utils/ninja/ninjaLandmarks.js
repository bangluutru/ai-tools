/**
 * @file packages/core/src/utils/ninja/ninjaLandmarks.js
 * ============================================================================
 * Toolio Ninja Run — Procedural Canvas 2D Vector Landmarks & Monster Renderer.
 *
 * Vẽ chi tiết nhận diện rõ ràng các biểu tượng văn hóa & danh thắng Nhật - Việt:
 * - Vịnh Hạ Long: Hòn Trống Mái chân thắt eo, thuyền buồm cánh dơi, núi Karst.
 * - Tokyo & Phú Sĩ: Núi Phú Sĩ tuyết phủ răng cưa, Tokyo Skytree, Cổng Torii, Sakura.
 * - Phố Cổ Hội An: Chùa Cầu mái ngói cong, nhà cổ tường vàng, giàn hoa giấy, đèn lồng.
 * - Sài Gòn: Landmark 81 bó tre, tháp Búp Sen Bitexco, cầu Ba Son dây văng.
 *
 * Đồng thời vẽ vector hoạt họa chi tiết cho 10 quái vật bài toán văn phòng Toolio.
 * ============================================================================
 */

/* ============================================================================
 * 1. TOKYO & NÚI PHÚ SĨ (NHẬT BẢN)
 * ============================================================================ */

/**
 * Núi Phú Sĩ tuyết phủ với vầng thái dương Ukiyo-e và dải mây cuộn Yamato-e
 */
export function drawMountFuji(ctx, x, groundY) {
  ctx.save();
  const peakY = groundY - 128;
  const baseY = groundY;
  const baseHalfWidth = 175;
  const peakHalfWidth = 30;

  // 1. Vầng thái dương đỏ rực (Rising Sun) khổng lồ phong cách mộc bản Nhật Bản
  const sunGrad = ctx.createLinearGradient(x, peakY - 45, x, peakY + 45);
  sunGrad.addColorStop(0, '#f43f5e');
  sunGrad.addColorStop(0.6, '#dc2626');
  sunGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(x, peakY - 12, 42, 0, Math.PI * 2);
  ctx.fill();

  // Quầng hào quang thái dương tỏa rộng mềm mại
  ctx.fillStyle = 'rgba(254, 205, 211, 0.22)';
  ctx.beginPath();
  ctx.arc(x, peakY - 12, 60, 0, Math.PI * 2);
  ctx.fill();

  // 2. Thân núi hùng vĩ với gradient ánh hoàng hôn/bình minh mộc bản Ukiyo-e
  const mtnGrad = ctx.createLinearGradient(x - baseHalfWidth, baseY, x + baseHalfWidth, peakY);
  mtnGrad.addColorStop(0, '#1e1b4b');
  mtnGrad.addColorStop(0.55, '#312e81');
  mtnGrad.addColorStop(1, '#4338ca');

  ctx.fillStyle = mtnGrad;
  ctx.beginPath();
  ctx.moveTo(x - baseHalfWidth, baseY);
  ctx.quadraticCurveTo(x - 85, baseY - 48, x - peakHalfWidth, peakY);
  ctx.lineTo(x + peakHalfWidth, peakY);
  ctx.quadraticCurveTo(x + 85, baseY - 48, x + baseHalfWidth, baseY);
  ctx.closePath();
  ctx.fill();

  // 3. Nón tuyết trắng đỉnh núi có các đường răng cưa tự nhiên
  const snowBaseY = peakY + 40;
  const snowGrad = ctx.createLinearGradient(x, peakY, x, snowBaseY);
  snowGrad.addColorStop(0, '#ffffff');
  snowGrad.addColorStop(0.7, '#f0fdf4');
  snowGrad.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = snowGrad;
  ctx.beginPath();
  ctx.moveTo(x - peakHalfWidth, peakY);
  ctx.lineTo(x + peakHalfWidth, peakY);
  // Các vệt tuyết tan răng cưa tự nhiên uốn lượn xuống sườn dốc
  ctx.lineTo(x + 44, snowBaseY - 8);
  ctx.lineTo(x + 34, snowBaseY);
  ctx.lineTo(x + 22, snowBaseY - 12);
  ctx.lineTo(x + 10, snowBaseY + 6);
  ctx.lineTo(x, snowBaseY - 10);
  ctx.lineTo(x - 12, snowBaseY + 7);
  ctx.lineTo(x - 22, snowBaseY - 8);
  ctx.lineTo(x - 34, snowBaseY + 2);
  ctx.lineTo(x - 44, snowBaseY - 6);
  ctx.closePath();
  ctx.fill();

  // 4. Dải mây cuộn Ukiyo-e ngang lưng chừng núi (Yamato-e / Kumadori clouds)
  const drawUkiyoeCloud = (cx, cy, scale) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Thân mây trắng ngà xếp lớp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-24, 0, 10, 0, Math.PI * 2);
    ctx.arc(-10, -5, 13, 0, Math.PI * 2);
    ctx.arc(8, -4, 12, 0, Math.PI * 2);
    ctx.arc(24, 1, 9, 0, Math.PI * 2);
    ctx.fill();

    // Viền vàng kim nghệ thuật phong cách tranh cổ Hokusai
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  };

  drawUkiyoeCloud(x - 90, peakY + 54, 1.1);
  drawUkiyoeCloud(x + 85, peakY + 62, 0.95);

  ctx.restore();
}

/**
 * Chùa 5 tầng Nhật Bản (Gojūnotō Five-Story Pagoda)
 * Kiến trúc mái ngói cong 5 tầng xếp lớp, cột đỏ son và ngọn sōrin đồng 9 vòng tròn.
 */
export function drawGojunotoPagoda(ctx, x, groundY) {
  ctx.save();
  const y = groundY;
  const totalH = 150;

  // Bệ đá móng chùa (Kidan)
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 26, y - 8, 52, 8);
  ctx.fillStyle = '#475569';
  ctx.fillRect(x - 22, y - 12, 44, 4);

  // 5 Tầng mái ngói cong xếp lớp giật cấp từ lớn đến nhỏ
  const tiers = [
    { w: 46, h: 10, eaveY: y - 24, colH: 14 },
    { w: 40, h: 9, eaveY: y - 44, colH: 12 },
    { w: 34, h: 9, eaveY: y - 64, colH: 12 },
    { w: 28, h: 8, eaveY: y - 83, colH: 11 },
    { w: 22, h: 8, eaveY: y - 101, colH: 11 },
  ];

  for (const tier of tiers) {
    // Cột trụ sơn đỏ son và tường gỗ nâu
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x - tier.w * 0.35, tier.eaveY, tier.w * 0.7, tier.colH);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - tier.w * 0.35 + 2, tier.eaveY, 3, tier.colH);
    ctx.fillRect(x + tier.w * 0.35 - 5, tier.eaveY, 3, tier.colH);

    // Mái ngói cong vút hai đầu (Nokiba)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x - tier.w / 2 - 6, tier.eaveY);
    ctx.quadraticCurveTo(x, tier.eaveY - 4, x + tier.w / 2 + 6, tier.eaveY);
    ctx.lineTo(x + tier.w / 2 + 4, tier.eaveY - tier.h);
    ctx.quadraticCurveTo(x, tier.eaveY - tier.h - 3, x - tier.w / 2 - 4, tier.eaveY - tier.h);
    ctx.closePath();
    ctx.fill();

    // Viền vàng kim đầu mái cong
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x - tier.w / 2 - 5, tier.eaveY - 1, 2, 0, Math.PI * 2);
    ctx.arc(x + tier.w / 2 + 5, tier.eaveY - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ngọn tháp đồng sōrin linh thiêng đỉnh chùa (9 vòng đồng Kurumahō)
  const spireBaseY = y - 109;
  const spireTopY = y - totalH;

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, spireBaseY);
  ctx.lineTo(x, spireTopY);
  ctx.stroke();

  // 9 Vòng tròn đồng nhỏ xếp trên ngọn sōrin
  ctx.fillStyle = '#fbbf24';
  for (let i = 0; i < 9; i++) {
    const ringY = spireBaseY - 6 - i * 3.2;
    const ringW = 7 - i * 0.3;
    ctx.fillRect(x - ringW / 2, ringY, ringW, 1.5);
  }

  // Viên ngọc Hōju rực sáng đỉnh tháp
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(x, spireTopY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}


/**
 * Tháp truyền hình Tokyo Skytree kết cấu mắt cáo đan chéo vươn cao
 */
export function drawTokyoSkytree(ctx, x, groundY, time = 0) {
  ctx.save();
  const topY = groundY - 195;
  const baseY = groundY;

  // Thân tháp thon dần từ chân lên đỉnh
  const towerGrad = ctx.createLinearGradient(x, topY, x, baseY);
  towerGrad.addColorStop(0, '#e0e7ff');
  towerGrad.addColorStop(0.5, '#c7d2fe');
  towerGrad.addColorStop(1, '#4338ca');

  ctx.fillStyle = towerGrad;
  ctx.beginPath();
  ctx.moveTo(x - 16, baseY);
  ctx.lineTo(x - 4, topY + 45);
  ctx.lineTo(x + 4, topY + 45);
  ctx.lineTo(x + 16, baseY);
  ctx.closePath();
  ctx.fill();

  // Kẻ mắt cáo đan chéo cấu trúc thép
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  for (let y = baseY - 12; y > topY + 48; y -= 16) {
    const w = ((y - topY) / (baseY - topY)) * 14;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x + w, y - 10);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x - w, y - 10);
    ctx.stroke();
  }

  // Đài quan sát 1 (Tembo Deck 350m)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 14, topY + 80, 28, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(x - 12, topY + 84, 24, 4);

  // Đài quan sát 2 (Tembo Galleria 450m)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 9, topY + 50, 18, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(x - 8, topY + 53, 16, 3);

  // Kim thu lôi / Anten đỉnh tháp
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, topY + 45);
  ctx.lineTo(x, topY);
  ctx.stroke();

  // Đèn chớp đỏ an toàn hàng không
  const beaconOn = Math.sin(time * 4) > 0;
  if (beaconOn) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, topY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Cổng Torii đền Thần Đạo truyền thống Nhật Bản (kèm dây bện Shimenawa & dải giấy Shide)
 */
export function drawToriiGate(ctx, x, groundY) {
  ctx.save();
  const h = 88;
  const w = 78;
  const y = groundY;

  // Kasagi (Xà ngang trên uốn cong nhẹ hai đầu)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 12, y - h);
  ctx.quadraticCurveTo(x, y - h - 10, x + w / 2 + 12, y - h);
  ctx.lineTo(x + w / 2 + 14, y - h + 9);
  ctx.quadraticCurveTo(x, y - h + 1, x - w / 2 - 14, y - h + 9);
  ctx.closePath();
  ctx.fill();

  // Mũ đen trên xà ngang (Shimaki)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 14, y - h - 3);
  ctx.quadraticCurveTo(x, y - h - 13, x + w / 2 + 14, y - h - 3);
  ctx.lineTo(x + w / 2 + 12, y - h);
  ctx.quadraticCurveTo(x, y - h - 10, x - w / 2 - 12, y - h);
  ctx.closePath();
  ctx.fill();

  // Nuki (Thanh xà ngang thứ hai)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x - w / 2 - 6, y - h + 16, w + 12, 8);

  // Trụ cột tròn đỏ son
  const colGrad = ctx.createLinearGradient(x - w / 2, y, x - w / 2 + 9, y);
  colGrad.addColorStop(0, '#ef4444');
  colGrad.addColorStop(0.5, '#dc2626');
  colGrad.addColorStop(1, '#991b1b');

  ctx.fillStyle = colGrad;
  ctx.fillRect(x - w / 2 + 8, y - h + 8, 9, h - 8);
  ctx.fillRect(x + w / 2 - 17, y - h + 8, 9, h - 8);

  // Bệ đá đen chân cột (Kamebara)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - w / 2 + 6, y - 8, 13, 8);
  ctx.fillRect(x + w / 2 - 19, y - 8, 13, 8);

  // Bảng tên vàng ở giữa (Gakuzuka)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 7, y - h + 7, 14, 16);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 6, y - h + 8, 12, 14);

  // Dây rơm bện thiêng liêng (Shimenawa) uốn lượn dưới thanh Nuki
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 17, y - h + 24);
  ctx.quadraticCurveTo(x, y - h + 31, x + w / 2 - 17, y - h + 24);
  ctx.stroke();

  // Dải giấy trắng gấp nếp Shide linh thiêng
  const drawShide = (sx, sy) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy);
    ctx.lineTo(sx + 3, sy + 3);
    ctx.lineTo(sx - 2, sy + 6);
    ctx.lineTo(sx + 3, sy + 10);
    ctx.lineTo(sx, sy + 10);
    ctx.lineTo(sx - 4, sy + 6);
    ctx.lineTo(sx + 1, sy + 3);
    ctx.closePath();
    ctx.fill();
  };
  drawShide(x - 16, y - h + 27);
  drawShide(x, y - h + 29);
  drawShide(x + 16, y - h + 27);

  ctx.restore();
}

/**
 * Cây hoa anh đào (Sakura) nở rộ mùa xuân Nhật Bản
 */
export function drawSakuraTree(ctx, x, groundY) {
  ctx.save();
  // Thân cây bonsai uốn lượn
  const trunkGrad = ctx.createLinearGradient(x, groundY, x + 20, groundY - 70);
  trunkGrad.addColorStop(0, '#451a03');
  trunkGrad.addColorStop(1, '#78350f');

  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(x - 8, groundY);
  ctx.quadraticCurveTo(x - 2, groundY - 35, x - 12, groundY - 60);
  ctx.lineTo(x - 4, groundY - 62);
  ctx.quadraticCurveTo(x + 4, groundY - 35, x + 12, groundY);
  ctx.closePath();
  ctx.fill();

  // Tán hoa bồng bềnh nhiều cụm sắc hồng
  const drawBlossom = (bx, by, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  };

  drawBlossom(x - 18, groundY - 75, 24, '#f472b6');
  drawBlossom(x + 14, groundY - 80, 26, '#f472b6');
  drawBlossom(x - 2, groundY - 95, 28, '#fda4af');
  drawBlossom(x - 14, groundY - 78, 20, '#fbcfe8');
  drawBlossom(x + 12, groundY - 82, 22, '#fbcfe8');
  drawBlossom(x - 2, groundY - 96, 24, '#ffffff');

  ctx.restore();
}

/**
 * Cây lá phong đỏ Momiji mùa thu Nhật Bản
 * Thân cây bonsai sẫm màu và các tán lá đỏ rực, cam cháy phong cách tranh khắc gỗ Ukiyo-e
 */
export function drawMomijiTree(ctx, x, groundY) {
  ctx.save();
  // Thân cây bonsai uốn lượn tự nhiên
  const trunkGrad = ctx.createLinearGradient(x, groundY, x - 18, groundY - 65);
  trunkGrad.addColorStop(0, '#292524');
  trunkGrad.addColorStop(1, '#57534e');

  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(x + 7, groundY);
  ctx.quadraticCurveTo(x + 2, groundY - 30, x + 10, groundY - 58);
  ctx.lineTo(x + 3, groundY - 60);
  ctx.quadraticCurveTo(x - 5, groundY - 30, x - 7, groundY);
  ctx.closePath();
  ctx.fill();

  // Cành vươn ngang
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 6, groundY - 45);
  ctx.lineTo(x - 20, groundY - 68);
  ctx.moveTo(x + 8, groundY - 52);
  ctx.lineTo(x + 26, groundY - 72);
  ctx.stroke();

  // Tán lá đỏ thắm Momiji nhiều lớp chuyển màu
  const drawMomijiCluster = (bx, by, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    // Vài đốm lá điểm xuyết
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(bx + r * 0.3, by - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  };

  drawMomijiCluster(x - 24, groundY - 72, 22, '#991b1b');
  drawMomijiCluster(x + 22, groundY - 76, 24, '#dc2626');
  drawMomijiCluster(x - 2, groundY - 92, 26, '#ef4444');
  drawMomijiCluster(x - 14, groundY - 80, 18, '#f97316');
  drawMomijiCluster(x + 12, groundY - 84, 20, '#ea580c');
  drawMomijiCluster(x - 2, groundY - 96, 22, '#f59e0b');

  ctx.restore();
}


/* ============================================================================
 * 2. VỊNH HẠ LONG (VIỆT NAM)
 * ============================================================================ */

/**
 * Hòn Trống Mái (Kissing Rocks) — Biểu tượng kỳ quan thiên nhiên Vịnh Hạ Long
 */
export function drawTrongMaiRocks(ctx, x, groundY, time = 0) {
  ctx.save();
  const waterY = groundY;

  // 1. Hòn Trống (Trống Rock - Trụ đá bên trái, cao dõng dạc, ức phồng, mỏ vươn sang phải)
  const tx = x - 26;
  const trongGrad = ctx.createLinearGradient(tx - 30, waterY, tx + 20, waterY - 115);
  trongGrad.addColorStop(0, '#1e293b');
  trongGrad.addColorStop(0.5, '#334155');
  trongGrad.addColorStop(1, '#475569');

  ctx.fillStyle = trongGrad;
  ctx.beginPath();
  // Chân thắt eo đặc thù nơi sóng biển ăn mòn ngàn năm
  ctx.moveTo(tx - 10, waterY);
  ctx.quadraticCurveTo(tx - 34, waterY - 45, tx - 28, waterY - 85);
  ctx.quadraticCurveTo(tx - 15, waterY - 118, tx + 6, waterY - 112);
  ctx.lineTo(tx + 12, waterY - 92);
  ctx.quadraticCurveTo(tx + 4, waterY - 45, tx + 6, waterY);
  ctx.closePath();
  ctx.fill();

  // Thảm thực vật xanh rêu trên đỉnh Hòn Trống
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(tx - 12, waterY - 114, 10, 0, Math.PI * 2);
  ctx.arc(tx - 2, waterY - 118, 9, 0, Math.PI * 2);
  ctx.arc(tx - 22, waterY - 96, 7, 0, Math.PI * 2);
  ctx.fill();

  // 2. Hòn Mái (Mái Rock - Trụ đá bên phải, bầu bĩnh, nghiêng đầu sát gần mỏ Hòn Trống)
  const mx = x + 24;
  const maiGrad = ctx.createLinearGradient(mx - 15, waterY, mx + 25, waterY - 100);
  maiGrad.addColorStop(0, '#1e293b');
  maiGrad.addColorStop(0.5, '#334155');
  maiGrad.addColorStop(1, '#475569');

  ctx.fillStyle = maiGrad;
  ctx.beginPath();
  ctx.moveTo(mx - 8, waterY);
  // Vách nghiêng sát chạm Hòn Trống như đang hôn nhau
  ctx.quadraticCurveTo(mx - 18, waterY - 45, mx - 12, waterY - 90);
  ctx.quadraticCurveTo(mx - 6, waterY - 106, mx + 12, waterY - 100);
  ctx.quadraticCurveTo(mx + 28, waterY - 60, mx + 8, waterY);
  ctx.closePath();
  ctx.fill();

  // Thảm thực vật xanh trên Hòn Mái
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.arc(mx + 2, waterY - 104, 8, 0, Math.PI * 2);
  ctx.arc(mx + 12, waterY - 100, 7, 0, Math.PI * 2);
  ctx.fill();

  // 3. Bọt sóng trắng vỗ quanh chân đá
  const waveBob = Math.sin(time * 2.2) * 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(tx - 2, waterY + waveBob, 14, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(mx, waterY - waveBob, 13, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vệt phản chiếu ngọc bích trên mặt nước
  ctx.fillStyle = 'rgba(6, 95, 70, 0.35)';
  ctx.fillRect(tx - 32, waterY, 84, 16);

  ctx.restore();
}

/**
 * Thuyền buồm truyền thống Vịnh Hạ Long với 3 cánh buồm cánh dơi nâu đỏ
 */
export function drawHaLongJunkBoat(ctx, x, groundY, time = 0) {
  ctx.save();
  const bob = Math.sin(time * 1.8 + x * 0.01) * 3;
  const y = groundY - 6 + bob;

  // Thân thuyền gỗ
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.quadraticCurveTo(x - 20, y + 10, x + 24, y + 10);
  ctx.lineTo(x + 32, y);
  ctx.quadraticCurveTo(x, y + 4, x - 30, y);
  ctx.closePath();
  ctx.fill();

  // Viền mạn thuyền đỏ gạch
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3 Cột buồm gỗ
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 14, y - 55);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 4, y - 72);
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + 20, y - 48);
  ctx.stroke();

  // Cờ đỏ sao vàng Việt Nam tung bay trên đỉnh cột buồm chính
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 72);
  ctx.lineTo(x + 16, y - 68);
  ctx.lineTo(x + 4, y - 64);
  ctx.closePath();
  ctx.fill();
  // Ngôi sao vàng trên cờ
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x + 8, y - 68, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 3 Cánh buồm nan cánh dơi nâu đỏ (Batwing Sails)
  const drawSail = (sx, sy, w, h) => {
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + w, sy + h * 0.4, sx + w * 0.8, sy + h);
    ctx.lineTo(sx, sy + h);
    ctx.closePath();
    ctx.fill();

    // Nan tre đan cánh dơi
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + (h / 4) * i);
      ctx.lineTo(sx + w * 0.85, sy + (h / 4) * i);
      ctx.stroke();
    }
  };

  drawSail(x - 14, y - 52, 16, 42);
  drawSail(x + 4, y - 68, 22, 54);
  drawSail(x + 20, y - 46, 14, 36);

  // Vệt rẽ sóng trắng
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 32, y + 2);
  ctx.lineTo(x + 44, y + 4);
  ctx.moveTo(x - 30, y + 4);
  ctx.lineTo(x - 48, y + 6);
  ctx.stroke();

  ctx.restore();
}

/**
 * Đảo đá vôi Karst Hạ Long đa tầng
 */
export function drawHaLongKarsts(ctx, x, groundY) {
  ctx.save();
  const karstGrad = ctx.createLinearGradient(x - 70, groundY, x + 70, groundY - 120);
  karstGrad.addColorStop(0, '#0f172a');
  karstGrad.addColorStop(0.6, '#1e293b');
  karstGrad.addColorStop(1, '#064e3b');

  ctx.fillStyle = karstGrad;
  ctx.beginPath();
  ctx.moveTo(x - 70, groundY);
  ctx.quadraticCurveTo(x - 40, groundY - 110, x - 10, groundY - 100);
  ctx.quadraticCurveTo(x + 30, groundY - 115, x + 70, groundY);
  ctx.closePath();
  ctx.fill();

  // Đỉnh núi phủ cây xanh
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x - 15, groundY - 102, 14, 0, Math.PI * 2);
  ctx.arc(x + 15, groundY - 104, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Ruộng bậc thang Mù Cang Chải / Sa Pa & Nón Lá Việt Nam
 * Các đường cong đồng mức mềm mại xếp tầng, dải chuyển màu mạ non sang lúa chín,
 * mặt nước lấp lánh phản chiếu và hình bóng nón lá tre truyền thống.
 */
export function drawTerracedFields(ctx, x, groundY) {
  ctx.save();
  const y = groundY;
  const w = 180;

  // 1. Dãy sườn đồi với các bậc thang uốn lượn nhiều tầng
  const tiers = [
    { dy: 68, c1: '#059669', c2: '#10b981', waterW: 130 }, // Tầng cao nhất: Mạ non xanh biếc
    { dy: 46, c1: '#16a34a', c2: '#22c55e', waterW: 150 }, // Tầng giữa: Lúa thì con gái
    { dy: 24, c1: '#ca8a04', c2: '#eab308', waterW: 165 }, // Tầng dưới: Lúa ngả vàng chín óng
    { dy: 6,  c1: '#b45309', c2: '#d97706', waterW: 175 }, // Bậc chân ruộng: Vàng rực mùa gặt
  ];

  for (const t of tiers) {
    const tierGrad = ctx.createLinearGradient(x - w / 2, y - t.dy, x + w / 2, y);
    tierGrad.addColorStop(0, t.c1);
    tierGrad.addColorStop(1, t.c2);

    ctx.fillStyle = tierGrad;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x - w / 4, y - t.dy, x, y - t.dy + 6);
    ctx.quadraticCurveTo(x + w / 4, y - t.dy - 8, x + w / 2, y - t.dy + 4);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();

    // Vệt nước phẳng lặng phản chiếu ánh trời trên mặt ruộng bậc thang
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - t.waterW / 2 + 10, y - t.dy + 4);
    ctx.quadraticCurveTo(x, y - t.dy + 7, x + t.waterW / 2 - 10, y - t.dy + 3);
    ctx.stroke();

    // Bờ ruộng đắp đất nâu sẫm giữ nước
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - t.waterW / 2, y - t.dy + 2);
    ctx.quadraticCurveTo(x, y - t.dy + 6, x + t.waterW / 2, y - t.dy + 2);
    ctx.stroke();
  }

  // 2. Hình bóng người nông dân đội Nón Lá tre nghiêng che nắng
  const farmerX = x - 25;
  const farmerY = y - 48;

  // Thân áo bà ba chàm / đen
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(farmerX, farmerY + 11, 4, 8, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Nón lá hình chóp nón truyền thống vàng nhạt
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(farmerX - 9, farmerY + 4);
  ctx.lineTo(farmerX, farmerY - 6);
  ctx.lineTo(farmerX + 9, farmerY + 4);
  ctx.closePath();
  ctx.fill();

  // Vành nón lá tre
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Đòn gánh tre uốn cong với 2 quang gánh
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(farmerX - 16, farmerY + 8);
  ctx.quadraticCurveTo(farmerX, farmerY + 4, farmerX + 16, farmerY + 9);
  ctx.stroke();

  // 2 Thúng thóc nan tre
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(farmerX - 16, farmerY + 12, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(farmerX + 16, farmerY + 13, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ============================================================================
 * 3. PHỐ CỔ HỘI AN (VIỆT NAM)
 * ============================================================================ */

/**
 * Chùa Cầu Hội An (Lai Viễn Kiều) — Di sản kiến trúc gỗ & mái ngói cong cổ kính
 */
export function drawChuaCauHoiAn(ctx, x, groundY) {
  ctx.save();
  const y = groundY;
  const w = 110;

  // 1. Chân mố cầu đá cổ cong vòm
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w / 2, y - 18);
  ctx.lineTo(x + w / 2, y - 18);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + 25, y);
  ctx.arc(x, y, 24, 0, Math.PI, true);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
  ctx.fill();

  // Vệt nước sông Hoài phản chiếu bóng cầu đá
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.fillRect(x - w / 2, y, w, 14);

  // 2. Thân cầu gỗ sơn son nâu đỏ
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(x - w / 2 + 6, y - 36, w - 12, 18);

  // Lan can và chấn song cầu gỗ gụ
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1.5;
  for (let c = x - w / 2 + 12; c < x + w / 2 - 12; c += 10) {
    ctx.strokeRect(c, y - 34, 6, 14);
  }

  // 3. Mái ngói vảy cá âm dương cổ kính 2 tầng (Mái thượng gia hạ kiều)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 8, y - 36);
  ctx.quadraticCurveTo(x, y - 56, x + w / 2 + 8, y - 36);
  ctx.lineTo(x + w / 2 + 4, y - 40);
  ctx.quadraticCurveTo(x, y - 62, x - w / 2 - 4, y - 40);
  ctx.closePath();
  ctx.fill();

  // Tầng mái phụ cổ kính bên trên
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(x - 28, y - 48);
  ctx.quadraticCurveTo(x, y - 64, x + 28, y - 48);
  ctx.lineTo(x + 24, y - 52);
  ctx.quadraticCurveTo(x, y - 68, x - 24, y - 52);
  ctx.closePath();
  ctx.fill();

  // Đỉnh nóc: Phù điêu Lưỡng long chầu nguyệt chạm vàng
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x - w / 2 - 6, y - 40, 3, 0, Math.PI * 2);
  ctx.arc(x + w / 2 + 6, y - 40, 3, 0, Math.PI * 2);
  ctx.arc(x, y - 68, 4, 0, Math.PI * 2);
  ctx.fill();

  // Đầu rồng nhỏ hai bên vút cong
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 68);
  ctx.lineTo(x - 14, y - 72);
  ctx.moveTo(x + 6, y - 68);
  ctx.lineTo(x + 14, y - 72);
  ctx.stroke();

  // 4. Đèn lồng đỏ dưới mái hiên Chùa Cầu
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x - 24, y - 30, 4, 0, Math.PI * 2);
  ctx.arc(x + 24, y - 30, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Dãy nhà cổ tường vàng hoa tiêu, giàn hoa giấy & đèn lồng lung linh
 */
export function drawHoiAnHousesAndLanterns(ctx, x, groundY) {
  ctx.save();
  const y = groundY;

  // Tường vàng hoa tiêu đặc trưng phố cổ Hội An
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x - 45, y - 85, 90, 85);

  // Mái ngói âm dương nâu rêu
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(x - 52, y - 85);
  ctx.lineTo(x, y - 105);
  ctx.lineTo(x + 52, y - 85);
  ctx.lineTo(x + 48, y - 82);
  ctx.lineTo(x, y - 101);
  ctx.lineTo(x - 48, y - 82);
  ctx.closePath();
  ctx.fill();

  // Cửa sổ chớp gỗ nâu
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 30, y - 70, 18, 24);
  ctx.fillRect(x + 12, y - 70, 18, 24);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x - 20, y - 70, 2, 24);
  ctx.fillRect(x + 20, y - 70, 2, 24);

  // Cửa ra vào bằng gỗ
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x - 12, y - 38, 24, 38);

  // Giàn hoa giấy đỏ hồng rủ xuống hiên nhà
  ctx.fillStyle = '#e11d48';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(x - 38 + i * 11, y - 82 + (i % 3) * 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dây đèn lồng Hội An giăng ngang
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 60, y - 65);
  ctx.quadraticCurveTo(x, y - 55, x + 60, y - 65);
  ctx.stroke();

  // Đèn lồng quả trám đa sắc lung linh
  const lanterns = [
    { lx: x - 35, ly: y - 60, color: '#ef4444' },
    { lx: x - 10, ly: y - 57, color: '#f59e0b' },
    { lx: x + 15, ly: y - 57, color: '#06b6d4' },
    { lx: x + 40, ly: y - 61, color: '#a855f7' },
  ];
  for (const lt of lanterns) {
    ctx.fillStyle = lt.color;
    ctx.beginPath();
    ctx.ellipse(lt.lx, lt.ly, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ánh sáng tỏa ra ấm áp
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(lt.lx, lt.ly, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ============================================================================
 * 4. TP. HỒ CHÍ MINH - SÀI GÒN (VIỆT NAM)
 * ============================================================================ */

/**
 * Landmark 81 — Tháp cao nhất Việt Nam kiến trúc bó tre vươn thẳng
 */
export function drawLandmark81(ctx, x, groundY, time = 0) {
  ctx.save();
  const y = groundY;
  const h = 210;

  // Kiến trúc bó tre: Các khối ống so le cao thấp vươn lên
  const tubes = [
    { dx: -18, w: 10, h: 120 },
    { dx: -9, w: 10, h: 155 },
    { dx: 0, w: 12, h: 185 }, // Lõi cao nhất
    { dx: 11, w: 10, h: 145 },
    { dx: 20, w: 10, h: 115 },
  ];

  for (const tube of tubes) {
    const tx = x + tube.dx - tube.w / 2;
    const ty = y - tube.h;

    const glassGrad = ctx.createLinearGradient(tx, ty, tx + tube.w, y);
    glassGrad.addColorStop(0, '#38bdf8');
    glassGrad.addColorStop(0.5, '#0284c7');
    glassGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = glassGrad;
    ctx.fillRect(tx, ty, tube.w, tube.h);

    // Kẻ viền kính xanh cyan và đường gân LED chiếu sáng thẳng đứng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tube.w, tube.h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.beginPath();
    ctx.moveTo(tx + tube.w / 2, ty);
    ctx.lineTo(tx + tube.w / 2, y);
    ctx.stroke();
  }

  // Đỉnh tháp Spire vút cao
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 185);
  ctx.lineTo(x, y - h);
  ctx.stroke();

  // Đèn hải đăng chớp sáng
  const beacon = Math.sin(time * 5) > 0;
  if (beacon) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - h, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y - h, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Tháp Bitexco Financial Tower — Biểu tượng búp sen & sân đỗ trực thăng tầng 52
 */
export function drawBitexcoTower(ctx, x, groundY) {
  ctx.save();
  const y = groundY;
  const h = 165;

  const bitexGrad = ctx.createLinearGradient(x - 20, y, x + 20, y - h);
  bitexGrad.addColorStop(0, '#0f172a');
  bitexGrad.addColorStop(0.5, '#0369a1');
  bitexGrad.addColorStop(1, '#38bdf8');

  ctx.fillStyle = bitexGrad;
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.quadraticCurveTo(x - 22, y - h * 0.6, x - 6, y - h);
  ctx.lineTo(x + 6, y - h);
  ctx.quadraticCurveTo(x + 14, y - h * 0.4, x + 16, y);
  ctx.closePath();
  ctx.fill();

  // Đường viền kính phản quang
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - h);
  ctx.quadraticCurveTo(x - 2, y - h * 0.5, x - 4, y);
  ctx.stroke();

  // Sân đỗ trực thăng cantilevered tầng 52
  const heliY = y - 105;
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(x + 14, heliY, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Vòng chữ H trên sân bay trực thăng
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', x + 14, heliY);

  ctx.restore();
}

/**
 * Cầu Ba Son (Cầu Thủ Thiêm 2) — Cầu dây văng cánh cung Sài Gòn
 */
export function drawBaSonBridge(ctx, x, groundY) {
  ctx.save();
  const y = groundY;

  // Trụ tháp cong nghiêng
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.quadraticCurveTo(x - 10, y - 75, x + 25, y - 105);
  ctx.stroke();

  // Chùm dây văng rẻ quạt
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const py = y - 60 - i * 8;
    const px = x - 18 + i * 7;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x - 60 + i * 22, y);
    ctx.stroke();
  }

  // Phản chiếu mờ trên mặt nước sông Sài Gòn
  ctx.fillStyle = 'rgba(3, 105, 161, 0.25)';
  ctx.fillRect(x - 65, y, 110, 10);

  ctx.restore();
}

/* ============================================================================
 * 5. DANH THẮNG VIỆT NAM MỚI (HÀ NỘI, NINH BÌNH, HUẾ, ĐÀ NẴNG, PHONG NHA, PHÚ YÊN)
 * ============================================================================ */

/**
 * 1. Chùa Một Cột (Liên Hoa Đài, Hà Nội)
 * Trụ đá đơn vững chãi vươn lên từ hồ sen Linh Chiểu, đài gỗ xòe 8 thanh xà cánh sen,
 * mái ngói 4 góc đao cong vút, hoa sen hồng nở rộ trên mặt nước.
 */
export function drawChuaMotCot(ctx, x, groundY) {
  ctx.save();
  const y = groundY;

  // A. Hồ sen Linh Chiểu
  const pondGrad = ctx.createLinearGradient(x - 55, y - 8, x + 55, y);
  pondGrad.addColorStop(0, '#064e3b');
  pondGrad.addColorStop(0.7, '#047857');
  pondGrad.addColorStop(1, '#065f46');
  ctx.fillStyle = pondGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 52, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Viền gờ đá quanh hồ sen
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 52, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Lá sen tròn khuyết tâm & hoa sen hồng bồng bềnh
  const drawLotusLeaf = (lx, ly, r) => {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(lx, ly, r, 0.25 * Math.PI, 1.95 * Math.PI);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };
  drawLotusLeaf(x - 34, y - 5, 6);
  drawLotusLeaf(x - 22, y - 3, 5);
  drawLotusLeaf(x + 26, y - 4, 6.5);
  drawLotusLeaf(x + 38, y - 6, 5);

  // Hoa sen hồng hé nở
  const drawLotusFlower = (fx, fy) => {
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(fx, fy - 3, 3, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(fx - 2.5, fy - 2, 2.5, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(fx + 2.5, fy - 2, 2.5, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(fx, fy - 2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  };
  drawLotusFlower(x - 28, y - 5);
  drawLotusFlower(x + 32, y - 6);

  // B. Cột đá đơn trụ vững chắc (đường kính ~14px, cao ~38px)
  const pillarGrad = ctx.createLinearGradient(x - 7, y - 42, x + 7, y - 4);
  pillarGrad.addColorStop(0, '#94a3b8');
  pillarGrad.addColorStop(0.5, '#64748b');
  pillarGrad.addColorStop(1, '#475569');
  ctx.fillStyle = pillarGrad;
  ctx.fillRect(x - 7, y - 42, 14, 38);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 7, y - 42, 14, 38);
  // Khớp nối đai đá giữa cột
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x - 8, y - 24, 16, 3);

  // C. 8 thanh xà gỗ xiên nâng đài hoa sen (kèo chống xòe cánh sen)
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  // Trái
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 28);
  ctx.lineTo(x - 18, y - 42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 34);
  ctx.lineTo(x - 22, y - 44);
  ctx.stroke();
  // Phải
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 28);
  ctx.lineTo(x + 18, y - 42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 34);
  ctx.lineTo(x + 22, y - 44);
  ctx.stroke();

  // D. Thân gỗ Liên Hoa Đài (ngôi chùa vuông gỗ)
  const shrineY = y - 44;
  ctx.fillStyle = '#7f1d1d'; // Gỗ lim đỏ sẫm
  ctx.fillRect(x - 18, shrineY - 20, 36, 20);
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 18, shrineY - 20, 36, 20);

  // Cửa gỗ lá sách / chấn song vàng ấm cúng bên trong
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - 6, shrineY - 16, 12, 16);
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 6, shrineY - 16, 12, 16);
  ctx.beginPath();
  ctx.moveTo(x, shrineY - 16);
  ctx.lineTo(x, shrineY);
  ctx.stroke();

  // Lan can gỗ xung quanh
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 20, shrineY - 3, 40, 4);

  // E. Mái ngói đao cong 4 góc đặc trưng kiến trúc Lý - Trần
  const roofBaseY = shrineY - 19;
  const roofTopY = roofBaseY - 14;

  const roofGrad = ctx.createLinearGradient(x, roofTopY, x, roofBaseY);
  roofGrad.addColorStop(0, '#b91c1c');
  roofGrad.addColorStop(0.6, '#991b1b');
  roofGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = roofGrad;

  ctx.beginPath();
  // Đỉnh mái
  ctx.moveTo(x, roofTopY);
  // Cạnh phải vuốt cong vút ra đầu đao
  ctx.quadraticCurveTo(x + 15, roofBaseY - 6, x + 28, roofBaseY - 4);
  // Mũi đao cong vểnh lên
  ctx.quadraticCurveTo(x + 24, roofBaseY + 1, x + 20, roofBaseY + 1);
  ctx.lineTo(x - 20, roofBaseY + 1);
  // Mũi đao bên trái cong vểnh lên
  ctx.quadraticCurveTo(x - 24, roofBaseY + 1, x - 28, roofBaseY - 4);
  ctx.quadraticCurveTo(x - 15, roofBaseY - 6, x, roofTopY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Kìm nóc & đỉnh tháp sen vàng trên nóc chùa
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(x, roofTopY - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, roofTopY);
  ctx.lineTo(x, roofTopY - 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * 2. Tháp Rùa Hồ Gươm (Hà Nội)
 * Tòa tháp 3 tầng cổ kính rêu phong ngự trên gò Rùa xanh mướt giữa hồ Gươm,
 * các vòm cửa Gothic & truyền thống, cành liễu rủ soi bóng lung linh.
 */
export function drawThapRua(ctx, x, groundY) {
  ctx.save();
  const y = groundY;

  // A. Gò Rùa (gò đất xanh rêu nổi giữa hồ Gươm)
  const moundGrad = ctx.createLinearGradient(x - 48, y - 10, x + 48, y);
  moundGrad.addColorStop(0, '#15803d');
  moundGrad.addColorStop(0.7, '#166534');
  moundGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = moundGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mặt nước hồ gợn sóng xanh biếc
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 52, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // B. Tầng 1 (Chân tháp rêu phong màu vàng đất Faifo/cổ điển)
  const t1Width = 44;
  const t1Height = 22;
  const t1Y = y - 6 - t1Height;
  const wallGrad = ctx.createLinearGradient(x - 22, t1Y, x + 22, y - 6);
  wallGrad.addColorStop(0, '#d97706');
  wallGrad.addColorStop(0.5, '#b45309');
  wallGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x - t1Width / 2, t1Y, t1Width, t1Height);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - t1Width / 2, t1Y, t1Width, t1Height);

  // 3 vòm cửa Gothic tầng 1
  ctx.fillStyle = '#451a03';
  for (let i = -1; i <= 1; i++) {
    const cx = x + i * 12;
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, y - 6);
    ctx.lineTo(cx - 3.5, t1Y + 7);
    ctx.arc(cx, t1Y + 7, 3.5, Math.PI, 0);
    ctx.lineTo(cx + 3.5, y - 6);
    ctx.closePath();
    ctx.fill();
  }

  // C. Tầng 2 (Nhỏ dần, có gờ chỉ ngang)
  const t2Width = 32;
  const t2Height = 18;
  const t2Y = t1Y - t2Height;
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x - t2Width / 2, t2Y, t2Width, t2Height);
  ctx.strokeRect(x - t2Width / 2, t2Y, t2Width, t2Height);

  // Gờ lan can phân tầng
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - t1Width / 2 - 1, t1Y - 1.5, t1Width + 2, 2.5);

  // 3 vòm cửa tầng 2 (nhỏ hơn)
  ctx.fillStyle = '#451a03';
  for (let i = -1; i <= 1; i++) {
    const cx = x + i * 9;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, t1Y);
    ctx.lineTo(cx - 2.5, t2Y + 6);
    ctx.arc(cx, t2Y + 6, 2.5, Math.PI, 0);
    ctx.lineTo(cx + 2.5, t1Y);
    ctx.closePath();
    ctx.fill();
  }

  // D. Tầng 3 (Tầng đỉnh với cửa sổ tròn nhật nguyệt)
  const t3Width = 20;
  const t3Height = 14;
  const t3Y = t2Y - t3Height;
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x - t3Width / 2, t3Y, t3Width, t3Height);
  ctx.strokeRect(x - t3Width / 2, t3Y, t3Width, t3Height);

  // Gờ phân tầng 2-3
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - t2Width / 2 - 1, t2Y - 1.5, t2Width + 2, 2.5);

  // Cửa tròn nhật nguyệt đặc trưng
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(x, t3Y + 7, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // E. Mái cong cổ truyền & chóp nhọn đỉnh tháp
  const roofY = t3Y - 6;
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(x, roofY - 5);
  ctx.quadraticCurveTo(x + 8, roofY, x + 15, roofY + 2);
  ctx.lineTo(x - 15, roofY + 2);
  ctx.quadraticCurveTo(x - 8, roofY, x, roofY - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Đỉnh chóp ngọn tháp
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x, roofY - 6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // F. Cành liễu rủ duyên dáng bên hồ Gươm (Weeping Willow)
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.2;
  const willowBranches = [
    { startX: x - 42, startY: y - 50, cpX: x - 35, cpY: y - 25, endX: x - 46, endY: y - 10 },
    { startX: x - 38, startY: y - 46, cpX: x - 30, cpY: y - 20, endX: x - 36, endY: y - 8 },
    { startX: x + 40, startY: y - 48, cpX: x + 34, cpY: y - 22, endX: x + 44, endY: y - 9 },
  ];
  for (const b of willowBranches) {
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY);
    ctx.quadraticCurveTo(b.cpX, b.cpY, b.endX, b.endY);
    ctx.stroke();
    // Các chồi lá liễu mềm mại
    ctx.fillStyle = '#4ade80';
    for (let t = 0.3; t <= 0.9; t += 0.25) {
      const lx = (1 - t) * (1 - t) * b.startX + 2 * (1 - t) * t * b.cpX + t * t * b.endX;
      const ly = (1 - t) * (1 - t) * b.startY + 2 * (1 - t) * t * b.cpY + t * t * b.endY;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 1.5, 3.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 3. Đại Nội Huế — Cửa Ngọ Môn & Lầu Ngũ Phụng (Thừa Thiên Huế)
 * Nền đài chữ U đồ sộ với 5 cửa vòm (cửa giữa kim sắc cho Hoàng Đế),
 * Lầu Ngũ Phụng 2 tầng 9 mái lợp ngói hoàng lưu ly vàng rực và thanh lưu ly ngọc bích.
 */
export function drawNgoMonHue(ctx, x, groundY) {
  ctx.save();
  const y = groundY;

  // A. Nền đài sa thạch chữ U đồ sộ (Width ~130px, Height ~36px)
  const baseWidth = 130;
  const baseHeight = 36;
  const baseY = y - baseHeight;

  const baseGrad = ctx.createLinearGradient(x, baseY, x, y);
  baseGrad.addColorStop(0, '#64748b');
  baseGrad.addColorStop(0.5, '#475569');
  baseGrad.addColorStop(1, '#334155');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x - baseWidth / 2, baseY, baseWidth, baseHeight);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - baseWidth / 2, baseY, baseWidth, baseHeight);

  // Lan can con tiện đỏ son trên mặt đài
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x - baseWidth / 2 - 2, baseY - 3.5, baseWidth + 4, 4);

  // B. 5 cửa vòm Ngọ Môn đặc trưng
  // 1. Cửa chính Ngọ Môn (giữa): dành riêng cho vua, viền kim sắc rực rỡ
  const mainGateH = 24;
  const mainGateW = 14;
  ctx.fillStyle = '#fbbf24'; // Ánh sáng hoàng gia vàng rực
  ctx.beginPath();
  ctx.moveTo(x - mainGateW / 2, y);
  ctx.lineTo(x - mainGateW / 2, y - mainGateH + mainGateW / 2);
  ctx.arc(x, y - mainGateH + mainGateW / 2, mainGateW / 2, Math.PI, 0);
  ctx.lineTo(x + mainGateW / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Tả/Hữu Giáp Môn (2 bên dành cho quan văn, quan võ)
  const sideGateH = 20;
  const sideGateW = 10;
  for (const offset of [-24, 24]) {
    const gx = x + offset;
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(gx - sideGateW / 2, y);
    ctx.lineTo(gx - sideGateW / 2, y - sideGateH + sideGateW / 2);
    ctx.arc(gx, y - sideGateH + sideGateW / 2, sideGateW / 2, Math.PI, 0);
    ctx.lineTo(gx + sideGateW / 2, y);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Tả/Hữu Dịch Môn (2 cánh ngoài cùng cho binh lính & voi ngựa)
  const wingGateH = 16;
  const wingGateW = 8;
  for (const offset of [-46, 46]) {
    const gx = x + offset;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(gx - wingGateW / 2, y);
    ctx.lineTo(gx - wingGateW / 2, y - wingGateH + wingGateW / 2);
    ctx.arc(gx, y - wingGateH + wingGateW / 2, wingGateW / 2, Math.PI, 0);
    ctx.lineTo(gx + wingGateW / 2, y);
    ctx.closePath();
    ctx.fill();
  }

  // C. Lầu Ngũ Phụng (Tầng 1 - Cột gỗ sơn son thếp vàng)
  const pavilionY = baseY - 4;
  const p1Width = 104;
  const p1Height = 18;
  ctx.fillStyle = 'rgba(127, 29, 29, 0.85)';
  ctx.fillRect(x - p1Width / 2, pavilionY - p1Height, p1Width, p1Height);

  // Hàng cột gỗ lim đỏ son
  ctx.fillStyle = '#dc2626';
  for (let px = x - 48; px <= x + 48; px += 16) {
    ctx.fillRect(px - 1.5, pavilionY - p1Height, 3, p1Height);
  }

  // D. Hệ thống 9 mái Lầu Ngũ Phụng (Mái chính ngói hoàng lưu ly vàng, mái cánh ngói thanh lưu ly xanh)
  // Tầng mái dưới (mái vươn rộng)
  const r1Y = pavilionY - p1Height;
  // Cánh trái (ngói thanh lưu ly xanh ngọc)
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(x - 56, r1Y + 3);
  ctx.quadraticCurveTo(x - 40, r1Y - 4, x - 26, r1Y - 1);
  ctx.lineTo(x - 26, r1Y + 4);
  ctx.lineTo(x - 54, r1Y + 4);
  ctx.closePath();
  ctx.fill();

  // Cánh phải (ngói thanh lưu ly xanh ngọc)
  ctx.beginPath();
  ctx.moveTo(x + 56, r1Y + 3);
  ctx.quadraticCurveTo(x + 40, r1Y - 4, x + 26, r1Y - 1);
  ctx.lineTo(x + 26, r1Y + 4);
  ctx.lineTo(x + 54, r1Y + 4);
  ctx.closePath();
  ctx.fill();

  // Mái chính giữa (ngói hoàng lưu ly vàng rực rỡ của Hoàng Đế)
  const yellowRoofGrad = ctx.createLinearGradient(x, r1Y - 8, x, r1Y + 4);
  yellowRoofGrad.addColorStop(0, '#fde047');
  yellowRoofGrad.addColorStop(0.5, '#eab308');
  yellowRoofGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = yellowRoofGrad;
  ctx.beginPath();
  ctx.moveTo(x, r1Y - 7);
  ctx.quadraticCurveTo(x - 18, r1Y - 2, x - 32, r1Y + 3);
  ctx.lineTo(x + 32, r1Y + 3);
  ctx.quadraticCurveTo(x + 18, r1Y - 2, x, r1Y - 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // E. Tầng 2 Lầu Ngũ Phụng & Mái chóp thượng
  const p2Height = 12;
  const p2Y = r1Y - 6;
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x - 22, p2Y - p2Height, 44, p2Height);

  // Mái thượng hoàng kim uốn đao cong vút
  const r2Y = p2Y - p2Height;
  ctx.fillStyle = yellowRoofGrad;
  ctx.beginPath();
  ctx.moveTo(x, r2Y - 8);
  ctx.quadraticCurveTo(x - 14, r2Y - 3, x - 26, r2Y + 2);
  ctx.lineTo(x + 26, r2Y + 2);
  ctx.quadraticCurveTo(x + 14, r2Y - 3, x, r2Y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Đôi rồng chầu trên bờ nóc (Lưỡng long triều nhật)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x, r2Y - 9, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Đầu đao 2 bên cong vuốt
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - 25, r2Y - 1, 3, 0.5 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 25, r2Y - 1, 3, 1.2 * Math.PI, 2.5 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/**
 * 4. Bảo Tháp Chùa Bái Đính (Ninh Bình — Tràng An)
 * Tháp Phật giáo 13 tầng bát giác cao vút, các tầng mái ngói cong thu nhỏ dần,
 * đỉnh tháp búp sen vàng óng ánh, giữa thung lũng núi đá vôi Tràng An hùng vĩ.
 */
export function drawBaiDinhPagoda(ctx, x, groundY) {
  ctx.save();
  const y = groundY;
  const totalTiers = 13;
  const totalHeight = 148;
  const baseWidth = 46;

  // A. Nền tháp bát giác sa thạch
  ctx.fillStyle = '#475569';
  ctx.fillRect(x - baseWidth / 2 - 4, y - 6, baseWidth + 8, 6);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - baseWidth / 2 - 4, y - 6, baseWidth + 8, 6);

  // B. 13 tầng tháp bát giác giật cấp
  let currentY = y - 6;
  for (let i = 0; i < totalTiers; i++) {
    const tierRatio = i / totalTiers;
    const tierWidth = baseWidth * (1 - tierRatio * 0.72);
    const tierHeight = (totalHeight / totalTiers) * (1 - tierRatio * 0.25);
    const roofY = currentY - tierHeight;

    // Thân tháp gạch nung sẫm màu
    const tierGrad = ctx.createLinearGradient(x - tierWidth / 2, roofY, x + tierWidth / 2, currentY);
    tierGrad.addColorStop(0, '#7f1d1d');
    tierGrad.addColorStop(0.5, '#991b1b');
    tierGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = tierGrad;
    ctx.fillRect(x - tierWidth / 2, roofY, tierWidth, tierHeight);

    // Cửa vòm Phật giáo phát sáng ánh vàng ở mỗi tầng
    const windowW = Math.max(3, tierWidth * 0.22);
    const windowH = Math.max(4, tierHeight * 0.65);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - windowW / 2, roofY + tierHeight - windowH - 1, windowW, windowH);

    // Mái ngói đao cong vểnh ở mỗi tầng
    const roofOverhang = tierWidth * 1.35;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(x - roofOverhang / 2, roofY);
    ctx.quadraticCurveTo(x, roofY - 2.5, x + roofOverhang / 2, roofY);
    ctx.lineTo(x + roofOverhang / 2 - 1, roofY + 2);
    ctx.lineTo(x - roofOverhang / 2 + 1, roofY + 2);
    ctx.closePath();
    ctx.fill();

    // Viền cong nhẹ ở góc mái
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    currentY = roofY;
  }

  // C. Đỉnh chóp sen vàng (Đỉnh bảo tháp Bái Đính)
  const spireY = currentY;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(x, spireY - 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, spireY);
  ctx.lineTo(x, spireY - 14);
  ctx.stroke();

  // Vòng phát hào quang đỉnh tháp
  ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.beginPath();
  ctx.arc(x, spireY - 7, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 5. Cầu Bàn Tay Vàng (Bà Nà Hills, Đà Nẵng)
 * Hai bàn tay đá khổng lồ rêu phong vươn lên từ mây ngàn nâng đỡ dải lụa cầu mạ vàng óng ả,
 * đường cong uốn lượn mềm mại giữa biển mây bồng bềnh và viền hoa Lobelia tím.
 */
export function drawGoldenBridgeHands(ctx, x, groundY, time = 0) {
  ctx.save();
  const y = groundY;

  // A. Biển mây bồng bềnh đỉnh núi Chúa Bà Nà
  const cloudOffset = Math.sin(time * 1.2) * 4;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(x - 65, y - 50 + cloudOffset, 28, 0, Math.PI * 2);
  ctx.arc(x - 30, y - 60 - cloudOffset, 34, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 55 + cloudOffset, 32, 0, Math.PI * 2);
  ctx.arc(x + 65, y - 48 - cloudOffset, 26, 0, Math.PI * 2);
  ctx.fill();

  // B. Hai bàn tay đá khổng lồ rêu phong (Giant Stone Hands)
  const drawStoneHand = (hx, hy, isLeft) => {
    ctx.save();
    ctx.translate(hx, hy);
    if (!isLeft) ctx.scale(-1, 1);

    // Cổ tay & lòng bàn tay đá phong hóa
    const handGrad = ctx.createLinearGradient(-16, 30, 16, -20);
    handGrad.addColorStop(0, '#334155');
    handGrad.addColorStop(0.5, '#64748b');
    handGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = handGrad;

    // Cổ tay vươn từ lòng đất
    ctx.beginPath();
    ctx.moveTo(-18, 50);
    ctx.lineTo(-12, 10);
    ctx.quadraticCurveTo(-14, -6, -4, -14); // Lòng bàn tay
    ctx.lineTo(14, -10);
    ctx.lineTo(18, 50);
    ctx.closePath();
    ctx.fill();

    // Các ngón tay nâng đỡ từ phía dưới cầu
    // Ngón cái
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-22, -10, -18, -26);
    ctx.quadraticCurveTo(-12, -26, -6, -8);
    ctx.fill();

    // Ngón trỏ
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.quadraticCurveTo(-8, -32, -2, -38);
    ctx.quadraticCurveTo(4, -36, 4, -12);
    ctx.fill();

    // Ngón giữa
    ctx.beginPath();
    ctx.moveTo(3, -12);
    ctx.quadraticCurveTo(6, -36, 12, -40);
    ctx.quadraticCurveTo(18, -36, 13, -10);
    ctx.fill();

    // Ngón áp út & ngón út
    ctx.beginPath();
    ctx.moveTo(13, -10);
    ctx.quadraticCurveTo(20, -30, 24, -32);
    ctx.quadraticCurveTo(28, -28, 20, -5);
    ctx.fill();

    // Mảng rêu phong cổ kính trên đá
    ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(-8, -12, 5, 0, Math.PI * 2);
    ctx.arc(6, -18, 4, 0, Math.PI * 2);
    ctx.arc(-10, 18, 6, 0, Math.PI * 2);
    ctx.arc(8, 26, 7, 0, Math.PI * 2);
    ctx.fill();

    // Vết nứt phong hóa tự nhiên
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6, 20);
    ctx.lineTo(-2, 12);
    ctx.lineTo(4, 16);
    ctx.stroke();

    ctx.restore();
  };

  // Vẽ 2 bàn tay đá ở 2 nhịp cầu
  drawStoneHand(x - 38, y - 55, true);
  drawStoneHand(x + 38, y - 55, false);

  // C. Dải cầu Cầu Vàng (Golden Bridge Walkway)
  // Đường cong cầu vươn ngang qua lòng bàn tay
  const bridgeY = y - 72;
  const bridgeGrad = ctx.createLinearGradient(x - 70, bridgeY, x + 70, bridgeY);
  bridgeGrad.addColorStop(0, '#f59e0b');
  bridgeGrad.addColorStop(0.2, '#fde047');
  bridgeGrad.addColorStop(0.5, '#fbbf24');
  bridgeGrad.addColorStop(0.8, '#fde047');
  bridgeGrad.addColorStop(1, '#d97706');

  // Thân dầm cầu mạ vàng uốn cong
  ctx.strokeStyle = bridgeGrad;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 85, bridgeY + 8);
  ctx.quadraticCurveTo(x - 40, bridgeY - 14, x, bridgeY - 10);
  ctx.quadraticCurveTo(x + 40, bridgeY - 6, x + 85, bridgeY + 12);
  ctx.stroke();

  // Ánh kim loại vàng phản chiếu lấp lánh
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 70, bridgeY + 6);
  ctx.quadraticCurveTo(x - 35, bridgeY - 12, x, bridgeY - 8);
  ctx.quadraticCurveTo(x + 35, bridgeY - 4, x + 70, bridgeY + 9);
  ctx.stroke();

  // Lan can kính & khung titan
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 85, bridgeY + 4);
  ctx.quadraticCurveTo(x - 40, bridgeY - 18, x, bridgeY - 14);
  ctx.quadraticCurveTo(x + 40, bridgeY - 10, x + 85, bridgeY + 8);
  ctx.stroke();

  // Dải hoa cúc Lobelia tím biếc dọc lối đi cầu
  ctx.fillStyle = '#a855f7';
  for (let fx = x - 75; fx <= x + 75; fx += 10) {
    const t = (fx - (x - 85)) / 170;
    const fy = (1 - t) * (1 - t) * (bridgeY + 8) + 2 * (1 - t) * t * (bridgeY - 12) + t * t * (bridgeY + 12);
    ctx.beginPath();
    ctx.arc(fx, fy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 6. Động Phong Nha (Kỳ Quan Đệ Nhất Động — Quảng Bình)
 * Vòm hang đá vôi karst kỳ vĩ, thạch nhũ (stalactites) buông rủ lấp lánh khoáng thạch,
 * dòng sông Son ngầm xanh màu ngọc bích, chiếc thuyền nan mái chèo êm đềm lướt vào lòng hang.
 */
export function drawPhongNhaCave(ctx, x, groundY, time = 0) {
  ctx.save();
  const y = groundY;

  // A. Vòm miệng hang đá vôi khổng lồ (Karst Cave Portal)
  const caveW = 140;
  const caveH = 110;
  const mouthY = y - 4;

  // Chiều sâu hun hút trong bóng tối lòng hang
  const caveInterior = ctx.createRadialGradient(x, mouthY - 45, 10, x, mouthY - 45, 75);
  caveInterior.addColorStop(0, '#020617');
  caveInterior.addColorStop(0.6, '#0f172a');
  caveInterior.addColorStop(1, '#1e293b');
  ctx.fillStyle = caveInterior;

  ctx.beginPath();
  ctx.moveTo(x - caveW / 2, mouthY);
  ctx.bezierCurveTo(x - caveW / 2 + 10, mouthY - caveH * 0.8, x - 25, mouthY - caveH, x, mouthY - caveH);
  ctx.bezierCurveTo(x + 25, mouthY - caveH, x + caveW / 2 - 10, mouthY - caveH * 0.8, x + caveW / 2, mouthY);
  ctx.closePath();
  ctx.fill();

  // B. Dòng sông Son ngầm xanh biếc ngọc bích
  const riverGrad = ctx.createLinearGradient(x, mouthY - 14, x, y);
  riverGrad.addColorStop(0, '#0d9488');
  riverGrad.addColorStop(0.6, '#0f766e');
  riverGrad.addColorStop(1, '#115e59');
  ctx.fillStyle = riverGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, caveW / 2 - 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gợn sóng lấp lánh mặt nước ngầm
  const waveW = Math.sin(time * 2) * 3;
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 35 + waveW, y - 5);
  ctx.quadraticCurveTo(x, y - 7, x + 35 - waveW, y - 5);
  ctx.stroke();

  // C. Thạch nhũ (Stalactites) buông rủ từ vòm trần hang
  const drawStalactite = (sx, sy, len, w, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx - w / 2, sy);
    ctx.lineTo(sx + w / 2, sy);
    ctx.lineTo(sx, sy + len);
    ctx.closePath();
    ctx.fill();
    // Giọt nước lấp lánh ở đầu nhũ đá
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(sx, sy + len + 1.2, 1, 0, Math.PI * 2);
    ctx.fill();
  };

  // Dãy nhũ đá trần hang
  drawStalactite(x - 45, mouthY - 65, 24, 8, '#64748b');
  drawStalactite(x - 30, mouthY - 82, 34, 9, '#475569');
  drawStalactite(x - 14, mouthY - 95, 26, 7, '#94a3b8');
  drawStalactite(x, mouthY - 98, 38, 10, '#cbd5e1');
  drawStalactite(x + 16, mouthY - 94, 28, 7, '#94a3b8');
  drawStalactite(x + 32, mouthY - 80, 32, 9, '#475569');
  drawStalactite(x + 48, mouthY - 62, 22, 8, '#64748b');

  // Măng đá (Stalagmites) nhô lên 2 bên mép hang
  const drawStalagmite = (mx, my, h, w) => {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(mx - w / 2, my);
    ctx.lineTo(mx + w / 2, my);
    ctx.lineTo(mx, my - h);
    ctx.closePath();
    ctx.fill();
  };
  drawStalagmite(x - 52, mouthY - 2, 22, 10);
  drawStalagmite(x - 42, mouthY - 3, 16, 8);
  drawStalagmite(x + 44, mouthY - 3, 18, 9);
  drawStalagmite(x + 54, mouthY - 2, 24, 11);

  // D. Thảm thực vật & dây leo nhiệt đới phủ miệng hang
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.4;
  for (let vx = x - 55; vx <= x + 55; vx += 18) {
    ctx.beginPath();
    ctx.moveTo(vx, mouthY - caveH + 12);
    ctx.quadraticCurveTo(vx + 4, mouthY - caveH + 28, vx - 2, mouthY - caveH + 42);
    ctx.stroke();
    // Chùm lá xanh
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(vx - 2, mouthY - caveH + 42, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // E. Chiếc thuyền nan du khách nhẹ nhàng lướt vào động Phong Nha
  const boatX = x - 12 + Math.sin(time * 1.5) * 5;
  const boatY = y - 7;
  // Thân thuyền nan gỗ
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(boatX - 16, boatY);
  ctx.quadraticCurveTo(boatX, boatY + 4, boatX + 16, boatY);
  ctx.lineTo(boatX + 13, boatY - 3);
  ctx.lineTo(boatX - 13, boatY - 3);
  ctx.closePath();
  ctx.fill();
  // Mui thuyền nan hình vòm
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(boatX, boatY - 3, 8, Math.PI, 0);
  ctx.fill();
  // Người chèo thuyền đội nón lá
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(boatX + 10, boatY - 7);
  ctx.lineTo(boatX + 7, boatY - 4);
  ctx.lineTo(boatX + 13, boatY - 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 7. Ghềnh Đá Đĩa (Gành Đá Đĩa — Phú Yên)
 * Hàng ngàn cột đá bazan hình lục lăng núi lửa xếp tầng ken chặt như tổ ong vươn ra biển,
 * bọt sóng đại dương trắng xóa vỗ vào gờ đá lục giác, mặt biển xanh ngọc bích.
 */
export function drawGhenhDaDia(ctx, x, groundY, time = 0) {
  ctx.save();
  const y = groundY;

  // A. Mặt biển đại dương Phú Yên xanh ngọc bích
  const oceanGrad = ctx.createLinearGradient(x - 60, y - 24, x + 60, y);
  oceanGrad.addColorStop(0, '#0284c7');
  oceanGrad.addColorStop(0.5, '#0369a1');
  oceanGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(x - 65, y - 16, 130, 16);

  // B. Hàm vẽ từng cột đá bazan lăng trụ lục giác (Hexagonal Basalt Column)
  const drawHexColumn = (colX, colY, colH, radius) => {
    // Thân cột trụ bazan (đổ bóng góc cạnh 3D)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(colX - radius, colY, radius * 2, colH);

    // Cạnh bên sáng hơn tạo khối lục giác
    ctx.fillStyle = '#334155';
    ctx.fillRect(colX - radius * 0.3, colY, radius * 1.3, colH);

    // Mặt đỉnh lục giác (Mặt đĩa xếp tầng)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const angle = (Math.PI / 3) * a;
      const hx = colX + Math.cos(angle) * radius;
      const hy = colY + Math.sin(angle) * (radius * 0.52);
      if (a === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();

    // Đường viền đá bazan sắc nét
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  };

  // C. Cụm đá lục giác xếp tầng giật cấp như tổ ong nhô ra biển
  const columns = [
    // Tầng cao (phía sau bên trái)
    { cx: x - 46, cy: y - 54, h: 54, r: 10 },
    { cx: x - 32, cy: y - 62, h: 62, r: 11 },
    { cx: x - 18, cy: y - 56, h: 56, r: 10.5 },
    // Tầng trung (trung tâm)
    { cx: x - 42, cy: y - 38, h: 38, r: 11 },
    { cx: x - 26, cy: y - 44, h: 44, r: 11.5 },
    { cx: x - 8, cy: y - 48, h: 48, r: 12 },
    { cx: x + 8, cy: y - 42, h: 42, r: 11 },
    { cx: x + 24, cy: y - 36, h: 36, r: 10.5 },
    // Tầng thấp thoai thoải đón sóng biển
    { cx: x - 34, cy: y - 22, h: 22, r: 11 },
    { cx: x - 16, cy: y - 26, h: 26, r: 12 },
    { cx: x + 4, cy: y - 24, h: 24, r: 11.5 },
    { cx: x + 22, cy: y - 20, h: 20, r: 11 },
    { cx: x + 38, cy: y - 16, h: 16, r: 10 },
    { cx: x + 52, cy: y - 12, h: 12, r: 9.5 },
  ];

  for (const c of columns) {
    drawHexColumn(c.cx, c.cy, c.h, c.r);
  }

  // D. Sóng biển đại dương vỗ tung bọt trắng xóa vào chân đá bazan
  const waveCycle = Math.sin(time * 3);
  const foamY = y - 10 + waveCycle * 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(x + 24, foamY, 6 + waveCycle * 2, 0, Math.PI * 2);
  ctx.arc(x + 38, foamY - 2, 8 + waveCycle * 1.5, 0, Math.PI * 2);
  ctx.arc(x + 52, foamY + 1, 7 - waveCycle * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Bụi nước biển bắn li ti (Sea Spray)
  ctx.fillStyle = '#bae6fd';
  for (let sp = 0; sp < 6; sp++) {
    const spX = x + 20 + sp * 6 + Math.cos(time * 4 + sp) * 4;
    const spY = foamY - 8 - (sp % 3) * 4;
    ctx.beginPath();
    ctx.arc(spX, spY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ============================================================================
 * 6. TẠO HÌNH VECTOR CHI TIẾT 10 QUÁI VẬT VĂN PHÒNG TOOLIO
 * ============================================================================ */

export function drawObstacleMonster(ctx, obs, time = 0) {
  ctx.save();
  const { x, y, width, height, type } = obs;

  if (type === 'spikes') {
    // Chông tre Ninja cổ điển sắc nhọn
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 4, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x + (width * 3) / 4, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    // Vát nhọn đầu cọc tre sáng bóng
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width / 4, y);
    ctx.lineTo(x + width / 4, y + 10);
    ctx.moveTo(x + (width * 3) / 4, y);
    ctx.lineTo(x + (width * 3) / 4, y + 10);
    ctx.stroke();
  } else if (type === 'pdf-bloat') {
    // PDF Bloat Monster: Quái vật tệp PDF béo phì màu đỏ
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    // Góc gập tài liệu gấp mép
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(x + width - 12, y);
    ctx.lineTo(x + width, y + 12);
    ctx.lineTo(x + width - 12, y + 12);
    ctx.closePath();
    ctx.fill();
    // Chữ PDF to rõ ràng
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PDF', x + width / 2, y + 16);
    // Đôi mắt tức giận & mồm cau có
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 10, y + 24, 6, 6);
    ctx.fillRect(x + width - 16, y + 24, 6, 6);
    ctx.fillRect(x + width / 2 - 6, y + 36, 12, 3);
  } else if (type === 'scattered-pages') {
    // Scattered Pages: Cơn lốc các trang tài liệu xáo trộn
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 6, width - 8, height - 8);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width - 6, height - 6);
    // Dòng kẻ văn bản
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 6, y + 12, width - 18, 3);
    ctx.fillRect(x + 6, y + 18, width - 20, 3);
    ctx.fillRect(x + 6, y + 24, width - 16, 3);
    // Ký hiệu trang bay lượn
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 32, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'messy-backdrop') {
    // Messy Backdrop: Đám mây phông nền lộn xộn
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x + 16, y + 20, 14, 0, Math.PI * 2);
    ctx.arc(x + 32, y + 18, 16, 0, Math.PI * 2);
    ctx.fill();
    // Khung lấy nét máy ảnh bị rối
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BG', x + width / 2, y + height / 2 + 3);
  } else if (type === 'crooked-card') {
    // Crooked Card Golem: Danh thiếp méo xẹo
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(0.12);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    // Dấu xén Tonbo đỏ trên góc thẻ
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-width / 2 + 8, -height / 2 + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VCARD', 0, 4);
    ctx.restore();
  } else if (type === 'invoice-beast') {
    // Invoice Beast: Rồng hóa đơn dài đuôi răng cưa
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, y, width, height);
    // Răng cưa giấy in nhiệt ở đáy
    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < width; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + height);
      ctx.lineTo(x + i + 4, y + height - 4);
      ctx.lineTo(x + i + 8, y + height);
      ctx.fill();
    }
    // Dấu mộc đỏ VAT
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VAT', x + width / 2, y + height / 2 + 3);
  } else if (type === 'heavy-image') {
    // Heavy RAW Image Boulder: Tảng đá máy ảnh RAW nặng nề
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    // Ống kính máy ảnh khẩu độ
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RAW', x + width / 2, y + height / 2 + 3);
  } else if (type === 'glitch-qr') {
    // Glitch QR Matrix: Khối mã QR ma trận phát sáng tím neon
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(x, y, width, height);
    // Ô định vị vuông đặc trưng QR góc trên
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 4, 12, 12);
    ctx.fillRect(x + width - 16, y + 4, 12, 12);
    ctx.fillRect(x + 4, y + height - 16, 12, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y + 6, 8, 8);
    ctx.fillRect(x + width - 14, y + 6, 8, 8);
    ctx.fillRect(x + 6, y + height - 14, 8, 8);
    // Vệt glitch sọc xanh cyan chớp tắt
    if (Math.sin(time * 10) > 0) {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x - 4, y + 14, width + 8, 3);
    }
  } else if (type === 'unprotected-doc') {
    // Unprotected Doc: Bóng ma tài liệu chưa đóng dấu
    ctx.fillStyle = 'rgba(99, 102, 241, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    // Biểu tượng khiên khóa rỗng
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 10, y + 12, width - 20, height - 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCK?', x + width / 2, y + height / 2 + 3);
  } else if (type === 'misaligned-excel') {
    // Misaligned Excel Grid: Bảng tính lệch cột
    ctx.fillStyle = '#059669';
    ctx.fillRect(x, y, width, height);
    // Đường lưới bảng tính lệch hàng
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 16);
    ctx.lineTo(x + width - 4, y + 18); // Kẻ lệch cột
    ctx.moveTo(x + 18, y + 4);
    ctx.lineTo(x + 20, y + height - 4);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('#REF!', x + width / 2, y + height - 8);
  } else if (type === 'tax-storm') {
    // Tax Math Storm: Đám mây bão công thức thuế
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x + 14, y + 18, 12, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 16, 14, 0, Math.PI * 2);
    ctx.arc(x + 22, y + 26, 13, 0, Math.PI * 2);
    ctx.fill();
    // Tia sét toán học & ký hiệu %
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('%', x + width / 2, y + height / 2 + 4);
  } else {
    // Fallback card
    ctx.fillStyle = obs.color || '#64748b';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(obs.name?.slice(0, 8) || 'TOOL', x + width / 2, y + height / 2 + 3);
  }

  ctx.restore();
}
