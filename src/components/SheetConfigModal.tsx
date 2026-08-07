import React, { useState } from 'react';
import { SheetConfig } from '../types';
import { X, FileSpreadsheet, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, FileDown, HelpCircle, Copy, Check } from 'lucide-react';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  onSaveSheetUrl: (url: string) => Promise<void>;
  onResetDefault: () => Promise<void>;
  isLoading: boolean;
}

export const SheetConfigModal: React.FC<SheetConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveSheetUrl,
  onResetDefault,
  isLoading,
}) => {
  const [urlInput, setUrlInput] = useState(config.sheetUrl || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!urlInput.trim()) {
      setErrorMsg('กรุณากรอกลิงก์ Google Sheet');
      return;
    }

    try {
      await onSaveSheetUrl(urlInput.trim());
      setSuccessMsg('เชื่อมต่อข้อมูลจาก Google Sheet สำเร็จแล้ว!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเชื่อมต่อ Google Sheet ได้');
    }
  };

  const handleReset = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    await onResetDefault();
    setUrlInput(config.sheetUrl);
    setSuccessMsg('สลับกลับมาใช้ชุดข้อมูลตัวอย่างมาตรฐานเรียบร้อย');
  };

  const sampleCsvUrl = '/api/sheets/sample-csv';

  const sampleSheetUrlDemo = 'https://docs.google.com/spreadsheets/d/1HousingAllowanceSample2026/edit#gid=0';

  const copySampleLink = () => {
    navigator.clipboard.writeText(sampleSheetUrlDemo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">ตั้งค่าการเชื่อมต่อ Google Sheets แบบเรียลไทม์</h3>
              <p className="text-xs text-slate-400">ใส่ลิงก์ Google Sheet เพื่อดึงข้อมูลประวัติการเบิกสดเข้าสู่ระบบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Current Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            config.isCustom
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-slate-800/60 border-slate-700 text-slate-300'
          }`}>
            <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${config.isCustom ? 'text-emerald-400' : 'text-teal-400'}`} />
            <div className="text-sm">
              <div className="font-semibold flex items-center gap-2">
                <span>สถานะปัจจุบัน: {config.isCustom ? 'เชื่อมต่อ Google Sheet ของคุณอยู่' : 'ใช้งานชุดข้อมูลตัวอย่างมาตรฐาน (Demo Data)'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ซิงค์ล่าสุด: {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString('th-TH') : 'ยังไม่ได้ซิงค์'}
              </p>
            </div>
          </div>

          {/* Form to enter Google Sheet URL */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                ลิงก์ Google Sheet (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                <a
                  href={urlInput || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  title="เปิดลิงก์ในหน้าใหม่"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
              >
                สลับใช้ข้อมูลตัวอย่าง
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังทดสอบและดึงข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>เชื่อมต่อ & ดึงข้อมูลสด</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Guide section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>ขั้นตอนเตรียม Google Sheet เพื่อให้เชื่อมต่อได้สำเร็จ</span>
            </h4>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4">
              <li>
                สร้าง Google Sheet และใส่หัวตารางดังนี้: <code className="text-emerald-300 font-mono">รหัสพนักงาน, ชื่อ, นามสกุล, วันที่โอนให้, รายการสวัสดิการ, ไซส์งาน, จำนวนเงิน, สถานะการนำส่งบิล</code>
              </li>
              <li>
                ไปที่ปุ่ม <strong className="text-slate-200">แชร์ (Share)</strong> มุมขวาบนของ Google Sheet -&gt; เปลี่ยนเป็น <strong className="text-emerald-300">"ทุกคนที่มีลิงก์ (Anyone with link)"</strong> ให้สิทธิ์อ่านข้อมูล
              </li>
              <li>
                หรือไปที่เมนู <strong className="text-slate-200">ไฟล์ (File) -&gt; แชร์ (Share) -&gt; เผยแพร่ไปยังเว็บ (Publish to Web)</strong> แล้วเลือกส่งออกเป็น <strong className="text-emerald-300">CSV</strong>
              </li>
            </ol>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={sampleCsvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์แม่แบบ CSV สำหรับนำไปอัปโหลดเข้า Google Sheet</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
