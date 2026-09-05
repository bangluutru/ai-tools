const SAMPLE_TECH_CARD_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="910" height="550" viewBox="0 0 910 550" style="background:#ffffff; font-family:'Noto Sans JP', sans-serif;">
  <rect width="910" height="550" fill="#ffffff"/>
  <rect x="0" y="0" width="910" height="12" fill="#0c8ee9"/>
  <circle cx="90" cy="90" r="30" fill="#0c8ee9"/>
  <text x="90" y="98" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">GIS</text>
  <text x="140" y="85" font-size="24" font-weight="bold" fill="#0f2350">\u682A\u5F0F\u4F1A\u793E\u30B0\u30ED\u30FC\u30D0\u30EB\u30A4\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3</text>
  <text x="140" y="110" font-size="14" fill="#64748b" letter-spacing="1">GLOBAL INNOVATION SOLUTIONS INC.</text>
  
  <text x="90" y="210" font-size="14" fill="#64748b">\u4EE3\u8868\u53D6\u7DE0\u5F79 CEO</text>
  <text x="90" y="270" font-size="44" font-weight="bold" fill="#0f172a" letter-spacing="4">\u7530\u4E2D \u5065\u4E8C</text>
  <text x="90" y="305" font-size="16" fill="#64748b" letter-spacing="2">KENJI TANAKA</text>

  <line x1="90" y1="340" x2="820" y2="340" stroke="#e2e8f0" stroke-width="2"/>

  <text x="90" y="390" font-size="16" fill="#334155">\u3012100-0005 \u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A\u4E38\u306E\u51851-1-1 \u30D1\u30FC\u30AF\u30BF\u30EF\u30FC14F</text>
  <text x="90" y="430" font-size="16" fill="#334155">TEL: 03-5555-0199  /  Mobile: 090-1234-5678</text>
  <text x="90" y="470" font-size="16" fill="#334155">Email: k.tanaka@global-innov.co.jp</text>
  <text x="90" y="510" font-size="16" fill="#0c8ee9">https://www.global-innov.co.jp</text>
</svg>
`);
export const SAMPLE_PROFILES = [
  {
    id: "tech-ceo",
    label: "\u7530\u4E2D \u5065\u4E8C (IT\u30FB\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\u4EE3\u8868)",
    labelEn: "Kenji Tanaka - Tech Startup CEO",
    labelVi: "Tanaka Kenji (CEO Kh\u1EDFi Nghi\u1EC7p C\xF4ng Ngh\u1EC7)",
    industry: "Technology / IT Consulting",
    recommendedStyle: "Tech Innovator",
    sampleCardImageSvg: SAMPLE_TECH_CARD_SVG,
    profile: {
      fullName: "\u7530\u4E2D \u5065\u4E8C",
      fullNameKana: "\u305F\u306A\u304B \u3051\u3093\u3058",
      fullNameEn: "Kenji Tanaka",
      jobTitle: "\u4EE3\u8868\u53D6\u7DE0\u5F79 CEO",
      jobTitleEn: "Representative Director & CEO",
      department: "\u7D4C\u55B6\u4F01\u753B\u672C\u90E8",
      departmentEn: "Executive Management",
      companyName: "\u682A\u5F0F\u4F1A\u793E\u30B0\u30ED\u30FC\u30D0\u30EB\u30A4\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30BA",
      companyNameKana: "\u30AB\u30D6\u30B7\u30AD\u30AC\u30A4\u30B7\u30E3\u30B0\u30ED\u30FC\u30D0\u30EB\u30A4\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30BA",
      companyNameEn: "Global Innovation Solutions Inc.",
      postalCode: "\u3012100-0005",
      address: "\u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A\u4E38\u306E\u51851-1-1",
      addressEn: "1-1-1 Marunouchi, Chiyoda-ku, Tokyo",
      building: "\u4E38\u306E\u5185\u30D1\u30FC\u30AF\u30BF\u30EF\u30FC 14F",
      phone: "03-5555-0199",
      mobile: "090-1234-5678",
      fax: "03-5555-0198",
      email: "k.tanaka@global-innov.co.jp",
      website: "https://www.global-innov.co.jp",
      sns: "@kenji_innov_tech",
      notes: "AI\u53D7\u8A17\u958B\u767A\u30FB\u30AF\u30E9\u30A6\u30C9\u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3\u8A2D\u8A08\u30FBDX\u4F34\u8D70\u652F\u63F4",
      brandColors: ["#0c8ee9", "#0f2350", "#ffffff"]
    }
  },
  {
    id: "kyoto-artisan",
    label: "\u4F50\u85E4 \u7D50\u7F8E (\u4EAC\u90FD\u30FB\u4F1D\u7D71\u5DE5\u82B8\u4F5C\u5BB6)",
    labelEn: "Yumi Sato - Kyoto Traditional Craftsman",
    labelVi: "Sato Yumi (Ngh\u1EC7 Nh\xE2n Truy\u1EC1n Th\u1ED1ng Kyoto)",
    industry: "Traditional Arts & Luxury",
    recommendedStyle: "Japanese Traditional",
    sampleCardImageSvg: SAMPLE_TECH_CARD_SVG,
    profile: {
      fullName: "\u4F50\u85E4 \u7D50\u7F8E",
      fullNameKana: "\u3055\u3068\u3046 \u3086\u307F",
      fullNameEn: "Yumi Sato",
      jobTitle: "\u4E3B\u5BB0\u30FB\u67D3\u7E54\u4F5C\u5BB6",
      jobTitleEn: "Textile Master & Founder",
      department: "\u6D1B\u98A8\u5802\u5DE5\u623F",
      departmentEn: "Rakufudo Atelier",
      companyName: "\u4EAC\u90FD\u4F1D\u7D71\u7E54\u7269 \u6D1B\u98A8\u5802",
      companyNameKana: "\u30AD\u30E7\u30A6\u30C8\u30C7\u30F3\u30C8\u30A6\u30AA\u30EA\u30E2\u30CE \u30E9\u30AF\u30D5\u30A6\u30C9\u30A6",
      companyNameEn: "Kyoto Textile Rakufudo",
      postalCode: "\u3012604-8001",
      address: "\u4EAC\u90FD\u5E9C\u4EAC\u90FD\u5E02\u4E2D\u4EAC\u533A\u6728\u5C4B\u753A\u901A\u4E09\u6761\u4E0A\u308B",
      addressEn: "Kiyamachi Sanjo, Nakagyo-ku, Kyoto",
      building: "\u6D1B\u98A8\u5EB5 \u672C\u9928",
      phone: "075-222-0888",
      mobile: "080-9876-5432",
      email: "yumi@rakufudo-kyoto.jp",
      website: "https://rakufudo-kyoto.jp",
      sns: "@kyoto_rakufudo",
      notes: "\u5929\u7136\u85CD\u67D3\u30FB\u897F\u9663\u7E54\u30FB\u6570\u5BC4\u5C4B\u5EFA\u7BC9\u5411\u3051\u5BA4\u5185\u88C5\u98FE",
      brandColors: ["#165e83", "#b59a57", "#111827"]
    }
  },
  {
    id: "global-consultant",
    label: "Elena Vance (\u30B0\u30ED\u30FC\u30D0\u30EB\u6CD5\u52D9\u30FB\u9867\u554F)",
    labelEn: "Elena Vance - International Legal Counsel",
    labelVi: "Elena Vance (C\u1ED1 V\u1EA5n Ph\xE1p L\xFD Qu\u1ED1c T\u1EBF)",
    industry: "Legal & International Consulting",
    recommendedStyle: "Executive Luxury",
    sampleCardImageSvg: SAMPLE_TECH_CARD_SVG,
    profile: {
      fullName: "\u30A8\u30EC\u30CA\u30FB\u30F4\u30A1\u30F3\u30B9",
      fullNameKana: "\u3048\u308C\u306A\u30FB\u3094\u3041\u3093\u3059",
      fullNameEn: "Elena Vance, J.D.",
      jobTitle: "\u30DE\u30CD\u30FC\u30B8\u30F3\u30B0\u30D1\u30FC\u30C8\u30CA\u30FC / \u5916\u56FD\u6CD5\u4E8B\u52D9\u5F01\u8B77\u58EB",
      jobTitleEn: "Managing Partner & Senior Counsel",
      department: "\u30AF\u30ED\u30B9\u30DC\u30FC\u30C0\u30FCM&A\u90E8\u9580",
      departmentEn: "Cross-Border M&A Practice",
      companyName: "\u30F4\u30A1\u30F3\u30B9\u56FD\u969B\u6CD5\u5F8B\u4E8B\u52D9\u6240",
      companyNameKana: "\u30F4\u30A1\u30F3\u30B9\u30B3\u30AF\u30B5\u30A4\u30DB\u30A6\u30EA\u30C4\u30B8\u30E0\u30B7\u30E7",
      companyNameEn: "Vance & Partners Global Law Office",
      postalCode: "\u3012106-6108",
      address: "\u6771\u4EAC\u90FD\u6E2F\u533A\u516D\u672C\u67286-10-1",
      addressEn: "6-10-1 Roppongi, Minato-ku, Tokyo",
      building: "\u516D\u672C\u6728\u30D2\u30EB\u30BA\u68EE\u30BF\u30EF\u30FC 28F",
      phone: "03-6800-9900",
      mobile: "070-1122-3344",
      email: "e.vance@vance-global-law.com",
      website: "https://vance-global-law.com",
      sns: "linkedin.com/in/elena-vance-legal",
      notes: "\u65E5\u7C73\u82F1\u30AF\u30ED\u30B9\u30DC\u30FC\u30C0\u30FC\u77E5\u8CA1\u53D6\u5F15\u30FB\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\u6D77\u5916\u5C55\u958B",
      brandColors: ["#111827", "#b59a57", "#ffffff"]
    }
  },
  {
    id: "yuka-design",
    label: "\u3055\u3093\u3077\u308B \u3086\u304B (yuka design - \u30DF\u30CB\u30DE\u30EB\u30FB\u7DDA\u753B)",
    labelEn: "Yuka Sample (yuka design - Minimalist Line-Art)",
    labelVi: "M\u1EABu Yuka (H\u1ECDa S\u0129 V\u1EBD N\xE9t & Chim Bay)",
    industry: "Design & Illustration / Creative",
    recommendedStyle: "Yuka Minimalist Line-Art",
    sampleCardImageSvg: SAMPLE_TECH_CARD_SVG,
    profile: {
      fullName: "\u3055\u3093\u3077\u308B \u3086\u304B",
      fullNameKana: "\u3055\u3093\u3077\u308B \u3086\u304B",
      fullNameEn: "Yuka Sample",
      jobTitle: "designer",
      jobTitleEn: "Designer & Illustrator",
      department: "",
      departmentEn: "",
      companyName: "yuka design",
      companyNameKana: "\u30E6\u30AB\u30C7\u30B6\u30A4\u30F3",
      companyNameEn: "yuka design",
      postalCode: "",
      address: "",
      addressEn: "",
      building: "",
      phone: "090-1234-5678",
      mobile: "090-1234-5678",
      email: "yuka.sample@gmail.com",
      website: "https://yuka.sample/",
      sns: "https://yuka.sample/design",
      notes: "\u30ED\u30B4\u30FB\u30C1\u30E9\u30B7\u30FB\u540D\u523A\u30FBWEB\u30FB\u5404\u7A2E\u5370\u5237\u7269\u30C7\u30B6\u30A4\u30F3\u30FB\u30C7\u30A3\u30EC\u30AF\u30B7\u30E7\u30F3\u696D\u52D9",
      brandColors: ["#2D2B2A", "#FAFAF8", "#8C8582"]
    }
  }
];
