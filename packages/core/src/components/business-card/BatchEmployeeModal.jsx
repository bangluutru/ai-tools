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
import { jsPDF } from "jspdf";
import { StorageService } from "../../utils/business-card/storage.js";
import { BusinessCardPdfExporter } from "../../utils/business-card/pdfExporter.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const BatchEmployeeModal = ({
  isOpen,
  onClose,
  masterProject
}) => {
  const { t, language } = useLanguage();
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState([
    masterProject.profile,
    {
      ...masterProject.profile,
      fullName: "\u9234\u6728 \u4E00\u90CE",
      fullNameKana: "\u3059\u305A\u304D \u3044\u3061\u308D\u3046",
      fullNameEn: "Ichiro Suzuki",
      jobTitle: "\u5C02\u52D9\u53D6\u7DE0\u5F79 COO",
      email: "i.suzuki@sample-corp.co.jp",
      phone: "03-5555-0199"
    },
    {
      ...masterProject.profile,
      fullName: "\u9AD8\u6A4B \u5948\u3005",
      fullNameKana: "\u305F\u304B\u306F\u3057 \u306A\u306A",
      fullNameEn: "Nana Takahashi",
      jobTitle: "\u30C7\u30B6\u30A4\u30F3\u7D71\u62EC \u30C7\u30A3\u30EC\u30AF\u30BF\u30FC",
      email: "n.takahashi@sample-corp.co.jp",
      phone: "03-5555-0199"
    }
  ]);
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  if (!isOpen) return null;
  const handleAddRow = () => {
    setEmployees([
      ...employees,
      {
        ...masterProject.profile,
        fullName: "\u65B0\u898F \u793E\u54E1\u6C0F\u540D",
        fullNameKana: "\u3057\u3093\u304D \u3057\u3083\u3044\u3093",
        fullNameEn: "New Employee",
        jobTitle: "\u55B6\u696D\u90E8 \u30A2\u30BD\u30B7\u30A8\u30A4\u30C8",
        email: "employee@sample.co.jp"
      }
    ]);
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
    const header = "fullName,fullNameKana,fullNameEn,jobTitle,department,email,phone,mobile\n";
    const row1 = "\u7530\u4E2D \u5065\u4E8C,\u305F\u306A\u304B \u3051\u3093\u3058,Kenji Tanaka,\u4EE3\u8868\u53D6\u7DE0\u5F79 CEO,\u7D4C\u55B6\u4F01\u753B\u672C\u90E8,k.tanaka@sample.jp,03-5555-0199,090-1234-5678\n";
    const row2 = "\u9234\u6728 \u4E00\u90CE,\u3059\u305A\u304D \u3044\u3061\u308D\u3046,Ichiro Suzuki,\u5C02\u52D9\u53D6\u7DE0\u5F79 COO,\u4E8B\u696D\u958B\u767A\u90E8,i.suzuki@sample.jp,03-5555-0199,080-9876-5432\n";
    const row3 = "\u9AD8\u6A4B \u5948\u3005,\u305F\u304B\u306F\u3057 \u306A\u306A,Nana Takahashi,\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u30C7\u30A3\u30EC\u30AF\u30BF\u30FC,\u30C7\u30B6\u30A4\u30F3\u90E8,n.takahashi@sample.jp,03-5555-0199,070-1122-3344\n";
    const blob = new Blob(["\uFEFF" + header + row1 + row2 + row3], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meishi_employee_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const parsed = StorageService.parseEmployeeCsv(text, masterProject.profile);
      if (parsed.length > 0) {
        setEmployees(parsed);
      }
    };
    reader.readAsText(file);
  };
  const handleExportBatchPdf = async () => {
    setIsExportingBatch(true);
    setExportProgress("Rendering...");
    try {
      const dim = masterProject.dimension;
      const isHoriz = masterProject.orientation === "horizontal";
      const rawW = isHoriz ? dim.widthMm : dim.heightMm;
      const rawH = isHoriz ? dim.heightMm : dim.widthMm;
      const bleed = dim.bleedMm;
      const totalW = rawW + bleed * 2;
      const totalH = rawH + bleed * 2;
      const batchDoc = new jsPDF({
        orientation: isHoriz ? "landscape" : "portrait",
        unit: "mm",
        format: [totalW, totalH],
        compress: true
      });
      for (let i = 0; i < employees.length; i++) {
        setExportProgress(`Rendering (${i + 1} / ${employees.length})...`);
        const emp = employees[i];
        const empProject = StorageService.applyEmployeeProfileToTemplate(masterProject, emp);
        if (i > 0) {
          batchDoc.addPage([totalW, totalH], isHoriz ? "landscape" : "portrait");
        }
        const frontCanvas = await BusinessCardPdfExporter.renderSideToCanvas(empProject.front, empProject, {
          includeBleed: true,
          scale: 3.125
        });
        batchDoc.addImage(frontCanvas.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, totalW, totalH);
        if (empProject.isDoubleSided) {
          batchDoc.addPage([totalW, totalH], isHoriz ? "landscape" : "portrait");
          const backCanvas = await BusinessCardPdfExporter.renderSideToCanvas(empProject.back, empProject, {
            includeBleed: true,
            scale: 3.125
          });
          batchDoc.addImage(backCanvas.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, totalW, totalH);
        }
      }
      batchDoc.save(`${masterProject.profile.companyName || "Company"}_Batch_PDF_${employees.length}.pdf`);
    } catch (err) {
      console.error("Batch export failed:", err);
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
    accept=".csv"
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
        <div className="p-4 flex-1 overflow-y-auto">
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
    className="w-full px-2 py-1 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary"
  />
                    </td>
                    <td className="p-2">
                      <input
    type="text"
    value={emp.fullNameEn || ""}
    onChange={(e) => handleUpdateEmp(idx, "fullNameEn", e.target.value)}
    className="w-full px-2 py-1 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary"
  />
                    </td>
                    <td className="p-2">
                      <input
    type="text"
    value={emp.jobTitle}
    onChange={(e) => handleUpdateEmp(idx, "jobTitle", e.target.value)}
    className="w-full px-2 py-1 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary"
  />
                    </td>
                    <td className="p-2">
                      <input
    type="email"
    value={emp.email}
    onChange={(e) => handleUpdateEmp(idx, "email", e.target.value)}
    className="w-full px-2 py-1 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary"
  />
                    </td>
                    <td className="p-2">
                      <input
    type="text"
    value={emp.phone}
    onChange={(e) => handleUpdateEmp(idx, "phone", e.target.value)}
    className="w-full px-2 py-1 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary"
  />
                    </td>
                    <td className="p-2 text-center">
                      <button
    onClick={() => handleRemoveRow(idx)}
    disabled={employees.length <= 1}
    className="text-outline hover:text-red-600 disabled:opacity-20 p-1"
  >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {
    /* Modal Footer */
  }
        <div className="px-6 py-3 border-t border-border-subtle bg-surface-canvas flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">
            {t("totalStaff")} <span className="font-bold text-on-surface">{employees.length} {language === "vi" ? "ng\u01B0\u1EDDi" : language === "en" ? "members" : "\u540D"}</span>
          </span>
          <button
    onClick={onClose}
    className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
  >
            {t("btnClose")}
          </button>
        </div>
      </div>
    </div>;
};
