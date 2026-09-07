/* eslint-disable no-useless-escape */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download,
  Trash2, ShieldCheck, RefreshCw,
  Building2, CalendarDays, DollarSign, FileCheck,
  Receipt, CheckCircle2, AlertCircle, Sparkles,
  Plus, Eye, EyeOff, Printer, Check, X,
  FileText, Code
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
import { buildPerDiemRow, parseIsoDate, perDiemDays } from '@ai-tools/core/utils/invoice/perDiem.js';
import {
  AMOUNT_BALANCE_WARNING_PREFIX,
  amountBalanceWarning,
  extractInvoiceFields,
  foldText,
  missingInvoiceFields,
  parseInvoiceSymbol,
  validateInvoiceFields,
} from '@ai-tools/core/utils/invoice/vietnamInvoice.js';
import { numberToWordsVN } from '@ai-tools/core/utils/invoice/numberToWords.js';

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

// Dữ liệu mẫu thực tế để kiểm thử nhanh quy trình lập đề nghị thanh toán
const SAMPLE_DEMO_INVOICES = [
  {
    id: 'demo-inv-1',
    fileName: 'HoaDon_PhanMem_AITools.xml',
    rawFileName: 'HoaDon_PhanMem_AITools.xml',
    invoiceNo: '0001234',
    invoiceSymbol: 'C26TAA',
    invoiceFormName: 'Hóa đơn giá trị gia tăng',
    date: '05/09/2026',
    seller: 'CÔNG TY TNHH CÔNG NGHỆ VÀ TIỆN ÍCH AI-TOOLS VIỆT NAM',
    sellerTax: '0109876543',
    sellerAddress: 'Tòa nhà Công Nghệ, Quận Cầu Giấy, Hà Nội',
    buyer: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ GLOBAL',
    buyerTax: '0312345678',
    buyerAddress: 'Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    amountBeforeTax: 15000000,
    vatAmount: 1500000,
    authorityCollection: 0,
    totalAmount: 16500000,
    expenseNote: 'Phí dịch vụ phần mềm AI-Tools Studio',
    status: 'Đã trích xuất',
    rawType: 'XML',
    isConfirmed: true,
    needsReview: false,
    warnings: [],
    missingFields: [],
  },
  {
    id: 'demo-inv-2',
    fileName: 'VeMayBay_VietnamAirlines.pdf',
    rawFileName: 'VeMayBay_VietnamAirlines.pdf',
    invoiceNo: '0058291',
    invoiceSymbol: '1C26TAV',
    invoiceFormName: 'Hóa đơn GTGT vé máy bay',
    date: '02/09/2026',
    seller: 'Vietnam Airlines [PNR: HAN-SGN]',
    sellerTax: '0100107518',
    sellerAddress: 'Số 200 Nguyễn Sơn, Long Biên, Hà Nội',
    buyer: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ GLOBAL',
    buyerTax: '0312345678',
    buyerAddress: 'Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    amountBeforeTax: 2363636,
    vatAmount: 236364,
    authorityCollection: 250000,
    totalAmount: 2850000,
    expenseNote: 'Vé máy bay công tác Hà Nội - Sài Gòn',
    status: 'Đã trích xuất',
    rawType: 'PDF',
    isConfirmed: true,
    needsReview: false,
    warnings: [],
    missingFields: [],
  },
  {
    id: 'demo-inv-3',
    fileName: 'BienNhan_Taxi_XanhSM.pdf',
    rawFileName: 'BienNhan_Taxi_XanhSM.pdf',
    invoiceNo: '0091240',
    invoiceSymbol: '2C26TXS',
    invoiceFormName: 'Hóa đơn điện tử cước taxi',
    date: '03/09/2026',
    seller: 'Xanh SM (Sân bay TSN -> Khách sạn Quận 1)',
    sellerTax: '0110034567',
    sellerAddress: 'Khu đô thị Vinhomes Riverside, Long Biên, Hà Nội',
    buyer: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ GLOBAL',
    buyerTax: '0312345678',
    buyerAddress: 'Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    amountBeforeTax: 409091,
    vatAmount: 40909,
    authorityCollection: 0,
    totalAmount: 450000,
    expenseNote: 'Cước di chuyển taxi gặp khách hàng',
    status: 'Đã trích xuất',
    rawType: 'PDF',
    isConfirmed: true,
    needsReview: false,
    warnings: [],
    missingFields: [],
  },
];

// Hàm trích xuất text từ buffer PDF
async function extractTextFromPDFBuffer(arrayBuffer) {
  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (pdf.numPages > INVOICE_LIMITS.maxPdfPages) {
      await loadingTask.destroy();
      throw new Error(`PDF vượt ${INVOICE_LIMITS.maxPdfPages} trang`);
    }
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = null;
      
      const items = textContent.items.map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        height: item.transform[3],
      }));

      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) {
          return b.y - a.y;
        }
        return a.x - b.x;
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
 * định, thay vì dò theo vị trí.
 */
function parsePDFInvoiceText(text, fileName, zipName = null) {
  try {
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
      authorityCollection: fields.authorityCollection,
    });
    const resolved = { ...fields, ...amounts };

    const warnings = validateInvoiceFields(resolved);
    const missingFields = missingInvoiceFields(resolved);

    const travelName = describeTravelDocument(text, fileName);
    const lineItem = findFirstLineItem(text);
    let seller = fields.seller || travelName || 'Hóa đơn/Biên lai (PDF)';
    if (fields.seller && lineItem) seller = `${seller} (${lineItem})`;
    else if (!fields.seller && travelName && lineItem) seller = `${travelName} (${lineItem})`;

    const invoiceNo = fields.invoiceNo || 'Chưa rõ số';

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
      sellerName: fields.seller || travelName || '',
      itemName: lineItem || '',
      route: findFlightRoutes(text, fileName)[0] || '',
      sellerTax: fields.sellerTax || '',
      buyer: fields.buyer || '',
      buyerTax: fields.buyerTax || '',
      buyerAddress: fields.buyerAddress || '',
      amountBeforeTax: resolved.amountBeforeTax,
      vatAmount: resolved.vatAmount,
      authorityCollection: resolved.authorityCollection,
      authorityCollectionDerived: resolved.authorityCollectionDerived,
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

    const buyer = getText([
      'NMua Ten', 'Buyer Ten', 'NMua > Ten', 'TenNguoiMua', 'TenDonViMua', 'BuyerName'
    ]) || '';
    const buyerTax = getText([
      'NMua MST', 'Buyer MST', 'NMua > MST', 'MaSoThueNguoiMua', 'BuyerTaxCode'
    ]) || '';
    const buyerAddress = getText([
      'NMua DChi', 'Buyer DChi', 'NMua > DChi', 'DiaChiNguoiMua', 'BuyerAddress'
    ]) || '';

    // 4. Trích xuất nâng cao: Taxi, Vé máy bay
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
      const itemName = thhdvuTexts.length > 0 ? thhdvuTexts[0] : '';
      if (itemName && itemName.length > 2 && !seller.toLowerCase().includes(itemName.toLowerCase())) {
        let shortItem = itemName.length > 55 ? `${itemName.slice(0, 55)}...` : itemName;
        shortItem = shortItem.replace(/^\d+[\.\s]+/, '').trim();
        seller = `${seller} (${shortItem})`;
      }
    }

    // 5. Các loại tiền
    const parseXmlAmount = (valStr) => {
      if (/^-?\d+(\.\d+)?$/.test(valStr)) return Number(valStr);
      return parseLocalizedNumber(valStr);
    };

    const parseAmount = (selectors) => {
      const valStr = getText(selectors);
      if (valStr) {
        const num = parseXmlAmount(valStr);
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

    const isAuthorityField = (name) => /thuho|authorizedcollection/.test(
      foldText(name).replace(/[^a-z0-9]/g, ''),
    );

    let authorityCollection = 0;
    for (const [field, value] of Object.entries(ttinData)) {
      if (!isAuthorityField(field)) continue;
      const parsed = parseXmlAmount(value);
      if (parsed !== null && parsed > 0) {
        authorityCollection = parsed;
        break;
      }
    }
    if (!authorityCollection) {
      for (const node of xmlDoc.querySelectorAll('*')) {
        if (node.children.length > 0 || !isAuthorityField(node.tagName)) continue;
        const parsed = parseXmlAmount(node.textContent.trim());
        if (parsed !== null && parsed > 0) {
          authorityCollection = parsed;
          break;
        }
      }
    }

    let authorityCollectionDerived = false;
    ({
      totalAmount,
      amountBeforeTax,
      vatAmount,
      authorityCollection,
      authorityCollectionDerived,
    } = deriveInvoiceAmounts({
      totalAmount,
      amountBeforeTax,
      vatAmount,
      authorityCollection,
    }));

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
      authorityCollection,
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
      authorityCollection,
      authorityCollectionDerived,
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
  perDiemAmount: '',
  perDiemFrom: '',
  perDiemTo: '',
};

function AmountInput({ value, onCommit, label, emphasis = false }) {
  const [draft, setDraft] = useState(null);

  const commit = () => {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft ?? (Number(value) || 0).toLocaleString('vi-VN')}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') setDraft(null);
      }}
      aria-label={label}
      className={`w-full rounded-lg border border-border-subtle bg-surface-container-low px-2 py-1.5 text-right text-[11px] font-mono outline-none focus:border-primary ${
        emphasis ? 'font-bold text-secondary' : 'text-on-surface'
      }`}
    />
  );
}

function DateField({ value, onChange, label, id }) {
  const pickerRef = useRef(null);
  const [draft, setDraft] = useState(null);

  const toDisplay = (isoValue) => {
    const date = parseIsoDate(isoValue);
    if (!date) return '';
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear(),
    ].join('/');
  };

  const formatTyping = (text) => {
    const digits = String(text).replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    return parts.join('/');
  };

  const toIso = (text) => {
    const digits = String(text).replace(/\D/g, '');
    if (digits.length !== 8) return '';
    const iso = [digits.slice(4, 8), digits.slice(2, 4), digits.slice(0, 2)].join('-');
    return parseIsoDate(iso) ? iso : '';
  };

  const handleTyping = (text) => {
    const formatted = formatTyping(text);
    setDraft(formatted);
    const iso = toIso(formatted);
    if (iso) onChange(iso);
    else if (formatted === '') onChange('');
  };

  const commit = () => setDraft(null);

  const openCalendar = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    try {
      picker.showPicker();
    } catch {
      picker.focus();
      picker.click();
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={draft ?? toDisplay(value)}
        onChange={(event) => handleTyping(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') setDraft(null);
        }}
        placeholder="dd/mm/yyyy"
        aria-label={label}
        className="w-full rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 pr-9 text-on-surface outline-none focus:border-primary text-xs"
      />
      <button
        type="button"
        onClick={openCalendar}
        aria-label={`Chọn ${label} trên lịch`}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-outline transition hover:bg-surface-container-high hover:text-brand-cyan-bright cursor-pointer"
      >
        <CalendarDays size={15} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute right-2 bottom-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}

export default function InvoiceTool({ displayLang = 'vi' } = {}) {
  const [invoices, setInvoices] = useState([]);
  const invoicesRef = useRef(invoices);
  useEffect(() => { invoicesRef.current = invoices; }, [invoices]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState('');

  // Thông tin cố định của người lập chứng từ: lưu trữ với namespace ai_tools_invoice-studio_*
  const [storedSettings, setFormSettings] = useLocalStorage(
    'payment-request-form',
    DEFAULT_FORM_SETTINGS,
    'invoice-studio',
  );
  const formSettings = useMemo(
    () => ({ ...DEFAULT_FORM_SETTINGS, ...storedSettings }),
    [storedSettings],
  );
  const [companyOverrides, setCompanyOverrides] = useLocalStorage(
    'payment-request-companies',
    {},
    'invoice-studio',
  );
  const [issuedAtInput, setIssuedAtInput] = useState(todayInputValue);
  const [contents, setContents] = useState({});
  const [perDiemCompanyKey, setPerDiemCompanyKey] = useState('');

  // Modal / Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Thêm khoản chi thủ công
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: todayInputValue(),
    seller: '',
    sellerTax: '',
    expenseNote: '',
    amountBeforeTax: '',
    vatAmount: '',
    totalAmount: '',
    invoiceNo: '',
  });

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
    const skipped = [];

    const readXmlEntry = async (text, displayName, zipName) => {
      parsedList.push(parseXMLInvoice(text, displayName, zipName));
    };

    const readPdfEntry = async (buffer, displayName, zipName) => {
      const pdfText = await extractTextFromPDFBuffer(buffer);
      const parsed = parsePDFInvoiceText(pdfText, displayName, zipName);
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
        return !entryName.includes('__MACOSX') && !entryName.split('/').pop().startsWith('._');
      });

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
    e.target.value = '';
  };

  // Nạp dữ liệu mẫu thử nghiệm 1-click
  const handleLoadDemo = () => {
    setInvoices(SAMPLE_DEMO_INVOICES);
    setFormSettings({
      ...DEFAULT_FORM_SETTINGS,
      requester: 'Nguyễn Văn A',
      department: 'Ban Giám Đốc',
      accountant: 'Trần Thị B',
      contentPrefix: 'Chi phí đi lại công tác',
      perDiemAmount: '200.000',
      perDiemFrom: '2026-09-02',
      perDiemTo: '2026-09-05',
    });
    setNotice('✨ Đã nạp 3 chứng từ mẫu thử nghiệm. Bạn có thể kiểm tra số liệu và xuất ngay Giấy đề nghị thanh toán.');
  };

  // Thêm khoản chi phí thủ công (không có file XML)
  const handleSaveManualExpense = (e) => {
    e.preventDefault();
    const beforeTax = parseLocalizedNumber(manualForm.amountBeforeTax) || 0;
    const vat = parseLocalizedNumber(manualForm.vatAmount) || 0;
    const total = parseLocalizedNumber(manualForm.totalAmount) || (beforeTax + vat);

    if (!total || total <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ.');
      return;
    }

    const isoDate = manualForm.date;
    const dateFormatted = isoDate ? `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}` : 'Chưa rõ ngày';

    const newExpense = {
      id: makeId(),
      fileName: `ChiPhi_${dateFormatted.replace(/\//g, '')}.manual`,
      rawFileName: `Chi phí thủ công (${dateFormatted})`,
      invoiceNo: manualForm.invoiceNo || 'CT-TAY',
      invoiceSymbol: 'TAY',
      invoiceFormName: 'Chứng từ chi nội bộ',
      date: dateFormatted,
      seller: manualForm.seller || 'Khoản chi nội bộ',
      sellerName: manualForm.seller || 'Khoản chi nội bộ',
      itemName: manualForm.expenseNote || 'Chi phí công tác',
      sellerTax: manualForm.sellerTax || '',
      buyer: formSettings.requester || '',
      amountBeforeTax: beforeTax || total,
      vatAmount: vat,
      authorityCollection: 0,
      totalAmount: total,
      expenseNote: manualForm.expenseNote || 'Chi phí thanh toán',
      status: 'Đã trích xuất',
      rawType: 'TAY',
      missingFields: [],
      warnings: [],
      needsReview: false,
      isConfirmed: true,
    };

    setInvoices((prev) => [newExpense, ...prev]);
    setShowManualModal(false);
    setManualForm({
      date: todayInputValue(),
      seller: '',
      sellerTax: '',
      expenseNote: '',
      amountBeforeTax: '',
      vatAmount: '',
      totalAmount: '',
      invoiceNo: '',
    });
  };

  const setAllConfirmed = (isConfirmed) => {
    setInvoices((current) => current.map((invoice) => (
      isInvoiceDocument(invoice) ? { ...invoice, isConfirmed } : invoice
    )));
  };

  const confirmCleanRows = () => {
    setInvoices((current) => current.map((invoice) => (
      invoice.needsReview || !isInvoiceDocument(invoice) ? invoice : { ...invoice, isConfirmed: true }
    )));
  };

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

  const setExpenseNote = (id, expenseNote) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, expenseNote } : invoice
    )));
  };

  const setInvoiceAmount = (id, field, rawValue) => {
    const parsed = parseLocalizedNumber(rawValue);
    const amount = parsed === null ? 0 : Math.max(0, parsed);

    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== id) return invoice;

      const edited = { ...invoice, [field]: amount, amountsEdited: true };
      if (field === 'authorityCollection') edited.authorityCollectionDerived = false;
      const kept = (invoice.warnings ?? [])
        .filter((warning) => !warning.startsWith(AMOUNT_BALANCE_WARNING_PREFIX));
      const balance = amountBalanceWarning(edited);
      const warnings = balance ? [...kept, balance] : kept;

      const needsReview = warnings.length > 0 || (edited.missingFields?.length ?? 0) > 0;
      return {
        ...edited,
        warnings,
        needsReview,
        status: needsReview ? 'Cần kiểm tra' : 'Đã trích xuất',
      };
    }));
  };

  const setInvoiceCompany = (id, key) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === id ? { ...invoice, companyKey: key || undefined } : invoice
    )));
  };

  const invoiceRows = useMemo(() => invoices.filter(isInvoiceDocument), [invoices]);
  const otherDocuments = useMemo(
    () => invoices.filter((document) => !isInvoiceDocument(document)),
    [invoices],
  );

  const validInvoices = useMemo(
    () => invoiceRows.filter((invoice) => invoice.isConfirmed),
    [invoiceRows],
  );

  const companyGroups = useMemo(
    () => groupInvoicesByCompany(validInvoices, companyOverrides),
    [validInvoices, companyOverrides],
  );

  const companyOptions = useMemo(
    () => groupInvoicesByCompany(invoices, companyOverrides).map((group) => ({
      key: group.key,
      label: group.company.name || 'Chưa xác định đơn vị',
    })),
    [invoices, companyOverrides],
  );

  const perDiemRow = useMemo(
    () => buildPerDiemRow({
      amountPerDay: parseLocalizedNumber(formSettings.perDiemAmount) ?? 0,
      from: formSettings.perDiemFrom,
      to: formSettings.perDiemTo,
      issuedAt: parseInputDate(issuedAtInput),
    }),
    [formSettings.perDiemAmount, formSettings.perDiemFrom, formSettings.perDiemTo, issuedAtInput],
  );

  const perDiemTarget = companyGroups.some((group) => group.key === perDiemCompanyKey)
    ? perDiemCompanyKey
    : companyGroups[0]?.key ?? '';

  const forms = useMemo(
    () => buildFormsFromGroups(companyGroups, {
      contents,
      contentPrefix: formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
      extraRows: perDiemRow && perDiemTarget ? { [perDiemTarget]: [perDiemRow] } : {},
    }),
    [companyGroups, contents, formSettings.contentPrefix, perDiemRow, perDiemTarget],
  );

  const updateCompany = (key, field, value) => {
    const current = companyOverrides[key] ?? {};
    setCompanyOverrides({ ...companyOverrides, [key]: { ...current, [field]: value } });
  };

  // Xuất Giấy đề nghị thanh toán: đúng 100% logic commit dcad2e9
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

  // Bảng kê chi tiết hóa đơn
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

  const activeForm = forms[activePreviewIndex] || forms[0] || null;

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-on-surface">
      {/* HEADER & BADGES SECTION (Chuẩn Design System ai-tools) */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center gap-2 text-xs text-outline font-medium">
          <a className="hover:text-primary transition-colors" href="#">Trang chủ</a>
          <span>/</span>
          <a className="hover:text-primary transition-colors" href="#excel-hoa-don">Excel & Hóa đơn</a>
          <span>/</span>
          <span className="text-brand-cyan-bright font-semibold">
            {displayLang === 'en' ? 'Payment Request Maker' : displayLang === 'ja' ? '支払依頼書作成' : 'Tạo Đề Nghị Thanh Toán'}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container p-6 rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center shrink-0 shadow-inner text-brand-cyan-bright">
              <Receipt size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
                {displayLang === 'en' ? 'Payment Request Maker' : displayLang === 'ja' ? '支払依頼書作成' : 'Tạo Đề Nghị Thanh Toán'}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                Trích xuất XML/PDF theo tiêu thức hóa đơn tại TT 91/2026/TT-BTC, tự động gom nhóm theo công ty và xuất Giấy đề nghị thanh toán chuẩn mẫu in A4 kế toán.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold">
              <ShieldCheck size={14} />
              Bảo mật 100% trên trình duyệt
            </div>
            {invoices.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error/20 border border-error/20 text-error text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 size={14} />
                Xóa tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-xs leading-relaxed text-on-surface">
        Công cụ không tự giả định thuế suất, ngày hoặc số tiền. Hãy kiểm tra chứng từ gốc và chỉ đánh dấu xác nhận khi dữ liệu đã đúng; file xuất ra chưa phải phê duyệt thanh toán.
      </div>

      {notice && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error flex items-center justify-between">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="p-1 hover:bg-error/20 rounded cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* KHỐI 1: UPLOAD ZONE VÀ NẠP DỮ LIỆU */}
      <div className="relative border-2 border-dashed border-border-subtle hover:border-primary bg-surface-container/60 hover:bg-surface-container transition rounded-2xl p-8 text-center cursor-pointer group">
        <input
          type="file"
          multiple
          accept=".xml,.pdf,.zip"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Kéo thả file hoặc click để chọn tệp"
        />
        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-brand-cyan-bright group-hover:scale-110 transition duration-300 shadow-inner">
            {isProcessing ? (
              <RefreshCw className="animate-spin text-primary" size={28} />
            ) : (
              <UploadCloud size={28} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              Kéo thả nhiều thư mục nén <span className="text-brand-cyan-bright font-bold">.ZIP</span> hoặc các tệp <span className="text-brand-cyan-bright font-bold">.XML, .PDF</span> vào đây
            </p>
            <p className="text-xs text-outline mt-1">
              Tối đa {INVOICE_LIMITS.maxFiles} file mỗi lần • ZIP tối đa {Math.round(INVOICE_LIMITS.maxZipBytes / 1024 / 1024)} MiB, đọc được cả ZIP lồng ZIP • XML/PDF tối đa {Math.round(INVOICE_LIMITS.maxFileBytes / 1024 / 1024)} MiB
            </p>
            {progress && (
              <p className="mt-2 text-xs font-semibold text-brand-cyan-bright">
                Đang đọc {progress.done}/{progress.total}
                {progress.label ? ` — ${progress.label}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action quick links inside drop zone */}
        <div className="mt-4 pt-3 border-t border-border-subtle/40 flex flex-wrap items-center justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleLoadDemo(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-subtle border border-border-subtle text-brand-cyan-bright text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            Thử nghiệm với dữ liệu mẫu (Sample Demo)
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowManualModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-subtle border border-border-subtle text-on-surface text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            + Thêm khoản chi thủ công
          </button>
        </div>
      </div>

      {/* KHỐI 2: THỐNG KÊ KHI ĐÃ CÓ DỮ LIỆU */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container border border-border-subtle rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-brand-cyan-bright">
              <FileCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-outline font-medium">Đã kiểm tra và xác nhận</p>
              <p className="text-lg font-bold text-on-surface">
                {validInvoices.length} <span className="text-xs text-outline font-normal">/ {invoiceRows.length} hóa đơn</span>
              </p>
            </div>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-outline font-medium">Tổng tiền thanh toán</p>
              <p className="text-lg font-bold text-secondary font-mono">
                {totalAmount.toLocaleString('vi-VN')} <span className="text-xs text-outline font-normal">VNĐ</span>
              </p>
            </div>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-brand-cyan-bright">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs text-outline font-medium">Đơn vị thanh toán</p>
              <p className="text-lg font-bold text-on-surface">
                {companyGroups.length} <span className="text-xs text-outline font-normal">giấy đề nghị</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KHỐI 3: THÔNG TIN IN TRÊN GIẤY ĐỀ NGHỊ THANH TOÁN (Commit dcad2e9) */}
      {invoices.length > 0 && (
        <div className="bg-surface-container border border-border-subtle rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
            Thông tin in trên Giấy đề nghị thanh toán
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Người đề nghị thanh toán</span>
              <input
                type="text"
                value={formSettings.requester}
                onChange={(event) => updateSetting('requester', event.target.value)}
                placeholder="Nguyễn Văn A"
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Bộ phận (hoặc địa chỉ)</span>
              <input
                type="text"
                value={formSettings.department}
                onChange={(event) => updateSetting('department', event.target.value)}
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Kế toán ký duyệt</span>
              <input
                type="text"
                value={formSettings.accountant}
                onChange={(event) => updateSetting('accountant', event.target.value)}
                placeholder="Trần Thị B"
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Ngày lập giấy đề nghị</span>
              <DateField
                value={issuedAtInput}
                onChange={setIssuedAtInput}
                label="Ngày lập giấy đề nghị"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Tên sheet (kỳ lập)</span>
              <input
                type="text"
                value={formSettings.sheetName}
                onChange={(event) => updateSetting('sheetName', event.target.value)}
                placeholder={monthSheetName(parseInputDate(issuedAtInput))}
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Mở đầu nội dung thanh toán</span>
              <input
                type="text"
                value={formSettings.contentPrefix}
                onChange={(event) => updateSetting('contentPrefix', event.target.value)}
                placeholder={DEFAULT_FORM_SETTINGS.contentPrefix}
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Mức công tác phí mỗi ngày (đồng)</span>
              <input
                type="text"
                inputMode="numeric"
                value={formSettings.perDiemAmount}
                onChange={(event) => updateSetting('perDiemAmount', event.target.value)}
                placeholder="200.000"
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs font-mono"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Từ ngày</span>
              <DateField
                value={formSettings.perDiemFrom}
                onChange={(next) => updateSetting('perDiemFrom', next)}
                label="Ngày bắt đầu công tác"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Đến ngày</span>
              <DateField
                value={formSettings.perDiemTo}
                onChange={(next) => updateSetting('perDiemTo', next)}
                label="Ngày kết thúc công tác"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-outline">Tính vào giấy của đơn vị</span>
              <select
                value={perDiemTarget}
                onChange={(event) => setPerDiemCompanyKey(event.target.value)}
                disabled={companyGroups.length === 0}
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs disabled:text-outline"
              >
                {companyGroups.length === 0 && <option value="">Chưa có đơn vị nào</option>}
                {companyGroups.map((group) => (
                  <option key={group.key} value={group.key}>{group.company.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs lg:col-span-2">
              <span className="font-semibold text-outline">Link thư mục hóa đơn gốc</span>
              <input
                type="text"
                value={formSettings.invoiceLink}
                onChange={(event) => updateSetting('invoiceLink', event.target.value)}
                placeholder="https://drive.google.com/..."
                className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
              />
            </label>
          </div>

          {perDiemRow ? (
            <p className="text-[11px] text-secondary">
              {perDiemDays(formSettings.perDiemFrom, formSettings.perDiemTo)} ngày ×{' '}
              {(parseLocalizedNumber(formSettings.perDiemAmount) ?? 0).toLocaleString('vi-VN')} ={' '}
              <span className="font-bold">{perDiemRow.amount.toLocaleString('vi-VN')} VNĐ</span>
              {' '}— thêm một dòng &quot;{perDiemRow.description}&quot; sau dòng hóa đơn cuối cùng.
            </p>
          ) : (
            <p className="text-[11px] italic text-outline">
              Số ngày tính trọn ngày, kể cả ngày đi và ngày về. Bỏ trống thì giấy đề nghị không có dòng công tác phí.
            </p>
          )}
        </div>
      )}

      {/* KHỐI 4: CÁC ĐƠN VỊ THANH TOÁN ĐÃ TÁCH THEO HÓA ĐƠN & NÚT XUẤT ĐNTT (Commit dcad2e9) */}
      {companyGroups.length > 0 && (
        <div className="bg-surface-container border border-border-subtle rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
                Đơn vị thanh toán ({companyGroups.length}) — cùng một sheet, mỗi đơn vị một giấy
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Xuất file Excel (.xlsx) gồm các trang in chuẩn A4, đầy đủ tiêu đề, bảng kê, công thức SUM và khối ký.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-container-high hover:bg-surface-subtle text-on-surface text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Eye size={15} className="text-brand-cyan-bright" />
                Xem trước bản in A4
              </button>
              <button
                type="button"
                onClick={handleExportForms}
                disabled={forms.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold shadow-lg hover:shadow-primary/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Download size={16} />
                Xuất Giấy đề nghị thanh toán ({companyGroups.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {companyGroups.map((group, index) => (
              <div key={group.key} className="rounded-xl border border-border-subtle bg-surface-container-low p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-outline">
                  <span className="font-bold text-on-surface">Giấy {index + 1}: {forms[index]?.label || group.company.name}</span>
                  <span>
                    {group.invoices.length} hóa đơn •{' '}
                    <span className="font-bold text-secondary font-mono">{group.total.toLocaleString('vi-VN')} VNĐ</span>
                    {group.company.taxCode && <> • MST {group.company.taxCode}</>}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-outline">Tên đơn vị</span>
                    <input
                      type="text"
                      value={group.company.name}
                      onChange={(event) => updateCompany(group.key, 'name', event.target.value)}
                      placeholder="CÔNG TY ..."
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-outline">Địa chỉ</span>
                    <input
                      type="text"
                      value={group.company.address}
                      onChange={(event) => updateCompany(group.key, 'address', event.target.value)}
                      placeholder="Số nhà, đường, phường, tỉnh/thành phố"
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-outline">Nội dung thanh toán</span>
                  <input
                    type="text"
                    value={contents[group.key] ?? describeFormContent(
                      group.invoices.map((invoice) => ({ date: invoice.date })),
                      formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
                    )}
                    onChange={(event) => setContents({ ...contents, [group.key]: event.target.value })}
                    className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-on-surface outline-none focus:border-primary text-xs"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KHỐI 5: DANH SÁCH HÓA ĐƠN ĐÃ BÓC TÁCH & BẢNG KÊ CHI TIẾT (Commit dcad2e9) */}
      {invoiceRows.length > 0 && (
        <div className="bg-surface-container border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border-subtle flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
                Danh sách hóa đơn đã bóc tách ({invoiceRows.length})
                <span className="ml-2 font-normal normal-case text-on-surface-variant">
                  • đã xác nhận {validInvoices.length}/{invoiceRows.length}
                </span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAllConfirmed(true)}
                className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-[11px] font-bold text-secondary transition hover:bg-secondary/20 cursor-pointer"
              >
                Chọn tất cả
              </button>
              {cleanRowCount > 0 && cleanRowCount < invoiceRows.length && (
                <button
                  type="button"
                  onClick={confirmCleanRows}
                  title="Chỉ chọn các dòng đọc đủ trường và không có cảnh báo"
                  className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-on-primary cursor-pointer"
                >
                  Chọn {cleanRowCount} dòng không cần kiểm tra
                </button>
              )}
              <button
                type="button"
                onClick={() => setAllConfirmed(false)}
                className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-[11px] font-bold text-outline transition hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-[11px] font-bold text-on-surface transition hover:bg-surface-container-high cursor-pointer"
              >
                <Plus size={13} />
                Thêm chi phí
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={validInvoices.length === 0}
                title="Bảng kê chi tiết hóa đơn kèm theo giấy đề nghị"
                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-[11px] font-bold text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:text-outline cursor-pointer"
              >
                <Download size={13} />
                Xuất bảng kê chi tiết ({validInvoices.length})
              </button>
            </div>
          </div>
          <p className="px-6 py-2 text-[11px] italic text-brand-cyan-bright bg-surface-container-low border-b border-border-subtle/50">
            * Chỉ các dòng đã được người dùng xác nhận mới được đưa vào Giấy đề nghị thanh toán và Bảng kê chi tiết.
          </p>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-outline font-semibold border-b border-border-subtle sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3 w-16 text-center">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allConfirmed}
                        ref={(node) => {
                          if (node) node.indeterminate = !allConfirmed && validInvoices.length > 0;
                        }}
                        onChange={(event) => setAllConfirmed(event.target.checked)}
                        aria-label="Chọn tất cả hóa đơn"
                        className="h-4 w-4 accent-secondary rounded cursor-pointer"
                      />
                      <span className="text-[10px]">Xác nhận</span>
                    </label>
                  </th>
                  <th className="py-3 px-3 w-24">Ngày</th>
                  <th className="py-3 px-3 min-w-[220px]">Nội dung chi tiết</th>
                  <th className="py-3 px-3 w-48">Nội dung trên ĐNTT</th>
                  <th className="py-3 px-3 w-44">Đơn vị thanh toán</th>
                  <th className="py-3 px-2 w-24 text-right">Trước thuế</th>
                  <th className="py-3 px-2 w-20 text-right">Tiền thuế</th>
                  <th
                    className="py-3 px-2 w-24 text-right"
                    title="Khoản hãng thu hộ nhà chức trách (phí sân bay, phí soi chiếu) — không chịu thuế GTGT nhưng vẫn nằm trong tổng thanh toán"
                  >
                    Thu hộ
                  </th>
                  <th className="py-3 px-2 w-28 text-right">Sau thuế</th>
                  <th className="py-3 px-3 w-28">Số HĐ</th>
                  <th className="py-3 px-2 w-16 text-center">Loại</th>
                  <th className="py-3 px-2 w-24 text-center">Trạng thái</th>
                  <th className="py-3 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-on-surface">
                {invoiceRows.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-surface-container-high/50 transition">
                    <td className="py-3 px-3 text-center font-medium text-outline font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={inv.isConfirmed}
                        onChange={() => toggleConfirmed(inv.id)}
                        aria-label={`Xác nhận dữ liệu ${inv.rawFileName || inv.fileName}`}
                        className="h-4 w-4 accent-secondary rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-on-surface whitespace-nowrap font-mono text-[11px]">{inv.date}</td>
                    <td className="py-3 px-3 font-medium">
                      <div className="text-on-surface leading-snug">{inv.seller}</div>
                      {inv.rawFileName && (
                        <div className="text-[10px] text-outline font-mono mt-0.5">{inv.rawFileName}</div>
                      )}
                      {inv.sellerTax && (
                        <div className="text-[10px] text-outline mt-0.5">MST: {inv.sellerTax}</div>
                      )}
                      {inv.missingFields?.length > 0 && (
                        <div className="mt-1 text-[10px] text-tertiary">
                          Thiếu/cần kiểm tra: {inv.missingFields.join(', ')}
                        </div>
                      )}
                      {inv.warnings?.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[10px] text-error">
                          {inv.warnings.map((warning) => (
                            <li key={warning}>⚠ {warning}</li>
                          ))}
                        </ul>
                      )}
                      {inv.textSample && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-[10px] font-semibold text-outline hover:text-on-surface">
                            Xem text công cụ đọc được từ PDF
                          </summary>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-container-low p-2 text-[10px] leading-relaxed text-on-surface-variant font-mono">
                            {inv.textSample}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={inv.expenseNote ?? describeExpense(inv)}
                        onChange={(event) => setExpenseNote(inv.id, event.target.value)}
                        aria-label={`Nội dung trên đề nghị thanh toán của ${inv.rawFileName || inv.fileName}`}
                        className="w-full rounded-lg border border-border-subtle bg-surface-container-low px-2 py-1.5 text-[11px] text-on-surface outline-none focus:border-primary"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={companyKeyOf(inv)}
                        onChange={(event) => setInvoiceCompany(inv.id, event.target.value)}
                        aria-label={`Đơn vị thanh toán của ${inv.rawFileName || inv.fileName}`}
                        className="w-full rounded-lg border border-border-subtle bg-surface-container-low px-2 py-1.5 text-[11px] text-on-surface outline-none focus:border-primary"
                      >
                        {companyOptions.map((option) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                      {!inv.isConfirmed && (
                        <p className="mt-1 text-[10px] italic text-outline">Chưa xác nhận nên chưa vào giấy nào.</p>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <AmountInput
                        value={inv.amountBeforeTax}
                        onCommit={(next) => setInvoiceAmount(inv.id, 'amountBeforeTax', next)}
                        label={`Tiền trước thuế của ${inv.rawFileName || inv.fileName}`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <AmountInput
                        value={inv.vatAmount}
                        onCommit={(next) => setInvoiceAmount(inv.id, 'vatAmount', next)}
                        label={`Tiền thuế GTGT của ${inv.rawFileName || inv.fileName}`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <AmountInput
                        value={inv.authorityCollection || 0}
                        onCommit={(next) => setInvoiceAmount(inv.id, 'authorityCollection', next)}
                        label={`Khoản thu hộ nhà chức trách của ${inv.rawFileName || inv.fileName}`}
                      />
                      {inv.authorityCollection > 0 && inv.authorityCollectionDerived && (
                        <p
                          className="mt-1 text-right text-[10px] italic text-outline"
                          title="Hóa đơn không ghi riêng khoản này; số hiện ra là phần chênh giữa tổng thanh toán và chưa thuế + tiền thuế."
                        >
                          suy ra
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <AmountInput
                        value={inv.totalAmount}
                        onCommit={(next) => setInvoiceAmount(inv.id, 'totalAmount', next)}
                        label={`Tổng thanh toán của ${inv.rawFileName || inv.fileName}`}
                        emphasis
                      />
                      {inv.amountsEdited && (
                        <p className="mt-1 text-right text-[10px] italic text-primary">đã sửa tay</p>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-outline">
                      <div className="text-on-surface font-semibold">{inv.invoiceNo}</div>
                      {inv.invoiceSymbol && (
                        <div className="text-[10px] text-outline" title={inv.invoiceFormName}>
                          {inv.invoiceSymbol}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        inv.rawType === 'XML'
                          ? 'bg-primary text-on-primary'
                          : inv.rawType === 'TAY'
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-subtle text-on-surface-variant border border-border-subtle'
                      }`}>
                        {inv.rawType}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        inv.needsReview
                          ? 'border border-tertiary/30 bg-tertiary/10 text-tertiary'
                          : 'border border-secondary/30 bg-secondary/10 text-secondary'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setInvoices((cur) => cur.filter((i) => i.id !== inv.id))}
                        className="p-1 text-outline hover:text-error transition cursor-pointer"
                        title="Xóa dòng này"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KHỐI 6: TỆP KHÔNG PHẢI HÓA ĐƠN (Commit dcad2e9) */}
      {otherDocuments.length > 0 && (
        <div className="bg-surface-container border border-border-subtle rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
            Tệp không phải hóa đơn ({otherDocuments.length})
          </h3>
          <p className="text-[11px] italic text-outline">
            Các tệp này thiếu cả số hóa đơn lẫn mã số thuế người bán — thường là lịch trình bay, thẻ lên tàu
            hoặc bản đính kèm của cùng một chuyến đi. Công cụ để riêng ra để bảng hóa đơn không bị lặp.
            Nếu đây thật sự là hóa đơn, hãy đưa vào bảng và nhập tay phần còn thiếu.
          </p>
          <ul className="space-y-2">
            {otherDocuments.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-container-low px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] text-on-surface">
                    {document.fileName}
                  </p>
                  <p className="text-[10px] text-outline">
                    {document.seller}
                    {document.date && document.date !== '-' ? ` • ${document.date}` : ''}
                    {document.totalAmount ? ` • ${document.totalAmount.toLocaleString('vi-VN')} VNĐ` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => forceAsInvoice(document.id)}
                  className="shrink-0 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-[11px] font-semibold text-on-surface transition hover:bg-surface-container-high cursor-pointer"
                >
                  Đưa vào bảng hóa đơn
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MODAL THÊM KHOẢN CHI THỦ CÔNG */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle/60 pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Plus size={18} className="text-brand-cyan-bright" />
                Thêm Khoản Chi Phí Thủ Công
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-outline">Ngày phát sinh</span>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-outline">Số HĐ / Mã biên lai</span>
                  <input
                    type="text"
                    placeholder="VD: HD-001 hoặc BL-092"
                    value={manualForm.invoiceNo}
                    onChange={(e) => setManualForm({ ...manualForm, invoiceNo: e.target.value })}
                    className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-outline">Đơn vị cung cấp / Bên bán</span>
                <input
                  type="text"
                  required
                  placeholder="VD: Khách sạn Mường Thanh hoặc Nhà xe Xanh SM"
                  value={manualForm.seller}
                  onChange={(e) => setManualForm({ ...manualForm, seller: e.target.value })}
                  className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-outline">Nội dung chi phí (in trên ĐNTT)</span>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiền phòng công tác Đà Nẵng hoặc Chi phí tiếp khách"
                  value={manualForm.expenseNote}
                  onChange={(e) => setManualForm({ ...manualForm, expenseNote: e.target.value })}
                  className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-outline">Tiền trước thuế</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={manualForm.amountBeforeTax}
                    onChange={(e) => setManualForm({ ...manualForm, amountBeforeTax: e.target.value })}
                    className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary font-mono"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-outline">Thuế GTGT</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={manualForm.vatAmount}
                    onChange={(e) => setManualForm({ ...manualForm, vatAmount: e.target.value })}
                    className="rounded-lg border border-border-subtle bg-surface-container-low px-3 py-2 text-on-surface text-xs outline-none focus:border-primary font-mono"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-secondary">Tổng thanh toán *</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="VD: 1.500.000"
                    value={manualForm.totalAmount}
                    onChange={(e) => setManualForm({ ...manualForm, totalAmount: e.target.value })}
                    className="rounded-lg border border-secondary/40 bg-surface-container-low px-3 py-2 text-secondary text-xs outline-none focus:border-secondary font-mono font-bold"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle/60">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-subtle text-outline hover:text-on-surface text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs cursor-pointer shadow-md"
                >
                  Lưu khoản chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC MẪU IN A4 CHUẨN KẾ TOÁN (SỔ ĐNTT) */}
      {showPreviewModal && activeForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col p-2 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full bg-surface-container border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
            {/* Modal Controls Header */}
            <div className="px-6 py-4 bg-surface-container-high border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <Eye size={18} className="text-brand-cyan-bright" />
                  Xem Trước Giấy Đề Nghị Thanh Toán (Mẫu In A4)
                </h3>
                {forms.length > 1 && (
                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle text-xs">
                    {forms.map((f, i) => (
                      <button
                        key={f.key || i}
                        type="button"
                        onClick={() => setActivePreviewIndex(i)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          activePreviewIndex === i
                            ? 'bg-primary text-on-primary'
                            : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        Giấy {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container-low border border-border-subtle text-on-surface text-xs font-semibold transition cursor-pointer"
                >
                  <Printer size={14} />
                  In / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportForms}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  Tải Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-outline hover:text-on-surface rounded-lg cursor-pointer"
                  aria-label="Đóng xem trước"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Paper Canvas: Standard Accounting Form 05-TT / Sổ ĐNTT */}
            <div className="p-4 sm:p-10 overflow-x-auto bg-surface-canvas flex justify-center">
              <div
                id="print-area"
                className="w-full max-w-[780px] p-8 sm:p-12 shadow-xl font-serif text-[13px] leading-relaxed border border-slate-200"
                style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* 1. Header Đơn vị */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="font-bold uppercase text-[12px]">{activeForm.company?.name || 'CÔNG TY ...'}</p>
                    <p className="text-[11px] max-w-sm text-slate-700">{activeForm.company?.address || 'Địa chỉ công ty'}</p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p className="font-bold">Mẫu số 05 - TT</p>
                    <p className="italic text-slate-600">(Ban hành theo TT 200/2014/TT-BTC)</p>
                  </div>
                </div>

                {/* 2. Tiêu đề Giấy */}
                <div className="text-center my-6">
                  <h2 className="text-xl font-bold uppercase tracking-wider">GIẤY ĐỀ NGHỊ THANH TOÁN</h2>
                  <p className="italic text-xs mt-1 text-slate-700">
                    Ngày {String(parseInputDate(issuedAtInput).getDate()).padStart(2, '0')} tháng {String(parseInputDate(issuedAtInput).getMonth() + 1).padStart(2, '0')} năm {parseInputDate(issuedAtInput).getFullYear()}
                  </p>
                </div>

                {/* 3. Người nhận & Thông tin đề nghị */}
                <div className="space-y-1.5 mb-6 text-[13px]">
                  <p className="italic font-semibold">Kính gửi: Ban Giám Đốc {activeForm.company?.name ? `— ${activeForm.company.name}` : ''}</p>
                  <p>
                    <strong>Người đề nghị thanh toán:</strong> {formSettings.requester || '................................................................'}
                  </p>
                  <p>
                    <strong>Bộ phận (hoặc địa chỉ):</strong> {formSettings.department || '................................................................'}
                  </p>
                  <p>
                    <strong>Nội dung thanh toán:</strong> {contents[activeForm.key] ?? describeFormContent(
                      (activeForm.rows || []).map((r) => ({ date: r.date })),
                      formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
                    )}
                  </p>
                </div>

                {/* 4. Bảng kê chi tiết 7 cột A..G theo sổ ĐNTT */}
                <table className="w-full border-collapse border border-black mb-4 text-[12px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-2 w-10">STT</th>
                      <th className="border border-black p-2 w-24">Ngày tháng</th>
                      <th className="border border-black p-2 text-left">Nội dung</th>
                      <th className="border border-black p-2 w-32 text-right">Số tiền (VNĐ)</th>
                      <th className="border border-black p-2 w-28 text-center">Hoá đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeForm.rows || []).map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="border border-black p-2 text-center">{rIdx + 1}</td>
                        <td className="border border-black p-2 text-center font-mono">{row.date || '-'}</td>
                        <td className="border border-black p-2">{row.description || '-'}</td>
                        <td className="border border-black p-2 text-right font-mono font-semibold">
                          {(Number(row.amount) || 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="border border-black p-2 text-center font-mono">{row.invoiceNo || '-'}</td>
                      </tr>
                    ))}
                    {/* Dòng tổng cộng */}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={3} className="border border-black p-2 text-center">Tổng cộng</td>
                      <td className="border border-black p-2 text-right font-mono">
                        {(activeForm.rows || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="border border-black p-2 text-center"></td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. Link hóa đơn & Số tiền bằng chữ */}
                <div className="space-y-1.5 mb-8 text-[12px]">
                  {formSettings.invoiceLink && (
                    <p className="text-slate-700">
                      <strong>Link hóa đơn điện tử:</strong>{' '}
                      <span className="text-blue-800 underline break-all">{formSettings.invoiceLink}</span>
                    </p>
                  )}
                  <p className="text-[13px]">
                    <strong>Số tiền viết bằng chữ:</strong>{' '}
                    <span className="italic font-medium">
                      {numberToWordsVN(
                        (activeForm.rows || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
                        { suffix: 'đồng chẵn./.' },
                      )}
                    </span>
                  </p>
                </div>

                {/* 6. Khối chữ ký chuẩn 3 bên theo sổ ĐNTT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 text-center text-[12px] pt-4">
                  <div className="space-y-1">
                    <p className="font-bold italic">Người đề nghị</p>
                    <p className="italic text-slate-600 text-[11px]">(Ký, họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold uppercase">{formSettings.requester || ''}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold italic">Kế toán</p>
                    <p className="italic text-slate-600 text-[11px]">(Ký, họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold uppercase">{formSettings.accountant || ''}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold italic">Giám đốc duyệt</p>
                    <p className="italic text-slate-600 text-[11px]">(Ký, họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold uppercase"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
