import React from 'react';
import { HousingAllowanceRecord } from '../types';
import { X, CheckCircle2, Clock, AlertTriangle, XCircle, Building2, Calendar, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HousingAllowanceRecord | null;
  onOpenUpload: (record: HousingAllowanceRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onOpenUpload,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c2331]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A475F] border border-[#7FA1B6]/40 rounded-3xl max-w-lg w-full text-[#D3D1C6] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#7FA1B6]/30 flex items-center justify-between bg-[#103042]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7FA1B6]/20 border border-[#7FA1B6]/40 text-[#FFFFFF] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#7FA1B6]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#FFFFFF]">รายละเอียดประวัติการเบิก</h3>
              <p className="text-xs text-[#D3D1C6] font-mono">รหัสรายการ: {record.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#D3D1C6] hover:text-[#FFFFFF] hover:bg-[#7FA1B6]/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Employee & Item Banner */}
          <div className="p-4 rounded-2xl bg-[#103042] border border-[#7FA1B6]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#D3D1C6]">พนักงาน</div>
              <div className="text-xs font-mono font-bold text-[#7FA1B6]">{record.employeeId}</div>
            </div>
            <div className="text-base font-bold text-[#FFFFFF]">{record.firstName} {record.lastName}</div>
            <div className="text-xs text-[#D3D1C6]">{record.department} ({record.position || 'พนักงาน'})</div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/30">
              <div className="text-[#D3D1C6] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7FA1B6]" />
                <span>วันที่โอนให้</span>
              </div>
              <div className="text-sm font-bold text-[#FFFFFF] font-mono">{record.transferDate}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/30">
              <div className="text-[#D3D1C6] mb-1">จำนวนเงินที่ได้รับ</div>
              <div className="text-sm font-extrabold text-[#FFFFFF] font-mono">
                ฿{record.amount.toLocaleString('th-TH')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/30 col-span-2">
              <div className="text-[#D3D1C6] mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#7FA1B6]" />
                <span>รายการสวัสดิการ & ไซต์งาน</span>
              </div>
              <div className="text-sm font-semibold text-[#FFFFFF]">{record.welfareItem}</div>
              <div className="text-xs text-[#7FA1B6] mt-1">{record.siteLocation}</div>
            </div>
          </div>

          {/* Bill Status */}
          <div className="p-4 rounded-2xl bg-[#103042] border border-[#7FA1B6]/30 flex items-center justify-between">
            <div className="text-xs text-[#D3D1C6]">สถานะการนำส่งบิล:</div>
            <div className="text-sm font-semibold">
              {record.billStatus === 'ส่งแล้ว' && (
                <span className="text-[#FFFFFF] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7FA1B6]" /> ส่งใบเสร็จแล้ว
                </span>
              )}
              {record.billStatus === 'รอดำเนินการ' && (
                <span className="text-[#D3D1C6] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#7FA1B6]" /> รอดำเนินการตรวจสอบ
                </span>
              )}
              {record.billStatus === 'ยังไม่ส่ง' && (
                <span className="text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" /> ยังไม่ได้ส่งใบเสร็จ
                </span>
              )}
              {record.billStatus === 'เกินกำหนด' && (
                <span className="text-orange-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> เกินกำหนดส่งใบเสร็จ
                </span>
              )}
            </div>
          </div>

          {/* Note or Proof Image */}
          {record.receiptUrl ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#D3D1C6] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#7FA1B6]" />
                  <span>หลักฐานการนำส่งใบเสร็จ</span>
                </span>
                <a
                  href={record.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7FA1B6] hover:text-[#FFFFFF] text-[11px] flex items-center gap-1 underline"
                >
                  <span>ขยายรูปภาพ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#7FA1B6]/30 bg-[#0c2331] max-h-48 flex items-center justify-center p-2">
                <img
                  src={record.receiptUrl}
                  alt="Receipt Proof"
                  className="max-h-44 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0c2331] border border-[#7FA1B6]/30 text-xs text-[#D3D1C6] text-center space-y-2">
              <p>ยังไม่มีการแนบไฟล์หลักฐานใบเสร็จสำหรับรายการนี้</p>
              {(record.billStatus === 'ยังไม่ส่ง' || record.billStatus === 'เกินกำหนด') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpload(record);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#103042] hover:bg-[#13384d] text-[#FFFFFF] font-medium text-xs border border-[#7FA1B6]/50 shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>คลิกเพื่อส่งบิลใบเสร็จตอนนี้</span>
                </button>
              )}
            </div>
          )}

          {record.note && (
            <div className="text-xs text-[#D3D1C6] bg-[#103042] p-3 rounded-xl border border-[#7FA1B6]/30">
              <strong className="text-[#FFFFFF] block mb-0.5">หมายเหตุ:</strong>
              <span>{record.note}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
