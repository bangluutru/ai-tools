/* eslint-disable no-useless-escape */
import React, { useState } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download, FileText, CheckCircle2,
  Trash2, ShieldCheck, AlertCircle, FileArchive, RefreshCw, Eye,
  Building, Calendar, DollarSign, FileCheck, ArrowRight
} from 'lucide-react';
import { parseLocalizedNumber } from '@ai-tools/core/utils/accounting/reconcile.js';
import {
  deriveInvoiceAmounts,
  INVOICE_LIMITS,
  isKnownInvoiceNumber,
  isUnsafeZipPath,
} from '@ai-tools/core/utils/invoice/validation.js';
import { verifyDocumentSignature } from '@ai-tools/core/utils/documentFiles.js';

let pdfJsPromise;
const loadPdfJs = () => {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }
  return pdfJsPromise;
};

const makeId = () => crypto.randomUUID();

// Tiện ích đọc số thành chữ tiếng Việt
function numberToWordsVN(num) {
  if (!num || num === 0) return 'Không đồng chẵn./.';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(group) {
    const h = Math.floor(group / 100);
    const t = Math.floor((group % 100) / 10);
    const u = group % 10;
    const res = [];
    if (h > 0 || t > 0 || u > 0) {
      res.push(digits[h] + ' trăm');
      if (t === 0 && u > 0) res.push('linh');
      else if (t === 1) res.push('mười');
      else if (t > 1) res.push(digits[t] + ' mươi');
      if (u === 1 && t > 1) res.push('mốt');
      else if (u === 5 && t > 0) res.push('lăm');
      else if (u > 0) res.push(digits[u]);
    }
    return res.join(' ').trim();
  }

  let s = Math.floor(Math.abs(num)).toString();
  const groups = [];
  while (s.length > 0) {
    groups.push(parseInt(s.slice(-3), 10));
    s = s.slice(0, -3);
  }

  const words = [];
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] > 0) {
      let gWord = readGroup(groups[i]);
      if (i === groups.length - 1 && groups[i] < 100 && groups.length > 1) {
        gWord = gWord.replace(' không trăm', '');
        if (gWord.startsWith('linh ')) gWord = gWord.slice(5);
      }
      words.push(gWord + ' ' + units[i]);
    }
  }

  let res = words.reverse().join(' ').trim();
  res = res.charAt(0).toUpperCase() + res.slice(1) + ' đồng chẵn./.';
  res = res.replace(/\s+/g, ' ');
  if (res.startsWith('Không trăm ')) res = res.slice(11);
  return res.charAt(0).toUpperCase() + res.slice(1);
}

// Hàm trích xuất text từ buffer PDF
async function extractTextFromPDFBuffer(arrayBuffer) {
  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (pdf.numPages > INVOICE_LIMITS.maxPdfPages) {
      await pdf.destroy();
      throw new Error(`PDF vượt ${INVOICE_LIMITS.maxPdfPages} trang`);
    }
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = null;
      
      // Sort items by Y (descending) and then X (ascending)
      const items = textContent.items.map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        height: item.transform[3]
      }));

      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) {
          return b.y - a.y; // Descending Y (top to bottom)
        }
        return a.x - b.x; // Ascending X (left to right)
      });

      for (const item of items) {
        if (lastY !== null && Math.abs(item.y - lastY) > 5) {
          pageText += '\n';
        } else if (lastY !== null) {
          pageText += ' ';
        }
        pageText += item.str.trim();
        lastY = item.y;
      }
      
      // Cleanup multiple spaces
      pageText = pageText.replace(/ {2,}/g, ' ');
      fullText += pageText + '\n';
      page.cleanup();
    }
    await pdf.destroy();
    return fullText;
  } catch (err) {
    console.error('Lỗi khi extract text PDF:', err);
    return '';
  }
}

// Bóc tách dữ liệu từ văn bản PDF theo các mẫu hóa đơn phổ biến
function parsePDFInvoiceText(text, fileName, zipName = null) {
  try {
    let dateStr = '';
    let invoiceNo = 'N/A';
    let provider = 'Hóa đơn/Biên lai (PDF)';
    let totalAmount = 0;
    let amountBeforeTax = 0;
    let vatAmount = 0;

    // 1. Quét ngày tháng (nhiều pattern)
    // Pattern 1: DD/MM/YYYY hoặc DD-MM-YYYY
    const dateMatch1 = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    // Pattern 2: "Ngày DD Tháng MM Năm YYYY" (Vietnamese)
    const dateMatch2 = text.match(/(\d{1,2})\s*[Tt]háng.*?(\d{1,2})\s*[Nn]ăm.*?(\d{4})/);
    // Pattern 3: From filename (e.g., 20260118 - Receipt...)
    const dateMatch3 = fileName.match(/(\d{4})(\d{2})(\d{2})/);

    if (dateMatch1) {
      dateStr = `${dateMatch1[1]}/${dateMatch1[2]}/${dateMatch1[3]}`;
    } else if (dateMatch2) {
      const d = dateMatch2[1].padStart(2, '0');
      const m = dateMatch2[2].padStart(2, '0');
      dateStr = `${d}/${m}/${dateMatch2[3]}`;
    } else if (dateMatch3) {
      dateStr = `${dateMatch3[3]}/${dateMatch3[2]}/${dateMatch3[1]}`;
    }
    // Không dùng ngày hiện tại làm fallback → giữ trống nếu không tìm được
    if (!dateStr) dateStr = 'N/A';

    // 2. Quét số hóa đơn
    const invMatch = text.match(/(?:Số HĐ|Số hóa đơn|Số|Invoice No|No\.)[:\s]*([A-Z0-9\-\/]+)/i);
    if (invMatch && invMatch[1].length >= 3 && invMatch[1].length <= 15) {
      invoiceNo = invMatch[1].trim();
    }

    // 3. Quét số tiền — Ưu tiên tìm đúng dòng "tổng cộng tiền thanh toán" (giống Python)
    const amountRegex = /(?:tổng cộng tiền thanh toán|tổng tiền thanh toán|tổng cộng|total payment|total amount|tổng tiền|thành tiền)[^\d]*(\d{1,3}(?:[.,]\d{3})+|\d{4,})/gi;
    let match;
    const parsedNums = [];
    while ((match = amountRegex.exec(text)) !== null) {
      const cleaned = match[1].replace(/[^\d]/g, '');
      const num = parseInt(cleaned, 10);
      if (num > 0 && num <= 1_000_000_000_000) {
        parsedNums.push(num);
      }
    }

    if (parsedNums.length > 0) {
      // Giá trị sau thuế luôn là giá trị lớn nhất trong các dòng tổng cộng
      totalAmount = Math.max(...parsedNums);
    }
    // KHÔNG fallback tìm MAX mọi số — đây là nguyên nhân gây lỗi 190 triệu

    // 3b. Thử tìm tiền trước thuế và tiền thuế riêng
    const beforeTaxMatch = text.match(/(?:cộng tiền hàng|tiền chưa thuế|amount before)[^\d]*(\d{1,3}(?:[.,]\d{3})+|\d{4,})/gi);
    if (beforeTaxMatch) {
      for (const m of beforeTaxMatch) {
        const cleaned = m.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,})/);
        if (cleaned) {
          const num = parseInt(cleaned[1].replace(/[^\d]/g, ''), 10);
          if (num >= 1000 && num < totalAmount) {
            amountBeforeTax = num;
            break;
          }
        }
      }
    }
    const vatMatch = text.match(/(?:tiền thuế|thuế GTGT|VAT amount|tax amount)[^\d]*(\d{1,3}(?:[.,]\d{3})+|\d{4,})/gi);
    if (vatMatch) {
      for (const m of vatMatch) {
        const cleaned = m.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,})/);
        if (cleaned) {
          const num = parseInt(cleaned[1].replace(/[^\d]/g, ''), 10);
          if (num >= 100 && num < totalAmount) {
            vatAmount = num;
            break;
          }
        }
      }
    }

    // Chỉ cộng/trừ các field đọc được; tuyệt đối không giả định thuế suất.
    ({ totalAmount, amountBeforeTax, vatAmount } = deriveInvoiceAmounts({
      totalAmount,
      amountBeforeTax,
      vatAmount,
    }));

    const textLower = text.toLowerCase();

    // 4. Nhận diện nhà cung cấp + rút gọn tên
    // --- VÉ MÁY BAY ---
    if (textLower.includes('vietjet') || textLower.includes('vé máy bay') || textLower.includes('electronic ticket') || textLower.includes('e-ticket')) {
      const isVietnam = textLower.includes('vietnam airlines') || textLower.includes('hàng không việt nam');
      const airline = isVietnam ? 'Vietnam Airlines' : 'Vietjet Air';

      let pnr = '';
      const pnrMatch = text.match(/(?:Mã đặt chỗ|PNR|Reservation Code|Booking Ref)[:\s]*([A-Z0-9]{5,8})/i);
      if (pnrMatch) pnr = pnrMatch[1];
      // Fallback: extract PNR from filename
      if (!pnr) {
        const fnamePnr = fileName.match(/[_-]([A-Z0-9]{5,8})\./i);
        if (fnamePnr && !/^\d+$/.test(fnamePnr[1])) pnr = fnamePnr[1].toUpperCase();
      }

      const routes = [];
      const routeMatches = text.matchAll(/\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/g);
      for (const rm of routeMatches) {
        const route = `${rm[1]}-${rm[2]}`;
        if (!routes.includes(route)) routes.push(route);
      }
      // Fallback: route from filename
      const fnameRoute = fileName.match(/([A-Z]{3}-[A-Z]{3})/);
      if (fnameRoute && !routes.includes(fnameRoute[1])) routes.push(fnameRoute[1]);

      if (pnr && routes.length > 0) {
        provider = `${airline} [PNR: ${pnr} | ${routes.join(', ')}]`;
      } else if (pnr) {
        provider = `${airline} [PNR: ${pnr}]`;
      } else if (routes.length > 0) {
        provider = `${airline} [${routes.join(', ')}]`;
      } else {
        provider = airline;
      }
    }
    // --- VIETNAM AIRLINES (PDF riêng, không qua vietjet branch) ---
    else if (textLower.includes('vietnam airlines') || textLower.includes('hàng không việt nam')) {
      let pnr = '';
      const pnrMatch = text.match(/(?:Mã đặt chỗ|PNR|Reservation Code|Booking Ref)[:\s]*([A-Z0-9]{5,8})/i);
      if (pnrMatch) pnr = pnrMatch[1];
      if (!pnr) {
        const fnamePnr = fileName.match(/[_-]([A-Z0-9]{5,8})\./i);
        if (fnamePnr && !/^\d+$/.test(fnamePnr[1])) pnr = fnamePnr[1].toUpperCase();
      }

      const routes = [];
      const routeMatches = text.matchAll(/\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/g);
      for (const rm of routeMatches) {
        const route = `${rm[1]}-${rm[2]}`;
        if (!routes.includes(route)) routes.push(route);
      }

      if (pnr && routes.length > 0) {
        provider = `Vietnam Airlines [PNR: ${pnr} | ${routes.join(', ')}]`;
      } else if (routes.length > 0) {
        provider = `Vietnam Airlines [${routes.join(', ')}]`;
      } else {
        provider = 'Vietnam Airlines';
      }
    }
    // --- TAXI ---
    else if (textLower.includes('xanh sm') || textLower.includes('di chuyển xanh') || textLower.includes('gsm')) {
      let pickup = '';
      let dropoff = '';

      const pickupMatch = text.match(/(?:Điểm đón|Đón|Pickup|Từ)[:\s]*(.*?)(?:\n|Điểm đến|Đến|Dropoff|Thời gian|Mã chuyến|$)/i);
      if (pickupMatch) pickup = pickupMatch[1].trim().split(',')[0].trim();

      const dropoffMatch = text.match(/(?:Điểm đến|Đến|Dropoff|Tới)[:\s]*(.*?)(?:\n|Thời gian|Cước phí|Mã chuyến|$)/i);
      if (dropoffMatch) dropoff = dropoffMatch[1].trim().split(',')[0].trim();

      if (pickup && dropoff) {
        provider = `Xanh SM (${pickup} -> ${dropoff})`;
      } else {
        provider = 'Xanh SM (Chi phí di chuyển)';
      }
    }
    // --- KHÁCH SẠN / HOÁ ĐƠN CHUNG ---
    else {
      let seller = '';
      const sellerMatch = text.match(/(?:Đơn vị bán hàng|Tên người bán|Tên đơn vị bán|Người bán)[^\n:]*:\s*(.*?)(?:\n|Mã số thuế|Địa chỉ|$)/i);
      if (sellerMatch) {
        seller = sellerMatch[1].trim();
        if (seller && !seller.toLowerCase().startsWith('hàng(seller)')) {
          provider = seller;
        }
      }

      // Trích xuất tên hàng hoá dịch vụ với bộ lọc thông minh
      const itemMatch = text.match(/(?:Tên hàng hóa|Diễn giải|Tên dịch vụ|Nội dung|Hàng hoá, dịch vụ|Description).*?\n((?:.*?\n){1,8})/i);
      let desc = '';
      if (itemMatch) {
        const lines = itemMatch[1].split('\n');
        for (let d of lines) {
          d = d.trim();
          if (!d || d.length < 4) continue;
          const dLower = d.toLowerCase();

          // Bỏ qua tiêu đề bảng song ngữ, từ khóa header
          if (/^(?:stt|số thứ tự|tên|đơn vị tính|số lượng|đơn giá|mã|\(|\[)/i.test(dLower)) continue;
          if (dLower.includes('name of goods') || dLower.includes('description') || dLower.includes('seller') || dLower.includes('unit') || dLower.includes('quantity')) continue;
          if (dLower.includes('(no)') || dLower.includes('hàng(seller)') || dLower.includes('tính (%)') || dLower.includes('tính(%)')) continue;

          // Bỏ qua dòng chỉ chứa số, đánh dấu cột
          if (/^[\d\s=xX\.\,\+\-\%]+$/.test(d)) continue;

          // Bỏ số thứ tự đầu dòng
          const cleanD = d.replace(/^\d+[\.\s]+/, '').trim();
          if (cleanD.length < 4) continue;
          desc = cleanD.length > 60 ? ` (${cleanD.slice(0, 60)}...)` : ` (${cleanD})`;
          break;
        }
      }

      if (desc) {
        provider = provider + desc;
      }
    }

    const missingFields = [];
    if (!isKnownInvoiceNumber(invoiceNo)) missingFields.push('invoiceNo');
    if (dateStr === 'N/A') missingFields.push('date');
    if (!totalAmount) missingFields.push('totalAmount');
    if (!amountBeforeTax && !vatAmount) missingFields.push('taxBreakdown');

    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      zipName: zipName || null,
      invoiceNo,
      date: dateStr,
      seller: provider,
      sellerTax: 'PDF/E-Ticket',
      amountBeforeTax,
      vatAmount,
      totalAmount,
      status: missingFields.length === 0 ? 'Đã trích xuất' : 'Cần kiểm tra',
      rawType: 'PDF',
      missingFields,
      needsReview: missingFields.length > 0,
      isConfirmed: false,
    };
  } catch (err) {
    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      invoiceNo: 'N/A',
      date: 'N/A',
      seller: 'Lỗi bóc tách PDF',
      sellerTax: '-',
      amountBeforeTax: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'Lỗi parse',
      errorMessage: err.message,
      rawType: 'PDF',
      missingFields: ['parseError'],
      needsReview: true,
      isConfirmed: false,
    };
  }
}

// Hàm parse XML hóa đơn điện tử
function parseXMLInvoice(xmlString, fileName, zipName = null) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Định dạng XML không hợp lệ');
    }

    const getText = (selectorList) => {
      for (const sel of selectorList) {
        const el = xmlDoc.querySelector(sel);
        if (el && el.textContent && el.textContent.trim()) {
          return el.textContent.trim();
        }
      }
      return '';
    };

    // 1. Số hóa đơn
    const invoiceNo = getText([
      'SHDon', 'SoHoaDon', 'InvoiceNo', 'InvNo', 'invoiceNumber', 'SoHDon'
    ]) || 'Chưa rõ số';

    // 2. Ngày lập
    let dateStr = getText(['NLap', 'NgayLap', 'InvoiceDate', 'InvDate', 'NgayHoaDon', 'IssueDate']);
    if (dateStr) {
      dateStr = dateStr.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-');
        dateStr = `${d}/${m}/${y}`;
      }
    }
    if (!dateStr) dateStr = 'Chưa rõ ngày';

    // 3. Người bán & Mã số thuế
    let seller = getText([
      'NBan Ten', 'Seller Ten', 'Seller Name', 'TenNguoiBan', 'TenDonViBan', 'SupplierName', 'NBan > Ten'
    ]) || getText(['Ten']) || 'Nhà cung cấp';

    const sellerTax = getText([
      'NBan MST', 'Seller MST', 'Seller TaxCode', 'MST', 'MaSoThue', 'TaxCode', 'NBan > MST'
    ]) || '';

    // 4. Trích xuất nâng cao: Taxi, Vé máy bay, và tên hàng hóa dịch vụ
    const thhdvuTexts = Array.from(xmlDoc.querySelectorAll('THHDVu, TenHHDVu, HHDVu > THHDVu, HHDVu > Ten'))
      .map(node => node.textContent.trim())
      .filter(txt => txt.length > 0);

    const ttinData = {};
    const ttinNodes = xmlDoc.querySelectorAll('TTin');
    ttinNodes.forEach(node => {
      const truong = node.querySelector('TTruong');
      const lieu = node.querySelector('DLieu');
      if (truong && truong.textContent && lieu && lieu.textContent) {
        ttinData[truong.textContent.trim()] = lieu.textContent.trim();
      }
    });

    const sellerUpper = seller.toUpperCase();
    const isAirline = sellerUpper.includes('VIETJET') || sellerUpper.includes('VIETNAM AIRLINES');
    const isTaxi = ['GSM', 'XANH', 'DI CHUYỂN XANH', 'GREEN CAR', 'PHÚ HOÀNG', 'SACO', 'ĐẠI THÀNH', 'TỴ MÙI'].some(k => sellerUpper.includes(k));

    if (isAirline) {
      let pnr = '';
      const routes = [];
      for (const txt of thhdvuTexts) {
        if (/^[A-Z0-9]{5,7}$/.test(txt)) {
          pnr = txt;
          break;
        }
      }
      for (const val of Object.values(ttinData)) {
        if (/^[A-Z]{3}-[A-Z]{3}$/.test(val) && !routes.includes(val)) {
          routes.push(val);
        }
      }
      const airline = sellerUpper.includes('VIETJET') ? 'Vietjet Air' : 'Vietnam Airlines';
      if (pnr && routes.length > 0) {
        seller = `${airline} [PNR: ${pnr} | ${routes.join(', ')}]`;
      } else if (pnr) {
        seller = `${airline} [PNR: ${pnr}]`;
      } else if (routes.length > 0) {
        seller = `${airline} [${routes.join(', ')}]`;
      } else {
        seller = airline;
      }
    } else if (isTaxi) {
      let pickup = ttinData['PICK_UP_ADDRESS'] || ttinData['SENDER_NAME'] || ttinData['CustomField2'] || '';
      let dropoff = ttinData['DROP_OFF_ADDRESS'] || ttinData['SHIPPING_ADDRESS'] || ttinData['CustomField3'] || '';

      if (!pickup && !dropoff) {
        for (const txt of thhdvuTexts) {
          let m = txt.match(/Điểm đón:\s*(.*?)\s*[-–]\s*Điểm trả:\s*(.*)/i);
          if (m) { pickup = m[1].replace(/[ \.]+$/, ''); dropoff = m[2].replace(/[ \.]+$/, ''); break; }
          
          m = txt.match(/Điểm đón:\s*(.*?)\s*[.]\s*Điểm đến:\s*(.*)/i);
          if (m) { pickup = m[1].replace(/[ \.]+$/, ''); dropoff = m[2].replace(/[ \.]+$/, ''); break; }
          
          m = txt.match(/(?:taxi|xe|Cước)\s+.*?(?:BSX.*?)?[-–]?\s*Điểm đón:\s*(.*?)[-–]\s*Điểm.*?:\s*(.*)/i);
          if (m) { pickup = m[1].replace(/[ \.]+$/, ''); dropoff = m[2].replace(/[ \.]+$/, ''); break; }
          
          m = txt.match(/từ\s+(.*?)\s+đến\s+(.*)/i);
          if (m) { pickup = m[1].replace(/[ \.,]+$/, ''); dropoff = m[2].replace(/[ \.,]+$/, ''); break; }
        }
      }

      const cleanAddr = (addr) => {
        if (!addr) return '';
        return addr.split(',')[0].trim();
      };

      const taxiMap = {
        'GSM': 'Xanh SM', 'XANH': 'Xanh SM', 'DI CHUYỂN XANH': 'Xanh SM',
        'GREEN CAR': 'Green Car', 'PHÚ HOÀNG': 'Phú Hoàng',
        'SACO': 'Saco', 'ĐẠI THÀNH': 'Đại Thành Công', 'TỴ MÙI': 'Tỵ Mùi'
      };

      let shortName = seller;
      for (const [key, name] of Object.entries(taxiMap)) {
        if (sellerUpper.includes(key)) {
          shortName = name;
          break;
        }
      }

      if (pickup || dropoff) {
        let routeStr = ` (${cleanAddr(pickup)} -> ${cleanAddr(dropoff)})`;
        if (routeStr.length > 80) routeStr = routeStr.substring(0, 77) + '...)';
        seller = shortName + routeStr;
      } else {
        seller = shortName + ' (Chi phí di chuyển)';
      }
    } else {
      // Các hóa đơn khác
      const itemName = thhdvuTexts.length > 0 ? thhdvuTexts[0] : '';
      if (itemName && itemName.length > 2 && !seller.toLowerCase().includes(itemName.toLowerCase())) {
        let shortItem = itemName.length > 55 ? `${itemName.slice(0, 55)}...` : itemName;
        shortItem = shortItem.replace(/^\d+[\.\s]+/, '').trim();
        seller = `${seller} (${shortItem})`;
      }
    }

    // 5. Các loại tiền (Ưu tiên số tiền sau thuế chuẩn)
    const parseAmount = (selectors) => {
      const valStr = getText(selectors);
      if (valStr) {
        const num = parseLocalizedNumber(valStr);
        if (num !== null && num >= 0) return num;
      }
      return 0;
    };

    let totalAmount = parseAmount([
      'TgTTTBSo', 'TongTienThanhToan', 'TotalAmountWithVAT', 'TongTien', 'TienThanhtoan', 'TotalAmount', 'TGiaTriThanhToan'
    ]);

    let amountBeforeTax = parseAmount([
      'TgTCThue', 'TotalAmountWithoutVAT', 'TongTienChuaThue', 'TienChuaThue', 'AmountBeforeVAT'
    ]);

    let vatAmount = parseAmount([
      'TgTThue', 'VATAmount', 'TongTienThue', 'TienThue', 'TaxAmount'
    ]);

    // Chỉ suy ra phép cộng trực tiếp khi cả trước thuế và thuế đều có bằng chứng.
    ({ totalAmount, amountBeforeTax, vatAmount } = deriveInvoiceAmounts({
      totalAmount,
      amountBeforeTax,
      vatAmount,
    }));

    const missingFields = [];
    if (!isKnownInvoiceNumber(invoiceNo)) missingFields.push('invoiceNo');
    if (dateStr === 'Chưa rõ ngày') missingFields.push('date');
    if (!sellerTax) missingFields.push('sellerTax');
    if (!totalAmount) missingFields.push('totalAmount');
    if (!amountBeforeTax && !vatAmount) missingFields.push('taxBreakdown');

    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      zipName: zipName || null,
      invoiceNo,
      date: dateStr,
      seller,
      sellerTax,
      amountBeforeTax,
      vatAmount,
      totalAmount,
      status: missingFields.length === 0 ? 'Đã trích xuất' : 'Cần kiểm tra',
      rawType: 'XML',
      missingFields,
      needsReview: missingFields.length > 0,
      isConfirmed: false,
    };
  } catch (err) {
    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      invoiceNo: 'Lỗi đọc',
      date: '-',
      seller: 'Lỗi cấu trúc XML',
      sellerTax: '-',
      amountBeforeTax: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'Lỗi parse',
      errorMessage: err.message,
      rawType: 'XML',
      missingFields: ['parseError'],
      needsReview: true,
      isConfirmed: false,
    };
  }
}

export default function InvoiceTool() {
  const [invoices, setInvoices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState('');

  // Xử lý nạp các tệp tải lên (XML, PDF, ZIP)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const rejected = [];
    const accepted = files.slice(0, INVOICE_LIMITS.maxFiles).filter((file) => {
      if (file.size <= 0 || file.size > INVOICE_LIMITS.maxFileBytes) {
        rejected.push(`${file.name}: file rỗng hoặc vượt ${Math.round(INVOICE_LIMITS.maxFileBytes / 1024 / 1024)} MiB`);
        return false;
      }
      if (!/\.(xml|pdf|zip)$/i.test(file.name)) {
        rejected.push(`${file.name}: định dạng không hỗ trợ`);
        return false;
      }
      return true;
    });
    if (files.length > INVOICE_LIMITS.maxFiles) {
      rejected.push(`Chỉ xử lý ${INVOICE_LIMITS.maxFiles} file đầu tiên`);
    }
    setNotice(rejected.join(' • '));
    if (accepted.length === 0) return;

    setIsProcessing(true);
    const parsedList = [];

    for (const file of accepted) {
      const lowerName = file.name.toLowerCase();

      // 1. TRƯỜNG HỢP: TẬP TIN ZIP (.zip)
      if (lowerName.endsWith('.zip') || file.type.includes('zip')) {
        try {
          const { default: JSZip } = await import('jszip');
          const zip = await JSZip.loadAsync(file);
          const zipEntries = Object.keys(zip.files);
          if (zipEntries.length > INVOICE_LIMITS.maxZipEntries) {
            throw new Error(`ZIP vượt ${INVOICE_LIMITS.maxZipEntries} entries`);
          }
          if (zipEntries.some(isUnsafeZipPath)) {
            throw new Error('ZIP chứa đường dẫn không an toàn');
          }
          const uncompressedBytes = zipEntries.reduce(
            (sum, entryName) => sum + (zip.files[entryName]._data?.uncompressedSize || 0),
            0,
          );
          if (uncompressedBytes > INVOICE_LIMITS.maxZipUncompressedBytes) {
            throw new Error(`ZIP vượt ${Math.round(INVOICE_LIMITS.maxZipUncompressedBytes / 1024 / 1024)} MiB sau giải nén`);
          }

          // Phase 1: Thu thập danh sách base name các file XML trong ZIP
          const xmlBaseNames = new Set();
          for (const entryName of zipEntries) {
            const entryLower = entryName.toLowerCase();
            if (entryLower.endsWith('.xml')) {
              const baseName = entryName.split('/').pop();
              // Lưu base name không extension để so sánh với PDF
              xmlBaseNames.add(baseName.replace(/\.xml$/i, '').toLowerCase());
            }
          }

          // Phase 2: Xử lý XML trước, rồi PDF (skip PDF nếu đã có XML cùng base)
          for (const entryName of zipEntries) {
            const zipEntry = zip.files[entryName];
            if (zipEntry.dir || entryName.includes('__MACOSX') || entryName.startsWith('._')) {
              continue;
            }

            const entryLower = entryName.toLowerCase();
            const baseName = entryName.split('/').pop();

            if (entryLower.endsWith('.xml')) {
              const xmlContent = await zipEntry.async('text');
              const parsed = parseXMLInvoice(xmlContent, baseName, file.name);
              parsedList.push(parsed);
            }
            else if (entryLower.endsWith('.pdf')) {
              // Skip PDF nếu có XML cùng base name (ưu tiên XML chính xác hơn)
              const pdfBase = baseName.replace(/\.pdf$/i, '').toLowerCase();
              if (xmlBaseNames.has(pdfBase)) {
                continue; // Đã có XML, không cần PDF
              }
              // Skip Itinerary/copy PDF (không phải hoá đơn)
              if (baseName.toLowerCase().includes('itinerary') || baseName.toLowerCase().includes(' copy')) {
                continue;
              }
              const pdfBuffer = await zipEntry.async('arraybuffer');
              const pdfText = await extractTextFromPDFBuffer(pdfBuffer);
              const parsed = parsePDFInvoiceText(pdfText, baseName, file.name);
              parsedList.push(parsed);
            }
          }
        } catch (err) {
          console.error('Lỗi khi giải nén ZIP:', err);
          parsedList.push({
            id: makeId(),
            fileName: file.name,
            invoiceNo: 'Lỗi file ZIP',
            date: '-',
            seller: 'Không thể đọc file ZIP',
            sellerTax: '-',
            amountBeforeTax: 0,
            vatAmount: 0,
            totalAmount: 0,
            status: 'Lỗi giải nén',
            errorMessage: err.message,
            rawType: 'ZIP',
            missingFields: ['zipError'],
            needsReview: true,
            isConfirmed: false,
          });
        }
      }
      // 2. TRƯỜNG HỢP: TẬP TIN XML (.xml)
      else if (lowerName.endsWith('.xml')) {
        try {
          const xmlContent = await file.text();
          const parsed = parseXMLInvoice(xmlContent, file.name);
          parsedList.push(parsed);
        } catch (err) {
          console.error('Lỗi đọc XML:', err);
        }
      }
      // 3. TRƯỜNG HỢP: TẬP TIN PDF (.pdf)
      else if (lowerName.endsWith('.pdf')) {
        // Skip Itinerary/copy PDF
        if (lowerName.includes('itinerary') || lowerName.includes(' copy')) {
          continue;
        }
        try {
          if (!(await verifyDocumentSignature(file))) {
            throw new Error('Nội dung không phải PDF hợp lệ');
          }
          const arrayBuffer = await file.arrayBuffer();
          const pdfText = await extractTextFromPDFBuffer(arrayBuffer);
          const parsed = parsePDFInvoiceText(pdfText, file.name);
          parsedList.push(parsed);
        } catch (err) {
          console.error('Lỗi đọc PDF:', err);
        }
      }
    }

    // Khử trùng lặp thông minh: Ưu tiên XML hơn PDF khi cùng amount+date
    setInvoices((prev) => {
      const combined = [...prev, ...parsedList];

      // Bước 1: Chỉ dedupe PDF/XML khi có cùng số hóa đơn đáng tin cậy.
      const xmlInvoiceNumbers = new Set();
      for (const inv of combined) {
        if (inv.rawType === 'XML' && isKnownInvoiceNumber(inv.invoiceNo)) {
          xmlInvoiceNumbers.add(String(inv.invoiceNo).trim().toUpperCase());
        }
      }

      // Bước 2: Loại bỏ PDF trùng với XML (cùng amount + date)
      const afterXmlDedup = combined.filter((item) => {
        if (item.rawType === 'PDF') {
          const invoiceNo = String(item.invoiceNo || '').trim().toUpperCase();
          if (isKnownInvoiceNumber(item.invoiceNo) && xmlInvoiceNumbers.has(invoiceNo)) return false;
        }
        return true;
      });

      // Bước 3: Khử trùng còn lại theo invoiceNo + amount
      const seen = new Set();
      return afterXmlDedup.filter((item) => {
        const invNo = item.invoiceNo;
        const key = invNo && invNo !== 'N/A' && invNo !== 'Chưa rõ số'
          ? `${invNo}_${item.totalAmount}`
          : `${item.rawFileName}_${item.totalAmount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setIsProcessing(false);
  };

  const toggleConfirmed = (id) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, isConfirmed: !invoice.isConfirmed } : invoice
    )));
  };

  // Xuất bản nháp bảng kê. Việc điền template chuẩn cần file template đã được phê duyệt.
  const handleExportExcel = async () => {
    if (invoices.length === 0) return;

    const validInvoices = invoices.filter((i) => i.isConfirmed);
    if (validInvoices.length === 0) return;
    const XLSX = await import('xlsx');
    const totalAmount = validInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const wordsVN = numberToWordsVN(totalAmount);

    const rows = [
      ['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['Độc lập - Tự do - Hạnh phúc'],
      ['-----------------------'],
      ['BẢNG KÊ ĐỀ NGHỊ THANH TOÁN'],
      ['BẢN NHÁP THAM KHẢO — CHƯA PHÊ DUYỆT'],
      [`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`],
      [''],
      ['STT', 'Ngày tháng', 'Nội dung', 'Trước thuế', 'Tiền thuế', 'Tổng sau thuế', 'Số hóa đơn', 'Ghi chú']
    ];

    validInvoices.forEach((inv, idx) => {
      rows.push([
        idx + 1,
        inv.date,
        inv.seller,
        inv.amountBeforeTax,
        inv.vatAmount,
        inv.totalAmount,
        inv.invoiceNo,
        inv.rawFileName || ''
      ]);
    });

    // Dòng tổng cộng
    rows.push([
      'Tổng cộng',
      '',
      '',
      validInvoices.reduce((sum, i) => sum + (i.amountBeforeTax || 0), 0),
      validInvoices.reduce((sum, i) => sum + (i.vatAmount || 0), 0),
      totalAmount,
      '',
      ''
    ]);
    rows.push(['']);
    rows.push([`Số tiền bằng chữ: ${wordsVN}`]);
    rows.push(['']);
    rows.push(['Người đề nghị thanh toán', '', '', '', '', '', 'Kế toán trưởng / Phê duyệt', '']);
    rows.push(['(Ký, ghi rõ họ tên)', '', '', '', '', '', '(Ký, ghi rõ họ tên)', '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Định dạng độ rộng cột
    ws['!cols'] = [
      { wch: 6 },   // STT
      { wch: 14 },  // Ngày tháng
      { wch: 55 },  // Nội dung
      { wch: 18 },  // Trước thuế
      { wch: 15 },  // Tiền thuế
      { wch: 22 },  // Tổng sau thuế
      { wch: 18 },  // Số hóa đơn
      { wch: 30 }   // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bản nháp ĐNTT');
    XLSX.writeFile(wb, `Ban_Nhap_De_Nghi_Thanh_Toan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClearAll = () => {
    setInvoices([]);
    setNotice('');
  };

  const validInvoices = invoices.filter((i) => i.isConfirmed);
  const totalAmount = validInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileSpreadsheet className="text-amber-400" size={24} />
            Xử Lý Hóa Đơn & Tạo Đề Nghị Thanh Toán
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trích xuất XML/PDF bằng quy tắc cục bộ, sau đó yêu cầu người dùng xác nhận từng chứng từ trước khi xuất bản nháp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            Parser cục bộ • Bản nháp tham khảo
          </div>
          {invoices.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition"
            >
              <Trash2 size={14} />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
        Công cụ không tự giả định thuế suất, ngày hoặc số tiền. Hãy kiểm tra chứng từ gốc và chỉ đánh dấu xác nhận khi dữ liệu đã đúng; file xuất ra chưa phải phê duyệt thanh toán.
      </div>

      {notice && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {notice}
        </div>
      )}

      {/* Upload Zone */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/40 hover:bg-slate-900/80 transition rounded-2xl p-8 text-center cursor-pointer group">
        <input
          type="file"
          multiple
          accept=".xml,.pdf,.zip"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition duration-300">
            {isProcessing ? (
              <RefreshCw className="animate-spin" size={28} />
            ) : (
              <UploadCloud size={28} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Kéo thả thư mục nén <span className="text-amber-400 font-bold">.ZIP</span> hoặc các tệp <span className="text-amber-400 font-bold">.XML, .PDF</span> vào đây
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tối đa {INVOICE_LIMITS.maxFiles} file, {Math.round(INVOICE_LIMITS.maxFileBytes / 1024 / 1024)} MiB/file; ZIP tối đa {INVOICE_LIMITS.maxZipEntries} entries
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Đã kiểm tra và xác nhận</p>
              <p className="text-lg font-bold text-slate-100">{validInvoices.length} <span className="text-xs text-slate-500 font-normal">/ {invoices.length} tệp</span></p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng tiền thanh toán</p>
              <p className="text-lg font-bold text-emerald-400">{totalAmount.toLocaleString('vi-VN')} <span className="text-xs text-slate-400">VNĐ</span></p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-end">
            <button
              onClick={handleExportExcel}
              disabled={validInvoices.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition transform active:scale-95 text-xs"
            >
              <Download size={16} />
              Xuất bản nháp ({validInvoices.length})
            </button>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      {invoices.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách hóa đơn đã bóc tách ({invoices.length})
            </h3>
            <span className="text-xs text-amber-400 italic">
              * Chỉ các dòng đã được người dùng xác nhận mới được xuất
            </span>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-20 text-center">Xác nhận</th>
                  <th className="py-3 px-4 w-28">Ngày tháng</th>
                  <th className="py-3 px-4">Nội dung chi tiết</th>
                  <th className="py-3 px-4 w-28 text-right">Trước thuế</th>
                  <th className="py-3 px-4 w-24 text-right">Tiền thuế</th>
                  <th className="py-3 px-4 w-32 text-right">Sau thuế</th>
                  <th className="py-3 px-4 w-32">Số hóa đơn</th>
                  <th className="py-3 px-4 w-24 text-center">Loại</th>
                  <th className="py-3 px-4 w-32 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={inv.isConfirmed}
                        onChange={() => toggleConfirmed(inv.id)}
                        aria-label={`Xác nhận dữ liệu ${inv.rawFileName || inv.fileName}`}
                        className="h-4 w-4 accent-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{inv.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div>{inv.seller}</div>
                      {inv.rawFileName && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.rawFileName}</div>
                      )}
                      {inv.missingFields?.length > 0 && (
                        <div className="mt-1 text-[10px] text-amber-300">
                          Thiếu/cần kiểm tra: {inv.missingFields.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-300 whitespace-nowrap">
                      {inv.amountBeforeTax.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-400 whitespace-nowrap">
                      {inv.vatAmount.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400 whitespace-nowrap">
                      {inv.totalAmount.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.rawType === 'XML' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {inv.rawType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        inv.needsReview
                          ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
                          : 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
