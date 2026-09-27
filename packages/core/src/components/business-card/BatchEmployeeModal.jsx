import { useState, useRef } from "react";
import {
  X,
  Users,
  Upload,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet
} from "lucide-react";
import { StorageService } from "../../utils/business-card/storage.js";
import { BusinessCardPdfExporter } from "../../utils/business-card/pdfExporter.js";
import { QrCodeService } from "../../utils/business-card/qrGenerator.js";
import { downloadBlob } from "../../utils/business-card/zipPackager.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const BatchEmployeeModal = ({
  isOpen,
  onClose,
  masterProject
}) => {
  const { t, language } = useLanguage();
  const csvInputRef = useRef(null);
  // Bắt đầu chỉ với hồ sơ master; không chèn nhân viên mẫu giả.
  // Parent chỉ mount modal khi mở nên state luôn khởi tạo lại từ hồ sơ hiện tại.
  const [employees, setEmployees] = useState(() => [masterProject.profile]);
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [batchMessage, setBatchMessage] = useState(null);
  if (!isOpen) return null;
  const placeholderQrCount = [...masterProject.front.elements, ...(masterProject.isDoubleSided ? masterProject.back.elements : [])].filter((el) => el.type === "qr" && el.qrType !== "vcard" && QrCodeService.isPlaceholderData(el.data)).length;
  const blankEmployee = () => {
    const emp = { ...masterProject.profile };
    for (const key of ["fullName", "fullNameKana", "fullNameEn", "jobTitle", "department", "email", "mobile"]) emp[key] = "";
    return emp;
  };
  const handleAddRow = () => {
    setEmployees([...employees, blankEmployee()]);
  };
  const handleRemoveRow = (idx) => {
    setEmployees(employees.filter((_, i) => i !== idx));
  };
  const handleUpdateEmp = (idx, key, val) => {
    const updated = [...employees];
    updated[idx] = {
      ...updated[idx],
      [key]: val
    };
    setEmployees(updated);
  };
  const handleDownloadSampleCsv = () => {
    const header = "fullName,fullNameKana,fullNameEn,jobTitle,department,email,phone,mobile\r\n";
    const p = masterProject.profile;
    const cell = (v) => {
      const s2 = String(v ?? "");
      return /[",\r\n]/.test(s2) ? `"${s2.replace(/"/g, '""')}"` : s2;
    };
    const row1 = [p.fullName, p.fullNameKana, p.fullNameEn, p.jobTitle, p.department, p.email, p.phone, p.mobile].map(cell).join(",") + "\r\n";
    const blob = new Blob(["\uFEFF" + header + row1], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "business_card_employees_template.csv");
  };
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = StorageService.decodeCsvBytes(await file.arrayBuffer());
      const parsed = StorageService.parseEmployeeCsv(text, masterProject.profile);
      if (parsed.length > 0) {
        setEmployees(parsed);
        setBatchMessage({ type: "ok", text: t("batchCsvImported").replace("{count}", String(parsed.length)) });
      } else {
        setBatchMessage({ type: "error", text: t("batchCsvEmpty") });
      }
    } catch (err) {
      console.error("CSV import failed:", err);
      setBatchMessage({ type: "error", text: t("batchCsvEmpty") });
    }
  };
  const handleExportBatchPdf = async () => {
    const valid = employees.filter((emp) => String(emp.fullName || "").trim());
    if (!valid.length) {
      setBatchMessage({ type: "error", text: t("batchNoNames") });
      return;
    }
    setIsExportingBatch(true);
    setBatchMessage(null);
    setExportProgress(t("batchRendering"));
    try {
      const projects = valid.map((emp) => StorageService.applyEmployeeProfileToTemplate(masterProject, emp));
      const doc = await BusinessCardPdfExporter.generateBatchPdf(projects, { mode: "tonbo" }, (i, n) => {
        setExportProgress(`${t("batchRendering")} (${i} / ${n})`);
      });
      const baseName = (masterProject.profile.companyName || "company").replace(/[\\/:*?"<>|]+/g, "_");
      downloadBlob(doc.output("blob"), `${baseName}_batch_${projects.length}.pdf`);
      setBatchMessage({ type: "ok", text: t("batchExported").replace("{count}", String(projects.length)) });
    } catch (err) {
      console.error("Batch export failed:", err);
      setBatchMessage({ type: "error", text: t("exportFailedMsg") });
    } finally {
      setIsExportingBatch(false);
      setExportProgress("");
    }
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-high rounded-3xl max-w-4xl w-full border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {
    /* Modal Header */
  }
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("batchTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t("batchSub")}
              </p>
            </div>
          </div>

          <button
    id="btn-close-batch"
    onClick={onClose}
    className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-subtle transition-colors"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Toolbar Controls */
  }
        <div className="p-4 bg-surface-container-high border-b border-border-subtle/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <input
    type="file"
    ref={csvInputRef}
    onChange={handleCsvUpload}
    accept=".csv,text/csv"
    className="hidden"
  />
            <button
    onClick={() => csvInputRef.current?.click()}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-subtle text-on-surface-variant font-medium transition-colors"
  >
              <Upload className="w-3.5 h-3.5" />
              <span>{t("btnImportCsv")}</span>
            </button>

            <button
    onClick={handleDownloadSampleCsv}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle transition-colors"
  >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("btnDownloadTemplateCsv")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
    onClick={handleAddRow}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-brand-100 font-bold border border-primary/30 transition-colors"
  >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("btnAddRow")}</span>
            </button>

            <button
    onClick={handleExportBatchPdf}
    disabled={isExportingBatch || employees.length === 0}
    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-container hover:bg-brand-700 text-white font-bold shadow-sm shadow-brand-500/20 disabled:opacity-50 transition-all"
  >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingBatch ? exportProgress : `${t("btnExportBatchPdf")} (${employees.length})`}</span>
            </button>
          </div>
        </div>

        {
    /* Employees Table */
  }
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <p className="text-[11px] text-on-surface-variant">{t("batchVcardNote")}</p>
          {placeholderQrCount > 0 && <div role="alert" className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs">
              {t("batchPlaceholderQrWarn")}
            </div>}
          {batchMessage && <div role={batchMessage.type === "error" ? "alert" : "status"} className={`p-3 rounded-lg text-xs border ${batchMessage.type === "error" ? "bg-error/10 border-error/30 text-error" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"}`}>
              {batchMessage.text}
            </div>}
          <div className="border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-canvas text-on-surface-variant font-bold border-b border-border-subtle">
                <tr>
                  <th className="p-2.5 w-10 text-center">{t("colNumber")}</th>
                  <th className="p-2.5">{t("colName")}</th>
                  <th className="p-2.5">{t("colNameEn")}</th>
                  <th className="p-2.5">{t("colJobTitle")}</th>
                  <th className="p-2.5">{t("colEmail")}</th>
                  <th className="p-2.5">{t("colPhone")}</th>
                  <th className="p-2.5 w-12 text-center">{t("colDelete")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {employees.map((emp, idx) => <tr key={idx} className="hover:bg-surface-canvas/80">
                    <td className="p-2 text-center text-outline font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={emp.fullName}
                        onChange={(e) => handleUpdateEmp(idx, "fullName", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border-subtle bg-surface-canvas text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={emp.fullNameEn || ""}
                        onChange={(e) => handleUpdateEmp(idx, "fullNameEn", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border-subtle bg-surface-canvas text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={emp.jobTitle}
                        onChange={(e) => handleUpdateEmp(idx, "jobTitle", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border-subtle bg-surface-canvas text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="email"
                        value={emp.email}
                        onChange={(e) => handleUpdateEmp(idx, "email", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border-subtle bg-surface-canvas text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={emp.phone}
                        onChange={(e) => handleUpdateEmp(idx, "phone", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border-subtle bg-surface-canvas text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        disabled={employees.length <= 1}
                        className="p-1 rounded text-outline hover:text-error transition-colors disabled:opacity-30 cursor-pointer"
                        title={t("colDelete")}
                        aria-label={t("colDelete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-surface-canvas flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">
            {t("totalStaff")} <span className="font-bold text-on-surface">{employees.length} {language === "vi" ? "người" : language === "en" ? "members" : "名"}</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-surface-container-highest hover:bg-surface-subtle border border-border-strong text-on-surface transition-colors cursor-pointer"
          >
            {t("btnClose")}
          </button>
        </div>
      </div>
    </div>;
};
