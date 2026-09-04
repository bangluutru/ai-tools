import React, { useState, useCallback } from 'react';
import {
    FileSpreadsheet, Upload, Download, Sparkles, Plus,
    Trash2, ChevronDown, ChevronUp, AlertCircle, Save, Loader2
} from 'lucide-react';
import { readExcelFile, autoMapFields, exportMappedExcel } from '../utils/excel';
import ZoneEditor from './ZoneEditor';
import { useAntigravityAgent } from '../hooks/useAntigravityAgent';

export default function ExcelMappingView({ t: tProp }) {
    const t = tProp || {};

    // --- STATE ---
    // Source (Customer)
    const [sourceFile, setSourceFile] = useState(null);
    const [sourceHeaders, setSourceHeaders] = useState([]);
    const [sourceData, setSourceData] = useState([]);
    const [sourceAllData, setSourceAllData] = useState([]);

    // Target (Supplier) - 3 Zones
    const [targetFile, setTargetFile] = useState(null);
    const [targetHeaders, setTargetHeaders] = useState([]);
    const [targetBuffer, setTargetBuffer] = useState(null);
    const [headerRowIndex, setHeaderRowIndex] = useState(null);
    const [headerZone, setHeaderZone] = useState([]);       // Zone 1
    const [footerZone, setFooterZone] = useState([]);       // Zone 3
    const [footerStartRow, setFooterStartRow] = useState(null);
    const [existingDataSlots, setExistingDataSlots] = useState(0);
    const [colCount, setColCount] = useState(0);

    // Mapping & Profiles
    const [mappingRules, setMappingRules] = useState([]);
    const [profiles, setProfiles] = useState(() => {
        try {
            const saved = localStorage.getItem('docstudio_mapping_profiles');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [currentProfileName, setCurrentProfileName] = useState('New Profile');
    const [showBottomPanel, setShowBottomPanel] = useState(true);

    // Status
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { execute: executeAutoMap, isLoading: isMappingLoading } = useAntigravityAgent('/map-fields');

    // --- ACTIONS ---
    const handleFileUpload = async (event, isSource) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsProcessing(true);
        setError('');

        try {
            const result = await readExcelFile(file, isSource);
            if (isSource) {
                setSourceFile(file.name);
                setSourceHeaders(result.headers);
                setSourceData(result.sampleRows);
                setSourceAllData(result.allRows);
            } else {
                setTargetFile(file.name);
                setTargetHeaders(result.headers);
                setTargetBuffer(result.rawBuffer);
                setHeaderRowIndex(result.headerRowIndex);
                // Store 3-Zone data
                setHeaderZone(result.headerZone || []);
                setFooterZone(result.footerZone || []);
                setFooterStartRow(result.footerStartRow);
                setExistingDataSlots(result.existingDataSlots || 0);
                setColCount(result.colCount || 0);
            }

            // Auto-map
            if (isSource && targetHeaders.length > 0 && mappingRules.length === 0) {
                setMappingRules(autoMapFields(result.headers, targetHeaders));
            } else if (!isSource && sourceHeaders.length > 0 && mappingRules.length === 0) {
                setMappingRules(autoMapFields(sourceHeaders, result.headers));
            }
        } catch (err) {
            setError(`Error reading file: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutoMap = async () => {
        if (sourceHeaders.length === 0 || targetHeaders.length === 0) {
            setError("Please upload both source and target files first.");
            return;
        }
        setError('');
        
        try {
            const payload = {
                source_headers: sourceHeaders,
                target_headers: targetHeaders,
                sample_data: sourceData.slice(0, 3)
            };

            const result = await executeAutoMap(payload);
            if (result && result.mappings) {
                const combinedRules = targetHeaders.map(targetCol => {
                    const found = result.mappings.find(m => m.target_col === targetCol);
                    return {
                        sourceCol: found ? found.source_col : '',
                        targetCol: targetCol,
                        type: found ? 'auto' : 'unmapped'
                    };
                });
                setMappingRules(combinedRules);
            } else {
                setMappingRules(autoMapFields(sourceHeaders, targetHeaders));
            }
        } catch (err) {
            console.warn("Backend auto-map failed, falling back to local auto-map:", err);
            setMappingRules(autoMapFields(sourceHeaders, targetHeaders));
        }
    };

    const handleExport = async () => {
        if (!sourceFile || !targetFile || mappingRules.length === 0) return;
        setIsProcessing(true);
        setError('');

        try {
            // Build the mapping dictionary { targetCol: sourceCol }
            const mappingDict = {};
            mappingRules.forEach(rule => {
                if (rule.sourceCol && rule.targetCol) {
                    mappingDict[rule.targetCol] = rule.sourceCol;
                }
            });

            // Use all data if available, fallback to sampleData
            const dataToExport = sourceAllData.length > 0 ? sourceAllData : sourceData;

            // Call the 3-Zone export engine
            const outBuffer = await exportMappedExcel({
                rawTargetBuffer: targetBuffer,
                mappingDict,
                sourceData: dataToExport,
                headerRowIndex,
                headerZone,
                footerZone,
                footerStartRow,
                existingDataSlots,
                colCount
            });

            // Download file
            const blob = new Blob([outBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Mapped_${targetFile}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            setError(`Error exporting file: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Callbacks for ZoneEditor cell edits
    const handleHeaderZoneChange = useCallback((cellAddress, newValue) => {
        setHeaderZone(prev => prev.map(row => ({
            ...row,
            cells: row.cells.map(cell =>
                cell.address === cellAddress ? { ...cell, value: newValue } : cell
            )
        })));
    }, []);

    const handleFooterZoneChange = useCallback((cellAddress, newValue) => {
        setFooterZone(prev => prev.map(row => ({
            ...row,
            cells: row.cells.map(cell =>
                cell.address === cellAddress ? { ...cell, value: newValue } : cell
            )
        })));
    }, []);

    // Save profile including 3-Zone configurations
    const saveProfile = () => {
        const name = prompt("Enter Profile Name:", currentProfileName === 'New Profile' ? '' : currentProfileName);
        if (!name) return;

        // Strip bulky raw buffers/formulas, save only structural cell overrides
        const cleanZone = (zone) => zone.map(row => ({
            rowIdx: row.rowIdx,
            cells: row.cells.map(c => ({
                address: c.address,
                // Ensure value is a clean string/number, never serialize [object Object]
                value: typeof c.value === 'object' && c.value !== null
                    ? (c.value.v !== undefined ? c.value.v : '')
                    : (c.value === '[object Object]' ? '' : c.value)
            }))
        }));

        const newProfiles = {
            ...profiles,
            [name]: {
                mappingRules,
                sourceHeaders,
                targetHeaders,
                headerZone: cleanZone(headerZone),
                footerZone: cleanZone(footerZone),
                savedAt: new Date().toISOString()
            }
        };

        setProfiles(newProfiles);
        setCurrentProfileName(name);
        try {
            localStorage.setItem('docstudio_mapping_profiles', JSON.stringify(newProfiles));
        } catch {
            // storage may be full
        }
    };

    const loadProfile = (name) => {
        const profile = profiles[name];
        if (!profile) return;
        setCurrentProfileName(name);
        setMappingRules(profile.mappingRules || []);

        // Sanitize zone data: clean [object Object] from old cached profiles
        const sanitizeZone = (zone) => {
            if (!zone) return zone;
            return zone.map(row => ({
                ...row,
                cells: row.cells.map(cell => ({
                    ...cell,
                    value: cell.value === '[object Object]' ? '' : cell.value
                }))
            }));
        };
        if (profile.headerZone) setHeaderZone(sanitizeZone(profile.headerZone));
        if (profile.footerZone) setFooterZone(sanitizeZone(profile.footerZone));
    };

    const removeRule = (index) => {
        const newRules = [...mappingRules];
        newRules.splice(index, 1);
        setMappingRules(newRules);
    };

    const addEmptyRule = () => {
        setMappingRules([...mappingRules, { sourceCol: '', targetCol: '', type: 'manual' }]);
        setShowBottomPanel(true);
    };

    const updateRule = (index, field, value) => {
        const newRules = [...mappingRules];
        newRules[index][field] = value;
        if (field === 'sourceCol' || field === 'targetCol') newRules[index].type = 'manual';
        setMappingRules(newRules);
    };

    // --- Helpers ---
    const getSourceStatus = (header) => {
        const rule = mappingRules.find(r => r.sourceCol === header);
        if (!rule) return 'unmapped';
        return rule.type === 'auto' ? 'auto' : 'manual';
    };

    const getTargetValue = (rowIndex, targetHeader) => {
        const rule = mappingRules.find(r => r.targetCol === targetHeader);
        if (!rule || !rule.sourceCol) return '';
        return sourceData[rowIndex]?.[rule.sourceCol] || '';
    };

    const statusColors = {
        auto: 'bg-secondary',
        manual: 'bg-tertiary',
        unmapped: 'bg-error'
    };
    const bgColors = {
        auto: 'bg-secondary-container/20 text-secondary border-secondary/30',
        manual: 'bg-tertiary-container/20 text-tertiary border-tertiary/30',
        unmapped: 'bg-error-container/20 border-error/30 text-error border-dashed'
    };

    // --- UI RENDER ---
    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[38rem] w-full rounded-xl border border-border-subtle/40 bg-surface-container font-body-md overflow-hidden text-on-surface shadow-sm">

            {/* 1. TOP BAR */}
            <header className="h-14 shrink-0 bg-surface-container-high border-b border-border-subtle/40 text-on-surface flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary-container" />
                    <h1 className="font-title-sm text-title-sm tracking-tight text-on-surface font-semibold">
                        {t.tabExcelMapping || 'Excel Order Mapping'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-body-sm flex items-center gap-2">
                        <span className="text-on-surface-variant">Profile:</span>
                        <select
                            className="bg-surface-container-low border border-border-subtle rounded-lg px-2.5 py-1 text-xs outline-none text-on-surface cursor-pointer"
                            value={currentProfileName}
                            onChange={(e) => {
                                if (e.target.value !== 'New Profile') loadProfile(e.target.value);
                                else { setCurrentProfileName('New Profile'); setMappingRules([]); }
                            }}
                        >
                            <option value="New Profile">-- {t.mappingNew || 'New Profile'} --</option>
                            {Object.keys(profiles).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={!sourceFile || !targetFile || mappingRules.length === 0 || isProcessing}
                        className="flex items-center gap-2 bg-brand-emerald-deep hover:bg-secondary-container text-white px-4 py-1.5 rounded-lg font-title-sm text-title-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        {isProcessing ? 'Processing...' : (t.exportXlsx || 'Tải xuống .xlsx')}
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-error-container/20 text-error p-2 text-center text-body-sm font-medium border-b border-error/30 flex items-center justify-center gap-2 shrink-0">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* 2. MAIN AREA (Split View) */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* LEFT COLUMN: SOURCE */}
                <section className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="bg-surface-container-low rounded-xl shadow-sm border border-border-subtle/40 flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-border-subtle/40 bg-surface-container flex items-center justify-between shrink-0">
                            <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">{t.sourceCustomer || 'Nguồn: Đơn hàng Khách'}</h2>
                            <label className="cursor-pointer">
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-2 ${sourceFile ? 'bg-primary-container/15 border-primary-container/40 text-brand-cyan-bright font-semibold' : 'hover:bg-surface-subtle border-border-subtle text-on-surface-variant'}`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    {sourceFile ? `${sourceFile} ✓` : 'Upload File'}
                                </div>
                            </label>
                        </div>

                        <div className="flex-1 overflow-auto p-3">
                            {sourceHeaders.length > 0 ? (
                                <table className="w-full text-xs text-left border-collapse font-body-sm">
                                    <thead className="bg-surface-container-high sticky top-0 z-10 shadow-sm backdrop-blur">
                                        <tr>
                                            {sourceHeaders.map((header, i) => (
                                                <th key={i} className="py-2 px-2 border-b border-border-subtle/40 font-semibold text-on-surface whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        {header}
                                                        <div className={`w-2 h-2 rounded-full ${statusColors[getSourceStatus(header)]}`} />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-subtle/20">
                                        {sourceData.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-surface-container/50 border-b border-border-subtle/20 transition-colors">
                                                {sourceHeaders.map((header, colIdx) => (
                                                    <td key={colIdx} className={`py-1.5 px-2 truncate max-w-[130px] border-l-2 ${getSourceStatus(header) === 'auto' ? 'border-secondary' : getSourceStatus(header) === 'manual' ? 'border-tertiary' : 'border-transparent'}`}>
                                                        {row[header] !== undefined ? String(row[header]) : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex items-center justify-center text-outline text-body-sm">Upload đơn hàng để xem preview</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* CENTER SMART DIVIDER */}
                <div className="w-20 shrink-0 flex flex-col items-center justify-center z-10">
                    <div className="flex-1 w-px bg-border-subtle/40 my-4" />
                    <button
                        type="button"
                        onClick={handleAutoMap}
                        disabled={!sourceFile || !targetFile || isProcessing || isMappingLoading}
                        className="bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container rounded-full p-3 shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group cursor-pointer"
                        title={t.autoMapBtn || 'AI Auto-Map'}
                    >
                        {isMappingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 animate-pulse group-hover:animate-none" />}
                    </button>
                    <div className="text-[10px] font-bold tracking-wider text-brand-cyan-bright mt-2 uppercase font-mono">Auto-map</div>
                    <div className="flex-1 w-px bg-border-subtle/40 my-4" />
                </div>

                {/* RIGHT COLUMN: TARGET with 3-Zone Layout */}
                <section className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="bg-surface-container-low rounded-xl shadow-sm border border-border-subtle/40 flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-border-subtle/40 bg-surface-container flex items-center justify-between shrink-0">
                            <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">{t.targetSupplier || 'Đích: Mẫu Nhà cung cấp'}</h2>
                            <label className="cursor-pointer">
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, false)} />
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors flex items-center gap-2 ${targetFile ? 'bg-primary-container/15 border-primary-container/40 text-brand-cyan-bright font-semibold' : 'hover:bg-surface-subtle border-border-subtle text-on-surface-variant'}`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    {targetFile ? `${targetFile} ✓` : 'Upload Template'}
                                </div>
                            </label>
                        </div>

                        <div className="flex-1 overflow-auto p-3">
                            {targetHeaders.length > 0 ? (
                                <div className="space-y-2">
                                    {/* ZONE 1: Editable Header */}
                                    <ZoneEditor
                                        zone={headerZone}
                                        onCellChange={handleHeaderZoneChange}
                                        title="Thông tin đầu mẫu (Header)"
                                        icon={<ChevronUp className="w-3 h-3 text-primary-container" />}
                                    />

                                    {/* ZONE 2: Product Data Table */}
                                    <div className="bg-surface-container-high rounded-lg border border-secondary/30 overflow-hidden">
                                        <div className="px-3 py-2 bg-secondary-container/15 border-b border-secondary/30 rounded-t-lg">
                                            <span className="text-xs font-bold text-secondary uppercase tracking-wider font-mono">
                                                📦 Bảng sản phẩm ({sourceData.length} sản phẩm)
                                            </span>
                                        </div>
                                        <table className="w-full text-xs text-left border-collapse font-body-sm">
                                            <thead className="bg-surface-container-low/80">
                                                <tr>
                                                    <th className="py-1.5 px-2 border-b border-border-subtle/40 font-semibold text-outline whitespace-nowrap text-center w-12">Row</th>
                                                    {targetHeaders.map((header, i) => (
                                                        <th key={i} className="py-1.5 px-2 border-b border-border-subtle/40 font-semibold text-on-surface whitespace-nowrap">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle/20">
                                                {sourceData.length > 0 ? sourceData.map((_, rowIdx) => (
                                                    <tr key={rowIdx} className="border-b border-border-subtle/20">
                                                        <td className="py-1 px-2 text-center text-[10px] font-mono text-outline bg-surface-container border-r border-border-subtle/30">
                                                            {headerRowIndex !== null ? headerRowIndex + 2 + rowIdx : rowIdx + 1}
                                                        </td>
                                                        {targetHeaders.map((header, colIdx) => {
                                                            const val = getTargetValue(rowIdx, header);
                                                            const isMapped = val !== '';
                                                            return (
                                                                <td key={colIdx} className="py-1 px-2 truncate max-w-[120px]">
                                                                    <div className={`px-1.5 py-0.5 rounded text-xs min-h-[22px] ${isMapped ? 'bg-secondary-container/20 text-secondary border border-secondary/30' : 'bg-surface-container text-outline border border-dashed border-border-subtle/40'}`}>
                                                                        {val || '—'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={targetHeaders.length} className="py-3 text-center text-outline italic text-xs">
                                                            Upload đơn khách để xem sản phẩm
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ZONE 3: Editable Footer */}
                                    <ZoneEditor
                                        zone={footerZone}
                                        onCellChange={handleFooterZoneChange}
                                        title="Thông tin cuối mẫu (Footer)"
                                        icon={<ChevronDown className="w-3 h-3 text-tertiary" />}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-outline text-body-sm">Upload mẫu NCC để xem 3 vùng</div>
                            )}
                        </div>
                    </div>
                </section>

            </main>

            {/* 3. BOTTOM PANEL: MAPPING RULES */}
            <footer className={`bg-surface-container-high/90 backdrop-blur border-t border-border-subtle/40 transition-all duration-300 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 ${showBottomPanel ? 'h-44' : 'h-11'}`}>

                <div className="h-11 px-6 flex items-center justify-between border-b border-border-subtle/30">
                    <button
                        type="button"
                        onClick={() => setShowBottomPanel(!showBottomPanel)}
                        className="flex items-center gap-2 font-bold text-on-surface hover:text-primary focus:outline-none text-body-sm cursor-pointer"
                    >
                        <span>{t.fieldMappingRules || 'Quy tắc khớp trường (Rules)'}</span>
                        <div className="bg-surface-subtle p-1 rounded-full text-on-surface-variant">
                            {showBottomPanel ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                        </div>
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={addEmptyRule}
                            className="text-xs font-medium text-on-surface hover:text-primary flex items-center gap-1 border border-border-subtle bg-surface-container px-3 py-1 rounded-lg shadow-sm hover:border-primary-container cursor-pointer transition"
                        >
                            <Plus size={12} /> {t.addRule || '+ Thêm Rule'}
                        </button>
                        <button
                            type="button"
                            onClick={saveProfile}
                            className="text-xs font-medium text-on-surface hover:bg-surface-container-high flex items-center gap-1 border border-border-subtle bg-surface-subtle px-3 py-1 rounded-lg shadow-sm cursor-pointer transition"
                        >
                            <Save size={12} /> {t.saveProfile || 'Lưu Profile'}
                        </button>
                    </div>
                </div>

                {showBottomPanel && (
                    <div className="p-3 h-[132px] overflow-y-auto">
                        {mappingRules.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-outline text-xs">Chưa có quy tắc. Bấm &quot;Auto-Map&quot; hoặc &quot;+ Thêm Rule&quot;.</div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-start">
                                {mappingRules.map((rule, idx) => (
                                    <div key={idx} className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-container/40 ${bgColors[rule.type] || bgColors.manual}`}>

                                        <select
                                            className="bg-transparent border-none outline-none text-xs font-medium appearance-none cursor-pointer text-inherit max-w-[110px] truncate"
                                            value={rule.sourceCol}
                                            onChange={(e) => updateRule(idx, 'sourceCol', e.target.value)}
                                        >
                                            <option value="" className="bg-surface-container text-on-surface">-- Source --</option>
                                            {sourceHeaders.map(h => <option key={h} value={h} className="bg-surface-container text-on-surface">{h}</option>)}
                                        </select>

                                        <span className="text-inherit opacity-60 text-xs">→</span>

                                        <select
                                            className="bg-transparent border-none outline-none text-xs font-medium appearance-none cursor-pointer text-inherit max-w-[110px] truncate"
                                            value={rule.targetCol}
                                            onChange={(e) => updateRule(idx, 'targetCol', e.target.value)}
                                        >
                                            <option value="" className="bg-surface-container text-on-surface">-- Target --</option>
                                            {targetHeaders.map(h => <option key={h} value={h} className="bg-surface-container text-on-surface">{h}</option>)}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => removeRule(idx)}
                                            className="opacity-0 group-hover:opacity-100 ml-1 text-error hover:bg-surface-container rounded p-0.5 transition-all cursor-pointer"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </footer>

        </div>
    );
}
