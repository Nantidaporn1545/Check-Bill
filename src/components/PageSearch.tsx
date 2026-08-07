import React, { useState } from 'react';
import { HousingAllowanceRecord } from '../types';
import { Search, AlertCircle, ChevronRight } from 'lucide-react';

interface PageSearchProps {
  records: HousingAllowanceRecord[];
  onSearch: (employeeId: string) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const PageSearch: React.FC<PageSearchProps> = ({
  records,
  onSearch,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const clean = searchInput.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('กรุณากรอกรหัสพนักงาน เช่น EMP-1001');
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
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1A475F] via-[#103042] to-[#091b26] border border-[#7FA1B6]/30 p-6 sm:p-12 shadow-2xl overflow-hidden text-center">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7FA1B6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#1A475F]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight leading-tight">
            ตรวจสอบประวัติการเบิกเงินสวัสดิการค่าที่พัก
          </h2>

          <p className="text-[#D3D1C6] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            กรอกรหัสพนักงานของคุณเพื่อตรวจสอบรายละเอียดการโอนเงิน สวัสดิการ ไซต์งานปฏิบัติงาน และสถานะการนำส่งใบเสร็จรับเงิน
          </p>

          {/* Search Box Form */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-4">
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-[#0c2331] border-2 border-[#7FA1B6]/60 focus-within:border-[#7FA1B6] transition-all p-1.5">
              <Search className="w-5 h-5 text-[#7FA1B6] ml-3 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="กรอกรหัสพนักงานของคุณ (เช่น EMP-1001)..."
                className="w-full bg-transparent px-3 py-2.5 text-[#FFFFFF] placeholder-[#7FA1B6]/70 font-mono text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#1A475F] hover:bg-[#235b7a] text-[#FFFFFF] font-semibold text-sm shadow-md border border-[#7FA1B6]/50 flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
              >
                <span>ค้นหา</span>
                <ChevronRight className="w-4 h-4 text-[#7FA1B6]" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#103042] border border-rose-500/80 text-rose-200 text-xs text-left flex items-start gap-2.5 shadow-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

        </div>
      </div>

    </div>
  );
};
