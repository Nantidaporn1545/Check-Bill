import React, { useState, useMemo } from 'react';
import { EmployeeInfo, HousingAllowanceRecord, BillStatus } from '../types';
import {
  Building2, Calendar, FileText, CheckCircle2, Clock, AlertTriangle, XCircle, Search
} from 'lucide-react';
import { formatThaiBEDate, formatThaiCurrency } from '../utils/formatters';

interface PageEmployeeDetailProps {
  employeeInfo: EmployeeInfo;
  onBackToSearch: () => void;
  onOpenUploadModal: (record: HousingAllowanceRecord) => void;
  onOpenDetailModal: (record: HousingAllowanceRecord) => void;
}

export const PageEmployeeDetail: React.FC<PageEmployeeDetailProps> = ({
  employeeInfo,
  onBackToSearch,
  onOpenUploadModal,
  onOpenDetailModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [selectedSite, setSelectedSite] = useState<string>('ทั้งหมด');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Extract unique site locations from records
  const availableSites = useMemo(() => {
    const set = new Set<string>();
    employeeInfo.records.forEach((r) => {
      if (r.siteLocation) set.add(r.siteLocation);
    });
    return ['ทั้งหมด', ...Array.from(set)];
  }, [employeeInfo.records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return employeeInfo.records.filter((r) => {
      // Status filter
      if (selectedStatus !== 'ทั้งหมด' && r.billStatus !== selectedStatus) return false;
      // Site filter
      if (selectedSite !== 'ทั้งหมด' && r.siteLocation !== selectedSite) return false;
      // Search text
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const matchItem = r.welfareItem.toLowerCase().includes(q);
        const matchSite = r.siteLocation.toLowerCase().includes(q);
        const matchDate = r.transferDate.includes(q);
        const matchAmount = r.amount.toString().includes(q);
        if (!matchItem && !matchSite && !matchDate && !matchAmount) return false;
      }
      return true;
    });
  }, [employeeInfo.records, selectedStatus, selectedSite, tableSearch]);

  // Status Badge Renderer
  const renderStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'ส่งแล้ว':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ส่งแล้ว</span>
          </span>
        );
      case 'รอดำเนินการ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>รอดำเนินการ</span>
          </span>
        );
      case 'เกินกำหนด':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>เกินกำหนด</span>
          </span>
        );
      case 'ยังไม่ส่ง':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>ยังไม่ส่ง</span>
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Employee Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-sm shrink-0">
              {employeeInfo.firstName.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
                <span>รหัสพนักงาน:</span>
                <span className="text-slate-900 font-extrabold">{employeeInfo.employeeId}</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {employeeInfo.firstName} {employeeInfo.lastName}
              </h2>
            </div>
          </div>

        </div>
      </div>

      {/* Summary Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-emerald-800 font-medium">ส่งใบเสร็จแล้ว</div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{employeeInfo.submittedCount} รายการ</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-sky-800 font-medium">รอดำเนินการ</div>
            <div className="text-xl font-bold text-sky-900 mt-0.5">{employeeInfo.pendingCount} รายการ</div>
          </div>
          <Clock className="w-8 h-8 text-sky-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-rose-800 font-medium">ยังไม่ส่งใบเสร็จ</div>
            <div className="text-xl font-bold text-rose-900 mt-0.5">{employeeInfo.unsubmittedCount} รายการ</div>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-amber-800 font-medium">เกินกำหนดส่ง</div>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{employeeInfo.overdueCount} รายการ</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/40" />
        </div>

      </div>

      {/* History Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Table Filter & Search Controls Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              ตารางรายการประวัติการเบิกค่าที่พัก
            </h3>
            <span className="text-xs text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-sky-200">
              ({filteredRecords.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search filter */}
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="ค้นหาในตาราง..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {['ทั้งหมด', 'ส่งแล้ว', 'รอดำเนินการ', 'ยังไม่ส่ง', 'เกินกำหนด'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Filter Site */}
            {availableSites.length > 2 && (
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
              >
                {availableSites.map((site) => (
                  <option key={site} value={site} className="bg-white text-slate-800">
                    {site === 'ทั้งหมด' ? 'ไซต์งานทั้งหมด' : site}
                  </option>
                ))}
              </select>
            )}

          </div>

        </div>

        {/* The Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">วันที่โอน</th>
                <th className="py-3.5 px-4 sm:px-6">รายการ</th>
                <th className="py-3.5 px-4 sm:px-6">เลขทะเบียนรถ</th>
                <th className="py-3.5 px-4 sm:px-6">ไซต์งาน</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">จำนวนเงินที่โอน</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">สถานะบิล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-base font-medium">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs mt-1 text-slate-400">ลองเปลี่ยนตัวกรองสถานะหรือลบข้อความค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onOpenDetailModal(record)}
                  >
                    {/* วันที่โอน */}
                    <td className="py-4 px-4 sm:px-6 text-slate-600 font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{formatThaiBEDate(record.transferDate)}</span>
                      </div>
                    </td>

                    {/* รายการ */}
                    <td className="py-4 px-4 sm:px-6 text-slate-900 font-medium">
                      <div>{record.welfareItem}</div>
                      {record.note && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {record.note}
                        </div>
                      )}
                    </td>

                    {/* เลขทะเบียนรถ */}
                    <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs whitespace-nowrap">
                      {record.vehiclePlate ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-semibold">
                          🚗 {record.vehiclePlate}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* ไซต์งาน */}
                    <td className="py-4 px-4 sm:px-6 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-xs">{record.siteLocation}</span>
                      </div>
                    </td>

                    {/* จำนวนเงินที่โอน */}
                    <td className="py-4 px-4 sm:px-6 text-right font-bold text-slate-900 font-mono text-base whitespace-nowrap">
                      {formatThaiCurrency(record.amount)}
                    </td>

                    {/* สถานะบิล */}
                    <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                      {renderStatusBadge(record.billStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>แสดง {filteredRecords.length} จากทั้งหมด {employeeInfo.records.length} รายการ</div>
        </div>

      </div>

    </div>
  );
};
