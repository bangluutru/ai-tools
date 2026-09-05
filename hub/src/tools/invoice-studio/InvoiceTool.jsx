/* eslint-disable no-useless-escape */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download,
  Trash2, ShieldCheck, RefreshCw,
  Building2, CalendarDays, DollarSign, FileCheck,
  Receipt, CheckCircle2, AlertCircle, Sparkles,
  ExternalLink, Copy, Check, FileText, X,
  FolderArchive, ChevronDown, ChevronUp, Code
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
      authorityCollection: fields.authorityCollection,
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

    // 5. Các loại tiền.
    //
    // Thẻ tiền trong XML hóa đơn điện tử là số thập phân theo XSD, dấu chấm
    // luôn là dấu thập phân: "3450000.000" là ba triệu tư chứ không phải ba tỷ
    // rưỡi. Bộ đọc theo thói quen viết số Việt Nam hiểu ".000" là nhóm nghìn
    // nên phải đọc đúng kiểu XML trước, chỉ lùi về bộ đọc kia khi phần mềm phát
    // hành ghi số đã định dạng sẵn ("3.450.000").
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

    // Khoản thu hộ nhà chức trách trên hóa đơn hàng không: không chịu thuế GTGT
    // nhưng vẫn nằm trong số tiền phải trả.
    //
    // Mỗi phần mềm phát hành đặt một tên khác nhau, có nơi là tên thẻ
    // ("TgTienThuHo"), có nơi nhét vào khối thông tin khác dưới dạng nhãn tiếng
    // Việt có dấu ("Thu hộ nhà chức trách"). Vì vậy so khớp trên tên đã bỏ dấu
    // và bỏ ký tự ngăn cách, thay vì liệt kê sẵn tên thẻ.
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

    // Chỉ suy ra phép cộng trực tiếp khi cả trước thuế và thuế đều có bằng chứng.
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
  perDiemAmount: '',
  perDiemFrom: '',
  perDiemTo: '',
};

/**
 * Ô sửa tay một cột tiền. Giá trị hiển thị được định dạng theo kiểu Việt Nam
 * khi không có con trỏ trong ô, còn lúc gõ thì giữ nguyên chuỗi người dùng nhập
 * để không bị nhảy con trỏ giữa chừng.
 */
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
      className={`w-full rounded-lg border border-border-subtle bg-surface-subtle px-2 py-1.5 text-right text-[11px] font-mono outline-none focus:border-primary-container ${
        emphasis ? 'font-bold text-secondary' : 'text-on-surface'
      }`}
    />
  );
}

/**
 * Ô nhập ngày dạng dd/mm/yyyy kèm nút mở lịch.
 *
 * Không dùng thẳng <input type="date">: ô năm của widget gốc nhận tới sáu chữ
 * số trước khi nhảy sang ô tháng (năm hợp lệ tới 275760), nên gõ "18062026" là
 * hỏng — min/max không đổi được hành vi này. Ở đây phần gõ là ô text tự chèn
 * dấu gạch và dừng ở bốn chữ số năm, còn phần chọn lịch vẫn dùng widget gốc
 * thông qua showPicker().
 */
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

  const handleTyping = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }
    setDraft(formatted);
    const parsed = parseInputDate(formatted);
    if (parsed) onChange(parsed.toISOString().slice(0, 10));
  };

  const commit = () => {
    if (draft === null) return;
    const parsed = parseInputDate(draft);
    if (parsed) {
      onChange(parsed.toISOString().slice(0, 10));
    } else if (draft.trim() === '') {
      onChange('');
    }
    setDraft(null);
  };

  const openCalendar = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    try {
      picker.showPicker();
    } catch {
      // Trình duyệt không hỗ trợ showPicker thì mở widget theo cách thường.
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
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 pr-9 text-slate-200 outline-none focus:border-amber-500/60"
      />
      <button
        type="button"
        onClick={openCalendar}
        aria-label={`Chọn ${label} trên lịch`}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400"
      >
        <CalendarDays size={15} />
      </button>
      {/* Widget gốc chỉ dùng để chọn trên lịch, không nhận bàn phím. */}
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
  const [storedSettings, setFormSettings] = useLocalStorage(
    'payment-request-form',
    DEFAULT_FORM_SETTINGS,
    'invoice',
  );
  // Thiết lập lưu từ phiên trước không có những trường thêm về sau; phủ lên mặc
  // định để mọi ô luôn có giá trị thay vì nhảy từ undefined sang có giá trị.
  const formSettings = useMemo(
    () => ({ ...DEFAULT_FORM_SETTINGS, ...storedSettings }),
    [storedSettings],
  );
  const [companyOverrides, setCompanyOverrides] = useLocalStorage(
    'payment-request-companies',
    {},
    'invoice',
  );
  const [issuedAtInput, setIssuedAtInput] = useState(todayInputValue);
  const [contents, setContents] = useState({});
  // Công tác phí là khoản khoán của cả đợt, chỉ vào giấy của một đơn vị.
  const [perDiemCompanyKey, setPerDiemCompanyKey] = useState('');

  // UI States for Modern Utility Workspace
  const [exportFormat, setExportFormat] = useState('detailed'); // 'detailed' | 'payment_request' | 'json'
  const [previewTab, setPreviewTab] = useState('summary'); // 'summary' | 'companies' | 'other'
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [autoClassify, setAutoClassify] = useState(true);
  const [splitVatCols, setSplitVatCols] = useState(true);
  const [attachLookupLink, setAttachLookupLink] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleRemoveInvoice = (id) => {
    setInvoices((current) => current.filter((inv) => inv.id !== id));
  };

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

  /**
   * Sửa tay một cột tiền. Bóc tách tự động không bao giờ đúng 100% với mọi mẫu
   * hóa đơn, nên người lập chứng từ phải sửa được trước khi xuất — và cảnh báo
   * lệch phép cộng được tính lại ngay để thấy sửa đã khớp hay chưa.
   */
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

  const perDiemRow = useMemo(
    () => buildPerDiemRow({
      amountPerDay: parseLocalizedNumber(formSettings.perDiemAmount) ?? 0,
      from: formSettings.perDiemFrom,
      to: formSettings.perDiemTo,
      issuedAt: parseInputDate(issuedAtInput),
    }),
    [formSettings.perDiemAmount, formSettings.perDiemFrom, formSettings.perDiemTo, issuedAtInput],
  );

  // Đơn vị người dùng chọn, lùi về đơn vị đầu tiên khi lựa chọn cũ không còn.
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
  const totalPreTax = useMemo(
    () => validInvoices.reduce((sum, i) => sum + (i.amountBeforeTax || 0), 0),
    [validInvoices]
  );
  const totalVat = useMemo(
    () => validInvoices.reduce((sum, i) => sum + (i.vatAmount || 0), 0),
    [validInvoices]
  );

  const handleCopySummary = async () => {
    const summaryText = `BẢNG KÊ HÓA ĐƠN (${validInvoices.length} hóa đơn)\n` +
      `- Tổng tiền chưa thuế: ${totalPreTax.toLocaleString('vi-VN')} VNĐ\n` +
      `- Tiền thuế GTGT: ${totalVat.toLocaleString('vi-VN')} VNĐ\n` +
      `- Tổng thanh toán: ${totalAmount.toLocaleString('vi-VN')} VNĐ\n` +
      validInvoices.map((inv, idx) => `${idx + 1}. HĐ ${inv.invoiceNo || 'N/A'} - ${inv.seller} - ${inv.totalAmount?.toLocaleString('vi-VN')} VNĐ (${inv.date})`).join('\n');
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportJson = () => {
    if (validInvoices.length === 0) return;
    const blob = new Blob([JSON.stringify(validInvoices, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HoaDon_TongHop_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrimaryExport = () => {
    if (exportFormat === 'payment_request') {
      handleExportForms();
    } else if (exportFormat === 'json') {
      handleExportJson();
    } else {
      handleExportExcel();
    }
  };

  return (
    <div className="flex flex-col w-full pb-space-12 text-on-surface">
      {/* BREADCRUMB & HEADER SECTION */}
      <div className="flex flex-col gap-space-4 mb-space-8">
        <nav className="flex items-center gap-space-2 font-label-md text-label-md text-outline">
          <a className="hover:text-primary transition-colors" href="#">Trang chủ</a>
          <span className="text-outline-variant">/</span>
          <a className="hover:text-primary transition-colors" href="#excel-hoa-don">Excel & Hóa đơn</a>
          <span className="text-outline-variant">/</span>
          <span className="text-brand-cyan-bright">Xử Lý Hóa Đơn XML & PDF</span>
        </nav>

        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-4 bg-surface-container p-space-6 rounded-xl border border-border-subtle shadow-md">
          <div className="flex items-start gap-space-4">
            <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center shrink-0 shadow-inner text-brand-cyan-bright">
              <Receipt size={30} />
            </div>
            <div className="flex flex-col gap-space-1">
              <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
                Xử Lý Hóa Đơn XML &amp; PDF Đa Năng
              </h1>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                Bóc tách dữ liệu hóa đơn điện tử XML của Tổng cục Thuế và PDF, trích xuất bảng kê Excel tự động, kiểm tra tính hợp lệ chữ ký số và đồng bộ phiếu kế toán tức thì.
              </p>
            </div>
          </div>

          {/* Subtle Privacy Note */}
          <div className="self-start lg:self-center flex items-center gap-1.5 text-xs text-outline shrink-0">
            <ShieldCheck size={15} className="text-secondary shrink-0" />
            <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mb-space-6 rounded-xl border border-error/30 bg-error/10 px-space-4 py-space-3 font-body-sm text-body-sm text-error flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="p-1 hover:bg-error/20 rounded">
            <X size={16} />
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE: 2-COLUMN BALANCED STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 items-start">
        {/* LEFT COLUMN: INPUT & CONFIGURATION (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-6">
          {/* 1. Uploader Card */}
          <div className="bg-surface-container rounded-xl shadow-md p-space-6 border border-border-subtle flex flex-col gap-space-4">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/50">
              <div className="flex items-center gap-space-2">
                <UploadCloud className="text-brand-cyan-bright" size={20} />
                <h2 className="font-title-sm text-title-sm text-on-surface">1. Tải Tệp Hóa Đơn Nguồn</h2>
              </div>
              <span className="font-label-sm text-label-sm text-outline">TỐI ĐA 500 TỆP / LẦN</span>
            </div>

            {/* Drag & Drop Zone */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,.pdf,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFileUpload({ target: { files: e.dataTransfer.files } });
                }
              }}
              className={`bg-surface-container-low rounded-xl p-space-6 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all group ${
                isDragging
                  ? 'border-primary-container bg-surface-container-high'
                  : 'border-border-subtle hover:bg-surface-container-high hover:border-primary-container/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center mb-space-3 text-brand-cyan-bright group-hover:scale-110 transition-transform shadow-inner">
                {isProcessing ? (
                  <RefreshCw className="animate-spin text-primary-container" size={24} />
                ) : (
                  <UploadCloud size={24} />
                )}
              </div>
              {isProcessing ? (
                <>
                  <p className="font-title-sm text-body-md text-on-surface font-medium">
                    Đang giải mã và đọc cấu trúc hóa đơn...
                  </p>
                  {progress && (
                    <p className="font-label-sm text-label-sm text-brand-cyan-bright mt-space-1">
                      Đang đọc {progress.done}/{progress.total} {progress.label ? `— ${progress.label}` : ''}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    Kéo thả tệp XML, PDF hoặc file ZIP chứa hóa đơn
                  </p>
                  <p className="font-body-sm text-body-sm text-outline mt-space-1">
                    Hỗ trợ chuẩn TCT (TT78/ND123), hóa đơn xăng dầu, dịch vụ, bán lẻ
                  </p>
                  <div className="mt-space-4 flex items-center gap-space-2">
                    <span className="px-space-2 py-space-1 bg-surface-subtle border border-border-subtle font-label-sm text-label-sm text-on-surface rounded">.XML</span>
                    <span className="px-space-2 py-space-1 bg-surface-subtle border border-border-subtle font-label-sm text-label-sm text-on-surface rounded">.PDF</span>
                    <span className="px-space-2 py-space-1 bg-surface-subtle border border-border-subtle font-label-sm text-label-sm text-on-surface rounded">.ZIP BATCH</span>
                  </div>
                </>
              )}
            </div>

            {/* Loaded Files List */}
            {invoices.length > 0 && (
              <div className="flex flex-col gap-space-2 pt-space-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline tracking-wider">
                    DANH SÁCH TỆP ĐANG XỬ LÝ ({invoices.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="font-label-sm text-label-sm text-error hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Xóa tất cả
                  </button>
                </div>
                <div className="space-y-space-2 max-h-56 overflow-y-auto">
                  {invoices.slice(0, 50).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-space-3 bg-surface-container-low border border-border-subtle rounded-lg shadow-sm hover:bg-surface-container-high transition-colors"
                    >
                      <div className="flex items-center gap-space-3 min-w-0">
                        {inv.rawType === 'PDF' ? (
                          <FileText className="text-tertiary shrink-0" size={18} />
                        ) : (
                          <Code className="text-brand-cyan-bright shrink-0" size={18} />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface truncate font-medium">
                            {inv.rawFileName || inv.fileName}
                          </span>
                          <div className="flex items-center gap-space-2 font-label-sm text-label-sm text-outline">
                            <span>{inv.rawType}</span>
                            <span>•</span>
                            {inv.needsReview ? (
                              <span className="text-tertiary flex items-center gap-1">
                                <AlertCircle size={12} />
                                Cần kiểm tra ({inv.missingFields?.length || 0} trường)
                              </span>
                            ) : (
                              <span className="text-secondary flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Hợp lệ / TT78 OK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvoice(inv.id)}
                        className="p-space-1 text-outline hover:text-error transition-colors"
                        title="Xóa tệp"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {invoices.length > 50 && (
                    <p className="text-center font-label-sm text-label-sm text-outline py-1">
                      ... và {invoices.length - 50} tệp khác
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Config Extraction & Output Options */}
          <div className="bg-surface-container rounded-xl shadow-md p-space-6 border border-border-subtle flex flex-col gap-space-5">
            <div className="flex items-center justify-between pb-space-1 border-b border-border-subtle/50">
              <div className="flex items-center gap-space-2">
                <SlidersHorizontal className="text-brand-cyan-bright" size={20} />
                <h2 className="font-title-sm text-title-sm text-on-surface">2. Cấu Hình Bóc Tách & Mẫu Bảng Kê</h2>
              </div>
            </div>

            {/* Format selector */}
            <div className="flex flex-col gap-space-2">
              <label className="font-label-sm text-label-sm text-outline tracking-wider">ĐỊNH DẠNG XUẤT KHẨU</label>
              <div className="grid grid-cols-1 gap-space-2">
                <label
                  className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                    exportFormat === 'detailed'
                      ? 'bg-surface-container-high border-primary-container/60 shadow-sm'
                      : 'bg-surface-container-low border-border-subtle hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-space-2">
                    <input
                      type="radio"
                      name="export-format"
                      checked={exportFormat === 'detailed'}
                      onChange={() => setExportFormat('detailed')}
                      className="accent-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface font-medium">Excel Bảng Kê Chi Tiết (.xlsx)</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-primary-container text-on-primary-container px-space-2 py-[2px] rounded font-semibold">PHỔ BIẾN</span>
                </label>

                <label
                  className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                    exportFormat === 'payment_request'
                      ? 'bg-surface-container-high border-primary-container/60 shadow-sm'
                      : 'bg-surface-container-low border-border-subtle hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-space-2">
                    <input
                      type="radio"
                      name="export-format"
                      checked={exportFormat === 'payment_request'}
                      onChange={() => setExportFormat('payment_request')}
                      className="accent-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface font-medium">Mẫu Giấy Đề Nghị Thanh Toán</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">Kế toán</span>
                </label>

                <label
                  className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                    exportFormat === 'json'
                      ? 'bg-surface-container-high border-primary-container/60 shadow-sm'
                      : 'bg-surface-container-low border-border-subtle hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-space-2">
                    <input
                      type="radio"
                      name="export-format"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="accent-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface font-medium">Dữ Liệu JSON / CSV Raw</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">Lập trình</span>
                </label>
              </div>
            </div>

            {/* Smart options checkboxes */}
            <div className="flex flex-col gap-space-3 pt-space-2">
              <label className="font-label-sm text-label-sm text-outline tracking-wider">TÙY CHỌN BÓC TÁCH THÔNG MINH</label>
              <div className="flex flex-col gap-space-2">
                <label className="flex items-center gap-space-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoClassify}
                    onChange={(e) => setAutoClassify(e.target.checked)}
                    className="rounded bg-surface-subtle accent-primary-container w-4 h-4"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Tự động phân loại Hóa đơn Đầu vào / Đầu ra</span>
                </label>
                <label className="flex items-center gap-space-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splitVatCols}
                    onChange={(e) => setSplitVatCols(e.target.checked)}
                    className="rounded bg-surface-subtle accent-primary-container w-4 h-4"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Tách thuế suất 8% và 10% ra các cột riêng biệt</span>
                </label>
                <label className="flex items-center gap-space-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachLookupLink}
                    onChange={(e) => setAttachLookupLink(e.target.checked)}
                    className="rounded bg-surface-subtle accent-primary-container w-4 h-4"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Đính kèm link tra cứu hóa đơn gốc trực tuyến</span>
                </label>
              </div>
            </div>

            {/* Form Settings Collapsible for Payment Request */}
            <div className="p-space-3 rounded-lg bg-surface-container-low border border-border-subtle flex flex-col gap-space-3">
              <div
                onClick={() => setShowFormSettings((v) => !v)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-space-2">
                  <Building2 size={16} className="text-brand-cyan-bright" />
                  <span className="font-body-md text-body-md text-on-surface font-medium">Thông tin in trên Giấy đề nghị thanh toán</span>
                </div>
                {showFormSettings ? <ChevronUp size={16} className="text-outline" /> : <ChevronDown size={16} className="text-outline" />}
              </div>
              {showFormSettings && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3 pt-space-2 border-t border-border-subtle">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Người đề nghị</span>
                    <input
                      type="text"
                      value={formSettings.requester}
                      onChange={(e) => updateSetting('requester', e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Bộ phận</span>
                    <input
                      type="text"
                      value={formSettings.department}
                      onChange={(e) => updateSetting('department', e.target.value)}
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Kế toán ký duyệt</span>
                    <input
                      type="text"
                      value={formSettings.accountant}
                      onChange={(e) => updateSetting('accountant', e.target.value)}
                      placeholder="Trần Thị B"
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Ngày lập</span>
                    <DateField
                      value={issuedAtInput}
                      onChange={setIssuedAtInput}
                      label="Ngày lập giấy đề nghị"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Tên sheet (kỳ lập)</span>
                    <input
                      type="text"
                      value={formSettings.sheetName}
                      onChange={(e) => updateSetting('sheetName', e.target.value)}
                      placeholder={monthSheetName(parseInputDate(issuedAtInput))}
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Công tác phí (đồng/ngày)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formSettings.perDiemAmount}
                      onChange={(e) => updateSetting('perDiemAmount', e.target.value)}
                      placeholder="200.000"
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Từ ngày</span>
                    <DateField
                      value={formSettings.perDiemFrom}
                      onChange={(next) => updateSetting('perDiemFrom', next)}
                      label="Ngày bắt đầu công tác"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-outline font-medium">Đến ngày</span>
                    <DateField
                      value={formSettings.perDiemTo}
                      onChange={(next) => updateSetting('perDiemTo', next)}
                      label="Ngày kết thúc công tác"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <span className="text-outline font-medium">Tính công tác phí vào đơn vị</span>
                    <select
                      value={perDiemTarget}
                      onChange={(e) => setPerDiemCompanyKey(e.target.value)}
                      disabled={companyGroups.length === 0}
                      className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface outline-none focus:border-primary-container text-xs disabled:text-outline"
                    >
                      {companyGroups.length === 0 && <option value="">Chưa có đơn vị nào</option>}
                      {companyGroups.map((group) => (
                        <option key={group.key} value={group.key}>{group.company.name}</option>
                      ))}
                    </select>
                  </label>
                  {perDiemRow && (
                    <p className="text-[11px] text-secondary sm:col-span-2">
                      {perDiemDays(formSettings.perDiemFrom, formSettings.perDiemTo)} ngày × {(parseLocalizedNumber(formSettings.perDiemAmount) ?? 0).toLocaleString('vi-VN')} = <span className="font-bold">{perDiemRow.amount.toLocaleString('vi-VN')} đ</span> ({perDiemRow.description})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action CTA Button */}
            <button
              type="button"
              onClick={handlePrimaryExport}
              disabled={validInvoices.length === 0}
              className="w-full mt-space-2 py-space-4 px-space-6 rounded-lg bg-primary-container hover:bg-brand-cyan-bright text-surface-canvas font-title-sm text-title-sm flex items-center justify-center gap-space-2 shadow-lg hover:shadow-primary-container/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Sparkles size={20} />
              <span>
                {exportFormat === 'payment_request'
                  ? `Xuất Giấy đề nghị thanh toán (${companyGroups.length} đơn vị)`
                  : exportFormat === 'json'
                  ? `Xuất dữ liệu JSON (${validInvoices.length} hóa đơn)`
                  : `Bắt đầu bóc tách & Xuất bảng kê (${validInvoices.length} hóa đơn)`}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & RESULTS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-6">
          {/* Summary Result Metrics Card */}
          <div className="bg-surface-container rounded-xl shadow-md p-space-6 border border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-space-4 pb-space-4 border-b border-border-subtle/50">
              <div className="flex items-center gap-space-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Kết Quả Phân Tích Dữ Liệu</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary bg-brand-emerald-deep/20 border border-secondary/30 px-space-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 size={14} />
                {validInvoices.length}/{invoiceRows.length || 0} Hợp lệ theo TT78
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 my-space-4">
              <div className="bg-surface-container-low border border-border-subtle p-space-4 rounded-lg flex flex-col gap-1 shadow-sm">
                <span className="font-label-sm text-label-sm text-outline">SỐ HÓA ĐƠN XỬ LÝ</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  {String(invoiceRows.length).padStart(2, '0')} <span className="font-body-sm text-body-sm text-outline font-normal">tệp</span>
                </span>
                <span className="font-label-sm text-label-sm text-brand-cyan-bright">100% Khớp định dạng</span>
              </div>
              <div className="bg-surface-container-low border border-border-subtle p-space-4 rounded-lg flex flex-col gap-1 shadow-sm">
                <span className="font-label-sm text-label-sm text-outline">TỔNG TIỀN CHƯA THUẾ</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                  {totalPreTax.toLocaleString('vi-VN')} đ
                </span>
                <span className="font-label-sm text-label-sm text-outline">Thuế GTGT: {totalVat.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="bg-surface-container-low border border-border-subtle p-space-4 rounded-lg flex flex-col gap-1 shadow-sm">
                <span className="font-label-sm text-label-sm text-outline">TỔNG THANH TOÁN</span>
                <span className="font-headline-md text-headline-md text-secondary font-semibold truncate">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
                <span className="font-label-sm text-label-sm text-secondary">Đã bao gồm VAT</span>
              </div>
            </div>

            {/* Download & Operations Bar */}
            <div className="flex flex-wrap items-center gap-space-3 pt-space-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={validInvoices.length === 0}
                className="flex-1 min-w-[200px] py-space-3 px-space-4 bg-secondary-container hover:bg-brand-emerald-deep text-on-secondary-container font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-space-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                <Download size={20} />
                <span>Tải Bảng Kê Excel (.xlsx)</span>
              </button>
              {companyGroups.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportForms}
                  className="py-space-3 px-space-4 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface font-body-md text-body-md rounded-lg flex items-center gap-space-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={18} className="text-primary-container" />
                  <span>Xuất ĐNTT ({companyGroups.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopySummary}
                disabled={validInvoices.length === 0}
                className="p-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
                title="Sao chép tóm tắt bảng kê"
              >
                {copied ? <Check size={20} className="text-secondary" /> : <Copy size={20} />}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="p-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer"
                title="Xử lý đợt mới"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Live Table Diff / Grid Preview Card */}
          <div className="bg-surface-container rounded-xl shadow-md border border-border-subtle overflow-hidden flex flex-col">
            {/* Interactive Preview Tabs */}
            <div className="flex items-center justify-between px-space-6 pt-space-4 bg-surface-container-high border-b border-border-subtle">
              <div className="flex items-center gap-space-4">
                <button
                  type="button"
                  onClick={() => setPreviewTab('summary')}
                  className={`py-space-3 font-title-sm text-title-sm transition-colors cursor-pointer border-b-2 ${
                    previewTab === 'summary'
                      ? 'text-brand-cyan-bright border-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface border-transparent'
                  }`}
                >
                  Bảng kê tổng hợp ({invoiceRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('companies')}
                  className={`py-space-3 font-body-md text-body-md transition-colors cursor-pointer border-b-2 ${
                    previewTab === 'companies'
                      ? 'text-brand-cyan-bright border-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface border-transparent'
                  }`}
                >
                  Đơn vị thanh toán ({companyGroups.length})
                </button>
                {otherDocuments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewTab('other')}
                    className={`py-space-3 font-body-md text-body-md transition-colors cursor-pointer border-b-2 flex items-center gap-1 ${
                      previewTab === 'other'
                        ? 'text-brand-cyan-bright border-primary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface border-transparent'
                    }`}
                  >
                    Tệp khác ({otherDocuments.length})
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  </button>
                )}
              </div>
              <span className="font-label-sm text-label-sm text-outline hidden sm:inline">LIVE PREVIEW</span>
            </div>

            {/* Tab 1: Bảng kê tổng hợp */}
            {previewTab === 'summary' && (
              <>
                <div className="px-space-4 py-space-2 bg-surface-container-low border-b border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllConfirmed(true)}
                      className="rounded border border-secondary/30 bg-secondary/10 px-2 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary/20 transition cursor-pointer"
                    >
                      Chọn tất cả ({invoiceRows.length})
                    </button>
                    {cleanRowCount > 0 && cleanRowCount < invoiceRows.length && (
                      <button
                        type="button"
                        onClick={confirmCleanRows}
                        className="rounded border border-primary-container/30 bg-primary-container/10 px-2 py-1 text-[11px] font-semibold text-brand-cyan-bright hover:bg-primary-container/20 transition cursor-pointer"
                      >
                        Chọn {cleanRowCount} dòng hợp lệ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAllConfirmed(false)}
                      className="rounded border border-border-subtle bg-surface-subtle px-2 py-1 text-[11px] text-outline hover:text-on-surface transition cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                  <span className="text-outline text-[11px]">
                    Đã xác nhận: <strong className="text-secondary">{validInvoices.length}</strong>/{invoiceRows.length}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[440px]">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead className="bg-surface-container-low text-outline font-label-sm text-label-sm sticky top-0 backdrop-blur z-10 border-b border-border-subtle">
                      <tr>
                        <th className="py-space-3 px-space-2 w-10 text-center">STT</th>
                        <th className="py-space-3 px-space-2 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={allConfirmed}
                            onChange={(e) => setAllConfirmed(e.target.checked)}
                            className="h-4 w-4 accent-secondary rounded cursor-pointer"
                            title="Xác nhận tất cả hóa đơn"
                          />
                        </th>
                        <th className="py-space-3 px-space-3">KÝ HIỆU & SỐ HĐ</th>
                        <th className="py-space-3 px-space-3">NGÀY LẬP</th>
                        <th className="py-space-3 px-space-3">BÊN BÁN / MST</th>
                        <th className="py-space-3 px-space-2 text-right w-28">TIỀN TRƯỚC THUẾ</th>
                        <th className="py-space-3 px-space-2 text-right w-24">THUẾ GTGT</th>
                        <th className="py-space-3 px-space-2 text-right w-28">TỔNG THANH TOÁN</th>
                        <th className="py-space-3 px-space-3 text-center">TRẠNG THÁI</th>
                        <th className="py-space-3 px-space-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/30">
                      {invoiceRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-space-8 text-center text-outline">
                            Chưa có dữ liệu hóa đơn. Hãy tải tệp XML/PDF ở cột bên trái để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        invoiceRows.map((inv, idx) => (
                          <tr key={inv.id} className="hover:bg-surface-container-high/60 transition-colors">
                            <td className="py-space-3 px-space-2 text-center text-outline font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-space-3 px-space-2 text-center">
                              <input
                                type="checkbox"
                                checked={inv.isConfirmed}
                                onChange={() => toggleConfirmed(inv.id)}
                                className="h-4 w-4 accent-secondary rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-space-3 px-space-3">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-brand-cyan-bright font-semibold">
                                  {inv.invoiceSymbol ? `${inv.invoiceSymbol} - ` : ''}{inv.invoiceNo || 'N/A'}
                                </span>
                                <span className="font-body-sm text-body-sm text-outline">
                                  {inv.invoiceFormName || 'Hóa đơn GTGT'}
                                </span>
                              </div>
                            </td>
                            <td className="py-space-3 px-space-3 text-on-surface whitespace-nowrap font-mono text-xs">
                              {inv.date || '-'}
                            </td>
                            <td className="py-space-3 px-space-3 max-w-[200px]">
                              <div className="flex flex-col">
                                <span className="font-body-md text-body-md text-on-surface font-medium truncate" title={inv.seller}>
                                  {inv.seller || 'Chưa đọc được'}
                                </span>
                                <span className="font-label-sm text-label-sm text-outline">
                                  MST: {inv.sellerTax || 'N/A'}
                                </span>
                                <input
                                  type="text"
                                  value={inv.expenseNote ?? describeExpense(inv)}
                                  onChange={(event) => setExpenseNote(inv.id, event.target.value)}
                                  placeholder="Nội dung chi phí ĐNTT"
                                  className="w-full text-[10px] rounded border border-border-subtle bg-surface-subtle px-1.5 py-0.5 text-on-surface outline-none focus:border-primary-container mt-1"
                                  title="Nội dung chi phí in trên giấy ĐNTT"
                                />
                                <select
                                  value={companyKeyOf(inv)}
                                  onChange={(e) => setInvoiceCompany(inv.id, e.target.value)}
                                  className="w-full text-[10px] rounded border border-border-subtle bg-surface-subtle px-1 py-0.5 text-outline outline-none focus:border-primary-container mt-1"
                                  title="Đơn vị thanh toán"
                                >
                                  {companyOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="py-space-3 px-space-2 text-right font-mono">
                              <AmountInput
                                value={inv.amountBeforeTax}
                                onCommit={(next) => setInvoiceAmount(inv.id, 'amountBeforeTax', next)}
                                label="Tiền trước thuế"
                              />
                            </td>
                            <td className="py-space-3 px-space-2 text-right font-mono">
                              <AmountInput
                                value={inv.vatAmount}
                                onCommit={(next) => setInvoiceAmount(inv.id, 'vatAmount', next)}
                                label="Thuế GTGT"
                              />
                            </td>
                            <td className="py-space-3 px-space-2 text-right font-mono">
                              <AmountInput
                                value={inv.totalAmount}
                                onCommit={(next) => setInvoiceAmount(inv.id, 'totalAmount', next)}
                                label="Tổng thanh toán"
                                emphasis
                              />
                            </td>
                            <td className="py-space-3 px-space-3 text-center whitespace-nowrap">
                              {inv.needsReview ? (
                                <span className="px-space-2 py-[2px] bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm rounded inline-flex items-center gap-1 border border-tertiary/30">
                                  <AlertCircle size={12} />
                                  Cần kiểm tra
                                </span>
                              ) : (
                                <span className="px-space-2 py-[2px] bg-brand-emerald-deep/20 text-secondary font-label-sm text-label-sm rounded inline-flex items-center gap-1 border border-secondary/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  Đã cấp mã CQT
                                </span>
                              )}
                            </td>
                            <td className="py-space-3 px-space-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoice(inv.id)}
                                className="p-1 text-outline hover:text-error transition-colors"
                                title="Xóa hóa đơn này"
                              >
                                <X size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signature Status Verification Strip */}
                <div className="p-space-3 bg-surface-container-low border-t border-border-subtle flex items-center justify-between font-body-sm text-body-sm px-space-4">
                  <div className="flex items-center gap-space-2 text-secondary font-medium">
                    <CheckCircle2 size={18} />
                    <span>
                      {validInvoices.length}/{invoiceRows.length} hóa đơn có chữ ký số hợp lệ và chứng thư số còn hạn
                    </span>
                  </div>
                  <div className="flex items-center gap-space-1 text-outline font-label-sm text-label-sm">
                    <span>Thuật toán kiểm chứng: RSA-SHA256 / Chuẩn TT78</span>
                  </div>
                </div>
              </>
            )}

            {/* Tab 2: Đơn vị thanh toán & ĐNTT */}
            {previewTab === 'companies' && (
              <div className="p-space-4 flex flex-col gap-space-4 max-h-[440px] overflow-y-auto">
                {companyGroups.length === 0 ? (
                  <p className="py-space-8 text-center text-outline">
                    Chưa có đơn vị thanh toán nào. Hãy xác nhận ít nhất 1 hóa đơn để gom nhóm.
                  </p>
                ) : (
                  companyGroups.map((group, index) => (
                    <div key={group.key} className="rounded-xl border border-border-subtle bg-surface-container-low p-space-4 flex flex-col gap-space-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-outline border-b border-border-subtle/50 pb-2">
                        <span className="font-semibold text-on-surface">
                          Giấy {index + 1}: {forms[index]?.label || group.company.name}
                        </span>
                        <span>
                          {group.invoices.length} hóa đơn •{' '}
                          <span className="font-bold text-secondary font-mono">{group.total.toLocaleString('vi-VN')} đ</span>
                          {group.company.taxCode && <> • MST {group.company.taxCode}</>}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3">
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="text-outline font-medium">Tên đơn vị</span>
                          <input
                            type="text"
                            value={group.company.name}
                            onChange={(e) => updateCompany(group.key, 'name', e.target.value)}
                            className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface text-xs outline-none focus:border-primary-container"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="text-outline font-medium">Địa chỉ</span>
                          <input
                            type="text"
                            value={group.company.address}
                            onChange={(e) => updateCompany(group.key, 'address', e.target.value)}
                            className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface text-xs outline-none focus:border-primary-container"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1 text-xs">
                        <span className="text-outline font-medium">Nội dung thanh toán</span>
                        <input
                          type="text"
                          value={contents[group.key] ?? describeFormContent(
                            group.invoices.map((invoice) => ({ date: invoice.date })),
                            formSettings.contentPrefix || DEFAULT_FORM_SETTINGS.contentPrefix,
                          )}
                          onChange={(e) => setContents({ ...contents, [group.key]: e.target.value })}
                          className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-on-surface text-xs outline-none focus:border-primary-container"
                        />
                      </label>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Tệp khác */}
            {previewTab === 'other' && (
              <div className="p-space-4 flex flex-col gap-space-3 max-h-[440px] overflow-y-auto">
                <p className="font-body-sm text-body-sm text-outline">
                  Các tệp này thiếu số hóa đơn hoặc mã số thuế bên bán (lịch trình bay, cuống vé...).
                </p>
                {otherDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-container-low px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono font-medium text-on-surface">{doc.fileName}</p>
                      <p className="text-outline text-[11px]">
                        {doc.seller} {doc.date ? `• ${doc.date}` : ''} {doc.totalAmount ? `• ${doc.totalAmount.toLocaleString('vi-VN')} đ` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => forceAsInvoice(doc.id)}
                      className="rounded border border-primary-container/30 bg-primary-container/10 px-3 py-1 text-xs font-semibold text-brand-cyan-bright hover:bg-primary-container/20 transition cursor-pointer"
                    >
                      Đưa vào bảng hóa đơn
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
