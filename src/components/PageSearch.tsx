import React, { useState } from 'react';
import { HousingAllowanceRecord } from '../types';
import { Search, AlertCircle, ChevronRight, FileSpreadsheet, Lock } from 'lucide-react';

interface PageSearchProps {
  records: HousingAllowanceRecord[];
  onSearch: (employeeId: string) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  onOpenSheetModal?: () => void;
  isAdmin?: boolean;
  onOpenAdminAuthModal?: () => void;
}

export const PageSearch: React.FC<PageSearchProps> = ({
  records,
  onSearch,
  onOpenSheetModal,
  isAdmin,
  onOpenAdminAuthModal,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const clean = searchInput.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('กรุณากรอกรหัสพนักงาน');
      return;
    }

    // Check if employee exists in records
    const matchedRecord = records.find(
      (r) => r.employeeId.toUpperCase() === clean || r.employeeId.toUpperCase().includes(clean)
    );

    if (!matchedRecord) {
      setErrorMsg(`ไม่พบข้อมูลรหัสพนักงาน "${clean}" ในระบบขณะนี้`);
      return;
    }

    onSearch(matchedRecord.employeeId);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-3xl mx-auto">
      
      {/* Hero Header & Search Form */}
      <div className="relative rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-12 shadow-sm overflow-hidden text-center">
        
        {/* Decorative subtle background accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            <span>ระบบสวัสดิการพนักงาน</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            ตรวจสอบประวัติการเบิกเงินสวัสดิการค่าที่พัก
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            กรอกรหัสพนักงานของคุณเพื่อตรวจสอบรายละเอียดการโอนเงิน สวัสดิการ ไซต์งานปฏิบัติงาน และสถานะการนำส่งใบเสร็จรับเงิน
          </p>

          {/* Search Box Form */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-2">
            <div className="relative flex items-center shadow-sm rounded-2xl bg-white border-2 border-slate-200 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100 transition-all p-1.5">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="กรอกรหัสพนักงานของคุณ..."
                className="w-full bg-transparent px-3 py-2.5 text-slate-900 placeholder-slate-400 font-mono text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
              >
                <span>ค้นหา</span>
                <ChevronRight className="w-4 h-4 text-sky-100" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

        </div>
      </div>

      {/* Quick Google Sheets Integration Box for Admin */}
      {isAdmin ? (
        onOpenSheetModal && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span>เชื่อมต่อกับ Google Sheet ขององค์กร</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                    โหมดผู้ดูแลระบบ
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  ดึงข้อมูลตารางเบิกจ่ายสวัสดิการค่าที่พักจาก Google Sheet ได้โดยตรง
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSheetModal}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              ตั้งค่า Google Sheet
            </button>
          </div>
        )
      ) : (
        <div className="text-center pt-2">
          <button
            onClick={onOpenAdminAuthModal}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-full hover:bg-slate-100"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>สำหรับผู้ดูแลระบบ: เข้าสู่ระบบจัดการ Google Sheet</span>
          </button>
        </div>
      )}

    </div>
  );
};

