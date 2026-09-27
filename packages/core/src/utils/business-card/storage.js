import { QrCodeService } from "./qrGenerator.js";
// Trường thông tin riêng của từng nhân viên — không được sao chép từ hồ sơ mẫu (master)
const PERSONAL_FIELDS = ["fullName", "fullNameKana", "fullNameEn", "jobTitle", "department", "email", "mobile"];
const LEGACY_COLUMN_ORDER = ["fullName", "fullNameKana", "fullNameEn", "jobTitle", "department", "email", "phone", "mobile"];
const HEADER_ALIASES = {
  fullname: "fullName", name: "fullName", "\u6C0F\u540D": "fullName", "h\u1ECD v\u00E0 t\u00EAn": "fullName", "h\u1ECD t\u00EAn": "fullName",
  fullnamekana: "fullNameKana", kana: "fullNameKana", "\u3075\u308A\u304C\u306A": "fullNameKana", "\u30D5\u30EA\u30AC\u30CA": "fullNameKana", "\u3088\u307F\u304C\u306A": "fullNameKana",
  fullnameen: "fullNameEn", englishname: "fullNameEn", romaji: "fullNameEn", "\u30ED\u30FC\u30DE\u5B57": "fullNameEn", "\u82F1\u8A9E\u540D": "fullNameEn", "t\u00EAn ti\u1EBFng anh": "fullNameEn",
  jobtitle: "jobTitle", title: "jobTitle", "\u5F79\u8077": "jobTitle", "\u80A9\u66F8": "jobTitle", "\u5F79\u8077\u30FB\u80A9\u66F8": "jobTitle", "ch\u1EE9c v\u1EE5": "jobTitle", "ch\u1EE9c danh": "jobTitle",
  department: "department", "\u90E8\u7F72": "department", "\u6240\u5C5E": "department", "ph\u00F2ng ban": "department", "b\u1ED9 ph\u1EADn": "department",
  email: "email", mail: "email", "e-mail": "email", "\u30E1\u30FC\u30EB": "email", "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9": "email",
  phone: "phone", tel: "phone", "\u96FB\u8A71": "phone", "\u96FB\u8A71\u756A\u53F7": "phone", "s\u1ED1 \u0111i\u1EC7n tho\u1EA1i": "phone", "\u0111i\u1EC7n tho\u1EA1i": "phone",
  mobile: "mobile", cell: "mobile", "\u643A\u5E2F": "mobile", "\u643A\u5E2F\u756A\u53F7": "mobile", "\u643A\u5E2F\u96FB\u8A71": "mobile", "di \u0111\u1ED9ng": "mobile", "s\u1ED1 di \u0111\u1ED9ng": "mobile",
  fax: "fax", website: "website", url: "website", sns: "sns"
};
function normalizeHeader(h) {
  return String(h || "").normalize("NFC").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}
function headerToKey(h) {
  return HEADER_ALIASES[h] || HEADER_ALIASES[h.replace(/[\s_-]/g, "")] || null;
}
/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes "", CR/LF inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
const STORAGE_KEY_PROJECTS = "ai_tools_business_card_projects_v1";
const STORAGE_KEY_ACTIVE_PROJECT_ID = "ai_tools_business_card_active_project_id_v1";
export class StorageService {
  /**
   * Loads all saved projects from LocalStorage
   */
  static getProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error loading projects from storage:", err);
      return [];
    }
  }
  /**
   * Saves or updates a project in LocalStorage
   */
  static saveProject(project) {
    try {
      const projects = this.getProjects();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      const updatedProject = {
        ...project,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existingIdx >= 0) {
        projects[existingIdx] = updatedProject;
      } else {
        projects.unshift(updatedProject);
      }
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT_ID, project.id);
    } catch (err) {
      console.error("Error saving project to storage:", err);
    }
  }
  /**
   * Gets the currently active project
   */
  static getActiveProject() {
    try {
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT_ID);
      const projects = this.getProjects();
      if (!projects.length) return null;
      if (!activeId) return projects[0];
      return projects.find((p) => p.id === activeId) || projects[0];
    } catch {
      return null;
    }
  }
  /**
   * Deletes a project by ID
   */
  static deleteProject(id) {
    try {
      const projects = this.getProjects().filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  }
  /**
   * Generates a new card for a different employee using the same master template design.
   * - Text elements bound to a profile field get the employee's value.
   * - Unbound text (e.g. "TEL: … | MAIL: …") has the master's personal values substituted.
   * - vCard QR codes are regenerated from the employee's profile (never reuse the master's vCard).
   */
  static applyEmployeeProfileToTemplate(templateProject, newProfile) {
    const newId = `card-emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const master = templateProject.profile || {};
    const substitutions = PERSONAL_FIELDS.map((key) => [String(master[key] ?? "").trim(), String(newProfile[key] ?? "").trim()]).filter(([from, to]) => from.length >= 2 && from !== to).sort((a, b) => b[0].length - a[0].length);
    const substitute = (text) => {
      if (typeof text !== "string" || !substitutions.length) return text;
      // Thay theo một lượt để giá trị mới không bị thay tiếp lần nữa
      const pattern = new RegExp(substitutions.map(([from]) => from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
      const map = new Map(substitutions);
      return text.replace(pattern, (m) => map.get(m) ?? m);
    };
    const mapElement = (el) => {
      if (el.type === "text") {
        if (el.fieldBinding) {
          const boundVal = newProfile[el.fieldBinding];
          return { ...el, content: typeof boundVal === "string" ? boundVal : "" };
        }
        return { ...el, content: substitute(el.content) };
      }
      if (el.type === "qr") {
        if (el.qrType === "vcard" || /^BEGIN:VCARD/i.test(String(el.data || ""))) {
          return { ...el, data: QrCodeService.formatVCard(newProfile) };
        }
        for (const key of ["sns", "website"]) {
          if (master[key] && el.data === master[key] && newProfile[key]) {
            return { ...el, data: newProfile[key] };
          }
        }
      }
      return el;
    };
    return {
      ...templateProject,
      id: newId,
      title: `${newProfile.companyName} - ${newProfile.fullName}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      profile: newProfile,
      front: {
        ...templateProject.front,
        elements: templateProject.front.elements.map(mapElement)
      },
      back: {
        ...templateProject.back,
        elements: templateProject.back.elements.map(mapElement)
      }
    };
  }
  /**
   * Parses CSV content into multiple employee profiles.
   * Supports quoted fields (RFC 4180), maps columns by header name (EN/JA/VI);
   * falls back to the legacy positional order when no header is recognised.
   * Personal fields missing in the CSV are left empty (never copied from the master).
   */
  static parseEmployeeCsv(csvText, baseProfile) {
    const rows = parseCsv(String(csvText || "").replace(/^\uFEFF/, "")).filter((r) => r.some((c) => c.trim() !== ""));
    if (rows.length <= 1) return [];
    const header = rows[0].map(normalizeHeader);
    let columnKeys = header.map(headerToKey);
    if (!columnKeys.includes("fullName")) columnKeys = LEGACY_COLUMN_ORDER;
    const profiles = [];
    for (let i = 1; i < rows.length; i++) {
      const record = {};
      rows[i].forEach((cell, idx) => {
        const key = columnKeys[idx];
        if (key) record[key] = cell.trim();
      });
      if (!record.fullName) continue;
      const profile = { ...baseProfile };
      for (const key of PERSONAL_FIELDS) profile[key] = "";
      for (const [key, value] of Object.entries(record)) {
        if (value !== "" || PERSONAL_FIELDS.includes(key)) profile[key] = value;
      }
      profiles.push(profile);
    }
    return profiles;
  }
  /**
   * Decodes CSV bytes: UTF-8 (with/without BOM) first, falls back to Shift_JIS (Excel JP default)
   * when UTF-8 decoding produces replacement characters.
   */
  static decodeCsvBytes(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const utf8 = new TextDecoder("utf-8").decode(bytes);
    if (!utf8.includes("\uFFFD")) return utf8;
    try {
      return new TextDecoder("shift_jis").decode(bytes);
    } catch {
      return utf8;
    }
  }
}
