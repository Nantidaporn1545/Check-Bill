import React from 'react';
import { HousingAllowanceRecord } from '../types';
import { X, CheckCircle2, Clock, AlertTriangle, XCircle, Building2, Calendar, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { formatThaiBEDate, formatThaiCurrency } from '../utils/formatters';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HousingAllowanceRecord | null;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full text-slate-700 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">รายละเอียดประวัติการเบิก</h3>
              <p className="text-xs text-slate-500 font-mono">รหัสรายการ: {record.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Employee & Item Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">พนักงาน</div>
              <div className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{record.employeeId}</div>
            </div>
            <div className="text-base font-bold text-slate-900">{record.firstName} {record.lastName}</div>
            <div className="text-xs text-slate-500">{record.department} ({record.position || 'พนักงาน'})</div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>วันที่โอน</span>
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">{formatThaiBEDate(record.transferDate)}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 mb-1">จำนวนเงินที่โอน</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono">
                {formatThaiCurrency(record.amount)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs col-span-2">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>รายการ & ไซต์งาน</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">{record.welfareItem}</div>
              <div className="text-xs text-sky-700 mt-1 flex items-center justify-between">
                <span>{record.siteLocation}</span>
                {record.vehiclePlate && (
                  <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    🚗 ทะเบียน: {record.vehiclePlate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bill Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="text-xs text-slate-600 font-medium">สถานะการนำส่งบิล:</div>
            <div className="text-sm font-semibold">
              {record.billStatus === 'ส่งแล้ว' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ส่งแล้ว
                </span>
              )}
              {record.billStatus === 'ยังไม่ส่ง' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold shadow-2xs">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> ยังไม่ส่ง
                </span>
              )}
              {record.billStatus === 'เกินกำหนด' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> เกินกำหนด
                </span>
              )}
            </div>
          </div>

          {/* Note or Proof Image */}
          {record.receiptUrl && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>หลักฐานการนำส่งใบเสร็จ</span>
                </span>
                <a
                  href={record.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-800 text-[11px] flex items-center gap-1 underline font-semibold"
                >
                  <span>ขยายรูปภาพ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center p-2">
                <img
                  src={record.receiptUrl}
                  alt="Receipt Proof"
                  className="max-h-44 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {record.note && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">หมายเหตุ:</strong>
              <span>{record.note}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
