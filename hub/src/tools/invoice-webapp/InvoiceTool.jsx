import React, { useState } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download, FileText, CheckCircle2,
  Trash2, ShieldCheck, AlertCircle, FileArchive, RefreshCw, Eye,
  Building, Calendar, DollarSign, FileCheck, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Cấu hình Worker cho PDF.js trong môi trường Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

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
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
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
    }
    return fullText;
  } catch (err) {
    console.error('Lỗi khi extract text PDF:', err);
    return '';
  }
}

// Bóc tách dữ liệu từ văn bản PDF theo các mẫu hóa đơn phổ biến
function parsePDFInvoiceText(text, fileName, zipName = null) {
  try {
    let dateStr = new Date().toLocaleDateString('vi-VN');
    let invoiceNo = 'N/A';
    let provider = 'Hóa đơn/Biên lai (PDF)';
    let totalAmount = 0;

    // 1. Quét ngày tháng
    const dateMatch = text.match(/(?:ngày|date|ngay)?\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i);
    if (dateMatch) {
      const d = dateMatch[1].padStart(2, '0');
      const m = dateMatch[2].padStart(2, '0');
      const y = dateMatch[3];
      dateStr = `${d}/${m}/${y}`;
    }

    // 2. Quét số hóa đơn
    const invMatch = text.match(/(?:Số HĐ|Số hóa đơn|Số|Invoice No|No\.)[:\s]*([A-Z0-9\-\/]+)/i);
    if (invMatch && invMatch[1].length >= 3 && invMatch[1].length <= 15) {
      invoiceNo = invMatch[1].trim();
    }

    // 3. Quét số tiền (Sử dụng regex như bản Python để tìm các dòng chứa "tổng cộng", "thành tiền", "total")
    const amountRegex = /(?:tổng cộng tiền thanh toán|tổng tiền thanh toán|tổng cộng|total payment|total amount|tổng tiền|thành tiền).*?(\d{1,3}(?:[\.,]\d{3})+(?:[\.,]\d{2})?|\d{4,9})/gi;
    let match;
    const parsedNums = [];
    while ((match = amountRegex.exec(text)) !== null) {
      const cleaned = match[1].replace(/[^\d]/g, '');
      const num = parseInt(cleaned, 10);
      if (num >= 5000 && num <= 500000000) {
        parsedNums.push(num);
      }
    }
    
    // Nếu không tìm thấy, fallback tìm MAX của TẤT CẢ các số hợp lệ
    if (parsedNums.length > 0) {
      totalAmount = Math.max(...parsedNums);
    } else {
      const allAmountMatches = text.match(/(?:VNĐ|VND|\₫)?\s*(\d{1,3}(?:[\.,]\d{3})+(?:[\.,]\d{2})?|\d{4,9})\s*(?:VNĐ|VND|\₫)?/g);
      if (allAmountMatches) {
        for (const m of allAmountMatches) {
          const cleaned = m.replace(/[^\d]/g, '');
          const num = parseInt(cleaned, 10);
          if (num >= 5000 && num <= 500000000) {
            parsedNums.push(num);
          }
        }
        if (parsedNums.length > 0) {
          totalAmount = Math.max(...parsedNums);
        }
      }
    }

    const textLower = text.toLowerCase();

    // 4. Nhận diện trường hợp: Vé máy bay Vietjet
    if (textLower.includes('vietjet') || textLower.includes('vé máy bay') || textLower.includes('electronic ticket')) {
      let pnr = 'N/A';
      const pnrMatch = text.match(/(?:Mã đặt chỗ|PNR|Reservation Code)[:\s]*([A-Z0-9]{6,8})/i);
      if (pnrMatch) pnr = pnrMatch[1];

      let flightRoute = '';
      const routeMatch = text.match(/\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/);
      if (routeMatch) {
        flightRoute = ` | ${routeMatch[1]}-${routeMatch[2]}`;
      }
      provider = `Vietjet Air [PNR: ${pnr}${flightRoute}]`;
    }
    // 5. Nhận diện trường hợp: Taxi Xanh SM / Grab / Taxi
    else if (textLower.includes('xanh sm') || textLower.includes('công ty cổ phần di chuyển xanh') || textLower.includes('gsm')) {
      let pickup = '';
      let dropoff = '';

      const pickupMatch = text.match(/(?:Điểm đón|Đón|Pickup|Từ)[:\s]*(.*?)(?:\n|Điểm đến|Đến|Dropoff|Thời gian|Mã chuyến|$)/i);
      if (pickupMatch) pickup = pickupMatch[1].trim().slice(0, 45);

      const dropoffMatch = text.match(/(?:Điểm đến|Đến|Dropoff|Tới)[:\s]*(.*?)(?:\n|Thời gian|Cước phí|Mã chuyến|$)/i);
      if (dropoffMatch) dropoff = dropoffMatch[1].trim().slice(0, 45);

      if (pickup && dropoff) {
        provider = `Xanh SM (${pickup} -> ${dropoff})`;
      } else if (pickup) {
        provider = `Xanh SM (${pickup})`;
      } else {
        provider = 'Xanh SM (Chi phí di chuyển)';
      }
    }
    // 6. Nhận diện trường hợp: Khách sạn / Hóa đơn song ngữ / Hóa đơn chung
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
          if (dLower.includes('(no)') || dLower.includes('hàng(seller)')) continue;
          
          // Bỏ qua dòng đánh số thứ tự cột toán học (1 2 3 4 5 6 = 4 x 5)
          if (/^[\d\s=xX\.\,\+\-]+$/.test(d)) continue;

          // Bỏ số thứ tự đầu dòng nếu có (ví dụ "1 Dịch vụ lưu trú" -> "Dịch vụ lưu trú")
          const cleanD = d.replace(/^\d+[\.\s]+/, '').trim();
          desc = cleanD.length > 60 ? ` (${cleanD.slice(0, 60)}...)` : ` (${cleanD})`;
          break;
        }
      }

      if (desc) {
        provider = provider + desc;
      }
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      zipName: zipName || null,
      invoiceNo,
      date: dateStr,
      seller: provider,
      sellerTax: 'PDF/E-Ticket',
      amountBeforeTax: Math.round(totalAmount / 1.08),
      vatAmount: totalAmount - Math.round(totalAmount / 1.08),
      totalAmount,
      status: 'Hợp lệ',
      rawType: 'PDF'
    };
  } catch (err) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      fileName: zipName ? `${zipName} ➔ ${fileName}` : fileName,
      rawFileName: fileName,
      invoiceNo: 'N/A',
      date: new Date().toLocaleDateString('vi-VN'),
      seller: 'Lỗi bóc tách PDF',
      sellerTax: '-',
      amountBeforeTax: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'Lỗi parse',
      errorMessage: err.message,
      rawType: 'PDF'
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
    } else {
      dateStr = new Date().toLocaleDateString('vi-VN');
    }

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
        seller = shortName;
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
        const clean = valStr.replace(/,/g, '').trim();
        const num = parseFloat(clean);
        if (!isNaN(num) && num >= 0) return num;
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

    // Tự động tính toán nếu thiếu
    if (totalAmount > 0 && amountBeforeTax === 0 && vatAmount === 0) {
      amountBeforeTax = Math.round(totalAmount / 1.1);
      vatAmount = totalAmount - amountBeforeTax;
    } else if (amountBeforeTax > 0 && totalAmount === 0) {
      if (vatAmount > 0) totalAmount = amountBeforeTax + vatAmount;
      else totalAmount = Math.round(amountBeforeTax * 1.1);
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
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
      status: 'Hợp lệ',
      rawType: 'XML'
    };
  } catch (err) {
    return {
      id: Math.random().toString(36).substring(2, 9),
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
      rawType: 'XML'
    };
  }
}

export default function InvoiceTool({ displayLang }) {
  const [invoices, setInvoices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFileCount, setProcessedFileCount] = useState(0);

  // Xử lý nạp các tệp tải lên (XML, PDF, ZIP)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const parsedList = [];
    let fileCounter = 0;

    for (const file of files) {
      const lowerName = file.name.toLowerCase();

      // 1. TRƯỜNG HỢP: TẬP TIN ZIP (.zip)
      if (lowerName.endsWith('.zip') || file.type.includes('zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipEntries = Object.keys(zip.files);

          for (const entryName of zipEntries) {
            const zipEntry = zip.files[entryName];
            if (zipEntry.dir || entryName.includes('__MACOSX') || entryName.startsWith('._')) {
              continue; // Bỏ qua thư mục con và file rác macOS
            }

            const entryLower = entryName.toLowerCase();
            const baseName = entryName.split('/').pop();

            // Nếu trong file ZIP có file XML
            if (entryLower.endsWith('.xml')) {
              const xmlContent = await zipEntry.async('text');
              const parsed = parseXMLInvoice(xmlContent, baseName, file.name);
              parsedList.push(parsed);
              fileCounter++;
            }
            // Nếu trong file ZIP có file PDF (Extract thật 100% bằng pdfjs-dist)
            else if (entryLower.endsWith('.pdf')) {
              const pdfBuffer = await zipEntry.async('arraybuffer');
              const pdfText = await extractTextFromPDFBuffer(pdfBuffer);
              const parsed = parsePDFInvoiceText(pdfText, baseName, file.name);
              parsedList.push(parsed);
              fileCounter++;
            }
          }
        } catch (err) {
          console.error('Lỗi khi giải nén ZIP:', err);
          parsedList.push({
            id: Math.random().toString(36).substring(2, 9),
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
            rawType: 'ZIP'
          });
        }
      }
      // 2. TRƯỜNG HỢP: TẬP TIN XML (.xml)
      else if (lowerName.endsWith('.xml')) {
        try {
          const xmlContent = await file.text();
          const parsed = parseXMLInvoice(xmlContent, file.name);
          parsedList.push(parsed);
          fileCounter++;
        } catch (err) {
          console.error('Lỗi đọc XML:', err);
        }
      }
      // 3. TRƯỜNG HỢP: TẬP TIN PDF (.pdf)
      else if (lowerName.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfText = await extractTextFromPDFBuffer(arrayBuffer);
          const parsed = parsePDFInvoiceText(pdfText, file.name);
          parsedList.push(parsed);
          fileCounter++;
        } catch (err) {
          console.error('Lỗi đọc PDF:', err);
        }
      }
    }

    // Khử trùng lặp theo Mã số HĐ hoặc Tên file + Số tiền
    setInvoices((prev) => {
      const combined = [...prev, ...parsedList];
      const seen = new Set();
      return combined.filter((item) => {
        const key = item.invoiceNo !== 'N/A' && item.invoiceNo !== 'Chưa rõ số'
          ? `${item.invoiceNo}_${item.totalAmount}`
          : `${item.rawFileName}_${item.totalAmount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setProcessedFileCount((prev) => prev + fileCounter);
    setIsProcessing(false);
  };

  // Xuất file Excel Đề nghị thanh toán theo format chuẩn
  const handleExportExcel = () => {
    if (invoices.length === 0) return;

    const validInvoices = invoices.filter((i) => i.status === 'Hợp lệ');
    const totalAmount = validInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const wordsVN = numberToWordsVN(totalAmount);

    const rows = [
      ['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['Độc lập - Tự do - Hạnh phúc'],
      ['-----------------------'],
      ['BẢNG KÊ ĐỀ NGHỊ THANH TOÁN'],
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
    XLSX.utils.book_append_sheet(wb, ws, 'Đề Nghị Thanh Toán');
    XLSX.writeFile(wb, `De_Nghi_Thanh_Toan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClearAll = () => {
    setInvoices([]);
    setProcessedFileCount(0);
  };

  const validInvoices = invoices.filter((i) => i.status === 'Hợp lệ');
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
            Tự động bóc tách hóa đơn XML & PDF thực tế (Vé máy bay, Taxi Xanh SM, Khách sạn, v.v.), luôn lấy giá trị sau thuế.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            100% Client-Side Safe
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
              Hỗ trợ xử lý hàng loạt không giới hạn số lượng • Bóc tách tự động chỉ trong vài giây
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
              <p className="text-xs text-slate-400 font-medium">Hóa đơn hợp lệ</p>
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition transform active:scale-95 text-xs"
            >
              <Download size={16} />
              Tải File Excel ĐNTT Chuẩn
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
              * Luôn lấy giá trị thanh toán thực chi (sau thuế)
            </span>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-28">Ngày tháng</th>
                  <th className="py-3 px-4">Nội dung chi tiết</th>
                  <th className="py-3 px-4 w-28 text-right">Trước thuế</th>
                  <th className="py-3 px-4 w-24 text-right">Tiền thuế</th>
                  <th className="py-3 px-4 w-32 text-right">Sau thuế</th>
                  <th className="py-3 px-4 w-32">Số hóa đơn</th>
                  <th className="py-3 px-4 w-24 text-center">Loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{inv.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div>{inv.seller}</div>
                      {inv.rawFileName && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.rawFileName}</div>
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
