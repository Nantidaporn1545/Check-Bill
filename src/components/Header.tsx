import React from 'react';
import { Building2, RefreshCw, ArrowLeft, FileSpreadsheet, ShieldCheck, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  currentPage: 'search' | 'detail';
  onNavigateHome: () => void;
  isSyncing: boolean;
  onOpenSheetModal: () => void;
  isCustomSheetConnected?: boolean;
  isAdmin: boolean;
  onOpenAdminAuthModal: () => void;
  onAdminLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  currentPage,
  onNavigateHome,
  isSyncing,
  onOpenSheetModal,
  isCustomSheetConnected,
  isAdmin,
  onOpenAdminAuthModal,
  onAdminLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1A475F] backdrop-blur-md border-b border-[#7FA1B6]/30 text-[#FFFFFF] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          {currentPage === 'detail' && (
            <button
              onClick={onNavigateHome}
              className="p-2 -ml-2 rounded-lg text-[#D3D1C6] hover:text-[#FFFFFF] hover:bg-[#7FA1B6]/20 transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
              title="กลับไปหน้าค้นหา"
            >
              <ArrowLeft className="w-4 h-4 text-[#7FA1B6]" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#7FA1B6]/20 border border-[#7FA1B6]/40 flex items-center justify-center text-[#FFFFFF] shadow-md group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-[#7FA1B6]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#FFFFFF] tracking-tight leading-tight flex items-center gap-2">
                <span>ตรวจสอบสวัสดิการค่าที่พัก</span>
              </h1>
              <p className="text-xs text-[#D3D1C6]/80 hidden sm:block">
                ระบบตรวจสอบประวัติการเบิกเงินสวัสดิการค่าที่พักพนักงาน
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Admin Mode Controls */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSheetModal}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer shadow-md ${
                  isCustomSheetConnected
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/50'
                    : 'bg-[#103042] hover:bg-[#13384D] text-[#D3D1C6] hover:text-[#FFFFFF] border-[#7FA1B6]/40'
                }`}
                title="จัดการ Google Sheet"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isCustomSheetConnected ? 'text-emerald-400' : 'text-[#7FA1B6]'}`} />
                <span className="hidden sm:inline">
                  {isCustomSheetConnected ? 'จัดการ Google Sheet' : 'ดึงข้อมูล Google Sheet'}
                </span>
                <span className="sm:hidden">Google Sheet</span>
              </button>

              <div className="flex items-center gap-1 pl-2 border-l border-[#7FA1B6]/30">
                <span className="px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] font-bold hidden md:inline flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                  <span>ผู้ดูแล</span>
                </span>
                <button
                  onClick={onAdminLogout}
                  className="p-2 rounded-xl bg-[#103042] hover:bg-rose-900/40 text-[#D3D1C6] hover:text-rose-200 border border-[#7FA1B6]/30 transition-colors cursor-pointer"
                  title="ออกจากระบบผู้ดูแล"
                >
                  <LogOut className="w-4 h-4 text-[#7FA1B6]" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAdminAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#103042] hover:bg-[#13384D] text-xs sm:text-sm font-medium text-[#D3D1C6] hover:text-[#FFFFFF] border border-[#7FA1B6]/30 transition-all cursor-pointer"
              title="สำหรับผู้ดูแลระบบจัดการ Google Sheet"
            >
              <Lock className="w-3.5 h-3.5 text-[#7FA1B6]" />
              <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
            </button>
          )}

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#103042] hover:bg-[#13384D] text-xs sm:text-sm font-medium text-[#D3D1C6] hover:text-[#FFFFFF] border border-[#7FA1B6]/30 transition-all disabled:opacity-50 cursor-pointer"
            title="รีเฟรชดึงข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7FA1B6] ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">รีเฟรช</span>
          </button>
        </div>

      </div>
    </header>
  );
};


