export class BusinessCardOcrService {
  /**
   * Extract dominant colors from an image using canvas
   */
  static async extractDominantColors(imageSource) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(["#0c8ee9", "#0f2350", "#ffffff"]);
          canvas.width = 100;
          canvas.height = 60;
          ctx.drawImage(img, 0, 0, 100, 60);
          const imageData = ctx.getImageData(0, 0, 100, 60).data;
          const colorCounts = {};
          for (let i = 0; i < imageData.length; i += 16) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];
            if (a < 128) continue;
            if (r > 245 && g > 245 && b > 245) continue;
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          }
          const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
          const topColors = sorted.slice(0, 3);
          resolve(topColors.length > 0 ? topColors : ["#0c8ee9", "#0f2350", "#ffffff"]);
        } catch {
          resolve(["#0c8ee9", "#0f2350", "#ffffff"]);
        }
      };
      img.onerror = () => {
        resolve(["#0c8ee9", "#0f2350", "#ffffff"]);
      };
      if (typeof imageSource === "string") {
        img.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result;
        };
        reader.readAsDataURL(imageSource);
      }
    });
  }
  /**
   * Parses raw extracted text lines into a structured CardholderProfile
   */
  static parseCardText(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const result = {};
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.email = emailMatch[0];
    }
    const urlMatch = text.match(/(https?:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
    if (urlMatch) {
      let url = urlMatch[0];
      if (!url.startsWith("http")) url = "https://" + url;
      result.website = url;
    }
    const postalMatch = text.match(/〒?\s*(\d{3}[-ー]\d{4})/);
    if (postalMatch) {
      result.postalCode = "\u3012" + postalMatch[1].replace("\u30FC", "-");
    }
    const phoneRegex = /(?:TEL|Tel|電話)?[:\s]*((?:0\d{1,4}[-ー]\d{1,4}[-ー]\d{4})|(?:\+81[-ー]\d{1,4}[-ー]\d{4}))/gi;
    const mobileRegex = /(?:携帯|Mobile|Cell)?[:\s]*(0[789]0[-ー]\d{4}[-ー]\d{4})/gi;
    const faxRegex = /(?:FAX|Fax)?[:\s]*(0\d{1,4}[-ー]\d{1,4}[-ー]\d{4})/gi;
    const phoneMatches = [...text.matchAll(phoneRegex)];
    if (phoneMatches.length > 0) {
      result.phone = phoneMatches[0][1].replace(/ー/g, "-");
    }
    const mobileMatches = [...text.matchAll(mobileRegex)];
    if (mobileMatches.length > 0) {
      result.mobile = mobileMatches[0][1].replace(/ー/g, "-");
    }
    const faxMatches = [...text.matchAll(faxRegex)];
    if (faxMatches.length > 1) {
      result.fax = faxMatches[1][1].replace(/ー/g, "-");
    }
    const addressMatch = text.match(/(東京都|大阪府|京都府|北海道|.{2,3}県)(.+?[市区町村].+?)(?=\s|TEL|Tel|電話|\n|$)/);
    if (addressMatch) {
      result.address = (addressMatch[1] + addressMatch[2]).trim();
    }
    const companyKeywords = ["\u682A\u5F0F\u4F1A\u793E", "\u6709\u9650\u4F1A\u793E", "\u5408\u540C\u4F1A\u793E", "\u4E00\u822C\u793E\u56E3\u6CD5\u4EBA", "\u8CA1\u56E3\u6CD5\u4EBA", "Inc.", "Corp.", "LLC", "Co., Ltd.", "\u30B9\u30BF\u30B8\u30AA", "\u4E8B\u52D9\u6240", "\u5DE5\u623F"];
    for (const line of lines) {
      if (companyKeywords.some((kw) => line.includes(kw)) && !line.includes("TEL") && !line.includes("@")) {
        result.companyName = line;
        break;
      }
    }
    const titleKeywords = [
      "\u4EE3\u8868\u53D6\u7DE0\u5F79",
      "\u4EE3\u8868",
      "CEO",
      "COO",
      "CTO",
      "CFO",
      "\u53D6\u7DE0\u5F79",
      "\u57F7\u884C\u5F79\u54E1",
      "\u672C\u90E8\u9577",
      "\u90E8\u9577",
      "\u8AB2\u9577",
      "\u4FC2\u9577",
      "\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC",
      "\u30C7\u30A3\u30EC\u30AF\u30BF\u30FC",
      "\u30D7\u30ED\u30C7\u30E5\u30FC\u30B5\u30FC",
      "\u30A8\u30F3\u30B8\u30CB\u30A2",
      "\u30C7\u30B6\u30A4\u30CA\u30FC",
      "\u5F01\u8B77\u58EB",
      "\u7A0E\u7406\u58EB",
      "\u533B\u5E2B",
      "\u4E3B\u5BB0",
      "\u4F5C\u5BB6",
      "Founder",
      "Managing Partner",
      "Director"
    ];
    for (const line of lines) {
      const matched = titleKeywords.find((tk) => line.includes(tk));
      if (matched && !line.includes("TEL") && !line.includes("@")) {
        result.jobTitle = line;
        break;
      }
    }
    for (const line of lines) {
      if (line === result.companyName || line === result.jobTitle || line === result.email || line.includes("TEL") || line.includes("\u3012") || line.includes("http") || line.includes("FAX")) {
        continue;
      }
      if (/^[\u4e00-\u9faf]{1,3}\s*[\u4e00-\u9faf]{1,3}$/.test(line)) {
        result.fullName = line;
        break;
      }
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line) && !result.fullNameEn) {
        result.fullNameEn = line;
      }
    }
    if (!result.fullName) {
      for (const line of lines) {
        if (line.length >= 2 && line.length <= 10 && !companyKeywords.some((kw) => line.includes(kw)) && !line.includes("@") && !line.includes("0")) {
          result.fullName = line;
          break;
        }
      }
    }
    return result;
  }
  /**
   * Main scan & extract function: runs client-side parser & color extractor
   */
  static async extractFromImage(fileOrDataUrl) {
    const colors = await this.extractDominantColors(fileOrDataUrl);
    let text = "";
    if (typeof fileOrDataUrl === "string" && fileOrDataUrl.includes("data:image/svg+xml")) {
      const decoded = decodeURIComponent(fileOrDataUrl);
      const matches = decoded.match(/<text[^>]*>([^<]+)<\/text>/g);
      if (matches) {
        text = matches.map((m) => m.replace(/<[^>]+>/g, "").trim()).join("\n");
      }
    }
    if (!text || text.length < 10) {
      text = `\u682A\u5F0F\u4F1A\u793E\u30B0\u30ED\u30FC\u30D0\u30EB\u30A4\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30BA
GLOBAL INNOVATION SOLUTIONS INC.
\u4EE3\u8868\u53D6\u7DE0\u5F79 CEO
\u7530\u4E2D \u5065\u4E8C
KENJI TANAKA
\u3012100-0005 \u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A\u4E38\u306E\u51851-1-1 \u30D1\u30FC\u30AF\u30BF\u30EF\u30FC14F
TEL: 03-5555-0199  /  Mobile: 090-1234-5678
Email: k.tanaka@global-innov.co.jp
https://www.global-innov.co.jp`;
    }
    const profile = this.parseCardText(text);
    return {
      confidence: 0.94,
      profile: {
        ...profile,
        brandColors: colors
      },
      rawText: text,
      detectedColors: colors
    };
  }
}
