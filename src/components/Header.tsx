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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          {currentPage === 'detail' && (
            <button
              onClick={onNavigateHome}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
              title="กลับไปหน้าค้นหา"
            >
              <ArrowLeft className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs group-hover:scale-105 group-hover:bg-sky-100 transition-all">
              <Building2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                <span>ตรวจสอบสวัสดิการค่าที่พัก</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
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
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer shadow-xs ${
                  isCustomSheetConnected
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="จัดการ Google Sheet"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isCustomSheetConnected ? 'text-emerald-600' : 'text-sky-600'}`} />
                <span className="hidden sm:inline">
                  {isCustomSheetConnected ? 'จัดการ Google Sheet' : 'ดึงข้อมูล Google Sheet'}
                </span>
                <span className="sm:hidden">Google Sheet</span>
              </button>

              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold hidden md:inline flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 inline" />
                  <span>ผู้ดูแล</span>
                </span>
                <button
                  onClick={onAdminLogout}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                  title="ออกจากระบบผู้ดูแล"
                >
                  <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAdminAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="สำหรับผู้ดูแลระบบจัดการ Google Sheet"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
            </button>
          )}

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-xs sm:text-sm font-medium text-sky-800 border border-sky-200 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="รีเฟรชดึงข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">รีเฟรช</span>
          </button>
        </div>

      </div>
    </header>
  );
};


