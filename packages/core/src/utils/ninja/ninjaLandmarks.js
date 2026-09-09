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
 * 5. TẠO HÌNH VECTOR CHI TIẾT 10 QUÁI VẬT VĂN PHÒNG TOOLIO
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
