import React, { useState } from 'react';
import { SheetConfig, HousingAllowanceRecord } from '../types';
import { syncCustomSheetUrl, resetSheetData } from '../services/sheetsService';
import {
  X, FileSpreadsheet, Link2, Download, RefreshCw, CheckCircle2, AlertCircle, HelpCircle, FileText, Upload
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  totalRecordsCount: number;
  onSyncSuccess: (config: SheetConfig, records: HousingAllowanceRecord[]) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  totalRecordsCount,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'csv' | 'help'>('url');
  const [sheetUrlInput, setSheetUrlInput] = useState(config.sheetUrl || '');
  const [csvTextInput, setCsvTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!sheetUrlInput.trim()) {
      setErrorMsg('กรุณากรอก URL ลิงก์ Google Sheet');
      return;
    }

    setIsLoading(true);
    const res = await syncCustomSheetUrl(sheetUrlInput.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`ดึงข้อมูลจาก Google Sheet สำเร็จ! โหลดแล้ว ${res.records.length} รายการ`);
      onSyncSuccess(res.config, res.records);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.message || 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบสิทธิ์การแชร์ของ Google Sheet');
    }
  };

  const handleSyncCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!csvTextInput.trim()) {
      setErrorMsg('กรุณาวางเนื้อหาข้อความ CSV');
      return;
    }

    setIsLoading(true);
    const res = await syncCustomSheetUrl('', csvTextInput.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`ประมวลผลข้อมูล CSV สำเร็จ! โหลดแล้ว ${res.records.length} รายการ`);
      onSyncSuccess(res.config, res.records);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.message || 'โครงสร้าง CSV ไม่ถูกต้อง');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvTextInput(text);
          setActiveTab('csv');
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?')) {
      setIsLoading(true);
      const res = await resetSheetData();
      setIsLoading(false);
      onSyncSuccess(res.config, res.records);
      setSuccessMsg('รีเซ็ตข้อมูลเป็นชุดตัวอย่างเรียบร้อย');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-xl w-full text-slate-700 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">เชื่อมต่อดึงข้อมูล Google Sheet</h3>
              <p className="text-xs text-slate-500">เชื่อมต่อตารางข้อมูลสวัสดิการค่าที่พักพนักงานแบบเรียลไทม์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">สถานะปัจจุบัน:</span>
            <strong className="text-slate-900">
              {config.isCustom ? 'เชื่อมต่อ Google Sheet ของคุณแล้ว' : 'ใช้ข้อมูลตัวอย่างระบบ'}
            </strong>
          </div>
          <div className="font-mono text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-semibold">
            {totalRecordsCount} รายการ
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4 text-sky-600" />
            <span>เชื่อมด้วย URL Google Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'csv'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>วางข้อความ / อัปโหลด CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'help'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>วิธีเปิดสิทธิ์แชร์</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: URL input */}
          {activeTab === 'url' && (
            <form onSubmit={handleSyncUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
                  ลิงก์ URL จาก Google Sheet ของท่าน
                </label>
                <input
                  type="url"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs text-[#FFFFFF] placeholder-[#7FA1B6]/50 focus:outline-none focus:border-[#7FA1B6]"
                />
                <p className="text-[11px] text-[#7FA1B6] mt-1">
                  * ต้องเปิดสิทธิ์ให้ "ทุกคนที่มีลิงก์สามารถดูได้" (Anyone with the link can view)
                </p>
              </div>

              <div className="bg-[#103042] p-3.5 rounded-2xl border border-[#7FA1B6]/30 text-xs space-y-1.5">
                <div className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7FA1B6]" />
                  <span>รองรับหัวตาราง (Headers) อัตโนมัติ:</span>
                </div>
                <p className="text-[#D3D1C6] text-[11px] leading-relaxed font-mono">
                  วันที่โอน, รายการ, รหัสพนักงาน, ผู้เบิก(ชื่อพนักงาน), เลขทะเบียนรถ(บางรายการที่เบิกค่าน้ำมัน), ไซต์งาน, จำนวนเงินที่โอน, สถานะบิล
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href="/api/sheets/sample-csv"
                  download="housing_allowance_template.csv"
                  className="px-3.5 py-2 rounded-xl bg-[#0c2331] hover:bg-[#103042] text-[#7FA1B6] hover:text-[#FFFFFF] border border-[#7FA1B6]/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>โหลดแม่แบบ CSV</span>
                </a>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#103042] hover:bg-[#13384D] text-[#FFFFFF] border border-[#7FA1B6]/60 font-semibold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#7FA1B6] ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูล Google Sheet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Paste CSV */}
          {activeTab === 'csv' && (
            <form onSubmit={handleSyncCsv} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#FFFFFF]">
                    วางข้อความ CSV หรือ เลือกไฟล์ CSV จากคอมพิวเตอร์
                  </label>
                  <label className="text-xs text-[#7FA1B6] hover:text-[#FFFFFF] cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์ .csv</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={csvTextInput}
                  onChange={(e) => setCsvTextInput(e.target.value)}
                  placeholder="วันที่โอน,รายการ,รหัสพนักงาน,ผู้เบิก(ชื่อพนักงาน),เลขทะเบียนรถ(บางรายการที่เบิกค่าน้ำมัน),ไซต์งาน,จำนวนเงินที่โอน,สถานะบิล
2026-07-28,ค่าที่พักประจำเดือน,EMP-1001,สมชาย ใจดี,,ไซต์งานบางนา-ตราด,6500,ส่งแล้ว
2026-07-30,เบิกค่าน้ำมันปฏิบัติงาน,EMP-1002,วิภาวี รักชาติ,3กข-4567 กทม,ไซต์งานนิคมมาบตาพุด,2500,รอดำเนินการ"
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs font-mono text-[#FFFFFF] placeholder-[#7FA1B6]/50 focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#103042] hover:bg-[#13384D] text-[#FFFFFF] border border-[#7FA1B6]/60 font-semibold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#7FA1B6] ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'กำลังประมวลผล...' : 'นำเข้าข้อมูล CSV'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Help Instructions */}
          {activeTab === 'help' && (
            <div className="space-y-4 text-xs text-[#D3D1C6]">
              <div className="p-4 rounded-2xl bg-[#103042] border border-[#7FA1B6]/30 space-y-2">
                <h4 className="font-bold text-[#FFFFFF] text-sm">
                  วิธีเปิดสิทธิ์ Google Sheet ให้ระบบดึงข้อมูลได้:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-[#D3D1C6]">
                  <li>เปิดไฟล์ Google Sheet ของคุณ</li>
                  <li>
                    กดปุ่ม <strong className="text-[#FFFFFF]">"แชร์" (Share)</strong> ที่มุมขวาบน
                  </li>
                  <li>
                    ตรง "การเข้าถึงแบบทั่วไป" เปลี่ยนเป็น <strong className="text-[#FFFFFF]">"ทุกคนที่มีลิงก์" (Anyone with the link can view)</strong>
                  </li>
                  <li>คัดลอกลิงก์ URL ในแถบเบราว์เซอร์ นำมาวางในช่องหน้าเชื่อมต่อ แล้วกดดึงข้อมูล</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c2331] border border-[#7FA1B6]/30 space-y-2">
                <h4 className="font-bold text-[#FFFFFF]">วิธีที่ 2: เผยแพร่ไปยังเว็บ (Publish to web)</h4>
                <p className="text-[11px] leading-relaxed">
                  ไปที่ เมนู <strong className="text-[#FFFFFF]">ไฟล์ (File) &gt; แชร์ (Share) &gt; เผยแพร่ไปยังเว็บ (Publish to web)</strong> &gt; เลือกประเภทเอกสารเป็น <strong className="text-[#FFFFFF]">CSV</strong> แล้วคัดลอกลิงก์นำมาวาง
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Reset & Actions */}
        <div className="px-6 py-4 border-t border-[#7FA1B6]/30 bg-[#103042] flex items-center justify-between">
          <button
            onClick={handleResetData}
            className="text-xs text-[#7FA1B6] hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่าง</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0c2331] hover:bg-[#1A475F] text-[#D3D1C6] hover:text-[#FFFFFF] text-xs font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
