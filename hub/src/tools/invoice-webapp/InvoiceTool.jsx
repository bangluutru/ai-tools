/* eslint-disable no-useless-escape */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download,
  Trash2, ShieldCheck, RefreshCw,
  Building2, DollarSign, FileCheck
} from 'lucide-react';
import { useLocalStorage } from '@ai-tools/core/hooks/useLocalStorage.js';
import { parseLocalizedNumber } from '@ai-tools/core/utils/accounting/reconcile.js';
import {
  deriveInvoiceAmounts,
  INVOICE_LIMITS,
  isInvoiceDocument,
  isKnownInvoiceNumber,
  isUnsafeZipPath,
  mergeInvoiceBatch,
} from '@ai-tools/core/utils/invoice/validation.js';
import { verifyDocumentSignature } from '@ai-tools/core/utils/documentFiles.js';
import { exportPaymentRequest } from '@ai-tools/core/utils/invoice/paymentRequestExport.js';
import {
  exportPaymentRequestForms,
  monthSheetName,
} from '@ai-tools/core/utils/invoice/paymentRequestForm.js';
import {
  buildFormsFromGroups,
  companyKeyOf,
  describeFormContent,
  groupInvoicesByCompany,
} from '@ai-tools/core/utils/invoice/companyGrouping.js';
import { describeExpense } from '@ai-tools/core/utils/invoice/expenseCategory.js';
import {
  extractInvoiceFields,
  missingInvoiceFields,
  parseInvoiceSymbol,
  validateInvoiceFields,
} from '@ai-tools/core/utils/invoice/vietnamInvoice.js';

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

// Hàm trích xuất text từ buffer PDF
async function extractTextFromPDFBuffer(arrayBuffer) {
  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (pdf.numPages > INVOICE_LIMITS.maxPdfPages) {
      // Giải phóng worker qua loadingTask: PDFDocumentProxy không có destroy().
      await loadingTask.destroy();
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
    await loadingTask.destroy();
    return fullText;
  } catch (err) {
    console.error('Lỗi khi extract text PDF:', err);
    return '';
  }
}

/**
 * Nhận diện chứng từ đi lại không phải hóa đơn điện tử theo mẫu (vé máy bay,
 * biên nhận taxi). Chỉ dùng để đặt tên hiển thị khi hóa đơn không có trường
 * "Tên người bán" theo quy định.
 */
function findFlightRoutes(text, fileName) {
  const routes = [];
  for (const match of text.matchAll(/\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/g)) {
    const route = `${match[1]}-${match[2]}`;
    if (!routes.includes(route)) routes.push(route);
  }
  const fromName = fileName.match(/([A-Z]{3}-[A-Z]{3})/);
  if (fromName && !routes.includes(fromName[1])) routes.push(fromName[1]);
  return routes;
}

function describeTravelDocument(text, fileName) {
  const textLower = text.toLowerCase();

  const findPnr = () => {
    const pnrMatch = text.match(/(?:Mã đặt chỗ|PNR|Reservation Code|Booking Ref)[:\s]*([A-Z0-9]{5,8})/i);
    if (pnrMatch) return pnrMatch[1];
    const fnamePnr = fileName.match(/[_-]([A-Z0-9]{5,8})\./i);
    return fnamePnr && !/^\d+$/.test(fnamePnr[1]) ? fnamePnr[1].toUpperCase() : '';
  };

  const findRoutes = () => findFlightRoutes(text, fileName);

  const isAirline = textLower.includes('vietjet')
    || textLower.includes('vietnam airlines')
    || textLower.includes('hàng không việt nam')
    || textLower.includes('vé máy bay')
    || textLower.includes('electronic ticket')
    || textLower.includes('e-ticket');

  if (isAirline) {
    const airline = textLower.includes('vietnam airlines') || textLower.includes('hàng không việt nam')
      ? 'Vietnam Airlines'
      : 'Vietjet Air';
    const pnr = findPnr();
    const routes = findRoutes();
    const details = [pnr ? `PNR: ${pnr}` : '', routes.join(', ')].filter(Boolean).join(' | ');
    return details ? `${airline} [${details}]` : airline;
  }

  if (textLower.includes('xanh sm') || textLower.includes('di chuyển xanh') || textLower.includes('gsm')) {
    const pickupMatch = text.match(/(?:Điểm đón|Đón|Pickup|Từ)[:\s]*(.*?)(?:\n|Điểm đến|Đến|Dropoff|Thời gian|Mã chuyến|$)/i);
    const dropoffMatch = text.match(/(?:Điểm đến|Đến|Dropoff|Tới)[:\s]*(.*?)(?:\n|Thời gian|Cước phí|Mã chuyến|$)/i);
    const pickup = pickupMatch ? pickupMatch[1].trim().split(',')[0].trim() : '';
    const dropoff = dropoffMatch ? dropoffMatch[1].trim().split(',')[0].trim() : '';
    return pickup && dropoff ? `Xanh SM (${pickup} -> ${dropoff})` : 'Xanh SM (Chi phí di chuyển)';
  }

  return '';
}

/** Tên hàng hóa, dịch vụ đầu tiên — chỉ để hiển thị kèm tên người bán. */
function findFirstLineItem(text) {
  const itemMatch = text.match(/(?:Tên hàng hóa|Diễn giải|Tên dịch vụ|Nội dung|Hàng hoá, dịch vụ|Description).*?\n((?:.*?\n){1,8})/i);
  if (!itemMatch) return '';

  for (let line of itemMatch[1].split('\n')) {
    line = line.trim();
    if (!line || line.length < 4) continue;
    const lower = line.toLowerCase();

    if (/^(?:stt|số thứ tự|tên|đơn vị tính|số lượng|đơn giá|mã|\(|\[)/i.test(lower)) continue;
    if (['name of goods', 'description', 'seller', 'unit', 'quantity'].some((token) => lower.includes(token))) continue;
    if (/^[\d\s=xX.,+\-%]+$/.test(line)) continue;

    // Text PDF gộp cả dòng bảng, nên cắt tại cột số đầu tiên (số lượng/đơn giá)
    // để chỉ giữ lại tên hàng hóa, dịch vụ.
    const words = line.replace(/^\d+[.\s]+/, '').trim().split(/\s+/);
    const firstNumber = words.findIndex((word) => /^\d[\d.,]*%?$/.test(word));
    const cleaned = (firstNumber > 0 ? words.slice(0, firstNumber) : words).join(' ').trim();
    if (cleaned.length < 4) continue;
    return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned;
  }

  return '';
}

/**
 * Bóc tách bản thể hiện PDF theo đúng bộ trường mà Thông tư 91/2026/TT-BTC quy
 * định, thay vì dò theo vị trí. Không suy diễn giá trị thiếu: trường nào không
 * đọc được thì đánh dấu để người dùng đối chiếu chứng từ gốc.
 */
function parsePDFInvoiceText(text, fileName, zipName = null) {
  try {
    // Hóa đơn điện tử xuất từ phần mềm luôn có lớp text. Gần như không có chữ
    // nào nghĩa là bản scan hoặc ảnh chụp — nói thẳng thay vì hiện trường trống.
    if (text.replace(/\s/g, '').length < 20) {
      return {
        id: makeId(),
        fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
        rawFileName: fileName,
        zipName: zipName || null,
        invoiceNo: 'Chưa rõ số',
        date: 'Chưa rõ ngày',
        seller: 'PDF không có lớp text',
        sellerTax: '',
        amountBeforeTax: 0,
        vatAmount: 0,
        totalAmount: 0,
        status: 'Không đọc được',
        rawType: 'PDF',
        missingFields: ['noTextLayer'],
        warnings: ['PDF không chứa lớp text (bản scan hoặc ảnh chụp). Công cụ không có OCR — hãy dùng bản PDF gốc do phần mềm hóa đơn xuất ra, hoặc nhập tay chứng từ này.'],
        needsReview: true,
        isConfirmed: false,
      };
    }

    const fields = extractInvoiceFields(text);

    const amounts = deriveInvoiceAmounts({
      totalAmount: fields.totalAmount,
      amountBeforeTax: fields.amountBeforeTax,
      vatAmount: fields.vatAmount,
    });
    const resolved = { ...fields, ...amounts };

    const warnings = validateInvoiceFields(resolved);
    const missingFields = missingInvoiceFields(resolved);

    // Tên hiển thị: ưu tiên "Tên người bán" theo quy định, sau đó mới tới nhận
    // diện vé/biên nhận vốn không phải hóa đơn điện tử theo mẫu.
    const travelName = describeTravelDocument(text, fileName);
    const lineItem = findFirstLineItem(text);
    let seller = fields.seller || travelName || 'Hóa đơn/Biên lai (PDF)';
    if (fields.seller && lineItem) seller = `${seller} (${lineItem})`;
    else if (!fields.seller && travelName && lineItem) seller = `${travelName} (${lineItem})`;

    const invoiceNo = fields.invoiceNo || 'Chưa rõ số';

    // Khi còn trường chưa đọc được, giữ lại các dòng có khả năng chứa nhãn tiền
    // để người dùng xem được phần mềm phát hành đã ghi nhãn thế nào.
    const textSample = missingFields.length === 0 && warnings.length === 0
      ? ''
      : text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && /\d/.test(line))
        .slice(0, 25)
        .join('\n')
        .slice(0, 1500);

    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      zipName: zipName || null,
      invoiceNo,
      invoiceSymbol: fields.symbol?.raw || '',
      invoiceFormName: fields.symbol?.formName || '',
      date: fields.date || 'Chưa rõ ngày',
      seller,
      // Tên người bán và tên hàng hóa "sạch" (chưa ghép chú thích) để suy ra
      // nội dung khoản chi trên Giấy đề nghị thanh toán.
      sellerName: fields.seller || travelName || '',
      itemName: lineItem || '',
      route: findFlightRoutes(text, fileName)[0] || '',
      sellerTax: fields.sellerTax || '',
      buyer: fields.buyer || '',
      buyerTax: fields.buyerTax || '',
      buyerAddress: fields.buyerAddress || '',
      amountBeforeTax: resolved.amountBeforeTax,
      vatAmount: resolved.vatAmount,
      totalAmount: resolved.totalAmount,
      amountInWords: fields.amountInWords || '',
      status: missingFields.length === 0 && warnings.length === 0 ? 'Đã trích xuất' : 'Cần kiểm tra',
      rawType: 'PDF',
      textSample,
      missingFields,
      warnings,
      needsReview: missingFields.length > 0 || warnings.length > 0,
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
      sellerTax: '',
      amountBeforeTax: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'Lỗi parse',
      errorMessage: err.message,
      rawType: 'PDF',
      missingFields: ['parseError'],
      warnings: [],
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
    const sellerName = seller;

    // Người mua quyết định hóa đơn thuộc về pháp nhân nào, nên đây là khóa để
    // tách Giấy đề nghị thanh toán theo công ty.
    const buyer = getText([
      'NMua Ten', 'Buyer Ten', 'NMua > Ten', 'TenNguoiMua', 'TenDonViMua', 'BuyerName'
    ]) || '';
    const buyerTax = getText([
      'NMua MST', 'Buyer MST', 'NMua > MST', 'MaSoThueNguoiMua', 'BuyerTaxCode'
    ]) || '';
    const buyerAddress = getText([
      'NMua DChi', 'Buyer DChi', 'NMua > DChi', 'DiaChiNguoiMua', 'BuyerAddress'
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

    let flightRoute = '';
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
      flightRoute = routes[0] || '';
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

    // Ký hiệu mẫu số + ký hiệu hóa đơn theo Điều 4 và Phụ lục I TT 91/2026/TT-BTC.
    const symbol = parseInvoiceSymbol(
      `${getText(['KHMSHDon', 'KyHieuMauSoHoaDon']) || ''}${getText(['KHHDon', 'KyHieuHoaDon']) || ''}`,
    );

    const missingFields = [];
    if (!isKnownInvoiceNumber(invoiceNo)) missingFields.push('invoiceNo');
    if (dateStr === 'Chưa rõ ngày') missingFields.push('date');
    if (!sellerTax) missingFields.push('sellerTax');
    if (!totalAmount) missingFields.push('totalAmount');
    if (symbol?.expectsVat !== false && !amountBeforeTax && !vatAmount) {
      missingFields.push('taxBreakdown');
    }

    const warnings = validateInvoiceFields({
      symbol,
      date: dateStr === 'Chưa rõ ngày' ? '' : dateStr,
      amountBeforeTax,
      vatAmount,
      totalAmount,
      sellerTax,
      amountInWordsValue: null,
      dateSource: 'label',
    });

    return {
      id: makeId(),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      zipName: zipName || null,
      invoiceNo,
      invoiceSymbol: symbol?.raw || '',
      invoiceFormName: symbol?.formName || '',
      date: dateStr,
      seller,
      sellerName,
      itemName: thhdvuTexts[0] || '',
      route: flightRoute,
      sellerTax,
      buyer,
      buyerTax,
      buyerAddress,
      amountBeforeTax,
      vatAmount,
      totalAmount,
      status: missingFields.length === 0 && warnings.length === 0 ? 'Đã trích xuất' : 'Cần kiểm tra',
      rawType: 'XML',
      missingFields,
      warnings,
      needsReview: missingFields.length > 0 || warnings.length > 0,
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

const todayInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** "2026-06-23" (input type=date) → Date theo giờ địa phương. */
const parseInputDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const DEFAULT_FORM_SETTINGS = {
  requester: '',
  department: 'Ban Giám Đốc',
  accountant: '',
  invoiceLink: '',
  contentPrefix: 'Chi phí đi lại công tác',
  sheetName: '',
};

export default function InvoiceTool() {
  const [invoices, setInvoices] = useState([]);
  // Việc đọc chứng từ chạy bất đồng bộ khá lâu; ref giữ danh sách mới nhất để
  // mẻ vừa đọc gộp đúng vào những gì đang có trên bảng.
  const invoicesRef = useRef(invoices);
  useEffect(() => { invoicesRef.current = invoices; }, [invoices]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState('');

  // Thông tin cố định của người lập chứng từ: giữ lại giữa các lần dùng để
  // khỏi phải gõ lại mỗi tháng.
  const [formSettings, setFormSettings] = useLocalStorage(
    'payment-request-form',
    DEFAULT_FORM_SETTINGS,
    'invoice',
  );
  const [companyOverrides, setCompanyOverrides] = useLocalStorage(
    'payment-request-companies',
    {},
    'invoice',
  );
  const [issuedAtInput, setIssuedAtInput] = useState(todayInputValue);
  const [contents, setContents] = useState({});

  const updateSetting = (key, value) => setFormSettings({ ...formSettings, [key]: value });

  // Xử lý nạp các tệp tải lên (XML, PDF, ZIP)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const notes = [];
    const accepted = files.slice(0, INVOICE_LIMITS.maxFiles).filter((file) => {
      const isZip = /\.zip$/i.test(file.name);
      const sizeCap = isZip ? INVOICE_LIMITS.maxZipBytes : INVOICE_LIMITS.maxFileBytes;
      if (file.size <= 0 || file.size > sizeCap) {
        notes.push(`${file.name}: file rỗng hoặc vượt ${Math.round(sizeCap / 1024 / 1024)} MiB`);
        return false;
      }
      if (!/\.(xml|pdf|zip)$/i.test(file.name)) {
        notes.push(`${file.name}: định dạng không hỗ trợ`);
        return false;
      }
      return true;
    });
    if (files.length > INVOICE_LIMITS.maxFiles) {
      notes.push(`Chỉ xử lý ${INVOICE_LIMITS.maxFiles} file đầu tiên trong ${files.length} file đã chọn`);
    }
    setNotice(notes.join(' • '));
    if (accepted.length === 0) return;

    setIsProcessing(true);
    setProgress({ done: 0, total: accepted.length, label: '' });

    const parsedList = [];
    // Ghi lại những gì công cụ gặp nhưng không bóc tách được, để báo lại thay vì
    // im lặng bỏ qua — người dùng cần biết đã đọc thiếu chứng từ nào.
    const skipped = [];

    const readXmlEntry = async (text, displayName, zipName) => {
      parsedList.push(parseXMLInvoice(text, displayName, zipName));
    };

    const readPdfEntry = async (buffer, displayName, zipName) => {
      const pdfText = await extractTextFromPDFBuffer(buffer);
      const parsed = parsePDFInvoiceText(pdfText, displayName, zipName);
      // Vé/lịch trình đi kèm không phải hóa đơn, nhưng vẫn hiện ra để người dùng
      // tự quyết định thay vì bị loại âm thầm như trước.
      if (/itinerary|\bcopy\b|lich trinh/i.test(displayName)) {
        parsed.warnings = [
          ...(parsed.warnings ?? []),
          'Tên tệp cho thấy đây có thể là lịch trình hoặc bản sao chứ không phải hóa đơn.',
        ];
        parsed.needsReview = true;
        parsed.status = 'Cần kiểm tra';
      }
      parsedList.push(parsed);
    };

    /** Mở một thư mục nén, kể cả ZIP lồng trong ZIP. */
    const readZip = async (blob, zipLabel, depth) => {
      if (depth > INVOICE_LIMITS.maxZipDepth) {
        skipped.push(`${zipLabel}: ZIP lồng quá ${INVOICE_LIMITS.maxZipDepth} lớp`);
        return;
      }

      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(blob);
      const entryNames = Object.keys(zip.files);

      if (entryNames.length > INVOICE_LIMITS.maxZipEntries) {
        throw new Error(`ZIP vượt ${INVOICE_LIMITS.maxZipEntries} entries`);
      }
      if (entryNames.some(isUnsafeZipPath)) {
        throw new Error('ZIP chứa đường dẫn không an toàn');
      }
      const uncompressedBytes = entryNames.reduce(
        (sum, entryName) => sum + (zip.files[entryName]._data?.uncompressedSize || 0),
        0,
      );
      if (uncompressedBytes > INVOICE_LIMITS.maxZipUncompressedBytes) {
        throw new Error(`ZIP vượt ${Math.round(INVOICE_LIMITS.maxZipUncompressedBytes / 1024 / 1024)} MiB sau giải nén`);
      }

      const usable = entryNames.filter((entryName) => {
        const entry = zip.files[entryName];
        if (entry.dir) return false;
        // Thư mục rác của macOS, không phải chứng từ.
        return !entryName.includes('__MACOSX') && !entryName.split('/').pop().startsWith('._');
      });

      // XML là bản gốc có giá trị pháp lý, PDF chỉ là bản thể hiện: khi cùng một
      // hóa đơn có cả hai thì đọc XML và bỏ PDF trùng tên.
      const xmlBaseNames = new Set(
        usable
          .filter((entryName) => /\.xml$/i.test(entryName))
          .map((entryName) => entryName.split('/').pop().replace(/\.xml$/i, '').toLowerCase()),
      );

      for (const entryName of usable) {
        if (parsedList.length >= INVOICE_LIMITS.maxDocuments) {
          skipped.push(`Dừng ở ${INVOICE_LIMITS.maxDocuments} chứng từ`);
          return;
        }

        const entry = zip.files[entryName];
        const baseName = entryName.split('/').pop();
        const displayName = zipLabel ? `${zipLabel} ➔ ${baseName}` : baseName;

        if (/\.xml$/i.test(baseName)) {
          await readXmlEntry(await entry.async('text'), baseName, zipLabel);
        } else if (/\.pdf$/i.test(baseName)) {
          if (xmlBaseNames.has(baseName.replace(/\.pdf$/i, '').toLowerCase())) continue;
          await readPdfEntry(await entry.async('arraybuffer'), baseName, zipLabel);
        } else if (/\.zip$/i.test(baseName)) {
          await readZip(await entry.async('blob'), displayName, depth + 1);
        } else {
          skipped.push(`${displayName}: không phải XML/PDF`);
        }
      }
    };

    for (const [index, file] of accepted.entries()) {
      setProgress({ done: index, total: accepted.length, label: file.name });
      const lowerName = file.name.toLowerCase();

      try {
        if (lowerName.endsWith('.zip') || file.type.includes('zip')) {
          await readZip(file, file.name, 1);
        } else if (lowerName.endsWith('.xml')) {
          await readXmlEntry(await file.text(), file.name, null);
        } else if (lowerName.endsWith('.pdf')) {
          if (!(await verifyDocumentSignature(file))) {
            throw new Error('Nội dung không phải PDF hợp lệ');
          }
          await readPdfEntry(await file.arrayBuffer(), file.name, null);
        }
      } catch (err) {
        console.error('Lỗi khi đọc chứng từ:', file.name, err);
        parsedList.push({
          id: makeId(),
          fileName: file.name,
          rawFileName: file.name,
          invoiceNo: 'Lỗi đọc tệp',
          date: '-',
          seller: `Không đọc được ${file.name}`,
          sellerTax: '',
          amountBeforeTax: 0,
          vatAmount: 0,
          totalAmount: 0,
          status: 'Lỗi đọc tệp',
          errorMessage: err.message,
          rawType: lowerName.endsWith('.zip') ? 'ZIP' : lowerName.endsWith('.xml') ? 'XML' : 'PDF',
          missingFields: ['readError'],
          warnings: [],
          needsReview: true,
          isConfirmed: false,
        });
      }
    }

    setProgress({ done: accepted.length, total: accepted.length, label: '' });

    const { invoices: merged, added } = mergeInvoiceBatch(invoicesRef.current, parsedList);
    setInvoices(merged);

    const summary = [`Đã đọc ${added} chứng từ từ ${accepted.length} tệp`];
    if (skipped.length > 0) {
      summary.push(`bỏ qua ${skipped.length} mục: ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '…' : ''}`);
    }
    setNotice([...notes, summary.join(' • ')].join(' • '));

    setIsProcessing(false);
    setProgress(null);
    // Cho phép chọn lại đúng những tệp vừa nạp mà vẫn kích hoạt onChange.
    e.target.value = '';
  };

  const setAllConfirmed = (isConfirmed) => {
    setInvoices((current) => current.map((invoice) => (
      isInvoiceDocument(invoice) ? { ...invoice, isConfirmed } : invoice
    )));
  };

  /** Xác nhận nhanh những dòng công cụ đọc đủ trường và không có cảnh báo. */
  const confirmCleanRows = () => {
    setInvoices((current) => current.map((invoice) => (
      invoice.needsReview || !isInvoiceDocument(invoice) ? invoice : { ...invoice, isConfirmed: true }
    )));
  };

  /** Đưa một tệp đính kèm vào bảng khi người dùng xác định đó là hóa đơn. */
  const forceAsInvoice = (id) => {
    setInvoices((current) => current.map((document) => (
      document.id === id ? { ...document, forcedAsInvoice: true } : document
    )));
  };

  const toggleConfirmed = (id) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, isConfirmed: !invoice.isConfirmed } : invoice
    )));
  };

  /** Nội dung khoản chi hiển thị trên ĐNTT — người dùng sửa được từng dòng. */
  const setExpenseNote = (id, expenseNote) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, expenseNote } : invoice
    )));
  };

  /** Chuyển một hóa đơn sang pháp nhân khác khi hóa đơn ghi sai người mua. */
  const setInvoiceCompany = (id, key) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, companyKey: key || undefined } : invoice
    )));
  };

  // Chỉ những tệp là bản thể hiện hóa đơn mới lên bảng; lịch trình bay và bản
  // đính kèm được xếp riêng để không trông như hóa đơn bị lặp.
  const invoiceRows = useMemo(() => invoices.filter(isInvoiceDocument), [invoices]);
  const otherDocuments = useMemo(
    () => invoices.filter((document) => !isInvoiceDocument(document)),
    [invoices],
  );

  const validInvoices = useMemo(
    () => invoiceRows.filter((invoice) => invoice.isConfirmed),
    [invoiceRows],
  );

  // Tách theo pháp nhân đứng tên người mua: mỗi công ty là một giấy đề nghị.
  const companyGroups = useMemo(
    () => groupInvoicesByCompany(validInvoices, companyOverrides),
    [validInvoices, companyOverrides],
  );

  /**
   * Danh sách đơn vị để đổi trong bảng: gom trên toàn bộ hóa đơn (kể cả chưa
   * xác nhận) nên luôn chứa nhóm hiện tại của mọi dòng.
   */
  const companyOptions = useMemo(
    () => groupInvoicesByCompany(invoices, companyOverrides).map((group) => ({
      key: group.key,
      label: group.company.name || 'Chưa xác định đơn vị',
    })),
    [invoices, companyOverrides],
  );

  const forms = useMemo(
    () => buildFormsFromGroups(companyGroups, {
      contents,
      contentPrefix: formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
    }),
    [companyGroups, contents, formSettings.contentPrefix],
  );

  const updateCompany = (key, field, value) => {
    const current = companyOverrides[key] ?? {};
    setCompanyOverrides({ ...companyOverrides, [key]: { ...current, [field]: value } });
  };

  // Xuất Giấy đề nghị thanh toán: một sheet cho mỗi công ty, đúng biểu mẫu giấy.
  const handleExportForms = async () => {
    if (forms.length === 0) return;

    const missingCompany = forms.find((form) => !form.company.name || form.company.name.startsWith('Chưa xác định'));
    if (missingCompany) {
      setNotice('Có nhóm chưa xác định được đơn vị thanh toán. Hãy điền tên công ty trước khi xuất.');
      return;
    }

    setNotice('');
    try {
      await exportPaymentRequestForms(forms, {
        issuedAt: parseInputDate(issuedAtInput),
        sheetName: formSettings.sheetName,
        requester: formSettings.requester,
        department: formSettings.department,
        accountant: formSettings.accountant,
        invoiceLink: formSettings.invoiceLink,
      });
    } catch (error) {
      console.error('Lỗi xuất Giấy đề nghị thanh toán:', error);
      setNotice(error.message || 'Không xuất được Giấy đề nghị thanh toán.');
    }
  };

  // Bảng kê chi tiết hóa đơn — phụ lục kèm theo giấy đề nghị.
  const handleExportExcel = async () => {
    if (validInvoices.length === 0) return;

    setNotice('');
    try {
      await exportPaymentRequest(validInvoices);
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      setNotice(error.message || 'Không xuất được file Excel.');
    }
  };

  const handleClearAll = () => {
    setInvoices([]);
    setContents({});
    setNotice('');
  };

  const allConfirmed = invoiceRows.length > 0 && validInvoices.length === invoiceRows.length;
  const cleanRowCount = invoiceRows.filter((invoice) => !invoice.needsReview).length;
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
            Trích xuất XML/PDF theo tiêu thức hóa đơn tại TT 91/2026/TT-BTC, sau đó yêu cầu người dùng xác nhận từng chứng từ trước khi xuất.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            Parser cục bộ • Kiểm tra trước khi xuất
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
              Kéo thả nhiều thư mục nén <span className="text-amber-400 font-bold">.ZIP</span> hoặc các tệp <span className="text-amber-400 font-bold">.XML, .PDF</span> vào đây
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tối đa {INVOICE_LIMITS.maxFiles} file mỗi lần • ZIP tối đa {Math.round(INVOICE_LIMITS.maxZipBytes / 1024 / 1024)} MiB và {INVOICE_LIMITS.maxZipEntries} mục, đọc được cả ZIP lồng ZIP • XML/PDF tối đa {Math.round(INVOICE_LIMITS.maxFileBytes / 1024 / 1024)} MiB
            </p>
            {progress && (
              <p className="mt-2 text-xs font-semibold text-amber-300">
                Đang đọc {progress.done}/{progress.total}
                {progress.label ? ` — ${progress.label}` : ''}
              </p>
            )}
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
              <p className="text-lg font-bold text-slate-100">{validInvoices.length} <span className="text-xs text-slate-500 font-normal">/ {invoiceRows.length} hóa đơn</span></p>
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

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Đơn vị thanh toán</p>
              <p className="text-lg font-bold text-slate-100">{companyGroups.length} <span className="text-xs text-slate-500 font-normal">giấy đề nghị</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Thông tin in trên Giấy đề nghị thanh toán */}
      {invoices.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Thông tin in trên Giấy đề nghị thanh toán
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Người đề nghị thanh toán</span>
              <input
                type="text"
                value={formSettings.requester}
                onChange={(event) => updateSetting('requester', event.target.value)}
                placeholder="Nguyễn Văn A"
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Bộ phận (hoặc địa chỉ)</span>
              <input
                type="text"
                value={formSettings.department}
                onChange={(event) => updateSetting('department', event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Kế toán ký duyệt</span>
              <input
                type="text"
                value={formSettings.accountant}
                onChange={(event) => updateSetting('accountant', event.target.value)}
                placeholder="Trần Thị B"
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Ngày lập giấy đề nghị</span>
              <input
                type="date"
                value={issuedAtInput}
                onChange={(event) => setIssuedAtInput(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Tên sheet (kỳ lập)</span>
              <input
                type="text"
                value={formSettings.sheetName}
                onChange={(event) => updateSetting('sheetName', event.target.value)}
                placeholder={monthSheetName(parseInputDate(issuedAtInput))}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Mở đầu nội dung thanh toán</span>
              <input
                type="text"
                value={formSettings.contentPrefix}
                onChange={(event) => updateSetting('contentPrefix', event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-400">Link hóa đơn (ô &quot;Link Hoá đơn&quot;)</span>
              <input
                type="text"
                value={formSettings.invoiceLink}
                onChange={(event) => updateSetting('invoiceLink', event.target.value)}
                placeholder="Tên thư mục hoặc đường dẫn lưu hóa đơn gốc"
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
              />
            </label>
          </div>
        </div>
      )}

      {/* Các đơn vị thanh toán đã tách theo hóa đơn */}
      {companyGroups.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đơn vị thanh toán ({companyGroups.length}) — cùng một sheet, mỗi đơn vị một giấy
            </h3>
            <button
              onClick={handleExportForms}
              disabled={forms.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition transform active:scale-95 text-xs"
            >
              <Download size={16} />
              Xuất Giấy đề nghị thanh toán ({companyGroups.length})
            </button>
          </div>

          <div className="space-y-3">
            {companyGroups.map((group, index) => (
              <div key={group.key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">Giấy {index + 1}: {forms[index]?.label}</span>
                  <span>
                    {group.invoices.length} hóa đơn •{' '}
                    <span className="font-bold text-emerald-400">{group.total.toLocaleString('vi-VN')} VNĐ</span>
                    {group.company.taxCode && <> • MST {group.company.taxCode}</>}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-slate-400">Tên đơn vị</span>
                    <input
                      type="text"
                      value={group.company.name}
                      onChange={(event) => updateCompany(group.key, 'name', event.target.value)}
                      placeholder="CÔNG TY ..."
                      className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-slate-400">Địa chỉ</span>
                    <input
                      type="text"
                      value={group.company.address}
                      onChange={(event) => updateCompany(group.key, 'address', event.target.value)}
                      placeholder="Số nhà, đường, phường, tỉnh/thành phố"
                      className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-slate-400">Nội dung thanh toán</span>
                  <input
                    type="text"
                    value={contents[group.key] ?? describeFormContent(
                      group.invoices.map((invoice) => ({ date: invoice.date })),
                      formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
                    )}
                    onChange={(event) => setContents({ ...contents, [group.key]: event.target.value })}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-200 outline-none focus:border-amber-500/60"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Table */}
      {invoiceRows.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách hóa đơn đã bóc tách ({invoiceRows.length})
              <span className="ml-2 font-normal normal-case text-slate-500">
                đã xác nhận {validInvoices.length}/{invoiceRows.length}
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAllConfirmed(true)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Chọn tất cả
              </button>
              {cleanRowCount > 0 && cleanRowCount < invoiceRows.length && (
                <button
                  type="button"
                  onClick={confirmCleanRows}
                  title="Chỉ chọn các dòng đọc đủ trường và không có cảnh báo"
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Chọn {cleanRowCount} dòng không cần kiểm tra
                </button>
              )}
              <button
                type="button"
                onClick={() => setAllConfirmed(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={validInvoices.length === 0}
                title="Bảng kê chi tiết hóa đơn kèm theo giấy đề nghị"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                <Download size={13} />
                Xuất bảng kê chi tiết ({validInvoices.length})
              </button>
            </div>
          </div>
          <p className="px-6 pb-3 text-[11px] italic text-amber-400/90">
            * Chỉ các dòng đã được người dùng xác nhận mới được xuất. Hãy đối chiếu chứng từ gốc trước khi xác nhận.
          </p>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-20 text-center">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allConfirmed}
                        ref={(node) => {
                          // Trạng thái "một phần" chỉ đặt được bằng thuộc tính DOM.
                          if (node) node.indeterminate = !allConfirmed && validInvoices.length > 0;
                        }}
                        onChange={(event) => setAllConfirmed(event.target.checked)}
                        aria-label="Chọn tất cả hóa đơn"
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <span>Xác nhận</span>
                    </label>
                  </th>
                  <th className="py-3 px-4 w-28">Ngày tháng</th>
                  <th className="py-3 px-4">Nội dung chi tiết</th>
                  <th className="py-3 px-4 w-56">Nội dung trên ĐNTT</th>
                  <th className="py-3 px-4 w-48">Đơn vị thanh toán</th>
                  <th className="py-3 px-4 w-28 text-right">Trước thuế</th>
                  <th className="py-3 px-4 w-24 text-right">Tiền thuế</th>
                  <th className="py-3 px-4 w-32 text-right">Sau thuế</th>
                  <th className="py-3 px-4 w-32">Số hóa đơn</th>
                  <th className="py-3 px-4 w-24 text-center">Loại</th>
                  <th className="py-3 px-4 w-32 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {invoiceRows.map((inv, idx) => (
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
                      {inv.sellerTax && (
                        <div className="text-[10px] text-slate-500 mt-0.5">MST: {inv.sellerTax}</div>
                      )}
                      {inv.missingFields?.length > 0 && (
                        <div className="mt-1 text-[10px] text-amber-300">
                          Thiếu/cần kiểm tra: {inv.missingFields.join(', ')}
                        </div>
                      )}
                      {inv.warnings?.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[10px] text-rose-300">
                          {inv.warnings.map((warning) => (
                            <li key={warning}>⚠ {warning}</li>
                          ))}
                        </ul>
                      )}
                      {inv.textSample && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-[10px] font-semibold text-slate-500 hover:text-slate-300">
                            Xem text công cụ đọc được từ PDF
                          </summary>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/80 p-2 text-[10px] leading-relaxed text-slate-400">
                            {inv.textSample}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={inv.expenseNote ?? describeExpense(inv)}
                        onChange={(event) => setExpenseNote(inv.id, event.target.value)}
                        aria-label={`Nội dung trên đề nghị thanh toán của ${inv.rawFileName || inv.fileName}`}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-amber-500/60"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={companyKeyOf(inv)}
                        onChange={(event) => setInvoiceCompany(inv.id, event.target.value)}
                        aria-label={`Đơn vị thanh toán của ${inv.rawFileName || inv.fileName}`}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-amber-500/60"
                      >
                        {companyOptions.map((option) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                      {!inv.isConfirmed && (
                        <p className="mt-1 text-[10px] italic text-slate-500">Chưa xác nhận nên chưa vào giấy nào.</p>
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
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <div>{inv.invoiceNo}</div>
                      {inv.invoiceSymbol && (
                        <div className="text-[10px] text-slate-500" title={inv.invoiceFormName}>
                          {inv.invoiceSymbol}
                        </div>
                      )}
                    </td>
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

      {/* Tệp đọc được nhưng không phải bản thể hiện hóa đơn */}
      {otherDocuments.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tệp không phải hóa đơn ({otherDocuments.length})
          </h3>
          <p className="text-[11px] italic text-slate-500">
            Các tệp này thiếu cả số hóa đơn lẫn mã số thuế người bán — thường là lịch trình bay, thẻ lên tàu
            hoặc bản đính kèm của cùng một chuyến đi. Công cụ để riêng ra để bảng hóa đơn không bị lặp.
            Nếu đây thật sự là hóa đơn, hãy đưa vào bảng và nhập tay phần còn thiếu.
          </p>
          <ul className="space-y-2">
            {otherDocuments.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] text-slate-300">
                    {document.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {document.seller}
                    {document.date && document.date !== '-' ? ` • ${document.date}` : ''}
                    {document.totalAmount ? ` • ${document.totalAmount.toLocaleString('vi-VN')} VNĐ` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => forceAsInvoice(document.id)}
                  className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
                >
                  Đưa vào bảng hóa đơn
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
