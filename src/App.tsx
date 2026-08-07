import React, { useState, useEffect } from 'react';
import { HousingAllowanceRecord, EmployeeInfo, SheetConfig } from './types';
import {
  fetchSheetData,
  getEmployeeSummary,
  updateRecordBillStatus,
} from './services/sheetsService';
import { DEFAULT_SHEET_CONFIG } from './data/mockData';
import { Header } from './components/Header';
import { PageSearch } from './components/PageSearch';
import { PageEmployeeDetail } from './components/PageEmployeeDetail';
import { ReceiptUploadModal } from './components/ReceiptUploadModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AdminAuthModal } from './components/AdminAuthModal';

export default function App() {
  const [records, setRecords] = useState<HousingAllowanceRecord[]>([]);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(DEFAULT_SHEET_CONFIG);
  const [currentPage, setCurrentPage] = useState<'search' | 'detail'>('search');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Admin Auth state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('admin_pin_code') || '1234';
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Modals state
  const [uploadModalRecord, setUploadModalRecord] = useState<HousingAllowanceRecord | null>(null);
  const [detailModalRecord, setDetailModalRecord] = useState<HousingAllowanceRecord | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Loading & sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast notification trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('is_admin_logged_in', 'true');
    setIsAdminAuthModalOpen(false);
    setIsSheetModalOpen(true);
    showToast('เข้าสู่ระบบผู้ดูแลระบบสำเร็จ');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('is_admin_logged_in');
    setIsSheetModalOpen(false);
    showToast('ออกจากระบบผู้ดูแลระบบแล้ว');
  };

  const handleUpdatePin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('admin_pin_code', newPin);
    showToast('เปลี่ยนรหัส PIN ผู้ดูแลระบบสำเร็จ');
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    const data = await fetchSheetData();
    setRecords(data.records);
    if (data.config) setSheetConfig(data.config);
    setIsSyncing(false);
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadData();
    showToast('ดึงข้อมูลล่าสุดเรียบร้อยแล้ว');
  };

  const handleSyncSuccess = (newConfig: SheetConfig, newRecords: HousingAllowanceRecord[]) => {
    setSheetConfig(newConfig);
    setRecords(newRecords);
    showToast(`อัปเดตข้อมูลสำเร็จ รวม ${newRecords.length} รายการ`);
  };

  // Search employee ID from Page 1 -> Page 2
  const handleSearchEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setCurrentPage('detail');
  };

  // Submit receipt upload / update bill status
  const handleSubmitReceipt = (recordId: string, receiptUrl: string, note: string) => {
    const updated = updateRecordBillStatus(records, recordId, 'รอดำเนินการ', receiptUrl, note);
    setRecords(updated);
    showToast('ส่งใบเสร็จเรียบร้อยแล้ว สถานะเปลี่ยนเป็น "รอดำเนินการ"');
  };

  // Current employee summary for Page 2
  const employeeInfo: EmployeeInfo | null = selectedEmployeeId
    ? getEmployeeSummary(selectedEmployeeId, records)
    : null;

  return (
    <div className="min-h-screen bg-[#0c2331] text-[#D3D1C6] font-sans antialiased selection:bg-[#1A475F] selection:text-[#FFFFFF] flex flex-col">
      
      {/* Top Bar Header */}
      <Header
        onRefresh={handleRefresh}
        currentPage={currentPage}
        onNavigateHome={() => setCurrentPage('search')}
        isSyncing={isSyncing}
        onOpenSheetModal={() => {
          if (isAdmin) {
            setIsSheetModalOpen(true);
          } else {
            setIsAdminAuthModalOpen(true);
          }
        }}
        isCustomSheetConnected={sheetConfig.isCustom}
        isAdmin={isAdmin}
        onOpenAdminAuthModal={() => setIsAdminAuthModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {currentPage === 'search' || !employeeInfo ? (
          <PageSearch
            records={records}
            onSearch={handleSearchEmployee}
            onRefresh={handleRefresh}
            isSyncing={isSyncing}
            onOpenSheetModal={() => setIsSheetModalOpen(true)}
            isAdmin={isAdmin}
            onOpenAdminAuthModal={() => setIsAdminAuthModalOpen(true)}
          />
        ) : (
          <PageEmployeeDetail
            employeeInfo={employeeInfo}
            onBackToSearch={() => setCurrentPage('search')}
            onOpenUploadModal={(rec) => setUploadModalRecord(rec)}
            onOpenDetailModal={(rec) => setDetailModalRecord(rec)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A475F]/40 bg-[#091b26] py-6 text-center text-xs text-[#7FA1B6] print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Housing Allowance Tracker — ระบบตรวจสอบประวัติการเบิกเงินสวัสดิการค่าที่พัก
          </div>
        </div>
      </footer>

      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A475F] border border-[#7FA1B6]/50 text-[#FFFFFF] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7FA1B6] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminSuccess}
        currentPin={adminPin}
        onUpdatePin={handleUpdatePin}
        isAdmin={isAdmin}
      />

      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={sheetConfig}
        totalRecordsCount={records.length}
        onSyncSuccess={handleSyncSuccess}
      />

      <ReceiptUploadModal
        isOpen={!!uploadModalRecord}
        onClose={() => setUploadModalRecord(null)}
        record={uploadModalRecord}
        onSubmitReceipt={handleSubmitReceipt}
      />

      <RecordDetailModal
        isOpen={!!detailModalRecord}
        onClose={() => setDetailModalRecord(null)}
        record={detailModalRecord}
        onOpenUpload={(rec) => setUploadModalRecord(rec)}
      />

    </div>
  );
}

